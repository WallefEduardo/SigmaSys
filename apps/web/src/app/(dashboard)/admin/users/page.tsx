"use client"

import { useState } from "react"
import { Search, Plus, MoreHorizontal, Users, Building2, Shield, Activity } from "lucide-react"

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

import { roleLabels, roleColors } from "@/lib/mock-data/users"
import { api } from "@/lib/trpc"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [page, setPage] = useState(1)

  // tRPC queries
  const { data: usersData, isLoading, refetch } = api.users.list.useQuery({
    page,
    limit: 10,
    search: searchTerm || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    active: statusFilter === "all" ? undefined : statusFilter === "active"
  })

  const createUserMutation = api.users.create.useMutation({
    onSuccess: () => {
      refetch()
      setIsDialogOpen(false)
      setEditingUser(null)
    }
  })

  const updateUserMutation = api.users.update.useMutation({
    onSuccess: () => {
      refetch()
      setIsDialogOpen(false)
      setEditingUser(null)
    }
  })

  const users = usersData?.users || []
  const pagination = usersData?.pagination

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const handleToggleStatus = (userId: string, currentActive: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      active: !currentActive
    })
  }

  const handleSubmit = (formData: FormData) => {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as "admin" | "manager" | "user",
      department: formData.get('department') as string || undefined,
      position: formData.get('position') as string || undefined,
      phone: formData.get('phone') as string || undefined,
    }

    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        ...data
      })
    } else {
      const password = formData.get('password') as string
      createUserMutation.mutate({
        ...data,
        password
      })
    }
  }

  const getRoleStats = () => {
    return users.reduce((stats, user) => {
      if (user.active) {
        stats[user.role] = (stats[user.role] || 0) + 1
      }
      return stats
    }, {} as Record<string, number>)
  }

  const roleStats = getRoleStats()

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Carregando usuários...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Usuários do Sistema</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.active).length} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.admin || 0}</div>
            <p className="text-xs text-muted-foreground">
              Acesso total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerentes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.manager || 0}</div>
            <p className="text-xs text-muted-foreground">
              Usuários gerenciais
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Comuns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.user || 0}</div>
            <p className="text-xs text-muted-foreground">
              Operacionais
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
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full md:w-[180px]">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
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
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      {user.phone && (
                        <div className="text-xs text-muted-foreground">{user.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role.toUpperCase() as keyof typeof roleColors]}>
                      {roleLabels[user.role.toUpperCase() as keyof typeof roleLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{user.department || "-"}</div>
                      {user.position && (
                        <div className="text-xs text-muted-foreground">{user.position}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={user.active 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR')
                      : "Nunca"
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant={user.active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.active)}
                        disabled={updateUserMutation.isPending}
                      >
                        {user.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit User */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? "Altere as informações do usuário aqui."
                : "Preencha as informações para criar um novo usuário."
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
                defaultValue={editingUser?.name || ""}
                className="col-span-3"
                required
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
                defaultValue={editingUser?.email || ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="phone" className="text-right">
                Telefone
              </label>
              <Input
                id="phone"
                name="phone"
                defaultValue={editingUser?.phone || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="role" className="text-right">
                Cargo
              </label>
              <Select name="role" defaultValue={editingUser?.role || "user"}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="department" className="text-right">
                Departamento
              </label>
              <Input
                id="department"
                name="department"
                defaultValue={editingUser?.department || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="position" className="text-right">
                Cargo
              </label>
              <Input
                id="position"
                name="position"
                defaultValue={editingUser?.position || ""}
                className="col-span-3"
              />
            </div>
            {!editingUser && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="password" className="text-right">
                  Senha
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="col-span-3"
                  required
                />
              </div>
            )}
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {createUserMutation.isPending || updateUserMutation.isPending 
                  ? "Salvando..." 
                  : editingUser ? "Salvar alterações" : "Criar usuário"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}