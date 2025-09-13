import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'

export const dashboardRouter = router({
  // Overview geral do dashboard
  getOverview: protectedProcedure
    .use(PermissionService.requirePermission('finance.dashboard.read'))
    .input(z.object({
      period: z.object({
        startDate: z.date(),
        endDate: z.date()
      }).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const now = new Date()
      
      // Período padrão: mês atual
      const startDate = input.period?.startDate || new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = input.period?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      // Transações do período
      const [incomeTransactions, expenseTransactions] = await Promise.all([
        ctx.db.transaction.aggregate({
          where: {
            companyId,
            type: 'INCOME',
            date: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true },
          _count: { id: true }
        }),
        ctx.db.transaction.aggregate({
          where: {
            companyId,
            type: 'EXPENSE', 
            date: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true },
          _count: { id: true }
        })
      ])

      // Orçamentos do período
      const [incomeBudgets, expenseBudgets] = await Promise.all([
        ctx.db.budget.aggregate({
          where: {
            companyId,
            year: startDate.getFullYear(),
            month: startDate.getMonth() + 1,
            category: { type: 'INCOME' }
          },
          _sum: { plannedAmount: true }
        }),
        ctx.db.budget.aggregate({
          where: {
            companyId,
            year: startDate.getFullYear(),
            month: startDate.getMonth() + 1,
            category: { type: 'EXPENSE' }
          },
          _sum: { plannedAmount: true }
        })
      ])

      const actualIncome = Number(incomeTransactions._sum.amount || 0)
      const actualExpense = Number(expenseTransactions._sum.amount || 0)
      const plannedIncome = Number(incomeBudgets._sum.plannedAmount || 0)
      const plannedExpense = Number(expenseBudgets._sum.plannedAmount || 0)

      return {
        period: { startDate, endDate },
        summary: {
          income: {
            actual: actualIncome,
            planned: plannedIncome,
            variance: actualIncome - plannedIncome,
            variancePercent: plannedIncome > 0 ? ((actualIncome - plannedIncome) / plannedIncome) * 100 : 0,
            transactions: incomeTransactions._count.id
          },
          expense: {
            actual: actualExpense,
            planned: plannedExpense,
            variance: actualExpense - plannedExpense,
            variancePercent: plannedExpense > 0 ? ((actualExpense - plannedExpense) / plannedExpense) * 100 : 0,
            transactions: expenseTransactions._count.id
          },
          balance: {
            actual: actualIncome - actualExpense,
            planned: plannedIncome - plannedExpense
          }
        }
      }
    }),

  // Gráficos para dashboard
  getChartData: protectedProcedure
    .use(PermissionService.requirePermission('finance.dashboard.read'))
    .input(z.object({
      type: z.enum(['monthly_trends', 'category_breakdown', 'budget_vs_actual', 'cash_flow']),
      period: z.object({
        startDate: z.date(),
        endDate: z.date()
      }).optional(),
      categoryType: z.enum(['INCOME', 'EXPENSE']).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      
      switch (input.type) {
        case 'monthly_trends':
          return getMonthlyTrends(ctx, companyId, input.period)
          
        case 'category_breakdown':
          return getCategoryBreakdown(ctx, companyId, input.period, input.categoryType)
          
        case 'budget_vs_actual':
          return getBudgetVsActual(ctx, companyId, input.period)
          
        case 'cash_flow':
          return getCashFlowData(ctx, companyId, input.period)
          
        default:
          return null
      }
    }),

  // Top categorias por valor
  getTopCategories: protectedProcedure
    .use(PermissionService.requirePermission('finance.dashboard.read'))
    .input(z.object({
      type: z.enum(['INCOME', 'EXPENSE']).optional(),
      period: z.object({
        startDate: z.date(),
        endDate: z.date()
      }).optional(),
      limit: z.number().int().min(1).max(20).default(5)
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const now = new Date()
      
      const startDate = input.period?.startDate || new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = input.period?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const where: any = {
        companyId,
        date: { gte: startDate, lte: endDate }
      }

      if (input.type) where.type = input.type

      const topCategories = await ctx.db.transaction.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: input.limit
      })

      // Buscar detalhes das categorias
      const categoryIds = topCategories.map(c => c.categoryId)
      const categories = await ctx.db.budgetCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, type: true, icon: true, color: true }
      })

      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat
        return acc
      }, {} as Record<string, any>)

      return topCategories.map(stat => ({
        category: categoryMap[stat.categoryId],
        amount: Number(stat._sum.amount || 0),
        transactions: stat._count.id
      }))
    }),

  // Transações recentes
  getRecentTransactions: protectedProcedure
    .use(PermissionService.requirePermission('finance.dashboard.read'))
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(10),
      type: z.enum(['INCOME', 'EXPENSE']).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const where: any = { companyId }
      if (input.type) where.type = input.type

      return ctx.db.transaction.findMany({
        where,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, type: true, icon: true, color: true }
          },
          user: {
            select: { id: true, name: true }
          }
        }
      })
    })
})

