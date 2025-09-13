import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'
import { getAIService } from '../../services/ai'

export const aiRouter = router({
  // Chat com assistente financeiro
  chat: protectedProcedure
    .use(PermissionService.requirePermission('finance.ai.chat'))
    .input(z.object({
      message: z.string().min(1, 'Mensagem não pode estar vazia').max(1000),
      context: z.object({
        period: z.string().optional(),
        categoryId: z.string().optional(),
        includeTransactions: z.boolean().default(false),
        includeBudgets: z.boolean().default(false)
      }).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      try {
        let context: any = {
          companyName: ctx.user.company?.name,
          userName: ctx.user.name
        }

        // Adicionar contexto financeiro se solicitado
        if (input.context?.includeTransactions || input.context?.includeBudgets) {
          const now = new Date()
          const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

          if (input.context.includeTransactions) {
            const recentTransactions = await ctx.db.transaction.findMany({
              where: { 
                companyId, 
                date: { gte: startDate, lte: endDate },
                ...(input.context.categoryId && { categoryId: input.context.categoryId })
              },
              include: { category: { select: { name: true, type: true } } },
              orderBy: { date: 'desc' },
              take: 10
            })

            context.recentTransactions = recentTransactions.map(t => ({
              date: t.date.toISOString().split('T')[0],
              amount: Number(t.amount),
              description: t.description,
              category: t.category.name,
              type: t.type
            }))
          }

          if (input.context.includeBudgets) {
            const currentBudgets = await ctx.db.budget.findMany({
              where: { 
                companyId, 
                year: now.getFullYear(), 
                month: now.getMonth() + 1 
              },
              include: { category: { select: { name: true, type: true } } }
            })

            context.currentBudgets = currentBudgets.map(b => ({
              category: b.category.name,
              planned: Number(b.plannedAmount),
              type: b.category.type
            }))
          }
        }

        let response: string;

        try {
          const aiService = getAIService()
          const aiResponse = await aiService.chatFinancialAssistant(input.message, context)
          response = typeof aiResponse === 'string' ? aiResponse : aiResponse.message || String(aiResponse)
        } catch (aiError) {
          console.warn('Serviço de IA indisponível, usando resposta de fallback:', aiError)
          
          // Resposta de fallback baseada no contexto
          if (input.message.toLowerCase().includes('orçamento')) {
            response = `Olá ${context.userName}! 📊 Entendo que você quer saber sobre orçamentos. 

Atualmente o sistema de IA está sendo configurado, mas posso te ajudar direcionando para as páginas corretas:

• **Dashboard**: Para visão geral das finanças
• **Orçamentos**: Para planejar e controlar gastos mensais  
• **Transações**: Para registrar receitas e despesas
• **Metas**: Para definir objetivos financeiros

Em breve nossa IA estará totalmente funcional para análises mais detalhadas! 🤖`
          } else if (input.message.toLowerCase().includes('meta')) {
            response = `Oi ${context.userName}! 🎯 Vejo que você quer falar sobre metas financeiras.

Enquanto configuro minha IA avançada, posso sugerir:

• Acesse **Metas Financeiras** no menu para criar objetivos
• Defina valores e prazos realistas
• Monitore o progresso regularmente

Logo estarei com análises inteligentes para te ajudar ainda mais! 💪`
          } else {
            response = `Olá ${context.userName}! 👋

Sou seu assistente financeiro e estou sendo configurado para te ajudar melhor. 

Por enquanto, você pode:
• Navegar pelas seções do sistema financeiro
• Cadastrar transações e categorias
• Definir orçamentos e metas
• Visualizar relatórios

Em breve estarei totalmente operacional com IA avançada! 🚀

**O que gostaria de fazer agora?**`
          }
        }

        // Salvar interação no log (opcional)
        await ctx.db.aIInsight.create({
          data: {
            type: 'ANALYSIS',
            title: `Chat: ${input.message.substring(0, 50)}...`,
            content: typeof response === 'string' ? response : response.message || String(response),
            confidence: 0.8,
            data: { userMessage: input.message, context },
            model: 'hybrid-chat',
            companyId
          }
        }).catch(() => {
          // Ignorar erro de log, não deve impedir resposta
        })

        // Retornar no formato que o frontend espera
        return {
          message: typeof response === 'string' ? response : response.message || String(response),
          suggestions: [
            "Como posso economizar mais?",
            "Analisar gastos da semana",
            "Criar uma meta de poupança"
          ]
        }

      } catch (error) {
        console.error('Erro no chat AI:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha no assistente financeiro. Tente novamente.'
        })
      }
    }),

  // Categorizar transação automaticamente
  categorizeTransaction: protectedProcedure
    .use(PermissionService.requirePermission('finance.ai.categorize'))
    .input(z.object({
      description: z.string().min(1),
      amount: z.number().positive(),
      type: z.enum(['INCOME', 'EXPENSE'])
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      try {
        // Buscar categorias existentes
        const existingCategories = await ctx.db.budgetCategory.findMany({
          where: { companyId, type: input.type, active: true },
          select: { id: true, name: true }
        })

        const categoryNames = existingCategories.map(c => c.name)

        const aiService = getAIService()
        const categorization = await aiService.categorizeTransaction(
          input.description,
          input.amount,
          categoryNames
        )

        // Encontrar categoria existente ou marcar para criação
        const existingCategory = existingCategories.find(
          c => c.name.toLowerCase() === categorization.category.toLowerCase()
        )

        return {
          ...categorization,
          categoryId: existingCategory?.id,
          needsCreation: !existingCategory,
          suggestedCategoryData: !existingCategory ? {
            name: categorization.category,
            type: input.type
          } : null
        }

      } catch (error) {
        console.error('Erro na categorização AI:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha na categorização automática.'
        })
      }
    }),

  // Gerar insights financeiros
  generateInsights: protectedProcedure
    .use(PermissionService.requirePermission('finance.ai.insights'))
    .input(z.object({
      period: z.object({
        startDate: z.date(),
        endDate: z.date()
      }),
      categories: z.array(z.string()).optional(),
      forceRefresh: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      try {
        // Verificar insights em cache (se não forçar refresh)
        if (!input.forceRefresh) {
          const cachedInsights = await ctx.db.aIInsight.findMany({
            where: {
              companyId,
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Últimas 24h
              OR: [
                { expires: null },
                { expires: { gt: new Date() } }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          })

          if (cachedInsights.length > 0) {
            return { insights: cachedInsights, fromCache: true }
          }
        }

        // Buscar dados para análise
        const where: any = {
          companyId,
          date: { gte: input.period.startDate, lte: input.period.endDate }
        }

        if (input.categories?.length) {
          where.categoryId = { in: input.categories }
        }

        const [transactions, budgets] = await Promise.all([
          ctx.db.transaction.findMany({
            where,
            include: { category: { select: { name: true, type: true } } },
            orderBy: { date: 'desc' }
          }),
          ctx.db.budget.findMany({
            where: { 
              companyId,
              year: input.period.startDate.getFullYear(),
              month: input.period.startDate.getMonth() + 1
            },
            include: { category: { select: { name: true, type: true } } }
          })
        ])

        // Calcular valores realizados por categoria
        const actualsByCategory = transactions.reduce((acc, t) => {
          const key = t.categoryId
          acc[key] = (acc[key] || 0) + Number(t.amount)
          return acc
        }, {} as Record<string, number>)

        // Preparar dados para IA
        const analysisInput = {
          transactions: transactions.map(t => ({
            id: t.id,
            date: t.date.toISOString(),
            amount: Number(t.amount),
            description: t.description,
            category: t.category.name,
            type: t.type as 'INCOME' | 'EXPENSE'
          })),
          budgets: budgets.map(b => ({
            category: b.category.name,
            planned: Number(b.plannedAmount),
            actual: actualsByCategory[b.categoryId] || 0
          })),
          period: `${input.period.startDate.toISOString().split('T')[0]} a ${input.period.endDate.toISOString().split('T')[0]}`,
          companyProfile: {
            name: ctx.user.company?.name || 'Empresa',
            segment: 'Comunicação Visual' // Pode vir do perfil da empresa
          }
        }

        const aiService = getAIService()
        const insights = await aiService.generateFinancialInsights(analysisInput)

        // Salvar insights no banco
        const savedInsights = await Promise.all(
          insights.map(insight =>
            ctx.db.aIInsight.create({
              data: {
                type: insight.type,
                title: insight.title,
                content: insight.content,
                confidence: insight.confidence,
                data: {
                  actionItems: insight.actionItems,
                  ...insight.data
                },
                model: insight.model,
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
                companyId
              }
            })
          )
        )

        return { insights: savedInsights, fromCache: false }

      } catch (error) {
        console.error('Erro na geração de insights:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha na geração de insights financeiros.'
        })
      }
    }),

  // Detectar anomalias
  detectAnomalies: protectedProcedure
    .use(PermissionService.requirePermission('finance.ai.analysis'))
    .input(z.object({
      period: z.object({
        startDate: z.date(),
        endDate: z.date()
      }).optional(),
      categoryId: z.string().optional(),
      minSeverity: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM')
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      try {
        const where: any = { companyId }

        if (input.period) {
          where.date = { gte: input.period.startDate, lte: input.period.endDate }
        } else {
          // Últimos 30 dias por padrão
          where.date = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }

        if (input.categoryId) {
          where.categoryId = input.categoryId
        }

        const transactions = await ctx.db.transaction.findMany({
          where,
          include: { category: { select: { name: true, type: true } } },
          orderBy: { date: 'desc' }
        })

        if (transactions.length < 5) {
          return { anomalies: [], message: 'Dados insuficientes para análise de anomalias' }
        }

        const aiService = getAIService()
        const anomalies = await aiService.detectAnomalies(
          transactions.map(t => ({
            id: t.id,
            date: t.date.toISOString(),
            amount: Number(t.amount),
            description: t.description,
            category: t.category.name,
            type: t.type
          }))
        )

        // Filtrar por severidade mínima
        const severityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3 }
        const minSeverityValue = severityOrder[input.minSeverity]

        const filteredAnomalies = anomalies.filter(
          anomaly => severityOrder[anomaly.severity] >= minSeverityValue
        )

        // Criar alertas para anomalias de alta severidade
        for (const anomaly of filteredAnomalies) {
          if (anomaly.severity === 'HIGH') {
            await ctx.db.financialAlert.create({
              data: {
                type: 'ANOMALY',
                title: `Anomalia detectada: ${anomaly.type}`,
                message: anomaly.description,
                severity: 'HIGH',
                data: { anomaly },
                companyId
              }
            }).catch(() => {
              // Ignorar erros de criação de alerta
            })
          }
        }

        return { anomalies: filteredAnomalies }

      } catch (error) {
        console.error('Erro na detecção de anomalias:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Falha na detecção de anomalias.'
        })
      }
    }),

  // Obter insights salvos
  getInsights: protectedProcedure
    .use(PermissionService.requirePermission('finance.ai.read'))
    .input(z.object({
      type: z.enum(['PREDICTION', 'RECOMMENDATION', 'ANALYSIS', 'PATTERN', 'OPTIMIZATION']).optional(),
      limit: z.number().int().min(1).max(50).default(10),
      includeExpired: z.boolean().default(false)
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      const where: any = { companyId }

      if (input.type) where.type = input.type

      if (!input.includeExpired) {
        where.OR = [
          { expires: null },
          { expires: { gt: new Date() } }
        ]
      }

      return ctx.db.aIInsight.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: input.limit
      })
    }),

  // Status do serviço de IA
  getStatus: protectedProcedure
    .use(PermissionService.requirePermission('finance.ai.read'))
    .query(async () => {
      try {
        const aiService = getAIService()
        const status = await aiService.getProvidersStatus()
        
        return {
          available: true,
          providers: status
        }
      } catch (error) {
        return {
          available: false,
          error: 'Serviço de IA não configurado'
        }
      }
    })
})