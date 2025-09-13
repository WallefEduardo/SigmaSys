import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'

const FinancialSettingsSchema = z.object({
  currency: z.string().min(3).max(3).default('BRL'),
  fiscalYearStart: z.number().int().min(1).max(12).default(1),
  budgetAlertThreshold: z.number().int().min(50).max(100).default(80),
  aiEnabled: z.boolean().default(true),
  aiAutoCateg: z.boolean().default(true),
  aiInsightsFreq: z.enum(['daily', 'weekly', 'monthly']).default('weekly')
})

export const settingsRouter = router({
  // Buscar configurações
  get: protectedProcedure
    .use(PermissionService.requirePermission('finance.settings.read'))
    .query(async ({ ctx }) => {
      const companyId = ctx.user.companyId

      let settings = await ctx.db.financialSettings.findUnique({
        where: { companyId }
      })

      // Criar configurações padrão se não existir
      if (!settings) {
        settings = await ctx.db.financialSettings.create({
          data: {
            companyId,
            currency: 'BRL',
            fiscalYearStart: 1,
            budgetAlertThreshold: 80,
            aiEnabled: true,
            aiAutoCateg: true,
            aiInsightsFreq: 'weekly'
          }
        })
      }

      return settings
    }),

  // Atualizar configurações
  update: protectedProcedure
    .use(PermissionService.requirePermission('finance.settings.update'))
    .input(FinancialSettingsSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      return ctx.db.financialSettings.upsert({
        where: { companyId },
        update: input,
        create: {
          ...input,
          companyId
        }
      })
    }),

  // Resetar configurações para padrão
  reset: protectedProcedure
    .use(PermissionService.requirePermission('finance.settings.update'))
    .mutation(async ({ ctx }) => {
      const companyId = ctx.user.companyId

      return ctx.db.financialSettings.upsert({
        where: { companyId },
        update: {
          currency: 'BRL',
          fiscalYearStart: 1,
          budgetAlertThreshold: 80,
          aiEnabled: true,
          aiAutoCateg: true,
          aiInsightsFreq: 'weekly'
        },
        create: {
          companyId,
          currency: 'BRL',
          fiscalYearStart: 1,
          budgetAlertThreshold: 80,
          aiEnabled: true,
          aiAutoCateg: true,
          aiInsightsFreq: 'weekly'
        }
      })
    }),

  // Configurações de categorias padrão
  getDefaultCategories: protectedProcedure
    .use(PermissionService.requirePermission('finance.settings.read'))
    .query(() => {
      return {
        INCOME: [
          { name: 'Vendas - Produtos', icon: '📦', color: '#10b981' },
          { name: 'Vendas - Serviços', icon: '🛠️', color: '#059669' },
          { name: 'Receitas Financeiras', icon: '💰', color: '#34d399' },
          { name: 'Outras Receitas', icon: '💸', color: '#6ee7b7' }
        ],
        EXPENSE: [
          { name: 'Materiais', icon: '🏗️', color: '#ef4444' },
          { name: 'Mão de Obra', icon: '👷', color: '#dc2626' },
          { name: 'Equipamentos', icon: '⚙️', color: '#b91c1c' },
          { name: 'Marketing', icon: '📢', color: '#f97316' },
          { name: 'Administrativo', icon: '🏢', color: '#ea580c' },
          { name: 'Impostos', icon: '🏛️', color: '#dc2626' },
          { name: 'Energia', icon: '⚡', color: '#eab308' },
          { name: 'Internet/Telefone', icon: '📞', color: '#3b82f6' },
          { name: 'Aluguel', icon: '🏠', color: '#8b5cf6' },
          { name: 'Outras Despesas', icon: '💳', color: '#6b7280' }
        ]
      }
    }),

  // Criar categorias padrão
  createDefaultCategories: protectedProcedure
    .use(PermissionService.requirePermission('finance.categories.create'))
    .input(z.object({
      types: z.array(z.enum(['INCOME', 'EXPENSE'])).optional(),
      overwriteExisting: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const defaultCategories = {
        INCOME: [
          { name: 'Vendas - Produtos', icon: '📦', color: '#10b981' },
          { name: 'Vendas - Serviços', icon: '🛠️', color: '#059669' },
          { name: 'Receitas Financeiras', icon: '💰', color: '#34d399' },
          { name: 'Outras Receitas', icon: '💸', color: '#6ee7b7' }
        ],
        EXPENSE: [
          { name: 'Materiais', icon: '🏗️', color: '#ef4444' },
          { name: 'Mão de Obra', icon: '👷', color: '#dc2626' },
          { name: 'Equipamentos', icon: '⚙️', color: '#b91c1c' },
          { name: 'Marketing', icon: '📢', color: '#f97316' },
          { name: 'Administrativo', icon: '🏢', color: '#ea580c' },
          { name: 'Impostos', icon: '🏛️', color: '#dc2626' },
          { name: 'Energia', icon: '⚡', color: '#eab308' },
          { name: 'Internet/Telefone', icon: '📞', color: '#3b82f6' },
          { name: 'Aluguel', icon: '🏠', color: '#8b5cf6' },
          { name: 'Outras Despesas', icon: '💳', color: '#6b7280' }
        ]
      }

      const typesToCreate = input.types || ['INCOME', 'EXPENSE']
      const results = { created: 0, skipped: 0, errors: [] as string[] }

      for (const type of typesToCreate) {
        const categories = defaultCategories[type]

        for (const category of categories) {
          try {
            // Verificar se já existe
            if (!input.overwriteExisting) {
              const existing = await ctx.db.budgetCategory.findFirst({
                where: { companyId, name: category.name, type }
              })

              if (existing) {
                results.skipped++
                continue
              }
            }

            await ctx.db.budgetCategory.upsert({
              where: {
                companyId_name: {
                  companyId,
                  name: category.name
                }
              },
              update: {
                icon: category.icon,
                color: category.color,
                type,
                active: true
              },
              create: {
                name: category.name,
                type,
                icon: category.icon,
                color: category.color,
                companyId
              }
            })

            results.created++

          } catch (error) {
            results.errors.push(`Erro ao criar categoria "${category.name}": ${(error as Error).message}`)
          }
        }
      }

      return results
    }),

  // Backup das configurações financeiras
  exportSettings: protectedProcedure
    .use(PermissionService.requirePermission('finance.settings.read'))
    .query(async ({ ctx }) => {
      const companyId = ctx.user.companyId

      const [settings, categories, budgets] = await Promise.all([
        ctx.db.financialSettings.findUnique({
          where: { companyId }
        }),
        ctx.db.budgetCategory.findMany({
          where: { companyId },
          select: {
            name: true,
            type: true,
            icon: true,
            color: true,
            description: true,
            active: true
          }
        }),
        ctx.db.budget.findMany({
          where: { 
            companyId,
            year: new Date().getFullYear()
          },
          include: {
            category: {
              select: { name: true, type: true }
            }
          }
        })
      ])

      return {
        exportedAt: new Date().toISOString(),
        settings,
        categories,
        budgets: budgets.map(budget => ({
          categoryName: budget.category.name,
          categoryType: budget.category.type,
          month: budget.month,
          year: budget.year,
          plannedAmount: Number(budget.plannedAmount)
        }))
      }
    }),

  // Importar configurações
  importSettings: protectedProcedure
    .use(PermissionService.requirePermission('finance.settings.update'))
    .input(z.object({
      settings: FinancialSettingsSchema.partial(),
      categories: z.array(z.object({
        name: z.string(),
        type: z.enum(['INCOME', 'EXPENSE']),
        icon: z.string().optional(),
        color: z.string().optional(),
        description: z.string().optional(),
        active: z.boolean().default(true)
      })).optional(),
      budgets: z.array(z.object({
        categoryName: z.string(),
        categoryType: z.enum(['INCOME', 'EXPENSE']),
        month: z.number().int().min(1).max(12),
        year: z.number().int(),
        plannedAmount: z.number()
      })).optional(),
      overwriteExisting: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const results = {
        settings: false,
        categories: { created: 0, updated: 0, errors: [] as string[] },
        budgets: { created: 0, updated: 0, errors: [] as string[] }
      }

      try {
        // Importar configurações
        if (input.settings) {
          await ctx.db.financialSettings.upsert({
            where: { companyId },
            update: input.settings,
            create: { ...input.settings, companyId }
          })
          results.settings = true
        }

        // Importar categorias
        if (input.categories) {
          for (const category of input.categories) {
            try {
              if (input.overwriteExisting) {
                const upserted = await ctx.db.budgetCategory.upsert({
                  where: {
                    companyId_name: {
                      companyId,
                      name: category.name
                    }
                  },
                  update: category,
                  create: { ...category, companyId }
                })
                results.categories.updated++
              } else {
                await ctx.db.budgetCategory.create({
                  data: { ...category, companyId }
                })
                results.categories.created++
              }
            } catch (error) {
              results.categories.errors.push(`Categoria "${category.name}": ${(error as Error).message}`)
            }
          }
        }

        // Importar orçamentos
        if (input.budgets) {
          for (const budget of input.budgets) {
            try {
              // Encontrar categoria
              const category = await ctx.db.budgetCategory.findFirst({
                where: {
                  companyId,
                  name: budget.categoryName,
                  type: budget.categoryType
                }
              })

              if (!category) {
                results.budgets.errors.push(`Orçamento para "${budget.categoryName}": Categoria não encontrada`)
                continue
              }

              if (input.overwriteExisting) {
                await ctx.db.budget.upsert({
                  where: {
                    companyId_categoryId_month_year: {
                      companyId,
                      categoryId: category.id,
                      month: budget.month,
                      year: budget.year
                    }
                  },
                  update: { plannedAmount: budget.plannedAmount },
                  create: {
                    companyId,
                    categoryId: category.id,
                    month: budget.month,
                    year: budget.year,
                    plannedAmount: budget.plannedAmount
                  }
                })
                results.budgets.updated++
              } else {
                await ctx.db.budget.create({
                  data: {
                    companyId,
                    categoryId: category.id,
                    month: budget.month,
                    year: budget.year,
                    plannedAmount: budget.plannedAmount
                  }
                })
                results.budgets.created++
              }
            } catch (error) {
              results.budgets.errors.push(`Orçamento ${budget.categoryName} ${budget.month}/${budget.year}: ${(error as Error).message}`)
            }
          }
        }

        return results

      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Falha na importação: ${(error as Error).message}`
        })
      }
    })
})