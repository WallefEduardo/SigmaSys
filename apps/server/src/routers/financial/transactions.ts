import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'
import { getAIService } from '../../services/ai'

const TransactionTypeSchema = z.enum(['INCOME', 'EXPENSE'])

const TransactionSchema = z.object({
  id: z.string().optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória').max(200),
  date: z.date(),
  type: TransactionTypeSchema,
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  orderId: z.string().optional(),
  quoteId: z.string().optional(),
  tags: z.array(z.string()).default([])
})

export const transactionsRouter = router({
  // Listar transações
  list: protectedProcedure
    .use(PermissionService.requirePermission('finance.transactions.read'))
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      type: TransactionTypeSchema.optional(),
      categoryId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      search: z.string().optional(),
      orderId: z.string().optional(),
      sortBy: z.enum(['date', 'amount', 'description']).default('date'),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const skip = (input.page - 1) * input.limit

      const where: any = { companyId }

      if (input.type) where.type = input.type
      if (input.categoryId) where.categoryId = input.categoryId
      if (input.orderId) where.orderId = input.orderId
      
      if (input.startDate && input.endDate) {
        where.date = {
          gte: input.startDate,
          lte: input.endDate
        }
      } else if (input.startDate) {
        where.date = { gte: input.startDate }
      } else if (input.endDate) {
        where.date = { lte: input.endDate }
      }

      if (input.search) {
        where.description = {
          contains: input.search,
          mode: 'insensitive'
        }
      }

      const [transactions, totalCount] = await Promise.all([
        ctx.db.transaction.findMany({
          where,
          skip,
          take: input.limit,
          include: {
            category: {
              select: { id: true, name: true, type: true, icon: true, color: true }
            },
            user: {
              select: { id: true, name: true, email: true }
            },
            order: {
              select: { id: true, number: true, title: true }
            },
            quote: {
              select: { id: true, number: true, title: true }
            }
          },
          orderBy: { [input.sortBy]: input.sortOrder }
        }),
        ctx.db.transaction.count({ where })
      ])

      return {
        data: transactions,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalCount,
          totalPages: Math.ceil(totalCount / input.limit)
        }
      }
    }),

  // Buscar transação por ID
  getById: protectedProcedure
    .use(PermissionService.requirePermission('finance.transactions.read'))
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const transaction = await ctx.db.transaction.findFirst({
        where: { id: input.id, companyId },
        include: {
          category: true,
          user: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, number: true, title: true, totalPrice: true } },
          quote: { select: { id: true, number: true, title: true, totalPrice: true } }
        }
      })

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transação não encontrada'
        })
      }

      return transaction
    }),

  // Criar transação
  create: protectedProcedure
    .use(PermissionService.requirePermission('finance.transactions.create'))
    .input(TransactionSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const userId = ctx.user.id

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

      // Verificar se tipo da transação é compatível com tipo da categoria
      if (input.type !== category.type) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Tipo da transação (${input.type}) não compatível com tipo da categoria (${category.type})`
        })
      }

      return ctx.db.transaction.create({
        data: {
          ...input,
          companyId,
          userId,
          aiCategorized: false
        },
        include: {
          category: true,
          user: { select: { id: true, name: true } }
        }
      })
    }),

  // Criar transação com categorização automática por IA
  createWithAI: protectedProcedure
    .use(PermissionService.requirePermission('finance.transactions.create'))
    .input(z.object({
      amount: z.number().positive(),
      description: z.string().min(1).max(200),
      date: z.date(),
      type: TransactionTypeSchema,
      orderId: z.string().optional(),
      quoteId: z.string().optional(),
      forceCategory: z.string().optional() // Categoria manual override
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const userId = ctx.user.id

      let categoryId = input.forceCategory
      let aiCategorized = false
      let aiConfidence: number | undefined
      let aiTags: string[] = []

      if (!categoryId) {
        try {
          // Buscar categorias existentes do mesmo tipo
          const existingCategories = await ctx.db.budgetCategory.findMany({
            where: { companyId, type: input.type, active: true },
            select: { name: true }
          })

          const categoryNames = existingCategories.map(c => c.name)

          // Usar IA para categorizar
          const aiService = getAIService()
          const categorization = await aiService.categorizeTransaction(
            input.description,
            input.amount,
            categoryNames
          )

          // Encontrar ou criar categoria
          let category = await ctx.db.budgetCategory.findFirst({
            where: {
              companyId,
              name: categorization.category,
              type: input.type
            }
          })

          if (!category) {
            // Criar nova categoria sugerida pela IA
            category = await ctx.db.budgetCategory.create({
              data: {
                name: categorization.category,
                type: input.type,
                companyId,
                description: `Categoria criada automaticamente pela IA`
              }
            })
          }

          categoryId = category.id
          aiCategorized = true
          aiConfidence = categorization.confidence
          aiTags = categorization.tags

        } catch (error) {
          console.error('Erro na categorização por IA:', error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Falha na categorização automática. Selecione uma categoria manualmente.'
          })
        }
      }

      if (!categoryId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Categoria é obrigatória'
        })
      }

      return ctx.db.transaction.create({
        data: {
          amount: input.amount,
          description: input.description,
          date: input.date,
          type: input.type,
          categoryId,
          orderId: input.orderId,
          quoteId: input.quoteId,
          companyId,
          userId,
          aiCategorized,
          aiConfidence,
          tags: aiTags
        },
        include: {
          category: true,
          user: { select: { id: true, name: true } }
        }
      })
    }),

  // Atualizar transação
  update: protectedProcedure
    .use(PermissionService.requirePermission('finance.transactions.update'))
    .input(z.object({
      id: z.string(),
      data: TransactionSchema.omit({ id: true }).partial()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const existing = await ctx.db.transaction.findFirst({
        where: { id: input.id, companyId }
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transação não encontrada'
        })
      }

      // Se mudando categoria, verificar compatibilidade
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

        const transactionType = input.data.type || existing.type
        if (transactionType !== category.type) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Tipo da transação não compatível com tipo da categoria`
          })
        }
      }

      return ctx.db.transaction.update({
        where: { id: input.id },
        data: {
          ...input.data,
          aiCategorized: false // Reset AI flag when manually updated
        },
        include: {
          category: true,
          user: { select: { id: true, name: true } }
        }
      })
    }),

  // Excluir transação
  delete: protectedProcedure
    .use(PermissionService.requirePermission('finance.transactions.delete'))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const transaction = await ctx.db.transaction.findFirst({
        where: { id: input.id, companyId }
      })

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transação não encontrada'
        })
      }

      return ctx.db.transaction.delete({
        where: { id: input.id }
      })
    }),

  // Importar transações em lote
  importBulk: protectedProcedure
    .use(PermissionService.requirePermission('finance.transactions.create'))
    .input(z.object({
      transactions: z.array(z.object({
        amount: z.number().positive(),
        description: z.string().min(1),
        date: z.date(),
        type: TransactionTypeSchema,
        categoryName: z.string().optional(),
        categoryId: z.string().optional()
      })),
      useAI: z.boolean().default(true)
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const userId = ctx.user.id

      const results = {
        success: 0,
        errors: [] as string[],
        created: [] as any[]
      }

      for (const [index, transaction] of input.transactions.entries()) {
        try {
          let categoryId = transaction.categoryId

          if (!categoryId && input.useAI) {
            // Usar IA para categorizar
            const existingCategories = await ctx.db.budgetCategory.findMany({
              where: { companyId, type: transaction.type, active: true },
              select: { name: true }
            })

            const aiService = getAIService()
            const categorization = await aiService.categorizeTransaction(
              transaction.description,
              transaction.amount,
              existingCategories.map(c => c.name)
            )

            let category = await ctx.db.budgetCategory.findFirst({
              where: { companyId, name: categorization.category, type: transaction.type }
            })

            if (!category) {
              category = await ctx.db.budgetCategory.create({
                data: {
                  name: categorization.category,
                  type: transaction.type,
                  companyId
                }
              })
            }

            categoryId = category.id
          } else if (!categoryId && transaction.categoryName) {
            // Buscar por nome da categoria
            let category = await ctx.db.budgetCategory.findFirst({
              where: { companyId, name: transaction.categoryName, type: transaction.type }
            })

            if (!category) {
              category = await ctx.db.budgetCategory.create({
                data: {
                  name: transaction.categoryName,
                  type: transaction.type,
                  companyId
                }
              })
            }

            categoryId = category.id
          }

          if (!categoryId) {
            results.errors.push(`Linha ${index + 1}: Categoria não especificada`)
            continue
          }

          const created = await ctx.db.transaction.create({
            data: {
              amount: transaction.amount,
              description: transaction.description,
              date: transaction.date,
              type: transaction.type,
              categoryId,
              companyId,
              userId,
              aiCategorized: input.useAI && !transaction.categoryId
            }
          })

          results.created.push(created)
          results.success++

        } catch (error) {
          results.errors.push(`Linha ${index + 1}: ${(error as Error).message}`)
        }
      }

      return results
    }),

  // Estatísticas de transações
  getStats: protectedProcedure
    .use(PermissionService.requirePermission('finance.transactions.read'))
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      categoryId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      
      const where: any = { companyId }
      
      if (input.startDate && input.endDate) {
        where.date = { gte: input.startDate, lte: input.endDate }
      }
      if (input.categoryId) {
        where.categoryId = input.categoryId
      }

      const [totalStats, categoryStats, monthlyStats] = await Promise.all([
        // Total por tipo
        ctx.db.transaction.groupBy({
          by: ['type'],
          where,
          _sum: { amount: true },
          _count: { id: true }
        }),

        // Por categoria
        ctx.db.transaction.groupBy({
          by: ['categoryId'],
          where,
          _sum: { amount: true },
          _count: { id: true }
        }),

        // Por mês
        ctx.db.$queryRaw`
          SELECT 
            DATE_TRUNC('month', date) as month,
            type,
            SUM(amount) as total,
            COUNT(*) as count
          FROM transactions 
          WHERE company_id = ${companyId}
            ${input.startDate ? `AND date >= ${input.startDate}` : ''}
            ${input.endDate ? `AND date <= ${input.endDate}` : ''}
          GROUP BY DATE_TRUNC('month', date), type
          ORDER BY month DESC
        `
      ])

      // Buscar nomes das categorias
      const categoryIds = categoryStats.map(c => c.categoryId)
      const categories = await ctx.db.budgetCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, type: true }
      })

      const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat
        return acc
      }, {} as Record<string, any>)

      return {
        totals: totalStats.reduce((acc, stat) => {
          acc[stat.type] = {
            amount: Number(stat._sum.amount || 0),
            count: stat._count.id
          }
          return acc
        }, {} as Record<string, any>),

        byCategory: categoryStats.map(stat => ({
          category: categoryMap[stat.categoryId],
          amount: Number(stat._sum.amount || 0),
          count: stat._count.id
        })),

        monthly: monthlyStats
      }
    })
})