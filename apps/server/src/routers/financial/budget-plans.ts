import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'

const BudgetPlanSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  totalAmount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  categories: z.array(z.object({
    categoryId: z.string().min(1, 'Categoria é obrigatória'),
    amount: z.number().min(0)
  })).min(1, 'Pelo menos uma categoria é obrigatória')
})

export const budgetPlansRouter = router({
  // Criar orçamento geral
  create: protectedProcedure
    .use(PermissionService.requirePermission('finance.budgets.create'))
    .input(BudgetPlanSchema)
    .mutation(async ({ ctx, input }) => {
      console.log('BudgetPlans.create - Input received:', JSON.stringify(input, null, 2))
      const companyId = ctx.user.companyId
      console.log('CompanyId:', companyId)

      // Verificar se todas as categorias existem
      const categoryIds = input.categories.map(cat => cat.categoryId)
      console.log('Category IDs:', categoryIds)
      
      const existingCategories = await ctx.db.budgetCategory.findMany({
        where: {
          id: { in: categoryIds },
          companyId
        }
      })
      
      console.log('Existing categories:', existingCategories.length)

      if (existingCategories.length !== categoryIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Uma ou mais categorias não encontradas'
        })
      }

      // Calcular datas baseadas no período
      const startDate = new Date(input.startDate)
      const endDate = new Date(input.endDate)

      // Criar orçamentos individuais por categoria
      const budgetPromises = input.categories.map(async (category) => {
        const startMonth = startDate.getMonth() + 1
        const startYear = startDate.getFullYear()

        return ctx.db.budget.upsert({
          where: {
            companyId_categoryId_month_year: {
              companyId,
              categoryId: category.categoryId,
              month: startMonth,
              year: startYear
            }
          },
          update: {
            plannedAmount: category.amount
          },
          create: {
            companyId,
            categoryId: category.categoryId,
            month: startMonth,
            year: startYear,
            plannedAmount: category.amount
          },
          include: {
            category: true
          }
        })
      })

      const createdBudgets = await Promise.all(budgetPromises)

      return {
        name: input.name,
        totalAmount: input.totalAmount,
        period: input.period,
        startDate: input.startDate,
        endDate: input.endDate,
        budgets: createdBudgets
      }
    })
})