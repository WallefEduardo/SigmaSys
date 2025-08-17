import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { PermissionService } from '../lib/permissions'
import { ensureCompanyAccess } from '../lib/tenancy'
import { TRPCError } from '@trpc/server'

const compositionSchema = z.object({
  materials: z.array(z.object({
    materialId: z.string(),
    quantity: z.number(),
    unit: z.string()
  })).optional(),
  processes: z.array(z.object({
    processId: z.string(),
    timeNeeded: z.number(),
    unit: z.string()
  })).optional()
})

export const finishesRouter = router({
  // Listar acabamentos
  list: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      active: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { page, limit, search, active } = input
      const offset = (page - 1) * limit

      const where = {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        }),
        ...(active !== undefined && { active })
      }

      const [finishes, total] = await Promise.all([
        ctx.db.finish.findMany({
          where,
          skip: offset,
          take: limit,
          include: {
            _count: {
              select: {
                products: true
              }
            }
          },
          orderBy: { name: 'asc' }
        }),
        ctx.db.finish.count({ where })
      ])

      return {
        finishes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }),

  // Obter acabamento por ID
  getById: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const finish = await ctx.db.finish.findFirst({
        where: {
          id: input.id,
          companyId
        },
        include: {
          products: {
            include: {
              product: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      if (!finish) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Finish not found'
        })
      }

      return finish
    }),

  // Criar acabamento
  create: protectedProcedure
    .use(PermissionService.requirePermission('products.create'))
    .input(z.object({
      name: z.string().min(2).max(200),
      description: z.string().optional(),
      composition: compositionSchema,
      cost: z.number().min(0)
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Validar materiais e processos na composição
      if (input.composition.materials) {
        const materialIds = input.composition.materials.map(m => m.materialId)
        const materials = await ctx.db.material.findMany({
          where: {
            id: { in: materialIds },
            companyId
          }
        })

        if (materials.length !== materialIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Some materials in composition do not exist'
          })
        }
      }

      if (input.composition.processes) {
        const processIds = input.composition.processes.map(p => p.processId)
        const processes = await ctx.db.process.findMany({
          where: {
            id: { in: processIds },
            companyId
          }
        })

        if (processes.length !== processIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Some processes in composition do not exist'
          })
        }
      }

      const finish = await ctx.db.finish.create({
        data: {
          ...input,
          companyId
        },
        include: {
          _count: {
            select: { products: true }
          }
        }
      })

      return finish
    }),

  // Atualizar acabamento
  update: protectedProcedure
    .use(PermissionService.requirePermission('products.update'))
    .input(z.object({
      id: z.string(),
      name: z.string().min(2).max(200).optional(),
      description: z.string().optional(),
      composition: compositionSchema.optional(),
      cost: z.number().min(0).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { id, composition, ...data } = input

      // Verificar se acabamento existe
      const existingFinish = await ctx.db.finish.findFirst({
        where: { id, companyId }
      })

      if (!existingFinish) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Finish not found'
        })
      }

      // Validar materiais e processos na composição (se fornecida)
      if (composition?.materials) {
        const materialIds = composition.materials.map(m => m.materialId)
        const materials = await ctx.db.material.findMany({
          where: {
            id: { in: materialIds },
            companyId
          }
        })

        if (materials.length !== materialIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Some materials in composition do not exist'
          })
        }
      }

      if (composition?.processes) {
        const processIds = composition.processes.map(p => p.processId)
        const processes = await ctx.db.process.findMany({
          where: {
            id: { in: processIds },
            companyId
          }
        })

        if (processes.length !== processIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Some processes in composition do not exist'
          })
        }
      }

      const finish = await ctx.db.finish.update({
        where: { id },
        data: {
          ...data,
          ...(composition && { composition })
        },
        include: {
          _count: {
            select: { products: true }
          }
        }
      })

      return finish
    }),

  // Desativar acabamento
  deactivate: protectedProcedure
    .use(PermissionService.requirePermission('products.delete'))
    .input(z.object({
      id: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se acabamento está sendo usado em produtos
      const usage = await ctx.db.productFinish.count({
        where: {
          finishId: input.id,
          product: { companyId }
        }
      })

      if (usage > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Finish is being used in ${usage} products`
        })
      }

      const finish = await ctx.db.finish.update({
        where: {
          id: input.id,
          companyId
        },
        data: { active: false }
      })

      return finish
    }),

  // Calcular custo de um acabamento
  calculateCost: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .input(z.object({
      id: z.string(),
      quantity: z.number().min(0).default(1),
      dimensions: z.object({
        largura: z.number().optional(),
        altura: z.number().optional(),
        espessura: z.number().optional()
      }).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const finish = await ctx.db.finish.findFirst({
        where: {
          id: input.id,
          companyId
        }
      })

      if (!finish) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Finish not found'
        })
      }

      const composition = finish.composition as any
      let totalCost = 0
      const breakdown: any[] = []

      // Calcular custo dos materiais
      if (composition?.materials) {
        const materialIds = composition.materials.map((m: any) => m.materialId)
        const materials = await ctx.db.material.findMany({
          where: {
            id: { in: materialIds },
            companyId
          }
        })

        for (const materialComp of composition.materials) {
          const material = materials.find(m => m.id === materialComp.materialId)
          if (material) {
            const materialCost = Number(material.cost) * materialComp.quantity * input.quantity
            totalCost += materialCost
            breakdown.push({
              type: 'material',
              name: material.name,
              quantity: materialComp.quantity * input.quantity,
              unit: materialComp.unit,
              unitCost: Number(material.cost),
              totalCost: materialCost
            })
          }
        }
      }

      // Calcular custo dos processos
      if (composition?.processes) {
        const processIds = composition.processes.map((p: any) => p.processId)
        const processes = await ctx.db.process.findMany({
          where: {
            id: { in: processIds },
            companyId
          }
        })

        for (const processComp of composition.processes) {
          const process = processes.find(p => p.id === processComp.processId)
          if (process) {
            const processCost = Number(process.costPerHour) * processComp.timeNeeded * input.quantity
            totalCost += processCost
            breakdown.push({
              type: 'process',
              name: process.name,
              time: processComp.timeNeeded * input.quantity,
              unit: processComp.unit,
              costPerHour: Number(process.costPerHour),
              totalCost: processCost
            })
          }
        }
      }

      return {
        finishId: input.id,
        finishName: finish.name,
        quantity: input.quantity,
        totalCost,
        unitCost: totalCost / input.quantity,
        breakdown
      }
    }),

  // Estatísticas
  stats: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .query(async ({ ctx }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const [
        totalFinishes,
        activeFinishes,
        avgCost,
        recentFinishes
      ] = await Promise.all([
        ctx.db.finish.count({ where: { companyId } }),
        ctx.db.finish.count({ where: { companyId, active: true } }),
        ctx.db.finish.aggregate({
          where: { companyId, active: true },
          _avg: { cost: true }
        }),
        ctx.db.finish.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            cost: true,
            createdAt: true
          }
        })
      ])

      return {
        totalFinishes,
        activeFinishes,
        inactiveFinishes: totalFinishes - activeFinishes,
        avgCost: avgCost._avg.cost || 0,
        recentFinishes
      }
    })
})