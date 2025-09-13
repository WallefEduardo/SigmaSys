'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  Receipt, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Bot,
  Loader2,
  Filter,
  RefreshCw
} from 'lucide-react'
import FloatingChatButton from '@/components/financial/FloatingChatButton'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart as RechartsPieChart, 
  Cell, 
  BarChart as RechartsBarChart, 
  Bar,
  Area,
  AreaChart
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('last-3-months')
  const [selectedReport, setSelectedReport] = useState('overview')
  const [startDate, setStartDate] = useState(startOfMonth(subMonths(new Date(), 2)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(endOfMonth(new Date()).toISOString().split('T')[0])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Queries
  const { data: reportData, isLoading, refetch } = api.financial.reports.getOverview.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    categoryId: selectedCategory || undefined
  })

  const { data: cashFlowData } = api.financial.reports.getCashFlow.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  })

  const { data: categoryBreakdown } = api.financial.reports.getCategoryBreakdown.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    type: 'expense'
  })

  const { data: monthlyTrends } = api.financial.reports.getMonthlyTrends.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  })

  const { data: categories } = api.financial.categories.list.useQuery({})

  const { data: aiReport } = api.financial.ai.generateReport.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const today = new Date()
    
    switch (period) {
      case 'this-month':
        setStartDate(startOfMonth(today).toISOString().split('T')[0])
        setEndDate(endOfMonth(today).toISOString().split('T')[0])
        break
      case 'last-month':
        const lastMonth = subMonths(today, 1)
        setStartDate(startOfMonth(lastMonth).toISOString().split('T')[0])
        setEndDate(endOfMonth(lastMonth).toISOString().split('T')[0])
        break
      case 'last-3-months':
        setStartDate(startOfMonth(subMonths(today, 2)).toISOString().split('T')[0])
        setEndDate(endOfMonth(today).toISOString().split('T')[0])
        break
      case 'last-6-months':
        setStartDate(startOfMonth(subMonths(today, 5)).toISOString().split('T')[0])
        setEndDate(endOfMonth(today).toISOString().split('T')[0])
        break
      case 'this-year':
        setStartDate(`${today.getFullYear()}-01-01`)
        setEndDate(`${today.getFullYear()}-12-31`)
        break
    }
  }

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true)
    try {
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Relatório ${format.toUpperCase()} gerado com sucesso!`)
    } catch (error) {
      toast.error('Erro ao gerar relatório')
    } finally {
      setIsGenerating(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <>
      <FloatingChatButton />
      <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises detalhadas da sua situação financeira
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Excel
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">Este mês</SelectItem>
                <SelectItem value="last-month">Mês passado</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
                <SelectItem value="this-year">Este ano</SelectItem>
                <SelectItem value="custom">Período personalizado</SelectItem>
              </SelectContent>
            </Select>

            {selectedPeriod === 'custom' && (
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
            )}

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Período */}
      {reportData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.incomeTransactions} transações
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.expenseTransactions} transações
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
              <BarChart3 className={`h-4 w-4 ${reportData.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${reportData.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportData.netBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData.netBalance >= 0 ? 'Superávit' : 'Déficit'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Receipt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(reportData.averageTransaction || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por transação
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Relatório da IA */}
      {aiReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Análise Inteligente
            </CardTitle>
            <CardDescription>
              Insights gerados por IA sobre sua situação financeira
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Resumo Executivo</h4>
                <p className="text-blue-800">{aiReport.summary}</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Pontos Positivos</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    {aiReport.positives?.map((positive, index) => (
                      <li key={index}>• {positive}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-2">Pontos de Atenção</h4>
                  <ul className="text-orange-800 text-sm space-y-1">
                    {aiReport.concerns?.map((concern, index) => (
                      <li key={index}>• {concern}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg mt-4">
                <h4 className="font-medium text-purple-900 mb-2">Recomendações</h4>
                <ul className="text-purple-800 text-sm space-y-1">
                  {aiReport.recommendations?.map((recommendation, index) => (
                    <li key={index}>• {recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : monthlyTrends ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : categoryBreakdown ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ category, percentage }) => `${category}: ${percentage}%`}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>
                Entrada e saída de dinheiro ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : cashFlowData ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Receitas" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Despesas" />
                    <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Saldo" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
              <CardDescription>
                Análise detalhada dos gastos por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : categoryBreakdown ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsBarChart data={categoryBreakdown} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis dataKey="category" type="category" width={120} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências Mensais</CardTitle>
              <CardDescription>
                Evolução das receitas e despesas ao longo dos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : monthlyTrends ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsBarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" fill="#10b981" name="Receitas" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </>
  )
}