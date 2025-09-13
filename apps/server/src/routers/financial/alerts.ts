import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'

const AlertTypeSchema = z.enum(['BUDGET_EXCEEDED', 'GOAL_RISK', 'ANOMALY', 'CASH_FLOW', 'AI_INSIGHT', 'PATTERN_DETECTED'])
const AlertSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export const alertsRouter = router({
  // Listar alertas
  list: protectedProcedure
    .use(PermissionService.requirePermission('finance.alerts.read'))
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
      type: AlertTypeSchema.optional(),
      severity: AlertSeveritySchema.optional(),
      read: z.boolean().optional(),
      categoryId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const skip = (input.page - 1) * input.limit

      const where: any = { companyId }
      
      if (input.type) where.type = input.type
      if (input.severity) where.severity = input.severity
      if (input.read !== undefined) where.read = input.read
      if (input.categoryId) where.categoryId = input.categoryId

      const [alerts, totalCount] = await Promise.all([
        ctx.db.financialAlert.findMany({
          where,
          skip,
          take: input.limit,
          include: {
            category: {
              select: { id: true, name: true, type: true, icon: true, color: true }
            },
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: [
            { read: 'asc' }, // Não lidos primeiro
            { severity: 'desc' }, // Mais severos primeiro
            { createdAt: 'desc' }
          ]
        }),
        ctx.db.financialAlert.count({ where })
      ])

      return {
        data: alerts,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalCount,
          totalPages: Math.ceil(totalCount / input.limit)
        }
      }
    }),

  // Buscar alerta por ID
  getById: protectedProcedure
    .use(PermissionService.requirePermission('finance.alerts.read'))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const alert = await ctx.db.financialAlert.findFirst({
        where: { id: input.id, companyId },
        include: {
          category: true,
          user: { select: { id: true, name: true, email: true } }
        }
      })

      if (!alert) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Alerta não encontrado'
        })
      }

      return alert
    }),

  // Marcar alerta como lido
  markAsRead: protectedProcedure
    .use(PermissionService.requirePermission('finance.alerts.update'))
    .input(z.object({
      id: z.string().optional(),
      ids: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      if (!input.id && !input.ids) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'ID ou lista de IDs é obrigatório'
        })
      }

      const where: any = { companyId }
      
      if (input.id) {
        where.id = input.id
      } else if (input.ids) {
        where.id = { in: input.ids }
      }

      return ctx.db.financialAlert.updateMany({
        where,
        data: { read: true }
      })
    }),

  // Marcar todos como lidos
  markAllAsRead: protectedProcedure
    .use(PermissionService.requirePermission('finance.alerts.update'))
    .input(z.object({
      type: AlertTypeSchema.optional(),
      severity: AlertSeveritySchema.optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const where: any = { companyId, read: false }
      
      if (input.type) where.type = input.type
      if (input.severity) where.severity = input.severity

      return ctx.db.financialAlert.updateMany({
        where,
        data: { read: true }
      })
    }),

  // Criar alerta manualmente
  create: protectedProcedure
    .use(PermissionService.requirePermission('finance.alerts.create'))
    .input(z.object({
      type: AlertTypeSchema,
      title: z.string().min(1).max(100),
      message: z.string().min(1).max(500),
      severity: AlertSeveritySchema,
      categoryId: z.string().optional(),
      userId: z.string().optional(),
      data: z.record(z.unknown()).optional(),
      actionable: z.boolean().default(true),
      expiresAt: z.date().optional()
    }))
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

      // Verificar se usuário existe (se fornecido)
      if (input.userId) {
        const user = await ctx.db.user.findFirst({
          where: { id: input.userId, companyId }
        })

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Usuário não encontrado'
          })
        }
      }

      return ctx.db.financialAlert.create({
        data: {
          ...input,
          companyId
        },
        include: {
          category: true,
          user: { select: { id: true, name: true } }
        }
      })
    }),

  // Excluir alerta
  delete: protectedProcedure
    .use(PermissionService.requirePermission('finance.alerts.delete'))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const alert = await ctx.db.financialAlert.findFirst({
        where: { id: input.id, companyId }
      })

      if (!alert) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Alerta não encontrado'
        })
      }

      return ctx.db.financialAlert.delete({
        where: { id: input.id }
      })
    }),

  // Limpar alertas antigos/lidos
  cleanup: protectedProcedure
    .use(PermissionService.requirePermission('finance.alerts.delete'))
    .input(z.object({
      olderThanDays: z.number().int().min(1).default(30),
      readOnly: z.boolean().default(true)
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const cutoffDate = new Date(Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000)

      const where: any = {
        companyId,
        createdAt: { lt: cutoffDate }
      }

      if (input.readOnly) {
        where.read = true
      }

      const deleted = await ctx.db.financialAlert.deleteMany({ where })
      
      return { deleted: deleted.count }
    }),

  // Estatísticas de alertas
  getStats: protectedProcedure
    .use(PermissionService.requirePermission('finance.alerts.read'))
    .query(async ({ ctx }) => {
      const companyId = ctx.user.companyId

      const [totalStats, severityStats, typeStats] = await Promise.all([
        // Total e não lidos
        ctx.db.financialAlert.groupBy({
          by: ['read'],
          where: { companyId },
          _count: { id: true }
        }),

        // Por severidade
        ctx.db.financialAlert.groupBy({
          by: ['severity'],
          where: { companyId },
          _count: { id: true }
        }),

        // Por tipo
        ctx.db.financialAlert.groupBy({
          by: ['type'],
          where: { companyId },
          _count: { id: true }
        })
      ])

      const totalCount = totalStats.reduce((sum, stat) => sum + stat._count.id, 0)
      const unreadCount = totalStats.find(stat => !stat.read)?._count.id || 0

      return {
        total: totalCount,
        unread: unreadCount,
        read: totalCount - unreadCount,
        bySeverity: severityStats.reduce((acc, stat) => {
          acc[stat.severity] = stat._count.id
          return acc
        }, {} as Record<string, number>),
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.id
          return acc
        }, {} as Record<string, number>)
      }
    }),

  // Verificar condições para criar alertas automáticos
  checkAndCreateAlerts: protectedProcedure
    .use(PermissionService.requirePermission('finance.alerts.create'))
    .mutation(async ({ ctx }) => {
      const companyId = ctx.user.companyId
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      const alertsCreated = []

      try {
        // 1. Verificar orçamentos ultrapassados
        const budgetAlerts = await checkBudgetAlerts(ctx, companyId, currentYear, currentMonth)
        alertsCreated.push(...budgetAlerts)

        // 2. Verificar metas em risco
        const goalAlerts = await checkGoalAlerts(ctx, companyId)
        alertsCreated.push(...goalAlerts)

        // 3. Verificar fluxo de caixa negativo
        const cashFlowAlerts = await checkCashFlowAlerts(ctx, companyId)
        alertsCreated.push(...cashFlowAlerts)

        return {
          created: alertsCreated.length,
          alerts: alertsCreated
        }

      } catch (error) {
        console.error('Erro ao verificar alertas automáticos:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha na verificação de alertas automáticos'
        })
      }
    })
})

