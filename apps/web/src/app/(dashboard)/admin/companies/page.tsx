"use client"

import { useState } from "react"
import { Search, Plus, MoreHorizontal, Building2, Users, Package, ShoppingCart } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { planLabels, planColors } from "@/lib/mock-data/companies"
import { api } from "@/lib/trpc"

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [page, setPage] = useState(1)

  // tRPC queries
  const { data: companiesData, isLoading, refetch } = api.companies.list.useQuery({
    page,
    limit: 10,
    search: searchTerm || undefined,
    plan: planFilter !== "all" ? planFilter : undefined,
    active: statusFilter === "all" ? undefined : statusFilter === "active"
  })

  const createCompanyMutation = api.companies.create.useMutation({
    onSuccess: () => {
      refetch()
      setIsDialogOpen(false)
      setEditingCompany(null)
    }
  })

  const updateCompanyMutation = api.companies.update.useMutation({
    onSuccess: () => {
      refetch()
      setIsDialogOpen(false)
      setEditingCompany(null)
    }
  })

  const toggleActiveMutation = api.companies.toggleActive.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  const companies = companiesData?.companies || []
  const pagination = companiesData?.pagination

  const handleEdit = (company: any) => {
    setEditingCompany(company)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingCompany(null)
    setIsDialogOpen(true)
  }

  const handleToggleStatus = (companyId: string, currentActive: boolean) => {
    toggleActiveMutation.mutate({
      id: companyId,
      active: !currentActive
    })
  }

  const handleSubmit = (formData: FormData) => {
    const data = {
      name: formData.get('name') as string,
      cnpj: formData.get('cnpj') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      plan: formData.get('plan') as "trial" | "basic" | "premium" | "enterprise"
    }

    if (editingCompany) {
      updateCompanyMutation.mutate({
        id: editingCompany.id,
        ...data
      })
    } else {
      createCompanyMutation.mutate(data)
    }
  }

  const getTotalStats = () => {
    return companies.reduce((totals, company) => ({
      users: totals.users + (company._count?.users || 0),
      clients: totals.clients + (company._count?.clients || 0),
      products: totals.products + (company._count?.products || 0),
      orders: totals.orders + (company._count?.orders || 0),
    }), { users: 0, clients: 0, products: 0, orders: 0 })
  }

  const totalStats = getTotalStats()

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Carregando empresas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Empresas</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
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
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {companies.filter(c => c.active).length} ativas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.users}</div>
            <p className="text-xs text-muted-foreground">
              Todos os usuários ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.clients}</div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.orders}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full md:w-[180px]">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas ({companies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company: any) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-muted-foreground">{company.email}</div>
                      {company.cnpj && (
                        <div className="text-xs text-muted-foreground">{company.cnpj}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={planColors[company.plan as keyof typeof planColors]}>
                      {planLabels[company.plan as keyof typeof planLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={company.active 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }
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
                        onClick={() => handleEdit(company)}
                      >
                        Editar
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

      {/* Dialog for Create/Edit Company */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Editar Empresa" : "Nova Empresa"}
            </DialogTitle>
            <DialogDescription>
              {editingCompany 
                ? "Altere as informações da empresa aqui."
                : "Preencha as informações para criar uma nova empresa."
              }
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Nome
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={editingCompany?.name || ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="cnpj" className="text-right">
                CNPJ
              </label>
              <Input
                id="cnpj"
                name="cnpj"
                defaultValue={editingCompany?.cnpj || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editingCompany?.email || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="phone" className="text-right">
                Telefone
              </label>
              <Input
                id="phone"
                name="phone"
                defaultValue={editingCompany?.phone || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="address" className="text-right">
                Endereço
              </label>
              <Input
                id="address"
                name="address"
                defaultValue={editingCompany?.address || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="plan" className="text-right">
                Plano
              </label>
              <Select name="plan" defaultValue={editingCompany?.plan || "trial"}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
              >
                {createCompanyMutation.isPending || updateCompanyMutation.isPending 
                  ? "Salvando..." 
                  : editingCompany ? "Salvar alterações" : "Criar empresa"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}