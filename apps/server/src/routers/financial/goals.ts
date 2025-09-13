import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'

const GoalTypeSchema = z.enum(['EMERGENCY', 'PURCHASE', 'INVESTMENT', 'SAVINGS'])

const GoalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().optional(),
  targetAmount: z.number().positive('Valor alvo deve ser positivo'),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.date(),
  type: GoalTypeSchema,
  priority: z.number().int().min(1).max(5).default(3),
  categoryId: z.string().optional(),
  active: z.boolean().default(true)
})

export const goalsRouter = router({
  // Listar metas
  list: protectedProcedure
    .use(PermissionService.requirePermission('finance.goals.read'))
    .input(z.object({
      type: GoalTypeSchema.optional(),
      active: z.boolean().optional(),
      sortBy: z.enum(['priority', 'targetDate', 'progress', 'name']).default('priority'),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const where: any = { companyId }
      
      if (input.type) where.type = input.type
      if (input.active !== undefined) where.active = input.active

      const goals = await ctx.db.financialGoal.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, type: true, icon: true, color: true }
          }
        },
        orderBy: input.sortBy === 'progress' 
          ? [{ priority: 'desc' }, { targetDate: 'asc' }]
          : { [input.sortBy]: input.sortOrder }
      })

      return goals.map(goal => ({
        ...goal,
        progress: Number(goal.targetAmount) > 0 
          ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 
          : 0,
        remaining: Number(goal.targetAmount) - Number(goal.currentAmount),
        daysToTarget: Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
      }))
    }),

  // Buscar meta por ID
  getById: protectedProcedure
    .use(PermissionService.requirePermission('finance.goals.read'))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const goal = await ctx.db.financialGoal.findFirst({
        where: { id: input.id, companyId },
        include: {
          category: true
        }
      })

      if (!goal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meta não encontrada'
        })
      }

      return {
        ...goal,
        progress: Number(goal.targetAmount) > 0 
          ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 
          : 0,
        remaining: Number(goal.targetAmount) - Number(goal.currentAmount),
        daysToTarget: Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)),
        monthlyTarget: goal.targetDate > new Date() 
          ? Math.ceil(goal.targetDate.getTime() - new Date().getTime()) / (30 * 24 * 60 * 60 * 1000)
          : 0
      }
    }),

  // Criar meta
  create: protectedProcedure
    .use(PermissionService.requirePermission('finance.goals.create'))
    .input(GoalSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      // Verificar se categoria existe (se fornecida)
      if (input.categoryId) {
        const category = await ctx.db.budgetCategory.findFirst({
          where: { id: input.categoryId, companyId }
        })

        if (!category) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Categoria não encontrada'
          })
        }
      }

      // Verificar se data é futura
      if (input.targetDate <= new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Data alvo deve ser futura'
        })
      }

      return ctx.db.financialGoal.create({
        data: {
          ...input,
          companyId
        },
        include: {
          category: true
        }
      })
    }),

  // Atualizar meta
  update: protectedProcedure
    .use(PermissionService.requirePermission('finance.goals.update'))
    .input(z.object({
      id: z.string(),
      data: GoalSchema.omit({ id: true }).partial()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const existing = await ctx.db.financialGoal.findFirst({
        where: { id: input.id, companyId }
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meta não encontrada'
        })
      }

      // Verificar categoria se mudando
      if (input.data.categoryId && input.data.categoryId !== existing.categoryId) {
        const category = await ctx.db.budgetCategory.findFirst({
          where: { id: input.data.categoryId, companyId }
        })

        if (!category) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Categoria não encontrada'
          })
        }
      }

      // Verificar data se mudando
      if (input.data.targetDate && input.data.targetDate <= new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Data alvo deve ser futura'
        })
      }

      return ctx.db.financialGoal.update({
        where: { id: input.id },
        data: input.data,
        include: {
          category: true
        }
      })
    }),

  // Atualizar progresso da meta
  updateProgress: protectedProcedure
    .use(PermissionService.requirePermission('finance.goals.update'))
    .input(z.object({
      id: z.string(),
      amount: z.number(),
      operation: z.enum(['add', 'subtract', 'set']).default('add'),
      description: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const goal = await ctx.db.financialGoal.findFirst({
        where: { id: input.id, companyId }
      })

      if (!goal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meta não encontrada'
        })
      }

      let newAmount: number
      const currentAmount = Number(goal.currentAmount)

      switch (input.operation) {
        case 'add':
          newAmount = currentAmount + input.amount
          break
        case 'subtract':
          newAmount = Math.max(0, currentAmount - input.amount)
          break
        case 'set':
          newAmount = Math.max(0, input.amount)
          break
      }

      // Não permitir exceder o valor alvo (opcional)
      const targetAmount = Number(goal.targetAmount)
      newAmount = Math.min(newAmount, targetAmount)

      const updated = await ctx.db.financialGoal.update({
        where: { id: input.id },
        data: { currentAmount: newAmount }
      })

      // Se atingiu a meta, criar alerta de sucesso
      if (newAmount >= targetAmount && currentAmount < targetAmount) {
        await ctx.db.financialAlert.create({
          data: {
            type: 'AI_INSIGHT',
            title: `Meta atingida: ${goal.name}`,
            message: `Parabéns! Você atingiu a meta "${goal.name}" de R$ ${targetAmount.toFixed(2)}.`,
            severity: 'LOW',
            companyId,
            data: { 
              goalId: goal.id, 
              achievement: true,
              description: input.description 
            }
          }
        }).catch(() => {
          // Ignorar erro no alerta
        })
      }

      return updated
    }),

  // Excluir meta
  delete: protectedProcedure
    .use(PermissionService.requirePermission('finance.goals.delete'))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const goal = await ctx.db.financialGoal.findFirst({
        where: { id: input.id, companyId }
      })

      if (!goal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meta não encontrada'
        })
      }

      return ctx.db.financialGoal.delete({
        where: { id: input.id }
      })
    }),

  // Dashboard das metas
  getDashboard: protectedProcedure
    .use(PermissionService.requirePermission('finance.goals.read'))
    .query(async ({ ctx }) => {
      const companyId = ctx.user.companyId
      const now = new Date()

      const goals = await ctx.db.financialGoal.findMany({
        where: { companyId, active: true },
        include: {
          category: {
            select: { id: true, name: true, type: true, color: true }
          }
        }
      })

      const stats = {
        total: goals.length,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        totalTargetAmount: 0,
        totalCurrentAmount: 0,
        byType: {} as Record<string, number>,
        upcoming: [] as any[]
      }

      const upcoming30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      for (const goal of goals) {
        const targetAmount = Number(goal.targetAmount)
        const currentAmount = Number(goal.currentAmount)
        const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

        stats.totalTargetAmount += targetAmount
        stats.totalCurrentAmount += currentAmount

        // Contar por status
        if (progress >= 100) {
          stats.completed++
        } else if (goal.targetDate < now) {
          stats.overdue++
        } else {
          stats.inProgress++
        }

        // Contar por tipo
        stats.byType[goal.type] = (stats.byType[goal.type] || 0) + 1

        // Metas próximas (30 dias)
        if (goal.targetDate >= now && goal.targetDate <= upcoming30Days && progress < 100) {
          const daysToTarget = Math.ceil((goal.targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          stats.upcoming.push({
            ...goal,
            progress,
            daysToTarget,
            remaining: targetAmount - currentAmount
          })
        }
      }

      // Ordenar próximas por data
      stats.upcoming.sort((a, b) => a.daysToTarget - b.daysToTarget)

      return {
        stats,
        progressOverall: stats.totalTargetAmount > 0 
          ? (stats.totalCurrentAmount / stats.totalTargetAmount) * 100 
          : 0
      }
    }),

  // Simular progresso de meta
  simulate: protectedProcedure
    .use(PermissionService.requirePermission('finance.goals.read'))
    .input(z.object({
      id: z.string(),
      monthlyContribution: z.number().positive()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const goal = await ctx.db.financialGoal.findFirst({
        where: { id: input.id, companyId }
      })

      if (!goal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meta não encontrada'
        })
      }

      const targetAmount = Number(goal.targetAmount)
      const currentAmount = Number(goal.currentAmount)
      const remaining = targetAmount - currentAmount

      if (remaining <= 0) {
        return {
          message: 'Meta já foi atingida',
          monthsToComplete: 0,
          projectedDate: new Date()
        }
      }

      const monthsToComplete = Math.ceil(remaining / input.monthlyContribution)
      const projectedDate = new Date()
      projectedDate.setMonth(projectedDate.getMonth() + monthsToComplete)

      const targetDate = goal.targetDate
      const isOnTime = projectedDate <= targetDate

      return {
        monthsToComplete,
        projectedDate,
        targetDate,
        isOnTime,
        monthsEarly: isOnTime 
          ? Math.floor((targetDate.getTime() - projectedDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
          : 0,
        monthsLate: !isOnTime 
          ? Math.ceil((projectedDate.getTime() - targetDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
          : 0,
        totalContributions: monthsToComplete * input.monthlyContribution
      }
    }),

  // Estatísticas detalhadas
  getStats: protectedProcedure
    .use(PermissionService.requirePermission('finance.goals.read'))
    .input(z.object({
      period: z.object({
        startDate: z.date(),
        endDate: z.date()
      }).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const where: any = { companyId }
      
      if (input.period) {
        where.createdAt = {
          gte: input.period.startDate,
          lte: input.period.endDate
        }
      }

      const [totalStats, typeStats, completionStats] = await Promise.all([
        // Estatísticas gerais
        ctx.db.financialGoal.aggregate({
          where,
          _count: { id: true },
          _sum: { 
            targetAmount: true,
            currentAmount: true 
          },
          _avg: {
            targetAmount: true,
            currentAmount: true
          }
        }),

        // Por tipo
        ctx.db.financialGoal.groupBy({
          by: ['type'],
          where,
          _count: { id: true },
          _sum: {
            targetAmount: true,
            currentAmount: true
          }
        }),

        // Por status de conclusão
        ctx.db.$queryRaw`
          SELECT 
            CASE 
              WHEN current_amount >= target_amount THEN 'completed'
              WHEN target_date < NOW() THEN 'overdue'
              ELSE 'active'
            END as status,
            COUNT(*) as count
          FROM financial_goals 
          WHERE company_id = ${companyId}
            ${input.period ? `AND created_at >= ${input.period.startDate} AND created_at <= ${input.period.endDate}` : ''}
          GROUP BY status
        `
      ])

      return {
        total: {
          count: totalStats._count.id,
          targetAmount: Number(totalStats._sum.targetAmount || 0),
          currentAmount: Number(totalStats._sum.currentAmount || 0),
          avgTargetAmount: Number(totalStats._avg.targetAmount || 0),
          avgCurrentAmount: Number(totalStats._avg.currentAmount || 0)
        },
        byType: typeStats.map(stat => ({
          type: stat.type,
          count: stat._count.id,
          targetAmount: Number(stat._sum.targetAmount || 0),
          currentAmount: Number(stat._sum.currentAmount || 0),
          progress: stat._sum.targetAmount 
            ? (Number(stat._sum.currentAmount || 0) / Number(stat._sum.targetAmount || 0)) * 100
            : 0
        })),
        byStatus: completionStats
      }
    })
})