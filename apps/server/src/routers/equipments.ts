import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { ensureCompanyAccess } from '../lib/tenancy'
import { TRPCError } from '@trpc/server'

const printingConfigSchema = z.object({
  maxWidth: z.number().optional(),
  maxHeight: z.number().optional(),
  minWidth: z.number().optional(),
  minHeight: z.number().optional(),
  maxThickness: z.number().optional(),
  resolution: z.number().optional(), // DPI
  colorModes: z.array(z.string()).optional(), // CMYK, RGB, etc
  supportedMaterials: z.array(z.string()).optional(),
  printSpeed: z.number().optional() // m²/h
}).optional()

const machiningConfigSchema = z.object({
  maxWidth: z.number().optional(),
  maxHeight: z.number().optional(),
  maxThickness: z.number().optional(),
  toolTypes: z.array(z.string()).optional(), // fresa, furadeira, etc
  spindleSpeed: z.number().optional(), // RPM
  feedRate: z.number().optional(), // mm/min
  precision: z.number().optional() // tolerância em mm
}).optional()

const consumablesSchema = z.array(z.object({
  name: z.string(),
  type: z.string(), // tinta, cabeça, broca, etc
  cost: z.number(),
  unit: z.string(),
  supplier: z.string().optional()
})).optional()

