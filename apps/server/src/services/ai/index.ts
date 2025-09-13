import { HybridAIService } from './ai-service'
import type { AIServiceConfig } from './types'

// Singleton instance
let aiService: HybridAIService | null = null

/**
 * Inicializa o serviço de IA com as configurações necessárias
 */
export function initializeAI(config: AIServiceConfig): HybridAIService {
  if (!aiService) {
    aiService = new HybridAIService(config)
  }
  return aiService
}

/**
 * Obtém a instância do serviço de IA
 * Lança erro se não foi inicializado
 */
export function getAIService(): HybridAIService {
  if (!aiService) {
    throw new Error('Serviço de IA não foi inicializado. Chame initializeAI() primeiro.')
  }
  return aiService
}

/**
 * Configuração padrão baseada em variáveis de ambiente
 */
export function createDefaultAIConfig(): AIServiceConfig {
  return {
    openaiApiKey: process.env.OPENAI_API_KEY,
    claudeApiKey: process.env.ANTHROPIC_API_KEY,
    defaultProvider: (process.env.AI_DEFAULT_PROVIDER as 'openai' | 'claude') || 'openai',
    fallbackProvider: (process.env.AI_FALLBACK_PROVIDER as 'openai' | 'claude') || 'claude',
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2'),
    timeout: parseInt(process.env.AI_TIMEOUT || '30000')
  }
}

// Re-exporta tipos principais
export type { 
  AIServiceConfig, 
  TransactionCategorization, 
  FinancialInsight, 
  FinancialAnalysisInput,
  FinancialAnomaly,
  CashFlowPrediction,
  BudgetOptimization
} from './types'

export { HybridAIService } from './ai-service'