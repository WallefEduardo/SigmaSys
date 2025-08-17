import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { PermissionService } from '../lib/permissions'
import { ensureCompanyAccess } from '../lib/tenancy'
import { UnitsService } from '../lib/units'
import { TRPCError } from '@trpc/server'

const dimensionsSchema = z.object({
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  thickness: z.number().optional()
}).optional()

const alternativeUnitsSchema = z.array(z.object({
  unit: z.string(),
  factor: z.number(),
  description: z.string().optional()
})).optional()

const supplierContactSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional()
}).optional()

export const materialsRouter = router({
  // Listar materiais
  list: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      category: z.string().optional(),
      supplier: z.string().optional(),
      unit: z.string().optional(),
      active: z.boolean().optional(),
      discontinued: z.boolean().optional(),
      lowStock: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { page, limit, search, category, supplier, unit, active, discontinued, lowStock } = input
      const offset = (page - 1) * limit

      const where = {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { supplier: { contains: search, mode: 'insensitive' as const } },
            { tags: { hasSome: [search] } }
          ]
        }),
        ...(category && { category }),
        ...(supplier && { supplier }),
        ...(unit && { unit }),
        ...(active !== undefined && { active }),
        ...(discontinued !== undefined && { discontinued })
      }

      const [materials, total] = await Promise.all([
        ctx.db.material.findMany({
          where,
          skip: offset,
          take: limit,
          include: {
            creator: { select: { name: true } },
            inventory: {
              select: {
                quantity: true,
                minStock: true
              }
            },
            _count: {
              select: {
                productItems: true,
                priceHistory: true
              }
            }
          },
          orderBy: { name: 'asc' }
        }),
        ctx.db.material.count({ where })
      ])

      // Filtrar por estoque baixo se solicitado
      const filteredMaterials = lowStock 
        ? materials.filter(material => {
            const totalStock = material.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0)
            const minStock = material.minStock ? Number(material.minStock) : 0
            return totalStock <= minStock
          })
        : materials

      return {
        materials: filteredMaterials,
        pagination: {
          page,
          limit,
          total: lowStock ? filteredMaterials.length : total,
          pages: Math.ceil((lowStock ? filteredMaterials.length : total) / limit)
        }
      }
    }),

  // Obter material por ID
  getById: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const material = await ctx.db.material.findFirst({
        where: {
          id: input.id,
          companyId
        },
        include: {
          creator: { select: { name: true, email: true } },
          updater: { select: { name: true, email: true } },
          inventory: {
            include: {
              movements: {
                take: 10,
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          priceHistory: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { name: true } }
            }
          },
          productItems: {
            include: {
              product: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      if (!material) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material not found'
        })
      }

      return material
    }),

  // Criar material
  create: protectedProcedure
    .use(PermissionService.requirePermission('products.create'))
    .input(z.object({
      name: z.string().min(2).max(200),
      description: z.string().optional(),
      code: z.string().max(50).optional(),
      barcode: z.string().max(100).optional(),
      unit: z.string().min(1),
      cost: z.number().min(0),
      supplier: z.string().optional(),
      supplierCode: z.string().optional(),
      supplierContact: supplierContactSchema,
      minStock: z.number().min(0).optional(),
      maxStock: z.number().min(0).optional(),
      location: z.string().optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      color: z.string().optional(),
      dimensions: dimensionsSchema,
      weight: z.number().min(0).optional(),
      volume: z.number().min(0).optional(),
      density: z.number().min(0).optional(),
      alternativeUnits: alternativeUnitsSchema,
      quality: z.enum(['A', 'B', 'C']).optional(),
      certification: z.string().optional(),
      images: z.array(z.string().url()).default([]),
      documents: z.array(z.string().url()).default([]),
      notes: z.string().optional(),
      tags: z.array(z.string()).default([])
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Validar unidade de medida
      if (!UnitsService.validateUnit(input.unit)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid unit of measurement'
        })
      }

      // Verificar se código já existe (se fornecido)
      if (input.code) {
        const existingMaterial = await ctx.db.material.findFirst({
          where: {
            companyId,
            code: input.code
          }
        })

        if (existingMaterial) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Material code already exists'
          })
        }
      }

      const material = await ctx.db.material.create({
        data: {
          ...input,
          companyId,
          createdBy: ctx.user!.id
        },
        include: {
          creator: { select: { name: true } },
          _count: {
            select: { productItems: true }
          }
        }
      })

      return material
    }),

  // Atualizar material
  update: protectedProcedure
    .use(PermissionService.requirePermission('products.update'))
    .input(z.object({
      id: z.string(),
      name: z.string().min(2).max(200).optional(),
      description: z.string().optional(),
      code: z.string().max(50).optional(),
      barcode: z.string().max(100).optional(),
      unit: z.string().optional(),
      cost: z.number().min(0).optional(),
      supplier: z.string().optional(),
      supplierCode: z.string().optional(),
      supplierContact: supplierContactSchema,
      minStock: z.number().min(0).optional(),
      maxStock: z.number().min(0).optional(),
      location: z.string().optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      color: z.string().optional(),
      dimensions: dimensionsSchema,
      weight: z.number().min(0).optional(),
      volume: z.number().min(0).optional(),
      density: z.number().min(0).optional(),
      alternativeUnits: alternativeUnitsSchema,
      quality: z.enum(['A', 'B', 'C']).optional(),
      certification: z.string().optional(),
      images: z.array(z.string().url()).optional(),
      documents: z.array(z.string().url()).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      discontinued: z.boolean().optional(),
      reason: z.string().optional() // motivo da alteração de preço
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { id, cost, reason, ...data } = input

      // Verificar se material existe
      const existingMaterial = await ctx.db.material.findFirst({
        where: { id, companyId }
      })

      if (!existingMaterial) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material not found'
        })
      }

      // Verificar código único (se alterado)
      if (data.code && data.code !== existingMaterial.code) {
        const codeExists = await ctx.db.material.findFirst({
          where: {
            companyId,
            code: data.code,
            id: { not: id }
          }
        })

        if (codeExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Material code already exists'
          })
        }
      }

      // Validar nova unidade (se alterada)
      if (data.unit && !UnitsService.validateUnit(data.unit)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid unit of measurement'
        })
      }

      // Atualizar material em transação (para histórico de preço)
      const material = await ctx.db.$transaction(async (tx) => {
        // Se preço mudou, criar histórico
        if (cost !== undefined && cost !== Number(existingMaterial.cost)) {
          await tx.materialPriceHistory.create({
            data: {
              materialId: id,
              oldPrice: existingMaterial.cost,
              newPrice: cost,
              reason: reason || 'Atualização manual',
              createdBy: ctx.user!.id
            }
          })
        }

        // Atualizar material
        return tx.material.update({
          where: { id },
          data: {
            ...data,
            ...(cost !== undefined && { 
              lastCost: existingMaterial.cost,
              cost 
            }),
            updatedBy: ctx.user!.id
          },
          include: {
            creator: { select: { name: true } },
            updater: { select: { name: true } },
            _count: {
              select: { 
                productItems: true,
                priceHistory: true
              }
            }
          }
        })
      })

      return material
    }),

  // Desativar material
  deactivate: protectedProcedure
    .use(PermissionService.requirePermission('products.delete'))
    .input(z.object({
      id: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se material está sendo usado em produtos
      const usage = await ctx.db.productMaterial.count({
        where: {
          materialId: input.id,
          product: { companyId }
        }
      })

      if (usage > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Material is being used in ${usage} products`
        })
      }

      const material = await ctx.db.material.update({
        where: {
          id: input.id,
          companyId
        },
        data: { 
          active: false,
          updatedBy: ctx.user!.id
        }
      })

      return material
    }),

  // Estatísticas
  stats: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .query(async ({ ctx }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const [
        totalMaterials,
        activeMaterials,
        categories,
        suppliers,
        recentMaterials,
        totalValue
      ] = await Promise.all([
        ctx.db.material.count({ where: { companyId } }),
        ctx.db.material.count({ where: { companyId, active: true } }),
        ctx.db.material.groupBy({
          by: ['category'],
          where: { companyId, category: { not: null } },
          _count: true,
          orderBy: { _count: { category: 'desc' } },
          take: 10
        }),
        ctx.db.material.groupBy({
          by: ['supplier'],
          where: { companyId, supplier: { not: null } },
          _count: true,
          orderBy: { _count: { supplier: 'desc' } },
          take: 10
        }),
        ctx.db.material.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            cost: true,
            createdAt: true
          }
        }),
        ctx.db.material.aggregate({
          where: { companyId, active: true },
          _sum: { cost: true }
        })
      ])

      return {
        totalMaterials,
        activeMaterials,
        inactiveMaterials: totalMaterials - activeMaterials,
        categories: categories.map(c => ({ name: c.category, count: c._count })),
        suppliers: suppliers.map(s => ({ name: s.supplier, count: s._count })),
        recentMaterials,
        totalValue: totalValue._sum.cost || 0
      }
    }),

  // Buscar por código de barras
  findByBarcode: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .input(z.object({
      barcode: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const material = await ctx.db.material.findFirst({
        where: {
          companyId,
          barcode: input.barcode
        },
        include: {
          inventory: {
            select: { quantity: true }
          }
        }
      })

      return material
    }),

  // Obter unidades disponíveis
  getUnits: protectedProcedure
    .query(() => {
      return UnitsService.getUnitsByCategory('area')
        .concat(UnitsService.getUnitsByCategory('length'))
        .concat(UnitsService.getUnitsByCategory('volume'))
        .concat(UnitsService.getUnitsByCategory('weight'))
        .concat(UnitsService.getUnitsByCategory('quantity'))
    })
})