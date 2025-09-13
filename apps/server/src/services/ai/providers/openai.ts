import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import type { AIProvider, FinancialAnalysisInput, FinancialInsight } from '../types'

// Schemas para structured outputs
const TransactionCategorizationSchema = z.object({
  categoryName: z.string().describe('Nome da categoria sugerida'),
  confidence: z.number().min(0).max(1).describe('Confiança da categorização (0-1)'),
  reasoning: z.string().describe('Razão da categorização'),
  tags: z.array(z.string()).describe('Tags sugeridas para a transação')
})

const FinancialInsightSchema = z.object({
  title: z.string().describe('Título do insight'),
  content: z.string().describe('Conteúdo detalhado do insight'),
  type: z.enum(['PREDICTION', 'RECOMMENDATION', 'ANALYSIS', 'PATTERN', 'OPTIMIZATION']),
  confidence: z.number().min(0).max(1).describe('Confiança do insight'),
  actionItems: z.array(z.string()).describe('Itens de ação sugeridos'),
  data: z.record(z.string(), z.unknown()).describe('Dados estruturados relacionados')
})

export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async categorizeTransaction(
    description: string, 
    amount: number, 
    existingCategories: string[]
  ) {
    const completion = await this.client.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em categorização financeira. 
          Analise a transação e sugira a melhor categoria.
          
          Categorias existentes: ${existingCategories.join(', ')}
          
          Se nenhuma categoria existir adequada, sugira uma nova categoria relevante.
          
          Regras importantes:
          - Para vendas/receitas: use categorias tipo "Vendas - [Produto/Serviço]"
          - Para despesas: seja específico (ex: "Marketing Digital", "Energia Elétrica")
          - Considere o contexto brasileiro (impostos, tributos, etc.)
          `
        },
        {
          role: 'user',
          content: `Descrição: ${description}\nValor: R$ ${amount.toFixed(2)}`
        }
      ],
      response_format: zodResponseFormat(TransactionCategorizationSchema, 'categorization')
    })

    const result = completion.choices[0]?.message.parsed
    if (!result) {
      throw new Error('Falha na categorização da transação')
    }

    return {
      category: result.categoryName,
      confidence: result.confidence,
      reasoning: result.reasoning,
      tags: result.tags,
      model: 'gpt-4o'
    }
  }

  async generateFinancialInsights(input: FinancialAnalysisInput): Promise<FinancialInsight[]> {
    const { transactions, budgets, period, companyProfile } = input
    
    // Análise contextualized do período
    const completion = await this.client.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um consultor financeiro especialista em análise de dados empresariais.
          
          Analise os dados financeiros e gere insights valiosos para gestão.
          
          Foque em:
          - Padrões de gastos e receitas
          - Oportunidades de otimização
          - Alertas de risco
          - Previsões baseadas em tendências
          - Comparações com orçamento planejado
          
          Seja específico e acionável nas recomendações.`
        },
        {
          role: 'user',
          content: `
          DADOS DA EMPRESA:
          - Período: ${period}
          - Perfil: ${JSON.stringify(companyProfile, null, 2)}
          
          TRANSAÇÕES (últimas):
          ${transactions.slice(0, 20).map(t => 
            `${t.date}: ${t.type} - R$ ${t.amount} - ${t.description} (${t.category})`
          ).join('\n')}
          
          ORÇAMENTOS:
          ${budgets.map(b => 
            `${b.category}: Planejado R$ ${b.planned} | Realizado R$ ${b.actual || 0}`
          ).join('\n')}
          
          Gere 3-5 insights mais importantes baseado nestes dados.`
        }
      ],
      response_format: zodResponseFormat(z.array(FinancialInsightSchema), 'insights')
    })

    const insights = completion.choices[0]?.message.parsed
    if (!insights) {
      throw new Error('Falha na geração de insights')
    }

    return insights.map(insight => ({
      ...insight,
      model: 'gpt-4o',
      createdAt: new Date()
    }))
  }

  async chatFinancialAssistant(message: string, context?: any): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente financeiro inteligente especializado em gestão empresarial.
          
          Características:
          - Respostas concisas e práticas
          - Foco em ações específicas
          - Conhecimento do mercado brasileiro
          - Linguagem profissional mas acessível
          
          Contexto disponível: ${context ? JSON.stringify(context) : 'Nenhum contexto específico'}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    return completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.'
  }

  async detectAnomalies(transactions: any[]): Promise<any[]> {
    // Implementação simplificada - em produção, usaria análise estatística mais sofisticada
    const completion = await this.client.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Analise as transações e identifique anomalias financeiras.
          
          Procure por:
          - Valores muito acima da média histórica
          - Padrões incomuns de gastos
          - Transações duplicadas suspeitas
          - Categorias com variação extrema
          
          Para cada anomalia, explique o motivo da detecção.`
        },
        {
          role: 'user',
          content: `Transações para análise:
          ${transactions.slice(0, 50).map(t => 
            `${t.date}: R$ ${t.amount} - ${t.description} (${t.category})`
          ).join('\n')}`
        }
      ],
      response_format: zodResponseFormat(z.array(z.object({
        transactionId: z.string().nullable(),
        type: z.string(),
        description: z.string(),
        severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        confidence: z.number().min(0).max(1)
      })), 'anomalies')
    })

    return completion.choices[0]?.message.parsed || []
  }
}