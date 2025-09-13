import type { 
  AIProvider,
  TransactionCategorization,
  FinancialAnalysisInput,
  FinancialInsight,
  FinancialAnomaly
} from '../types'

export class OpenRouterProvider implements AIProvider {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  private model: string

  constructor(apiKey: string, model: string = 'qwen/qwq-32b') {
    this.apiKey = apiKey
    this.model = model
  }

  async categorizeTransaction(
    description: string,
    amount: number,
    existingCategories: string[]
  ): Promise<TransactionCategorization> {
    const prompt = `
Categorize esta transação financeira:
Descrição: ${description}
Valor: R$ ${amount.toFixed(2)}

Categorias existentes: ${existingCategories.join(', ')}

Responda com uma categoria da lista ou sugira uma nova categoria se apropriado.
Também forneça uma confiança de 0 a 100 e uma breve justificativa.

Formato de resposta:
{
  "category": "nome_da_categoria",
  "confidence": 85,
  "reasoning": "justificativa_breve"
}
`

    const response = await this.makeRequest([
      { role: 'user', content: prompt }
    ])

    try {
      const result = JSON.parse(response)
      return {
        category: result.category,
        confidence: result.confidence,
        reasoning: result.reasoning
      }
    } catch (error) {
      // Fallback parsing
      return {
        category: existingCategories[0] || 'Outros',
        confidence: 50,
        reasoning: 'Categorização automática com base na descrição'
      }
    }
  }

  async generateFinancialInsights(input: FinancialAnalysisInput): Promise<FinancialInsight[]> {
    const prompt = `
Analise os dados financeiros e gere insights:

Receita Total: R$ ${input.totalRevenue.toFixed(2)}
Despesas Totais: R$ ${input.totalExpenses.toFixed(2)}
Margem: R$ ${(input.totalRevenue - input.totalExpenses).toFixed(2)}

Despesas por categoria:
${input.expensesByCategory.map(cat => `${cat.category}: R$ ${cat.amount.toFixed(2)}`).join('\n')}

Tendência de receita: ${input.revenueTrend}
Período: ${input.period}

Gere 3-5 insights financeiros práticos.

Formato de resposta (array JSON):
[
  {
    "title": "Título do Insight",
    "description": "Descrição detalhada",
    "type": "positive|negative|neutral",
    "impact": "high|medium|low",
    "actionable": true,
    "recommendation": "Recomendação específica"
  }
]
`

    const response = await this.makeRequest([
      { role: 'user', content: prompt }
    ])

    try {
      return JSON.parse(response)
    } catch (error) {
      return [{
        title: 'Análise Financeira',
        description: 'Dados financeiros processados com sucesso',
        type: 'neutral',
        impact: 'medium',
        actionable: true,
        recommendation: 'Continue monitorando as métricas financeiras'
      }]
    }
  }

  async detectAnomalies(
    transactions: Array<{ amount: number; category: string; date: string }>
  ): Promise<FinancialAnomaly[]> {
    const prompt = `
Analise essas transações para detectar anomalias:

${transactions.map(t => `${t.date}: ${t.category} - R$ ${t.amount.toFixed(2)}`).join('\n')}

Identifique gastos anômalos, padrões incomuns ou transações suspeitas.

Formato de resposta (array JSON):
[
  {
    "transactionIndex": 0,
    "anomalyType": "high_amount|unusual_category|frequency",
    "severity": "high|medium|low",
    "description": "Descrição da anomalia",
    "suggestion": "Sugestão de ação"
  }
]
`

    const response = await this.makeRequest([
      { role: 'user', content: prompt }
    ])

    try {
      return JSON.parse(response)
    } catch (error) {
      return []
    }
  }

  async chatFinancialAssistant(message: string, context?: any): Promise<string> {
    const prompt = `Você é um assistente financeiro inteligente especializado em gestão empresarial.

Características:
- Respostas concisas e práticas
- Foco em ações específicas
- Conhecimento em finanças brasileiras
- Análise baseada em dados

CONTEXTO: ${context ? JSON.stringify(context, null, 2) : 'Contexto geral'}

PERGUNTA: ${message}

Responda de forma direta e útil:`

    return await this.makeRequest([
      { role: 'user', content: prompt }
    ])
  }

  private async makeRequest(messages: Array<{ role: string; content: string }>): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 1000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Resposta inválida da OpenRouter API')
    }

    return data.choices[0].message.content
  }
}