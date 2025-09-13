'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  Send, 
  Bot, 
  User, 
  X, 
  Loader2, 
  TrendingUp,
  TrendingDown,
  Target,
  PieChart,
  Plus,
  Calculator,
  Sparkles,
  MessageCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  data?: any
}

interface ChatAssistantProps {
  onClose: () => void
}

const QUICK_ACTIONS = [
  {
    icon: Plus,
    label: 'Nova transação',
    action: 'create_transaction',
    description: 'Adicionar receita ou despesa'
  },
  {
    icon: PieChart,
    label: 'Resumo do mês',
    action: 'monthly_summary',
    description: 'Ver resumo financeiro mensal'
  },
  {
    icon: Target,
    label: 'Progresso das metas',
    action: 'goals_progress',
    description: 'Verificar status das metas'
  },
  {
    icon: Calculator,
    label: 'Orçamento restante',
    action: 'budget_remaining',
    description: 'Saldo disponível no orçamento'
  }
]

const SUGGESTIONS = [
  "Como está meu orçamento este mês?",
  "Qual categoria gastei mais dinheiro?",
  "Criar uma meta de economia",
  "Resumir minhas transações da semana",
  "Analisar meus gastos com alimentação",
  "Sugerir categorias para minha última compra"
]

export default function ChatAssistant({ onClose }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Olá! 👋 Sou seu assistente financeiro inteligente. Como posso ajudar você hoje?',
      timestamp: new Date(),
      suggestions: SUGGESTIONS.slice(0, 3)
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mutations
  const chatMutation = api.financial.ai.chat.useMutation({
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
        data: response.data
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    },
    onError: (error) => {
      toast.error(`Erro no chat: ${error.message}`)
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  })

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Focus no input quando o chat abrir
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    chatMutation.mutate({
      message: content,
      context: {
        includeTransactions: true,
        includeBudgets: true
      }
    })
  }

  const handleQuickAction = (action: string) => {
    const actionMessages = {
      create_transaction: "Quero adicionar uma nova transação",
      monthly_summary: "Me mostre o resumo financeiro deste mês",
      goals_progress: "Como está o progresso das minhas metas?",
      budget_remaining: "Quanto ainda tenho disponível no meu orçamento?"
    }

    const message = actionMessages[action as keyof typeof actionMessages]
    if (message) {
      handleSendMessage(message)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const renderMessageContent = (message: Message) => {
    // Se a mensagem tem dados estruturados, renderizar de forma especial
    if (message.data) {
      switch (message.data.type) {
        case 'summary':
          return (
            <div className="space-y-3">
              <p>{message.content}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-green-50 p-2 rounded">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-700">Receitas</span>
                  </div>
                  <div className="font-bold text-green-800">
                    {formatCurrency(message.data.income || 0)}
                  </div>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-700">Despesas</span>
                  </div>
                  <div className="font-bold text-red-800">
                    {formatCurrency(message.data.expenses || 0)}
                  </div>
                </div>
              </div>
            </div>
          )
        case 'goals':
          return (
            <div className="space-y-3">
              <p>{message.content}</p>
              {message.data.goals && message.data.goals.map((goal: any, index: number) => (
                <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-blue-600" />
                    <span className="font-medium">{goal.title}</span>
                  </div>
                  <div className="mt-1 text-blue-700">
                    Progresso: {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )
        default:
          return <p>{message.content}</p>
      }
    }

    return <p>{message.content}</p>
  }

  return (
    <div className="flex flex-col h-[400px] bg-background border-t">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-6 w-6 text-blue-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold">Assistente Financeiro</h3>
            <p className="text-xs text-muted-foreground">Online • Powered by IA</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 border-b bg-muted/20">
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.action}
                variant="outline"
                size="sm"
                className="h-auto p-2 justify-start"
                onClick={() => handleQuickAction(action.action)}
              >
                <action.icon className="h-4 w-4 mr-2 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-muted border'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className="space-y-2">
                  <Card className={`p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-background border'
                  }`}>
                    {renderMessageContent(message)}
                  </Card>
                  <p className="text-xs text-muted-foreground">
                    {format(message.timestamp, 'HH:mm', { locale: ptBR })}
                  </p>
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Sugestões:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <Card className="p-3 bg-background border">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage(inputValue)
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua pergunta sobre finanças..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <div className="flex items-center gap-2 mt-2">
          <MessageCircle className="h-3 w-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Pergunte sobre gastos, orçamentos, metas ou peça insights financeiros
          </p>
        </div>
      </div>
    </div>
  )
}