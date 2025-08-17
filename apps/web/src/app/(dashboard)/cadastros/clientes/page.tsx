"use client"

import { useState } from "react"
import { Search, Plus, MoreHorizontal, Users, Building2, Star, Phone, Mail, MapPin, Calendar, TrendingUp, Eye } from "lucide-react"

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

import { 
  statusLabels, 
  statusColors, 
  typeLabels
} from "@/lib/mock-data/clients"
import { api } from "@/lib/trpc"

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [segmentFilter, setSegmentFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [viewingClient, setViewingClient] = useState<any>(null)
  const [page, setPage] = useState(1)

  // tRPC queries
  const { data: clientsData, isLoading, refetch } = api.clients.list.useQuery({
    page,
    limit: 10,
    search: searchTerm || undefined,
    type: typeFilter !== "all" ? typeFilter as "person" | "company" : undefined,
    status: statusFilter !== "all" ? statusFilter as "active" | "inactive" | "prospect" | "lead" : undefined,
    segment: segmentFilter !== "all" ? segmentFilter : undefined
  })

  const { data: clientStats } = api.clients.stats.useQuery()

  const createClientMutation = api.clients.create.useMutation({
    onSuccess: () => {
      refetch()
      setIsDialogOpen(false)
      setEditingClient(null)
    }
  })

  const updateClientMutation = api.clients.update.useMutation({
    onSuccess: () => {
      refetch()
      setIsDialogOpen(false)
      setEditingClient(null)
    }
  })

  const deactivateClientMutation = api.clients.deactivate.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  const clients = clientsData?.clients || []
  const pagination = clientsData?.pagination

  const handleEdit = (client: any) => {
    setEditingClient(client)
    setIsDialogOpen(true)
  }

  const handleView = (client: any) => {
    setViewingClient(client)
    setIsViewDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingClient(null)
    setIsDialogOpen(true)
  }

  const handleToggleStatus = (clientId: string) => {
    deactivateClientMutation.mutate({ id: clientId })
  }

  const handleSubmit = (formData: FormData) => {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      document: formData.get('document') as string || undefined,
      type: formData.get('type') as "person" | "company",
      segment: formData.get('segment') as string || undefined,
      status: formData.get('status') as "active" | "inactive" | "prospect" | "lead",
      source: formData.get('source') as string || undefined,
      rating: formData.get('rating') ? Number(formData.get('rating')) : undefined,
      creditLimit: formData.get('creditLimit') ? Number(formData.get('creditLimit')) : undefined,
      paymentTerm: formData.get('paymentTerm') ? Number(formData.get('paymentTerm')) : undefined,
      discount: formData.get('discount') ? Number(formData.get('discount')) : undefined,
      notes: formData.get('notes') as string || undefined
    }

    if (editingClient) {
      updateClientMutation.mutate({
        id: editingClient.id,
        ...data
      })
    } else {
      createClientMutation.mutate(data)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Get unique segments for filter
  const uniqueSegments = [...new Set(clients.map(c => c.segment).filter(Boolean))]

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Carregando clientes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">CRM - Gestão de Clientes</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">
              {clientStats?.activeClients || 0} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats?.prospects || 0}</div>
            <p className="text-xs text-muted-foreground">
              Oportunidades ativas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats?.leads || 0}</div>
            <p className="text-xs text-muted-foreground">
              Qualificados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segmentos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats?.topSegments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Principais setores
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aniversariantes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats?.birthdays?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
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
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full md:w-[160px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="person">Pessoa Física</SelectItem>
                  <SelectItem value="company">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[160px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[160px]">
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos segmentos</SelectItem>
                  {uniqueSegments.map(segment => (
                    <SelectItem key={segment} value={segment!}>{segment}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Orçamentos</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client: any) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                      {client.document && (
                        <div className="text-xs text-muted-foreground">{client.document}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabels[client.type as keyof typeof typeLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                      {statusLabels[client.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{client.segment || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {client.rating ? (
                        <>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>{client.rating}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{client._count?.quotes || 0}</TableCell>
                  <TableCell>{client._count?.orders || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(client)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant={client.active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleStatus(client.id)}
                        disabled={deactivateClientMutation.isPending}
                      >
                        {client.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Client Details View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações completas e histórico de interações
            </DialogDescription>
          </DialogHeader>
          {viewingClient && (
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Nome:</strong> {viewingClient.name}</div>
                    <div><strong>Tipo:</strong> {typeLabels[viewingClient.type as keyof typeof typeLabels]}</div>
                    <div><strong>Email:</strong> {viewingClient.email || "Não informado"}</div>
                    <div><strong>Telefone:</strong> {viewingClient.phone || "Não informado"}</div>
                    <div><strong>Documento:</strong> {viewingClient.document || "Não informado"}</div>
                    <div><strong>Segmento:</strong> {viewingClient.segment || "Não informado"}</div>
                    <div><strong>Status:</strong> 
                      <Badge className={`ml-2 ${statusColors[viewingClient.status as keyof typeof statusColors]}`}>
                        {statusLabels[viewingClient.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Orçamentos:</strong> {viewingClient._count?.quotes || 0}</div>
                    <div><strong>Pedidos:</strong> {viewingClient._count?.orders || 0}</div>
                    <div><strong>Interações:</strong> {viewingClient._count?.interactions || 0}</div>
                    <div><strong>Avaliação:</strong> 
                      {viewingClient.rating ? (
                        <div className="flex items-center ml-2 inline-flex">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>{viewingClient.rating}</span>
                        </div>
                      ) : (
                        <span className="ml-2">Não avaliado</span>
                      )}
                    </div>
                    <div><strong>Limite de Crédito:</strong> {viewingClient.creditLimit ? formatCurrency(viewingClient.creditLimit) : "Não definido"}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Address */}
              {viewingClient.address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Endereço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {viewingClient.address.street}, {viewingClient.address.number}
                      {viewingClient.address.complement && `, ${viewingClient.address.complement}`}
                      <br />
                      {viewingClient.address.neighborhood} - {viewingClient.address.city}/{viewingClient.address.state}
                      <br />
                      CEP: {viewingClient.address.zipCode}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {viewingClient.tags?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {viewingClient.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {viewingClient.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{viewingClient.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for Create/Edit Client */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {editingClient 
                ? "Altere as informações do cliente aqui."
                : "Preencha as informações para criar um novo cliente."
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
                defaultValue={editingClient?.name || ""}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="type" className="text-right">
                Tipo
              </label>
              <Select name="type" defaultValue={editingClient?.type || "person"}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Pessoa Física</SelectItem>
                  <SelectItem value="company">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editingClient?.email || ""}
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
                defaultValue={editingClient?.phone || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="document" className="text-right">
                Documento
              </label>
              <Input
                id="document"
                name="document"
                defaultValue={editingClient?.document || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="segment" className="text-right">
                Segmento
              </label>
              <Input
                id="segment"
                name="segment"
                defaultValue={editingClient?.segment || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="status" className="text-right">
                Status
              </label>
              <Select name="status" defaultValue={editingClient?.status || "prospect"}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="source" className="text-right">
                Origem
              </label>
              <Input
                id="source"
                name="source"
                defaultValue={editingClient?.source || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="rating" className="text-right">
                Avaliação
              </label>
              <Select name="rating" defaultValue={editingClient?.rating?.toString() || ""}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem avaliação</SelectItem>
                  <SelectItem value="1">1 Estrela</SelectItem>
                  <SelectItem value="2">2 Estrelas</SelectItem>
                  <SelectItem value="3">3 Estrelas</SelectItem>
                  <SelectItem value="4">4 Estrelas</SelectItem>
                  <SelectItem value="5">5 Estrelas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="notes" className="text-right">
                Observações
              </label>
              <Input
                id="notes"
                name="notes"
                defaultValue={editingClient?.notes || ""}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createClientMutation.isPending || updateClientMutation.isPending}
              >
                {createClientMutation.isPending || updateClientMutation.isPending 
                  ? "Salvando..." 
                  : editingClient ? "Salvar alterações" : "Criar cliente"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}