// Helper functions
async function getMonthlyTrends(ctx: any, companyId: string, period?: any) {
  const endDate = period?.endDate || new Date()
  const startDate = period?.startDate || new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1)

  const monthlyData = await ctx.db.$queryRaw`
    SELECT 
      DATE_TRUNC('month', date) as month,
      type,
      SUM(amount) as total
    FROM transactions 
    WHERE company_id = ${companyId}
      AND date >= ${startDate}
      AND date <= ${endDate}
    GROUP BY DATE_TRUNC('month', date), type
    ORDER BY month ASC
  `

  // Processar dados para formato do gráfico
  const months = new Map()
  
  for (const row of monthlyData as any[]) {
    const monthKey = row.month.toISOString().substring(0, 7) // YYYY-MM
    
    if (!months.has(monthKey)) {
      months.set(monthKey, { month: monthKey, INCOME: 0, EXPENSE: 0 })
    }
    
    months.get(monthKey)[row.type] = Number(row.total)
  }

  return Array.from(months.values())
}

async function getCategoryBreakdown(ctx: any, companyId: string, period?: any, categoryType?: string) {
  const now = new Date()
  const startDate = period?.startDate || new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = period?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const where: any = {
    companyId,
    date: { gte: startDate, lte: endDate }
  }

  if (categoryType) where.type = categoryType

  const categoryData = await ctx.db.transaction.groupBy({
    by: ['categoryId'],
    where,
    _sum: { amount: true }
  })

  const categoryIds = categoryData.map(c => c.categoryId)
  const categories = await ctx.db.budgetCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, type: true, color: true }
  })

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat
    return acc
  }, {} as Record<string, any>)

  return categoryData.map(data => ({
    category: categoryMap[data.categoryId],
    value: Number(data._sum.amount || 0)
  }))
}

async function getBudgetVsActual(ctx: any, companyId: string, period?: any) {
  const now = new Date()
  const year = period?.startDate?.getFullYear() || now.getFullYear()
  const month = period?.startDate ? period.startDate.getMonth() + 1 : now.getMonth() + 1

  const [budgets, transactions] = await Promise.all([
    ctx.db.budget.findMany({
      where: { companyId, year, month },
      include: { category: true }
    }),
    ctx.db.transaction.groupBy({
      by: ['categoryId'],
      where: {
        companyId,
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0)
        }
      },
      _sum: { amount: true }
    })
  ])

  const actualMap = transactions.reduce((acc, t) => {
    acc[t.categoryId] = Number(t._sum.amount || 0)
    return acc
  }, {} as Record<string, number>)

  return budgets.map(budget => ({
    category: budget.category,
    planned: Number(budget.plannedAmount),
    actual: actualMap[budget.categoryId] || 0
  }))
}

async function getCashFlowData(ctx: any, companyId: string, period?: any) {
  const endDate = period?.endDate || new Date()
  const startDate = period?.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  const dailyFlow = await ctx.db.$queryRaw`
    SELECT 
      DATE(date) as day,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
    FROM transactions 
    WHERE company_id = ${companyId}
      AND date >= ${startDate}
      AND date <= ${endDate}
    GROUP BY DATE(date)
    ORDER BY day ASC
  `

  let runningBalance = 0
  
  return (dailyFlow as any[]).map(row => {
    const dailyNet = Number(row.income) - Number(row.expense)
    runningBalance += dailyNet
    
    return {
      date: row.day,
      income: Number(row.income),
      expense: Number(row.expense),
      net: dailyNet,
      balance: runningBalance
    }
  })
}