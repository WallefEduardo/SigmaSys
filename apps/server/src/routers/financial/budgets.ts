import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'

const BudgetSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2030),
  plannedAmount: z.number().positive('Valor deve ser positivo')
})

export const budgetsRouter = router({
  // Listar orçamentos
  list: protectedProcedure
    .use(PermissionService.requirePermission('finance.budgets.read'))
    .input(z.object({
      year: z.number().int().optional(),
      month: z.union([z.number().int().min(1).max(12), z.string()]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      categoryId: z.string().optional(),
      includeActuals: z.boolean().default(true)
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1

      const where: any = { companyId }
      
      let year = input.year || currentYear
      let month = currentMonth
      let startDate: Date
      let endDate: Date
      
      // Priorizar startDate/endDate se fornecidos
      if (input.startDate && input.endDate) {
        startDate = new Date(input.startDate)
        endDate = new Date(input.endDate)
        
        // Buscar todos os orçamentos no período
        const startYear = startDate.getFullYear()
        const startMonth = startDate.getMonth() + 1
        const endYear = endDate.getFullYear()
        const endMonth = endDate.getMonth() + 1
        
        // Se for o mesmo mês, filtrar por mês
        if (startYear === endYear && startMonth === endMonth) {
          where.year = startYear
          where.month = startMonth
        } else {
          // Se for período maior, buscar todos os meses no período
          const months = []
          
          for (let year = startYear; year <= endYear; year++) {
            const monthStart = year === startYear ? startMonth : 1
            const monthEnd = year === endYear ? endMonth : 12
            
            for (let month = monthStart; month <= monthEnd; month++) {
              months.push({ year, month })
            }
          }
          
          where.OR = months.map(m => ({ year: m.year, month: m.month }))
        }
      } else {
        // Parse month if it's a string like "2025-09"
        if (input.month) {
          if (typeof input.month === 'string') {
            const [yearStr, monthStr] = input.month.split('-')
            year = parseInt(yearStr)
            month = parseInt(monthStr)
          } else {
            month = input.month
          }
        }
        
        where.year = year
        where.month = month
        startDate = new Date(year, month - 1, 1)
        endDate = new Date(year, month, 1)
      }
      
      if (input.categoryId) where.categoryId = input.categoryId

      const budgets = await ctx.db.budget.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              icon: true,
              color: true
            }
          }
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { category: { name: 'asc' } }
        ]
      })

      if (!input.includeActuals) {
        return budgets
      }

      // Buscar valores realizados
      const budgetIds = budgets.map(b => b.categoryId)
      const actualsByCategory = await ctx.db.transaction.groupBy({
        by: ['categoryId'],
        where: {
          companyId,
          categoryId: { in: budgetIds },
          date: {
            gte: startDate,
            lt: endDate
          }
        },
        _sum: {
          amount: true
        }
      })

      const actualsMap = actualsByCategory.reduce((acc, actual) => {
        acc[actual.categoryId] = Number(actual._sum.amount || 0)
        return acc
      }, {} as Record<string, number>)

      return budgets.map(budget => ({
        ...budget,
        actualAmount: actualsMap[budget.categoryId] || 0,
        variance: (actualsMap[budget.categoryId] || 0) - Number(budget.plannedAmount),
        variancePercent: Number(budget.plannedAmount) > 0 
          ? ((actualsMap[budget.categoryId] || 0) - Number(budget.plannedAmount)) / Number(budget.plannedAmount) * 100
          : 0
      }))
    }),

  // Orçamento por período
  getByPeriod: protectedProcedure
    .use(PermissionService.requirePermission('finance.budgets.read'))
    .input(z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12)
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const budgets = await ctx.db.budget.findMany({
        where: {
          companyId,
          year: input.year,
          month: input.month
        },
        include: {
          category: true
        }
      })

      // Buscar transações do período
      const startDate = new Date(input.year, input.month - 1, 1)
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59)

      const transactions = await ctx.db.transaction.groupBy({
        by: ['categoryId', 'type'],
        where: {
          companyId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          amount: true
        }
      })

      const transactionsByCategory = transactions.reduce((acc, t) => {
        if (!acc[t.categoryId]) acc[t.categoryId] = { INCOME: 0, EXPENSE: 0 }
        acc[t.categoryId][t.type] = Number(t._sum.amount || 0)
        return acc
      }, {} as Record<string, Record<string, number>>)

      return {
        period: { year: input.year, month: input.month },
        budgets: budgets.map(budget => ({
          ...budget,
          actualAmount: transactionsByCategory[budget.categoryId]?.[budget.category.type] || 0
        })),
        summary: {
          totalPlanned: budgets.reduce((sum, b) => sum + Number(b.plannedAmount), 0),
          totalActual: Object.values(transactionsByCategory).reduce((sum, cat) => 
            sum + (cat.INCOME || 0) + (cat.EXPENSE || 0), 0
          )
        }
      }
    }),

  // Criar/Atualizar orçamento
  upsert: protectedProcedure
    .use(PermissionService.requirePermission('finance.budgets.create'))
    .input(BudgetSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      // Verificar se categoria existe
      const category = await ctx.db.budgetCategory.findFirst({
        where: { id: input.categoryId, companyId }
      })

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Categoria não encontrada'
        })
      }

      return ctx.db.budget.upsert({
        where: {
          companyId_categoryId_month_year: {
            companyId,
            categoryId: input.categoryId,
            month: input.month,
            year: input.year
          }
        },
        update: {
          plannedAmount: input.plannedAmount
        },
        create: {
          ...input,
          companyId
        },
        include: {
          category: true
        }
      })
    }),

  // Criar orçamentos em lote
  createBulk: protectedProcedure
    .use(PermissionService.requirePermission('finance.budgets.create'))
    .input(z.object({
      budgets: z.array(BudgetSchema.omit({ id: true })),
      overwriteExisting: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      // Validar todas as categorias existem
      const categoryIds = [...new Set(input.budgets.map(b => b.categoryId))]
      const categories = await ctx.db.budgetCategory.findMany({
        where: {
          id: { in: categoryIds },
          companyId
        }
      })

      if (categories.length !== categoryIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Uma ou mais categorias não encontradas'
        })
      }

      const results = []

      for (const budget of input.budgets) {
        if (input.overwriteExisting) {
          const result = await ctx.db.budget.upsert({
            where: {
              companyId_categoryId_month_year: {
                companyId,
                categoryId: budget.categoryId,
                month: budget.month,
                year: budget.year
              }
            },
            update: { plannedAmount: budget.plannedAmount },
            create: { ...budget, companyId }
          })
          results.push(result)
        } else {
          try {
            const result = await ctx.db.budget.create({
              data: { ...budget, companyId }
            })
            results.push(result)
          } catch (error) {
            // Skip duplicates if not overwriting
            continue
          }
        }
      }

      return {
        created: results.length,
        budgets: results
      }
    }),

  // Excluir orçamento
  delete: protectedProcedure
    .use(PermissionService.requirePermission('finance.budgets.delete'))
    .input(z.object({
      categoryId: z.string(),
      year: z.number().int(),
      month: z.number().int().min(1).max(12)
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      return ctx.db.budget.delete({
        where: {
          companyId_categoryId_month_year: {
            companyId,
            categoryId: input.categoryId,
            month: input.month,
            year: input.year
          }
        }
      })
    }),

  // Copiar orçamentos de um período para outro
  copyPeriod: protectedProcedure
    .use(PermissionService.requirePermission('finance.budgets.create'))
    .input(z.object({
      fromYear: z.number().int(),
      fromMonth: z.number().int().min(1).max(12),
      toYear: z.number().int(),
      toMonth: z.number().int().min(1).max(12),
      adjustmentPercent: z.number().default(0) // % de ajuste (positivo ou negativo)
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const sourceBudgets = await ctx.db.budget.findMany({
        where: {
          companyId,
          year: input.fromYear,
          month: input.fromMonth
        }
      })

      if (sourceBudgets.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Nenhum orçamento encontrado no período origem'
        })
      }

      const adjustmentMultiplier = 1 + (input.adjustmentPercent / 100)

      const newBudgets = sourceBudgets.map(budget => ({
        categoryId: budget.categoryId,
        month: input.toMonth,
        year: input.toYear,
        plannedAmount: Number(budget.plannedAmount) * adjustmentMultiplier,
        companyId
      }))

      // Delete existing budgets for the target period
      await ctx.db.budget.deleteMany({
        where: {
          companyId,
          year: input.toYear,
          month: input.toMonth
        }
      })

      // Create new budgets
      await ctx.db.budget.createMany({
        data: newBudgets
      })

      return {
        copied: newBudgets.length,
        adjustmentPercent: input.adjustmentPercent
      }
    }),

  // Dashboard summary
  getDashboardSummary: protectedProcedure
    .use(PermissionService.requirePermission('finance.budgets.read'))
    .input(z.object({
      year: z.number().int().optional(),
      month: z.number().int().min(1).max(12).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const now = new Date()
      const year = input.year || now.getFullYear()
      const month = input.month || (now.getMonth() + 1)

      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)

      // Orçamentos do período
      const budgets = await ctx.db.budget.findMany({
        where: { companyId, year, month },
        include: { category: true }
      })

      // Transações do período
      const transactions = await ctx.db.transaction.groupBy({
        by: ['type'],
        where: {
          companyId,
          date: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true }
      })

      const transactionSums = transactions.reduce((acc, t) => {
        acc[t.type] = Number(t._sum.amount || 0)
        return acc
      }, { INCOME: 0, EXPENSE: 0 })

      const budgetSums = budgets.reduce((acc, b) => {
        acc[b.category.type] = (acc[b.category.type] || 0) + Number(b.plannedAmount)
        return acc
      }, { INCOME: 0, EXPENSE: 0 })

      return {
        period: { year, month },
        planned: budgetSums,
        actual: transactionSums,
        variance: {
          INCOME: transactionSums.INCOME - budgetSums.INCOME,
          EXPENSE: transactionSums.EXPENSE - budgetSums.EXPENSE
        },
        percentageUsed: {
          INCOME: budgetSums.INCOME > 0 ? (transactionSums.INCOME / budgetSums.INCOME) * 100 : 0,
          EXPENSE: budgetSums.EXPENSE > 0 ? (transactionSums.EXPENSE / budgetSums.EXPENSE) * 100 : 0
        }
      }
    }),

  // Estatísticas dos orçamentos
  getStats: protectedProcedure
    .use(PermissionService.requirePermission('finance.budgets.read'))
    .input(z.object({
      month: z.string().optional(),
      year: z.number().int().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const now = new Date()
      
      let year: number
      let month: number
      let where: any = { companyId }
      
      if (input.startDate && input.endDate) {
        const startDate = new Date(input.startDate)
        const endDate = new Date(input.endDate)
        const startYear = startDate.getFullYear()
        const startMonth = startDate.getMonth() + 1
        const endYear = endDate.getFullYear()
        const endMonth = endDate.getMonth() + 1
        
        if (startYear === endYear && startMonth === endMonth) {
          where.year = startYear
          where.month = startMonth
        } else {
          const months = []
          
          for (let year = startYear; year <= endYear; year++) {
            const monthStart = year === startYear ? startMonth : 1
            const monthEnd = year === endYear ? endMonth : 12
            
            for (let month = monthStart; month <= monthEnd; month++) {
              months.push({ year, month })
            }
          }
          
          where.OR = months.map(m => ({ year: m.year, month: m.month }))
        }
      } else if (input.month) {
        const [yearStr, monthStr] = input.month.split('-')
        year = parseInt(yearStr)
        month = parseInt(monthStr)
        where.year = year
        where.month = month
      } else {
        year = input.year || now.getFullYear()
        month = now.getMonth() + 1
        where.year = year
        where.month = month
      }

      const budgets = await ctx.db.budget.findMany({
        where,
        include: { category: true }
      })

      const totalPlanned = budgets.reduce((sum, b) => sum + Number(b.plannedAmount), 0)
      const categoriesCount = budgets.length

      return {
        totalPlanned,
        categoriesCount,
        budgetsByCategory: budgets.map(b => ({
          categoryName: b.category.name,
          plannedAmount: Number(b.plannedAmount),
          categoryType: b.category.type
        }))
      }
    })
})