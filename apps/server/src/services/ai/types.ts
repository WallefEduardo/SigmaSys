export interface AIProvider {
  categorizeTransaction(
    description: string, 
    amount: number, 
    existingCategories: string[]
  ): Promise<TransactionCategorization>
  
  generateFinancialInsights(input: FinancialAnalysisInput): Promise<FinancialInsight[]>
  
  chatFinancialAssistant(message: string, context?: any): Promise<string>
  
  detectAnomalies(transactions: any[]): Promise<FinancialAnomaly[]>
}

export interface TransactionCategorization {
  category: string
  confidence: number
  reasoning: string
  tags: string[]
  model: string
}

export interface FinancialAnalysisInput {
  transactions: {
    id: string
    date: string
    amount: number
    description: string
    category: string
    type: 'INCOME' | 'EXPENSE'
  }[]
  budgets: {
    category: string
    planned: number
    actual?: number
  }[]
  period: string
  companyProfile: {
    name: string
    segment?: string
    size?: string
    monthlyRevenue?: number
    employees?: number
  }
}

export interface FinancialInsight {
  title: string
  content: string
  type: 'PREDICTION' | 'RECOMMENDATION' | 'ANALYSIS' | 'PATTERN' | 'OPTIMIZATION'
  confidence: number
  actionItems: string[]
  data: Record<string, any>
  model: string
  createdAt: Date
}

export interface FinancialAnomaly {
  transactionId?: string
  type: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
}

export interface AIServiceConfig {
  openaiApiKey?: string
  claudeApiKey?: string
  openrouterApiKey?: string
  defaultProvider: 'openai' | 'claude' | 'openrouter'
  fallbackProvider: 'openai' | 'claude' | 'openrouter'
  defaultModel?: string
  maxRetries: number
  timeout: number
}

export interface CashFlowPrediction {
  date: string
  predictedIncome: number
  predictedExpenses: number
  predictedBalance: number
  confidence: number
  factors: string[]
}

export interface BudgetOptimization {
  categoryId: string
  currentBudget: number
  suggestedBudget: number
  reasoning: string
  potentialSavings: number
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
}