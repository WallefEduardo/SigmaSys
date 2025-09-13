import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, FinancialAnalysisInput, FinancialInsight } from '../types'

export class ClaudeProvider implements AIProvider {
  private client: Anthropic
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async categorizeTransaction(
    description: string, 
    amount: number, 
    existingCategories: string[]
  ) {
    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Como especialista em categorização financeira empresarial brasileira, analise esta transação:

Descrição: ${description}
Valor: R$ ${amount.toFixed(2)}

Categorias existentes: ${existingCategories.join(', ')}

RETORNE APENAS um JSON válido com esta estrutura:
{
  "category": "nome_da_categoria",
  "confidence": 0.85,
  "reasoning": "explicação da escolha",
  "tags": ["tag1", "tag2"]
}

Regras:
- Use categoria existente se adequada, senão crie nova específica
- Para vendas: "Vendas - [Produto/Serviço]" 
- Para despesas: seja específico (ex: "Marketing Digital", "Energia Elétrica")
- Considere impostos e tributos brasileiros
- Confidence: 0-1 baseado na certeza`
        }
      ]
    })

    try {
      const content = message.content[0]
      if (content.type === 'text') {
        const result = JSON.parse(content.text)
        return {
          category: result.category,
          confidence: result.confidence,
          reasoning: result.reasoning,
          tags: result.tags || [],
          model: 'claude-3-5-sonnet'
        }
      }
    } catch (error) {
      console.error('Erro ao parsear resposta do Claude:', error)
    }

    throw new Error('Falha na categorização da transação')
  }

  async generateFinancialInsights(input: FinancialAnalysisInput): Promise<FinancialInsight[]> {
    const { transactions, budgets, period, companyProfile } = input
    
    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Como consultor financeiro sênior, analise estes dados empresariais e gere insights estratégicos:

EMPRESA:
- Período: ${period}
- Perfil: ${JSON.stringify(companyProfile, null, 2)}

TRANSAÇÕES RECENTES:
${transactions.slice(0, 30).map(t => 
  `${t.date}: ${t.type} - R$ ${t.amount} - ${t.description} (${t.category})`
).join('\n')}

PERFORMANCE ORÇAMENTÁRIA:
${budgets.map(b => 
  `${b.category}: Planejado R$ ${b.planned} | Realizado R$ ${b.actual || 0} | Var: ${b.actual ? ((b.actual - b.planned) / b.planned * 100).toFixed(1) : 'N/A'}%`
).join('\n')}

RETORNE APENAS um array JSON com 3-5 insights mais relevantes:
[{
  "title": "Título do insight",
  "content": "Análise detalhada com contexto brasileiro",
  "type": "PREDICTION|RECOMMENDATION|ANALYSIS|PATTERN|OPTIMIZATION",
  "confidence": 0.85,
  "actionItems": ["Ação 1", "Ação 2"],
  "data": {"key": "value com métricas relevantes"}
}]

Foque em:
- Padrões de sazonalidade
- Oportunidades de economia
- Riscos financeiros
- Tendências de crescimento
- Otimizações operacionais
- Comparações setoriais brasileiras`
        }
      ]
    })

    try {
      const content = message.content[0]
      if (content.type === 'text') {
        const insights = JSON.parse(content.text)
        return insights.map((insight: any) => ({
          ...insight,
          model: 'claude-3-5-sonnet',
          createdAt: new Date()
        }))
      }
    } catch (error) {
      console.error('Erro ao parsear insights do Claude:', error)
    }

    throw new Error('Falha na geração de insights')
  }

  async chatFinancialAssistant(message: string, context?: any): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Como assistente financeiro especialista em gestão empresarial brasileira, responda de forma prática e objetiva:

CONTEXTO: ${context ? JSON.stringify(context, null, 2) : 'Contexto geral'}

PERGUNTA: ${message}

DIRETRIZES:
- Respostas concisas e acionáveis
- Considere legislação e mercado brasileiro
- Inclua números e métricas quando relevante
- Sugira próximos passos específicos
- Use linguagem profissional mas acessível

Resposta:`
        }
      ]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }

    return 'Desculpe, não consegui processar sua solicitação.'
  }

  async detectAnomalies(transactions: any[]): Promise<any[]> {
    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Como especialista em análise financeira, identifique anomalias nestas transações:

TRANSAÇÕES:
${transactions.slice(0, 40).map(t => 
  `ID:${t.id}|${t.date}|R$${t.amount}|${t.description}|${t.category}`
).join('\n')}

PROCURE POR:
- Valores muito acima/abaixo da média
- Padrões incomuns de gastos
- Possíveis duplicações
- Variações extremas por categoria
- Transações suspeitas

RETORNE APENAS um array JSON:
[{
  "transactionId": "id_da_transacao_ou_null",
  "type": "VALOR_ANOMALO|DUPLICACAO|PADRAO_INCOMUM|CATEGORIA_SUSPEITA",
  "description": "Descrição específica da anomalia",
  "severity": "LOW|MEDIUM|HIGH",
  "confidence": 0.85
}]`
        }
      ]
    })

    try {
      const content = message.content[0]
      if (content.type === 'text') {
        return JSON.parse(content.text)
      }
    } catch (error) {
      console.error('Erro ao parsear anomalias do Claude:', error)
    }

    return []
  }
}