// Helper functions
async function checkBudgetAlerts(ctx: any, companyId: string, year: number, month: number) {
  const alerts = []

  // Buscar orçamentos e gastos do mês atual
  const budgets = await ctx.db.budget.findMany({
    where: { companyId, year, month },
    include: { category: true }
  })

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const actualSpending = await ctx.db.transaction.groupBy({
    by: ['categoryId'],
    where: {
      companyId,
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  })

  const spendingMap = actualSpending.reduce((acc, spend) => {
    acc[spend.categoryId] = Number(spend._sum.amount || 0)
    return acc
  }, {} as Record<string, number>)

  for (const budget of budgets) {
    const actual = spendingMap[budget.categoryId] || 0
    const planned = Number(budget.plannedAmount)
    const percentage = planned > 0 ? (actual / planned) * 100 : 0

    // Alerta se ultrapassou 90% do orçamento
    if (percentage >= 90 && percentage < 100) {
      const existingAlert = await ctx.db.financialAlert.findFirst({
        where: {
          companyId,
          type: 'BUDGET_EXCEEDED',
          categoryId: budget.categoryId,
          createdAt: { gte: startDate }
        }
      })

      if (!existingAlert) {
        const alert = await ctx.db.financialAlert.create({
          data: {
            type: 'BUDGET_EXCEEDED',
            title: `Orçamento quase ultrapassado: ${budget.category.name}`,
            message: `A categoria "${budget.category.name}" já utilizou ${percentage.toFixed(1)}% do orçamento mensal (R$ ${actual.toFixed(2)} de R$ ${planned.toFixed(2)}).`,
            severity: 'MEDIUM',
            categoryId: budget.categoryId,
            companyId,
            data: { percentage, actual, planned }
          }
        })
        alerts.push(alert)
      }
    }
    // Alerta se ultrapassou 100%
    else if (percentage >= 100) {
      const existingAlert = await ctx.db.financialAlert.findFirst({
        where: {
          companyId,
          type: 'BUDGET_EXCEEDED',
          categoryId: budget.categoryId,
          createdAt: { gte: startDate }
        }
      })

      if (!existingAlert) {
        const alert = await ctx.db.financialAlert.create({
          data: {
            type: 'BUDGET_EXCEEDED',
            title: `Orçamento ultrapassado: ${budget.category.name}`,
            message: `A categoria "${budget.category.name}" ultrapassou o orçamento mensal em ${(percentage - 100).toFixed(1)}% (R$ ${actual.toFixed(2)} de R$ ${planned.toFixed(2)}).`,
            severity: 'HIGH',
            categoryId: budget.categoryId,
            companyId,
            data: { percentage, actual, planned }
          }
        })
        alerts.push(alert)
      }
    }
  }

  return alerts
}

async function checkGoalAlerts(ctx: any, companyId: string) {
  const alerts = []
  const now = new Date()

  // Buscar metas próximas do vencimento (30 dias) e com progresso insuficiente
  const goals = await ctx.db.financialGoal.findMany({
    where: {
      companyId,
      active: true,
      targetDate: {
        gte: now,
        lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      }
    }
  })

  for (const goal of goals) {
    const progress = Number(goal.currentAmount) / Number(goal.targetAmount) * 100
    const daysToTarget = Math.ceil((goal.targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

    // Se faltam menos de 30 dias e progresso < 70%
    if (daysToTarget <= 30 && progress < 70) {
      const existingAlert = await ctx.db.financialAlert.findFirst({
        where: {
          companyId,
          type: 'GOAL_RISK',
          data: { path: ['goalId'], equals: goal.id },
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } // Última semana
        }
      })

      if (!existingAlert) {
        const alert = await ctx.db.financialAlert.create({
          data: {
            type: 'GOAL_RISK',
            title: `Meta em risco: ${goal.name}`,
            message: `A meta "${goal.name}" está com apenas ${progress.toFixed(1)}% de progresso e vence em ${daysToTarget} dias.`,
            severity: daysToTarget <= 7 ? 'HIGH' : 'MEDIUM',
            companyId,
            data: { goalId: goal.id, progress, daysToTarget }
          }
        })
        alerts.push(alert)
      }
    }
  }

  return alerts
}

async function checkCashFlowAlerts(ctx: any, companyId: string) {
  const alerts = []
  const now = new Date()
  
  // Verificar últimos 7 dias
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const dailyFlow = await ctx.db.$queryRaw`
    SELECT 
      DATE(date) as day,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
    FROM transactions 
    WHERE company_id = ${companyId}
      AND date >= ${startDate}
    GROUP BY DATE(date)
    ORDER BY day DESC
    LIMIT 7
  ` as any[]

  let consecutiveNegativeDays = 0
  let totalNegative = 0

  for (const day of dailyFlow) {
    const dailyNet = Number(day.income) - Number(day.expense)
    if (dailyNet < 0) {
      consecutiveNegativeDays++
      totalNegative += Math.abs(dailyNet)
    } else {
      break
    }
  }

  // Alerta se 3+ dias consecutivos negativos
  if (consecutiveNegativeDays >= 3) {
    const existingAlert = await ctx.db.financialAlert.findFirst({
      where: {
        companyId,
        type: 'CASH_FLOW',
        createdAt: { gte: startDate }
      }
    })

    if (!existingAlert) {
      const alert = await ctx.db.financialAlert.create({
        data: {
          type: 'CASH_FLOW',
          title: 'Fluxo de caixa negativo',
          message: `Fluxo de caixa negativo por ${consecutiveNegativeDays} dias consecutivos. Total negativo: R$ ${totalNegative.toFixed(2)}.`,
          severity: consecutiveNegativeDays >= 5 ? 'HIGH' : 'MEDIUM',
          companyId,
          data: { consecutiveNegativeDays, totalNegative }
        }
      })
      alerts.push(alert)
    }
  }

  return alerts
}