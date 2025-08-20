"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Plus, MoreHorizontal, Building2, Users, Package, ShoppingCart } from "lucide-react"
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

function CompaniesPageContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)

  // tRPC queries
  const { data: companiesData, isLoading, refetch } = api.companies.list.useQuery({
    page,
    limit: 10,
    search: searchTerm || undefined,
    planId: planFilter !== "all" ? planFilter : undefined,
    active: statusFilter === "all" ? undefined : statusFilter === "active"
  })

  const toggleActiveMutation = api.companies.toggleActive.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  const companies = companiesData?.companies || []
  const pagination = companiesData?.pagination

  const handleToggleStatus = (companyId: string, currentActive: boolean) => {
    toggleActiveMutation.mutate({
      id: companyId,
      active: !currentActive
    })
  }

  const getTotalStats = () => {
    return companies.reduce((totals, company) => ({
      users: totals.users + (company._count?.users || 0),
      clients: totals.clients + (company._count?.clients || 0),
      products: totals.products + (company._count?.products || 0),
      orders: totals.orders + (company._count?.orders || 0),
    }), { users: 0, clients: 0, products: 0, orders: 0 })
  }

  const stats = getTotalStats()

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Empresas</h2>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando empresas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Empresas</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/superadmin/empresas/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              Empresas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              Usuários ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos processados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {company.email}
                      </div>
                      {company.cnpj && (
                        <div className="text-xs text-muted-foreground">
                          CNPJ: {company.cnpj}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {company.plan?.name || 'Sem plano'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={company.active ? "default" : "destructive"}
                    >
                      {company.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{company._count?.users || 0}</TableCell>
                  <TableCell>{company._count?.clients || 0}</TableCell>
                  <TableCell>
                    {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/superadmin/empresas/editar/${company.id}`}>
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant={company.active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleStatus(company.id, company.active)}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {company.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CompaniesPage() {
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <CompaniesPageContent />
    </RoleGuard>
  )
}