'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  Plus, 
  PieChart, 
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy
} from 'lucide-react'
import FloatingChatButton from '@/components/financial/FloatingChatButton'
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'


export default function BudgetsPage() {
  const router = useRouter()
  const [startDate, setStartDate] = useState(startOfMonth(new Date()).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(endOfMonth(new Date()).toISOString().split('T')[0])

  // Queries
  const { data: budgets, isLoading } = api.financial.budgets.list.useQuery({
    startDate,
    endDate
  })
  
  const { data: budgetStats } = api.financial.budgets.getStats.useQuery({ 
    startDate,
    endDate 
  })

  const deleteMutation = api.financial.budgets.delete.useMutation({
    onSuccess: () => {
      toast.success('Orçamento excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao excluir orçamento: ${error.message}`)
    }
  })


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100
    if (percentage >= 100) return 'text-red-500 dark:text-red-400'
    if (percentage >= 80) return 'text-yellow-500 dark:text-yellow-400'
    return 'text-green-500 dark:text-green-400'
  }

  const getStatusIcon = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100
    if (percentage >= 100) return <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
    if (percentage >= 80) return <TrendingUp className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
    return <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
  }

  const getBudgetProgress = (spent: number, budgeted: number) => {
    return Math.min((spent / budgeted) * 100, 100)
  }

  return (
    <>
      <FloatingChatButton />
      <div className="w-full py-8 space-y-8 px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">
            Planeje e controle seus gastos mensais
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/financeiro/orcamentos/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Seletor de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Data Início</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Data Fim</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do Período */}
      {budgetStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orçado</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(budgetStats.totalBudgeted)}
              </div>
              <p className="text-xs text-muted-foreground">
                {budgetStats.activeBudgets} orçamentos ativos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500 dark:text-red-400">
                {formatCurrency(budgetStats.totalSpent)}
              </div>
              <p className="text-xs text-muted-foreground">
                {((budgetStats.totalSpent / budgetStats.totalBudgeted) * 100).toFixed(1)}% do orçado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponível</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500 dark:text-green-400">
                {formatCurrency(budgetStats.totalBudgeted - budgetStats.totalSpent)}
              </div>
              <p className="text-xs text-muted-foreground">
                Restante do período
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">
                {budgetStats.alertsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Categorias em excesso
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Orçamentos do Período</CardTitle>
          <CardDescription>
            Visualize e gerencie seus orçamentos ativos
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
          ) : budgets?.length ? (
            <div className="space-y-6">
              {budgets?.map((budget) => (
                <div key={budget.id} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{budget.category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {budget.month}/{budget.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(budget.actualAmount || 0)} / {formatCurrency(Number(budget.plannedAmount))}
                        </p>
                        <p className={`text-sm ${getStatusColor(budget.actualAmount || 0, Number(budget.plannedAmount))}`}>
                          {(((budget.actualAmount || 0) / Number(budget.plannedAmount)) * 100).toFixed(1)}% utilizado
                        </p>
                      </div>
                      {getStatusIcon(budget.actualAmount || 0, Number(budget.plannedAmount))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500 dark:text-red-400"
                            onClick={() => deleteMutation.mutate({ id: budget.id })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          getBudgetProgress(budget.actualAmount || 0, Number(budget.plannedAmount)) >= 100 ? 'bg-red-500 dark:bg-red-400' :
                          getBudgetProgress(budget.actualAmount || 0, Number(budget.plannedAmount)) >= 80 ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-green-500 dark:bg-green-400'
                        }`}
                        style={{ width: `${getBudgetProgress(budget.actualAmount || 0, Number(budget.plannedAmount))}%` }}
                      />
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Categoria: {budget.category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Tipo: {budget.category.type === 'INCOME' ? 'Receita' : 'Despesa'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            ((budget.actualAmount || 0) / Number(budget.plannedAmount)) >= 1 ? 'destructive' :
                            ((budget.actualAmount || 0) / Number(budget.plannedAmount)) >= 0.8 ? 'secondary' : 'outline'
                          }>
                            {(((budget.actualAmount || 0) / Number(budget.plannedAmount)) * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum orçamento encontrado</p>
              <p className="text-muted-foreground">
                Crie seu primeiro orçamento para começar a controlar seus gastos
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}