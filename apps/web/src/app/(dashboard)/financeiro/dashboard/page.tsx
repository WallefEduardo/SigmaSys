'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Target,
  Brain,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from 'lucide-react'
import { api } from '@/lib/trpc'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import AlertsWidget from '@/components/financial/AlertsWidget'
import FloatingChatButton from '@/components/financial/FloatingChatButton'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')
  const [refreshing, setRefreshing] = useState(false)

  // Queries
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = api.financial.dashboard.getOverview.useQuery({})
  
  const { data: chartData } = api.financial.dashboard.getChartData.useQuery({
    type: 'monthly_trends'
  })
  
  const { data: categoryBreakdown } = api.financial.dashboard.getChartData.useQuery({
    type: 'category_breakdown'
  })
  
  const { data: budgetComparison } = api.financial.dashboard.getChartData.useQuery({
    type: 'budget_vs_actual'
  })
  
  const { data: topCategories } = api.financial.dashboard.getTopCategories.useQuery({
    limit: 5
  })
  
  const { data: recentTransactions } = api.financial.dashboard.getRecentTransactions.useQuery({
    limit: 6
  })
  
  const { data: aiInsights } = api.financial.ai.getInsights.useQuery({
    limit: 3
  })
  
  const { data: alerts } = api.financial.alerts.list.useQuery({
    page: 1,
    limit: 3,
    read: false
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetchOverview()
    setRefreshing(false)
  }

  if (overviewLoading) {
    return <DashboardSkeleton />
  }

  const summary = overview?.summary
  const incomeVariance = summary?.income.variancePercent || 0
  const expenseVariance = summary?.expense.variancePercent || 0
  const balance = summary?.balance.actual || 0

  return (
    <>
      <FloatingChatButton />
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral da sua saúde financeira
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Mês Atual</SelectItem>
              <SelectItem value="last-month">Mês Anterior</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas Importantes */}
      {alerts?.data && alerts.data.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Você tem {alerts.data.length} alerta(s) financeiro(s) não lido(s).
            <Button variant="link" className="p-0 ml-2 h-auto text-orange-800 underline">
              Ver todos
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.income.actual || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="mr-1">
                {incomeVariance >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
              </span>
              <span className={incomeVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(incomeVariance).toFixed(1)}%
              </span>
              <span className="ml-1">vs orçado</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.expense.actual || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="mr-1">
                {expenseVariance <= 0 ? (
                  <ArrowDownRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowUpRight className="h-3 w-3 text-red-600" />
                )}
              </span>
              <span className={expenseVariance <= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(expenseVariance).toFixed(1)}%
              </span>
              <span className="ml-1">vs orçado</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(summary?.income.transactions || 0) + (summary?.expense.transactions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.income.transactions || 0} receitas, {summary?.expense.transactions || 0} despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráficos Principais */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="trends" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">Tendências</TabsTrigger>
              <TabsTrigger value="breakdown">Categorias</TabsTrigger>
              <TabsTrigger value="comparison">Orçado vs Real</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Tendências Mensais</CardTitle>
                  <CardDescription>
                    Evolução das receitas e despesas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="INCOME" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Receitas"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="EXPENSE" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Despesas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="breakdown">
              <Card>
                <CardHeader>
                  <CardTitle>Breakdown por Categoria</CardTitle>
                  <CardDescription>
                    Distribuição dos gastos e receitas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.category?.name}: ${formatCurrency(entry.value)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(categoryBreakdown || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="comparison">
              <Card>
                <CardHeader>
                  <CardTitle>Orçado vs Realizado</CardTitle>
                  <CardDescription>
                    Comparação por categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetComparison || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category.name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="planned" fill="#94a3b8" name="Orçado" />
                      <Bar dataKey="actual" fill="#3b82f6" name="Realizado" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar com Insights e Atividades */}
        <div className="space-y-6">
          {/* Insights da IA */}
          {aiInsights && aiInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Insights da IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiInsights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="p-3 rounded-lg border border-purple-100 bg-purple-50">
                    <h4 className="font-medium text-sm text-purple-900 mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-purple-700 line-clamp-3">
                      {insight.content.substring(0, 120)}...
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.type}
                      </Badge>
                      <span className="text-xs text-purple-600">
                        {Math.round(insight.confidence * 100)}% confiança
                      </span>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Todos os Insights
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Widget de Alertas */}
          <AlertsWidget />

          {/* Top Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Top Categorias</CardTitle>
              <CardDescription>Maiores movimentações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCategories?.map((item, index) => (
                <div key={item.category.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.transactions} transações
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transações Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTransactions?.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.category.name} • {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}
                  </div>
                </div>
              ))}
              
              <Button variant="outline" size="sm" className="w-full mt-3">
                <Eye className="h-4 w-4 mr-2" />
                Ver Todas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Skeleton loading
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  )
}