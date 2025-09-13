import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'

const CategoryTypeSchema = z.enum(['INCOME', 'EXPENSE'])

const BudgetCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  type: CategoryTypeSchema,
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().default(true)
})

export const budgetCategoriesRouter = router({
  // Listar categorias
  list: protectedProcedure
    .use(PermissionService.requirePermission('finance.categories.read'))
    .input(z.object({
      type: CategoryTypeSchema.optional(),
      active: z.boolean().optional(),
      search: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const where: any = { companyId }
      
      if (input.type) where.type = input.type
      if (input.active !== undefined) where.active = input.active
      if (input.search) {
        where.name = {
          contains: input.search,
          mode: 'insensitive'
        }
      }

      return ctx.db.budgetCategory.findMany({
        where,
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ],
        include: {
          _count: {
            select: {
              transactions: { where: { companyId } },
              budgets: { where: { companyId } }
            }
          }
        }
      })
    }),

  // Buscar categoria por ID
  getById: protectedProcedure
    .use(PermissionService.requirePermission('finance.categories.read'))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const category = await ctx.db.budgetCategory.findFirst({
        where: { 
          id: input.id, 
          companyId 
        },
        include: {
          _count: {
            select: {
              transactions: { where: { companyId } },
              budgets: { where: { companyId } }
            }
          }
        }
      })

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Categoria não encontrada'
        })
      }

      return category
    }),

  // Criar categoria
  create: protectedProcedure
    .use(PermissionService.requirePermission('finance.categories.create'))
    .input(BudgetCategorySchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      // Verificar se já existe categoria com mesmo nome
      const existing = await ctx.db.budgetCategory.findFirst({
        where: {
          companyId,
          name: input.name,
          type: input.type
        }
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Já existe uma categoria com este nome'
        })
      }

      return ctx.db.budgetCategory.create({
        data: {
          ...input,
          companyId
        }
      })
    }),

  // Atualizar categoria
  update: protectedProcedure
    .use(PermissionService.requirePermission('finance.categories.update'))
    .input(z.object({
      id: z.string(),
      data: BudgetCategorySchema.omit({ id: true }).partial()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      // Verificar se categoria existe
      const existing = await ctx.db.budgetCategory.findFirst({
        where: { id: input.id, companyId }
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Categoria não encontrada'
        })
      }

      // Se está mudando nome, verificar duplicação
      if (input.data.name && input.data.name !== existing.name) {
        const duplicate = await ctx.db.budgetCategory.findFirst({
          where: {
            companyId,
            name: input.data.name,
            type: input.data.type || existing.type,
            NOT: { id: input.id }
          }
        })

        if (duplicate) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Já existe uma categoria com este nome'
          })
        }
      }

      return ctx.db.budgetCategory.update({
        where: { id: input.id },
        data: input.data
      })
    }),

  // Excluir categoria (soft delete)
  delete: protectedProcedure
    .use(PermissionService.requirePermission('finance.categories.delete'))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const category = await ctx.db.budgetCategory.findFirst({
        where: { id: input.id, companyId },
        include: {
          _count: {
            select: {
              transactions: true,
              budgets: true
            }
          }
        }
      })

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Categoria não encontrada'
        })
      }

      // Verificar se tem transações ou orçamentos associados
      if (category._count.transactions > 0 || category._count.budgets > 0) {
        // Soft delete - apenas desativa
        return ctx.db.budgetCategory.update({
          where: { id: input.id },
          data: { active: false }
        })
      }

      // Hard delete se não tem dados associados
      return ctx.db.budgetCategory.delete({
        where: { id: input.id }
      })
    }),

  // Estatísticas das categorias
  getStats: protectedProcedure
    .use(PermissionService.requirePermission('finance.categories.read'))
    .query(async ({ ctx }) => {
      const companyId = ctx.user.companyId

      const stats = await ctx.db.budgetCategory.groupBy({
        by: ['type'],
        where: { companyId, active: true },
        _count: {
          id: true
        }
      })

      const totalTransactions = await ctx.db.transaction.groupBy({
        by: ['categoryId'],
        where: { companyId },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      })

      return {
        categoriesByType: stats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.id
          return acc
        }, {} as Record<string, number>),
        totalCategories: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        transactionVolume: totalTransactions.reduce((sum, t) => sum + Number(t._sum.amount || 0), 0),
        activeCategories: stats.reduce((sum, stat) => sum + stat._count.id, 0)
      }
    })
})