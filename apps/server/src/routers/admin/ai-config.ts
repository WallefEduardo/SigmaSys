import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../../lib/trpc'
import { PermissionService } from '../../lib/permissions'
import { initializeAI, createDefaultAIConfig } from '../../services/ai'

const AIConfigSchema = z.object({
  openaiApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
  openrouterApiKey: z.string().optional(),
  aiDefaultProvider: z.enum(['openai', 'claude', 'openrouter']).default('openai'),
  aiDefaultModel: z.string().optional(),
  aiEnabled: z.boolean().default(false)
})

export const aiConfigRouter = router({
  // Buscar configuração atual
  get: protectedProcedure
    .use(PermissionService.requirePermission('admin.ai.read'))
    .query(async ({ ctx }) => {
      const companyId = ctx.user.companyId

      const company = await ctx.db.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          openaiApiKey: true,
          claudeApiKey: true,
          openrouterApiKey: true,
          aiDefaultProvider: true,
          aiDefaultModel: true,
          aiEnabled: true
        }
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Empresa não encontrada'
        })
      }

      return {
        ...company,
        // Mascarar as chaves para segurança
        openaiApiKey: company.openaiApiKey ? maskApiKey(company.openaiApiKey) : null,
        claudeApiKey: company.claudeApiKey ? maskApiKey(company.claudeApiKey) : null,
        openrouterApiKey: company.openrouterApiKey ? maskApiKey(company.openrouterApiKey) : null,
        hasOpenaiKey: !!company.openaiApiKey,
        hasClaudeKey: !!company.claudeApiKey,
        hasOpenrouterKey: !!company.openrouterApiKey
      }
    }),

  // Atualizar configuração
  update: protectedProcedure
    .use(PermissionService.requirePermission('admin.ai.update'))
    .input(AIConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId

      // Buscar chaves existentes para validação
      const existingCompany = await ctx.db.company.findUnique({
        where: { id: companyId },
        select: {
          openaiApiKey: true,
          claudeApiKey: true,
          openrouterApiKey: true
        }
      })

      // Validar pelo menos uma chave se IA está habilitada
      if (input.aiEnabled) {
        // Calcular quais chaves estarão ativas após esta atualização
        const finalOpenaiKey = input.openaiApiKey !== undefined ? input.openaiApiKey : existingCompany?.openaiApiKey
        const finalClaudeKey = input.claudeApiKey !== undefined ? input.claudeApiKey : existingCompany?.claudeApiKey
        const finalOpenrouterKey = input.openrouterApiKey !== undefined ? input.openrouterApiKey : existingCompany?.openrouterApiKey

        if (!finalOpenaiKey && !finalClaudeKey && !finalOpenrouterKey) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Pelo menos uma API key é necessária para habilitar a IA'
          })
        }
      }

      // Validar formato das chaves
      if (input.openaiApiKey && !input.openaiApiKey.startsWith('sk-')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Chave OpenAI deve começar com "sk-"'
        })
      }

      if (input.claudeApiKey && !input.claudeApiKey.startsWith('sk-ant-')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Chave Claude deve começar com "sk-ant-"'
        })
      }

      if (input.openrouterApiKey && !input.openrouterApiKey.startsWith('sk-or-')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Chave OpenRouter deve começar com "sk-or-"'
        })
      }

      // Preparar dados para atualização, removendo chaves vazias
      const updateData: any = {
        aiDefaultProvider: input.aiDefaultProvider,
        aiDefaultModel: input.aiDefaultModel,
        aiEnabled: input.aiEnabled
      }

      // Sempre atualizar chaves, definir como null se vazias
      updateData.openaiApiKey = input.openaiApiKey || null
      updateData.claudeApiKey = input.claudeApiKey || null
      updateData.openrouterApiKey = input.openrouterApiKey || null

      // Atualizar no banco
      const updated = await ctx.db.company.update({
        where: { id: companyId },
        data: updateData
      })


      // Tentar reinicializar o serviço de IA
      if (input.aiEnabled) {
        try {
          const aiConfig = {
            openaiApiKey: input.openaiApiKey,
            claudeApiKey: input.claudeApiKey,
            openrouterApiKey: input.openrouterApiKey,
            defaultProvider: input.aiDefaultProvider as 'openai' | 'claude' | 'openrouter',
            fallbackProvider: input.aiDefaultProvider === 'openai' ? 'claude' as const : 
                             input.aiDefaultProvider === 'claude' ? 'openai' as const : 
                             'openrouter' as const,
            defaultModel: input.aiDefaultModel,
            maxRetries: 2,
            timeout: 30000
          }

          initializeAI(aiConfig)
        } catch (error) {
          console.warn('Falha ao reinicializar IA:', error)
        }
      }

      return {
        success: true,
        message: 'Configuração de IA atualizada com sucesso',
        aiEnabled: updated.aiEnabled
      }
    }),

  // Testar configuração
  test: protectedProcedure
    .use(PermissionService.requirePermission('admin.ai.test'))
    .input(z.object({
      provider: z.enum(['openai', 'claude', 'openrouter']),
      apiKey: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      try {
        if (input.provider === 'openai') {
          // Testar OpenAI
          const { OpenAIProvider } = await import('../../services/ai/providers/openai')
          const provider = new OpenAIProvider(input.apiKey)
          
          // Teste simples
          await provider.categorizeTransaction(
            'Teste de conexão',
            100,
            ['Teste']
          )
        } else if (input.provider === 'claude') {
          // Testar Claude
          const { ClaudeProvider } = await import('../../services/ai/providers/claude')
          const provider = new ClaudeProvider(input.apiKey)
          
          // Teste simples
          await provider.categorizeTransaction(
            'Teste de conexão',
            100,
            ['Teste']
          )
        } else if (input.provider === 'openrouter') {
          // Testar OpenRouter
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${input.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'qwen/qwq-32b',
              messages: [
                { role: 'user', content: 'Responda apenas "OK" se você pode me ouvir.' }
              ],
              max_tokens: 10
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          if (!data.choices || !data.choices[0]) {
            throw new Error('Resposta inválida da API')
          }
        }

        return {
          success: true,
          message: `Conexão com ${input.provider} testada com sucesso!`
        }
      } catch (error) {
        console.error(`Erro ao testar ${input.provider}:`, error)
        
        return {
          success: false,
          message: `Falha ao conectar com ${input.provider}: ${(error as Error).message}`
        }
      }
    }),

  // Status do serviço de IA
  getStatus: protectedProcedure
    .use(PermissionService.requirePermission('admin.ai.read'))
    .query(async ({ ctx }) => {
      const companyId = ctx.user.companyId

      const company = await ctx.db.company.findUnique({
        where: { id: companyId },
        select: {
          aiEnabled: true,
          openaiApiKey: true,
          claudeApiKey: true,
          openrouterApiKey: true,
          aiDefaultProvider: true
        }
      })

      if (!company || !company.aiEnabled) {
        return {
          enabled: false,
          providers: {
            openai: false,
            claude: false,
            openrouter: false
          },
          message: 'IA não está habilitada'
        }
      }

      try {
        // Tentar obter status do serviço atual
        const { getAIService } = await import('../../services/ai')
        const aiService = getAIService()
        const status = await aiService.getProvidersStatus()

        return {
          enabled: true,
          providers: status,
          defaultProvider: company.aiDefaultProvider,
          message: 'Serviço de IA ativo'
        }
      } catch (error) {
        return {
          enabled: false,
          providers: {
            openai: !!company.openaiApiKey,
            claude: !!company.claudeApiKey,
            openrouter: !!company.openrouterApiKey
          },
          message: 'Serviço de IA não inicializado',
          error: (error as Error).message
        }
      }
    }),

  // Estatísticas de uso
  getUsageStats: protectedProcedure
    .use(PermissionService.requirePermission('admin.ai.read'))
    .input(z.object({
      period: z.object({
        startDate: z.date(),
        endDate: z.date()
      }).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user.companyId
      const now = new Date()
      const startDate = input.period?.startDate || new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = input.period?.endDate || now

      const [aiInsights, aiTransactions, aiAlerts] = await Promise.all([
        // Insights gerados
        ctx.db.aIInsight.groupBy({
          by: ['model'],
          where: {
            companyId,
            createdAt: { gte: startDate, lte: endDate }
          },
          _count: { id: true }
        }),

        // Transações categorizadas por IA
        ctx.db.transaction.aggregate({
          where: {
            companyId,
            aiCategorized: true,
            createdAt: { gte: startDate, lte: endDate }
          },
          _count: { id: true }
        }),

        // Alertas da IA
        ctx.db.financialAlert.aggregate({
          where: {
            companyId,
            type: 'AI_INSIGHT',
            createdAt: { gte: startDate, lte: endDate }
          },
          _count: { id: true }
        })
      ])

      const totalInsights = aiInsights.reduce((sum, insight) => sum + insight._count.id, 0)

      return {
        period: { startDate, endDate },
        insights: {
          total: totalInsights,
          byModel: aiInsights.reduce((acc, insight) => {
            acc[insight.model] = insight._count.id
            return acc
          }, {} as Record<string, number>)
        },
        transactions: {
          aiCategorized: aiTransactions._count.id
        },
        alerts: {
          aiGenerated: aiAlerts._count.id
        }
      }
    })
})

// Helper function para mascarar API keys
function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  
  const start = key.substring(0, 8)
  const end = key.substring(key.length - 4)
  const middle = '*'.repeat(Math.max(4, key.length - 12))
  
  return start + middle + end
}