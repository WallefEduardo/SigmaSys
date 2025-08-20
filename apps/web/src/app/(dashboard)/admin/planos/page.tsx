"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Zap, Users, Building2, Star, Settings, DollarSign, Package, Crown, Activity, TrendingUp, ShieldCheck, Target } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { RoleGuard } from "@/components/auth/role-guard"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { api } from "@/lib/trpc"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const getPlanIcon = (planName: string) => {
  const name = planName.toLowerCase()
  if (name.includes('trial')) return <Zap className="h-5 w-5" />
  if (name.includes('básico')) return <Package className="h-5 w-5" />
  if (name.includes('profissional')) return <Star className="h-5 w-5" />
  if (name.includes('enterprise')) return <Crown className="h-5 w-5" />
  if (name.includes('super')) return <ShieldCheck className="h-5 w-5" />
  return <Settings className="h-5 w-5" />
}

const getPlanColor = (planName: string) => {
  const name = planName.toLowerCase()
  if (name.includes('trial')) return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
  if (name.includes('básico')) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  if (name.includes('profissional')) return "bg-secondary/20 text-secondary dark:bg-secondary/20 dark:text-secondary"
  if (name.includes('enterprise')) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  if (name.includes('super')) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
}

function PlanosPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)

  // Verificar se é superadmin
  if (user?.role !== 'superadmin') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <ShieldCheck className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas superadministradores podem gerenciar planos
            </p>
            <Button onClick={() => router.back()}>
              Voltar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // tRPC queries
  const { data: plansData, isLoading, refetch } = api.plans.list.useQuery({
    page,
    limit: 10,
    search: searchTerm || undefined,
    active: statusFilter === "all" ? undefined : statusFilter === "active"
  })

  const { data: statsData } = api.plans.getStats.useQuery()

  const plans = plansData?.plans || []
  const pagination = plansData?.pagination
  const stats = statsData || {
    totalPlans: 0,
    activePlans: 0,
    inactivePlans: 0,
    plansWithCompanies: 0,
    unusedPlans: 0,
    popularPlan: 'Nenhum'
  }

  const handleCreatePlan = () => {
    router.push('/admin/planos/novo')
  }

  const handleEditPlan = (planId: string) => {
    router.push(`/admin/planos/${planId}/editar`)
  }

  const handleViewPlan = (planId: string) => {
    router.push(`/admin/planos/${planId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Carregando planos...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-secondary to-primary rounded-xl">
              <Settings className="h-6 w-6 text-white" />
            </div>
            Gestão de Planos
          </h2>
          <p className="text-muted-foreground">
            Configure e gerencie os planos disponíveis no sistema
          </p>
        </div>
        <Button onClick={handleCreatePlan} className="bg-secondary hover:bg-secondary/90">
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
            <Package className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.totalPlans}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePlans} ativos, {stats.inactivePlans} inativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos em Uso</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.plansWithCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unusedPlans} sem empresas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Popular</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-yellow-600">{stats.popularPlan}</div>
            <p className="text-xs text-muted-foreground">
              Destacado para clientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.activePlans}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para venda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar planos por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full md:w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Planos ({plans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Empresas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan: any) => (
                <TableRow key={plan.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPlanColor(plan.name)}`}>
                        {getPlanIcon(plan.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{plan.name}</span>
                          {plan.popular && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              <Star className="mr-1 h-3 w-3" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {plan.description || 'Sem descrição'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-semibold text-secondary">
                        {formatCurrency(plan.price)}/mês
                      </div>
                      {plan.yearlyPrice && (
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(plan.yearlyPrice)}/ano
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {plan.maxUsers} usuários
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {plan.maxClients} clientes
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {plan.maxProducts} produtos
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <span className="text-lg font-bold text-primary">
                        {plan._count?.companies || 0}
                      </span>
                      <div className="text-xs text-muted-foreground">empresas</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={plan.active 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {plan.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPlan(plan.id)}
                        className="hover:bg-secondary/20"
                      >
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(plan.id)}
                        className="hover:bg-secondary/20"
                      >
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {plans.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plano encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar os filtros' : 'Comece criando seu primeiro plano'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreatePlan}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Plano
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {plans.length} de {pagination.total} planos
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {page} de {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.pages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlanosPage() {
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <PlanosPageContent />
    </RoleGuard>
  )
}