export const equipmentsRouter = router({
  // Listar equipamentos
  list: protectedProcedure
    
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      location: z.string().optional(),
      active: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { page, limit, search, type, status, location, active } = input
      const offset = (page - 1) * limit

      const where = {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { manufacturer: { contains: search, mode: 'insensitive' as const } },
            { model: { contains: search, mode: 'insensitive' as const } },
            { tags: { hasSome: [search] } }
          ]
        }),
        ...(type && { type }),
        ...(status && { status }),
        ...(location && { location }),
        ...(active !== undefined && { active })
      }

      const [equipments, total] = await Promise.all([
        ctx.db.equipment.findMany({
          where,
          skip: offset,
          take: limit,
          include: {
            creator: { select: { name: true } },
            usageLog: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                operator: { select: { name: true } }
              }
            },
            _count: {
              select: {
                productItems: true,
                usageLog: true
              }
            }
          },
          orderBy: { name: 'asc' }
        }),
        ctx.db.equipment.count({ where })
      ])

      return {
        equipments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }),

  // Obter equipamento por ID
  getById: protectedProcedure
    
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const equipment = await ctx.db.equipment.findFirst({
        where: {
          id: input.id,
          companyId
        },
        include: {
          creator: { select: { name: true, email: true } },
          updater: { select: { name: true, email: true } },
          usageLog: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              operator: { select: { name: true } }
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

      if (!equipment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Equipment not found'
        })
      }

      return equipment
    }),

  // Criar equipamento
  create: protectedProcedure
    
    .input(z.object({
      name: z.string().min(2).max(200),
      description: z.string().optional(),
      code: z.string().max(50).optional(),
      type: z.enum(['printing', 'machining']),
      costPerHour: z.number().min(0),
      maintenanceCost: z.number().min(0).optional(),
      energyCost: z.number().min(0).optional(),
      maxWidth: z.number().min(0).optional(),
      maxHeight: z.number().min(0).optional(),
      maxThickness: z.number().min(0).optional(),
      printingConfig: printingConfigSchema,
      machiningConfig: machiningConfigSchema,
      consumables: consumablesSchema,
      location: z.string().optional(),
      serialNumber: z.string().optional(),
      manufacturer: z.string().optional(),
      model: z.string().optional(),
      year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
      maintenanceInterval: z.number().min(1).optional(),
      maintenanceNotes: z.string().optional(),
      manualUrl: z.string().url().optional(),
      images: z.array(z.string().url()).default([]),
      documents: z.array(z.string().url()).default([]),
      notes: z.string().optional(),
      tags: z.array(z.string()).default([])
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se código já existe (se fornecido)
      if (input.code) {
        const existingEquipment = await ctx.db.equipment.findFirst({
          where: {
            companyId,
            code: input.code
          }
        })

        if (existingEquipment) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Equipment code already exists'
          })
        }
      }

      // Calcular próxima manutenção se intervalo fornecido
      const nextMaintenance = input.maintenanceInterval 
        ? new Date(Date.now() + input.maintenanceInterval * 24 * 60 * 60 * 1000)
        : undefined

      const equipment = await ctx.db.equipment.create({
        data: {
          ...input,
          companyId,
          nextMaintenance,
          createdBy: ctx.user!.id
        },
        include: {
          creator: { select: { name: true } },
          _count: {
            select: { productItems: true }
          }
        }
      })

      return equipment
    }),

  // Atualizar equipamento
  update: protectedProcedure
    
    .input(z.object({
      id: z.string(),
      name: z.string().min(2).max(200).optional(),
      description: z.string().optional(),
      code: z.string().max(50).optional(),
      type: z.enum(['printing', 'machining']).optional(),
      costPerHour: z.number().min(0).optional(),
      maintenanceCost: z.number().min(0).optional(),
      energyCost: z.number().min(0).optional(),
      maxWidth: z.number().min(0).optional(),
      maxHeight: z.number().min(0).optional(),
      maxThickness: z.number().min(0).optional(),
      printingConfig: printingConfigSchema,
      machiningConfig: machiningConfigSchema,
      consumables: consumablesSchema,
      status: z.enum(['available', 'busy', 'maintenance', 'broken']).optional(),
      location: z.string().optional(),
      serialNumber: z.string().optional(),
      manufacturer: z.string().optional(),
      model: z.string().optional(),
      year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
      lastMaintenance: z.date().optional(),
      maintenanceInterval: z.number().min(1).optional(),
      maintenanceNotes: z.string().optional(),
      manualUrl: z.string().url().optional(),
      images: z.array(z.string().url()).optional(),
      documents: z.array(z.string().url()).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { id, lastMaintenance, maintenanceInterval, ...data } = input

      // Verificar se equipamento existe
      const existingEquipment = await ctx.db.equipment.findFirst({
        where: { id, companyId }
      })

      if (!existingEquipment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Equipment not found'
        })
      }

      // Verificar código único (se alterado)
      if (data.code && data.code !== existingEquipment.code) {
        const codeExists = await ctx.db.equipment.findFirst({
          where: {
            companyId,
            code: data.code,
            id: { not: id }
          }
        })

        if (codeExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Equipment code already exists'
          })
        }
      }

      // Calcular próxima manutenção
      let nextMaintenance = existingEquipment.nextMaintenance
      if (lastMaintenance && maintenanceInterval) {
        nextMaintenance = new Date(lastMaintenance.getTime() + maintenanceInterval * 24 * 60 * 60 * 1000)
      } else if (maintenanceInterval && existingEquipment.lastMaintenance) {
        nextMaintenance = new Date(existingEquipment.lastMaintenance.getTime() + maintenanceInterval * 24 * 60 * 60 * 1000)
      }

      const equipment = await ctx.db.equipment.update({
        where: { id },
        data: {
          ...data,
          ...(lastMaintenance && { lastMaintenance }),
          ...(maintenanceInterval && { maintenanceInterval }),
          ...(nextMaintenance && { nextMaintenance }),
          updatedBy: ctx.user!.id
        },
        include: {
          creator: { select: { name: true } },
          updater: { select: { name: true } },
          _count: {
            select: { 
              productItems: true,
              usageLog: true
            }
          }
        }
      })

      return equipment
    }),

  // Desativar equipamento
  deactivate: protectedProcedure
    
    .input(z.object({
      id: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se equipamento está sendo usado em produtos
      const usage = await ctx.db.productEquipment.count({
        where: {
          equipmentId: input.id,
          product: { companyId }
        }
      })

      if (usage > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Equipment is being used in ${usage} products`
        })
      }

      const equipment = await ctx.db.equipment.update({
        where: {
          id: input.id,
          companyId
        },
        data: { 
          active: false,
          status: 'broken',
          updatedBy: ctx.user!.id
        }
      })

      return equipment
    }),

  // Registrar uso do equipamento
  logUsage: protectedProcedure
    
    .input(z.object({
      equipmentId: z.string(),
      startTime: z.date(),
      endTime: z.date().optional(),
      description: z.string().optional(),
      orderId: z.string().optional(),
      consumablesUsed: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        cost: z.number()
      })).optional(),
      unitsProduced: z.number().min(0).optional(),
      area: z.number().min(0).optional(),
      length: z.number().min(0).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se equipamento existe e pertence à empresa
      const equipment = await ctx.db.equipment.findFirst({
        where: {
          id: input.equipmentId,
          companyId
        }
      })

      if (!equipment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Equipment not found'
        })
      }

      // Calcular duração e custo
      const duration = input.endTime 
        ? Math.round((input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60))
        : undefined

      const hourlyRate = Number(equipment.costPerHour)
      const cost = duration ? (duration / 60) * hourlyRate : undefined

      const usage = await ctx.db.equipmentUsage.create({
        data: {
          ...input,
          equipmentId: input.equipmentId,
          operatorId: ctx.user!.id,
          duration,
          cost
        },
        include: {
          equipment: { select: { name: true } },
          operator: { select: { name: true } }
        }
      })

      // Atualizar status do equipamento se necessário
      if (input.endTime) {
        await ctx.db.equipment.update({
          where: { id: input.equipmentId },
          data: { status: 'available' }
        })
      } else {
        await ctx.db.equipment.update({
          where: { id: input.equipmentId },
          data: { status: 'busy' }
        })
      }

      return usage
    }),

  // Estatísticas
  stats: protectedProcedure
    
    .query(async ({ ctx }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const [
        totalEquipments,
        activeEquipments,
        equipmentsByType,
        equipmentsByStatus,
        maintenanceDue,
        recentUsage,
        totalUsageHours
      ] = await Promise.all([
        ctx.db.equipment.count({ where: { companyId } }),
        ctx.db.equipment.count({ where: { companyId, active: true } }),
        ctx.db.equipment.groupBy({
          by: ['type'],
          where: { companyId },
          _count: true
        }),
        ctx.db.equipment.groupBy({
          by: ['status'],
          where: { companyId, active: true },
          _count: true
        }),
        ctx.db.equipment.findMany({
          where: {
            companyId,
            active: true,
            nextMaintenance: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // próximos 7 dias
            }
          },
          select: {
            id: true,
            name: true,
            nextMaintenance: true,
            location: true
          }
        }),
        ctx.db.equipmentUsage.findMany({
          where: {
            equipment: { companyId }
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            equipment: { select: { name: true } },
            operator: { select: { name: true } }
          }
        }),
        ctx.db.equipmentUsage.aggregate({
          where: {
            equipment: { companyId },
            duration: { not: null }
          },
          _sum: { duration: true }
        })
      ])

      return {
        totalEquipments,
        activeEquipments,
        inactiveEquipments: totalEquipments - activeEquipments,
        equipmentsByType: equipmentsByType.map(e => ({ type: e.type, count: e._count })),
        equipmentsByStatus: equipmentsByStatus.map(e => ({ status: e.status, count: e._count })),
        maintenanceDue,
        recentUsage,
        totalUsageHours: Math.round((totalUsageHours._sum.duration || 0) / 60),
        maintenanceDueCount: maintenanceDue.length
      }
    })
})