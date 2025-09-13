import { OpenAIProvider } from './providers/openai'
import { ClaudeProvider } from './providers/claude'
import { OpenRouterProvider } from './providers/openrouter'
import type { 
  AIProvider, 
  AIServiceConfig, 
  TransactionCategorization,
  FinancialAnalysisInput,
  FinancialInsight,
  FinancialAnomaly
} from './types'

export class HybridAIService {
  private openaiProvider?: OpenAIProvider
  private claudeProvider?: ClaudeProvider
  private openrouterProvider?: OpenRouterProvider
  private config: AIServiceConfig
  
  constructor(config: AIServiceConfig) {
    this.config = config
    
    if (config.openaiApiKey) {
      this.openaiProvider = new OpenAIProvider(config.openaiApiKey)
    }
    
    if (config.claudeApiKey) {
      this.claudeProvider = new ClaudeProvider(config.claudeApiKey)
    }
    
    if (config.openrouterApiKey) {
      this.openrouterProvider = new OpenRouterProvider(config.openrouterApiKey, config.defaultModel)
    }
    
    if (!this.openaiProvider && !this.claudeProvider && !this.openrouterProvider) {
      throw new Error('Pelo menos um provedor de IA deve ser configurado')
    }
  }
  
  private getProvider(preferred?: 'openai' | 'claude' | 'openrouter'): AIProvider {
    const providerType = preferred || this.config.defaultProvider
    
    if (providerType === 'openai' && this.openaiProvider) {
      return this.openaiProvider
    }
    
    if (providerType === 'claude' && this.claudeProvider) {
      return this.claudeProvider
    }
    
    if (providerType === 'openrouter' && this.openrouterProvider) {
      return this.openrouterProvider
    }
    
    // Fallback
    const fallbackType = this.config.fallbackProvider
    if (fallbackType === 'openai' && this.openaiProvider) {
      return this.openaiProvider
    }
    
    if (fallbackType === 'claude' && this.claudeProvider) {
      return this.claudeProvider
    }
    
    throw new Error('Nenhum provedor de IA disponível')
  }
  
  private async executeWithFallback<T>(
    operation: (provider: AIProvider) => Promise<T>,
    preferred?: 'openai' | 'claude'
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const provider = this.getProvider(preferred)
        return await operation(provider)
      } catch (error) {
        lastError = error as Error
        console.warn(`Tentativa ${attempt + 1} falhou:`, error)
        
        // Se falhou com provedor preferido, tenta o fallback
        if (attempt === 0 && preferred) {
          preferred = undefined // Remove preferência para próxima tentativa
        }
      }
    }
    
    throw lastError || new Error('Todas as tentativas falharam')
  }

  // ===== MÉTODOS PRINCIPAIS =====

  /**
   * Categoriza transação usando IA
   * Estratégia: OpenAI para estrutured outputs, Claude como fallback
   */
  async categorizeTransaction(
    description: string,
    amount: number,
    existingCategories: string[]
  ): Promise<TransactionCategorization> {
    return this.executeWithFallback(
      (provider) => provider.categorizeTransaction(description, amount, existingCategories),
      'openai' // OpenAI é melhor para structured outputs
    )
  }

  /**
   * Gera insights financeiros
   * Estratégia: Claude para análises complexas, OpenAI como fallback
   */
  async generateFinancialInsights(input: FinancialAnalysisInput): Promise<FinancialInsight[]> {
    return this.executeWithFallback(
      (provider) => provider.generateFinancialInsights(input),
      'claude' // Claude é melhor para análises detalhadas
    )
  }

  /**
   * Chat assistant financeiro
   * Estratégia: Usa provedor padrão configurado
   */
  async chatFinancialAssistant(message: string, context?: any): Promise<string> {
    return this.executeWithFallback(
      (provider) => provider.chatFinancialAssistant(message, context)
    )
  }

  /**
   * Detecta anomalias financeiras
   * Estratégia: OpenAI primeiro (structured outputs), Claude como fallback
   */
  async detectAnomalies(transactions: any[]): Promise<FinancialAnomaly[]> {
    return this.executeWithFallback(
      (provider) => provider.detectAnomalies(transactions),
      'openai'
    )
  }

  // ===== MÉTODOS AVANÇADOS =====

  /**
   * Análise comparativa usando ambos provedores
   * Útil para validação cruzada de insights críticos
   */
  async generateComparativeInsights(input: FinancialAnalysisInput): Promise<{
    openai?: FinancialInsight[]
    claude?: FinancialInsight[]
    consensus: FinancialInsight[]
  }> {
    const results: any = {}
    
    try {
      if (this.openaiProvider) {
        results.openai = await this.openaiProvider.generateFinancialInsights(input)
      }
    } catch (error) {
      console.warn('OpenAI insights failed:', error)
    }
    
    try {
      if (this.claudeProvider) {
        results.claude = await this.claudeProvider.generateFinancialInsights(input)
      }
    } catch (error) {
      console.warn('Claude insights failed:', error)
    }
    
    // Identifica insights consensuais (títulos similares ou conteúdo convergente)
    results.consensus = this.findConsensusInsights(results.openai || [], results.claude || [])
    
    return results
  }

  private findConsensusInsights(
    openaiInsights: FinancialInsight[], 
    claudeInsights: FinancialInsight[]
  ): FinancialInsight[] {
    const consensus: FinancialInsight[] = []
    
    for (const oaiInsight of openaiInsights) {
      for (const claudeInsight of claudeInsights) {
        // Verifica similaridade de títulos ou conteúdo
        const titleSimilarity = this.calculateSimilarity(oaiInsight.title, claudeInsight.title)
        const contentSimilarity = this.calculateSimilarity(oaiInsight.content, claudeInsight.content)
        
        if (titleSimilarity > 0.6 || contentSimilarity > 0.4) {
          consensus.push({
            ...oaiInsight,
            title: `Consenso: ${oaiInsight.title}`,
            content: `${oaiInsight.content}\n\nValidação: ${claudeInsight.content}`,
            confidence: Math.min(oaiInsight.confidence + 0.1, 1), // Bonus por consenso
            model: 'hybrid-consensus'
          })
          break
        }
      }
    }
    
    return consensus
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Implementação simples de similaridade de strings
    const words1 = str1.toLowerCase().split(' ')
    const words2 = str2.toLowerCase().split(' ')
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    
    return intersection.length / union.length
  }

  /**
   * Health check dos provedores
   */
  async getProvidersStatus(): Promise<{
    openai: boolean
    claude: boolean
    openrouter: boolean
    default: string
  }> {
    return {
      openai: !!this.openaiProvider,
      claude: !!this.claudeProvider,
      openrouter: !!this.openrouterProvider,
      default: this.config.defaultProvider
    }
  }
}