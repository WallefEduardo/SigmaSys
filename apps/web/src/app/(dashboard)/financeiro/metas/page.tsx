'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  Plus, 
  Target, 
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Calendar,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Trophy,
  AlertCircle,
  Clock,
  Bot
} from 'lucide-react'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import FloatingChatButton from '@/components/financial/FloatingChatButton'

const goalSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  targetAmount: z.number().min(0.01, 'Valor meta deve ser maior que zero'),
  currentAmount: z.number().min(0).default(0),
  type: z.enum(['saving', 'expense_reduction', 'income_increase', 'debt_payment']),
  priority: z.enum(['low', 'medium', 'high']),
  targetDate: z.string(),
  categoryId: z.string().optional(),
  reminderEnabled: z.boolean().default(true)
})

type GoalForm = z.infer<typeof goalSchema>

export default function GoalsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Queries
  const { data: goals, isLoading } = api.financial.goals.list.useQuery({
    status: selectedStatus === 'all' ? undefined : selectedStatus as 'active' | 'completed' | 'overdue'
  })
  
  const { data: categories } = api.financial.categories.list.useQuery({})
  const { data: goalStats } = api.financial.goals.getStats.useQuery({})
  const { data: aiInsights } = api.financial.ai.getGoalInsights.useQuery({})

  // Mutations
  const createMutation = api.financial.goals.create.useMutation({
    onSuccess: () => {
      toast.success('Meta criada com sucesso!')
      setIsDialogOpen(false)
      form.reset()
    },
    onError: (error) => {
      toast.error(`Erro ao criar meta: ${error.message}`)
    }
  })

  const updateMutation = api.financial.goals.update.useMutation({
    onSuccess: () => {
      toast.success('Meta atualizada com sucesso!')
      setEditingGoal(null)
      setIsDialogOpen(false)
      form.reset()
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar meta: ${error.message}`)
    }
  })

  const deleteMutation = api.financial.goals.delete.useMutation({
    onSuccess: () => {
      toast.success('Meta excluída com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao excluir meta: ${error.message}`)
    }
  })

  const form = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: '',
      description: '',
      targetAmount: 0,
      currentAmount: 0,
      type: 'saving',
      priority: 'medium',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      categoryId: 'none',
      reminderEnabled: true
    }
  })

  const onSubmit = (data: GoalForm) => {
    // Tratar categoryId "none" como undefined
    const processedData = {
      ...data,
      categoryId: data.categoryId === 'none' ? undefined : data.categoryId,
      targetDate: new Date(data.targetDate)
    }

    if (editingGoal) {
      updateMutation.mutate({
        id: editingGoal.id,
        ...processedData
      })
    } else {
      createMutation.mutate(processedData)
    }
  }

  const handleEdit = (goal: any) => {
    setEditingGoal(goal)
    form.reset({
      title: goal.title,
      description: goal.description || '',
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      type: goal.type,
      priority: goal.priority,
      targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
      categoryId: goal.categoryId || 'none',
      reminderEnabled: goal.reminderEnabled
    })
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingGoal(null)
    form.reset()
    setIsDialogOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'saving': return 'Poupança'
      case 'expense_reduction': return 'Redução de Gastos'
      case 'income_increase': return 'Aumento de Renda'
      case 'debt_payment': return 'Pagamento de Dívida'
      default: return type
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'saving': return <Target className="h-4 w-4" />
      case 'expense_reduction': return <TrendingDown className="h-4 w-4" />
      case 'income_increase': return <TrendingUp className="h-4 w-4" />
      case 'debt_payment': return <CheckCircle2 className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getGoalStatus = (goal: any) => {
    const today = new Date()
    const targetDate = new Date(goal.targetDate)
    const progress = (goal.currentAmount / goal.targetAmount) * 100

    if (progress >= 100) return { status: 'completed', color: 'text-green-600', icon: <Trophy className="h-4 w-4" /> }
    if (isAfter(today, targetDate)) return { status: 'overdue', color: 'text-red-600', icon: <AlertCircle className="h-4 w-4" /> }
    if (differenceInDays(targetDate, today) <= 7) return { status: 'urgent', color: 'text-orange-600', icon: <Clock className="h-4 w-4" /> }
    return { status: 'active', color: 'text-blue-600', icon: <Target className="h-4 w-4" /> }
  }

  const getProgressColor = (progress: number, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-500'
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  return (
    <>
      <FloatingChatButton />
      <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas Financeiras</h1>
          <p className="text-muted-foreground">
            Defina e acompanhe seus objetivos financeiros
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Editar Meta' : 'Nova Meta'}
                </DialogTitle>
                <DialogDescription>
                  {editingGoal 
                    ? 'Atualize as informações da sua meta' 
                    : 'Defina um novo objetivo financeiro para alcançar'
                  }
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Economizar para viagem..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva sua meta..." 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="targetAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Meta</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Atual</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="saving">Poupança</SelectItem>
                              <SelectItem value="expense_reduction">Redução de Gastos</SelectItem>
                              <SelectItem value="income_increase">Aumento de Renda</SelectItem>
                              <SelectItem value="debt_payment">Pagamento de Dívida</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Meta</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria (opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingGoal ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      {goalStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goalStats.activeGoals}</div>
              <p className="text-xs text-muted-foreground">
                {goalStats.totalGoals} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <Trophy className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{goalStats.completedGoals}</div>
              <p className="text-xs text-muted-foreground">
                {goalStats.totalGoals > 0 ? ((goalStats.completedGoals / goalStats.totalGoals) * 100).toFixed(1) : 0}% de sucesso
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{goalStats.overdueGoals}</div>
              <p className="text-xs text-muted-foreground">
                Precisam de atenção
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goalStats.averageProgress?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground">
                De todas as metas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights da IA */}
      {aiInsights && aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Insights da IA
            </CardTitle>
            <CardDescription>
              Recomendações inteligentes para suas metas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Metas */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Metas</CardTitle>
          <CardDescription>
            Acompanhe o progresso dos seus objetivos financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-[200px]" />
                    <Skeleton className="h-6 w-[100px]" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : goals?.length ? (
            <div className="space-y-6">
              {goals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                const status = getGoalStatus(goal)
                const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date())
                const isOverdue = daysRemaining < 0

                return (
                  <div key={goal.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(goal.type)}
                          <h3 className="text-lg font-semibold">{goal.title}</h3>
                          <Badge variant={getPriorityBadgeVariant(goal.priority)}>
                            {goal.priority === 'high' ? 'Alta' : goal.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        {goal.description && (
                          <p className="text-muted-foreground mb-2">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(goal.targetDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <span className={status.color}>
                            {isOverdue 
                              ? `${Math.abs(daysRemaining)} dias em atraso`
                              : daysRemaining === 0 
                              ? 'Vence hoje'
                              : `${daysRemaining} dias restantes`
                            }
                          </span>
                          <Badge variant="outline">
                            {getTypeLabel(goal.type)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          </p>
                          <p className={`text-sm ${status.color}`}>
                            {progress.toFixed(1)}% concluído
                          </p>
                        </div>
                        {status.icon}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(goal)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteMutation.mutate({ id: goal.id })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso</span>
                        <span>{formatCurrency(goal.targetAmount - goal.currentAmount)} restante</span>
                      </div>
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma meta encontrada</p>
              <p className="text-muted-foreground">
                Defina suas primeiras metas financeiras para começar
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}