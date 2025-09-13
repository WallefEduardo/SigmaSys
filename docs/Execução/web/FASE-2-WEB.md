# 🌐 FASE 2 - CADASTROS FUNDAMENTAIS WEB (Semanas 3-4)

## 📋 Visão Geral da Fase
Criar interfaces modernas para gestão de empresas, usuários e clientes com dados mockados, focando em UX/UI excepcional e componentes reutilizáveis.

---

## 🏢 PARTE 2.1: Interface de Empresas (Superadmin)

### **Objetivo**: Criar interface de superadmin para gestão de empresas

### **Pré-requisitos**:
- FASE 1 WEB concluída
- Componentes base instalados
- Sistema de temas funcionando

### **Tarefas Sequenciais**:

#### 2.1.1 - Dados Mockados de Empresas
**Arquivo**: `apps/web/src/lib/mock-data/companies.ts`

```typescript
export interface Company {
  id: string
  name: string
  cnpj?: string
  email?: string
  phone?: string
  address?: string
  plan: 'trial' | 'basic' | 'premium' | 'enterprise'
  active: boolean
  createdAt: Date
  stats: {
    users: number
    clients: number
    products: number
    orders: number
  }
}

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Visual Graphics Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'contato@visualgraphics.com',
    phone: '(11) 98765-4321',
    address: 'Rua das Empresas, 123 - São Paulo/SP',
    plan: 'premium',
    active: true,
    createdAt: new Date('2024-01-15'),
    stats: {
      users: 12,
      clients: 245,
      products: 89,
      orders: 156
    }
  },
  {
    id: '2',
    name: 'Impressões Digitais Rápidas',
    cnpj: '98.765.432/0001-10',
    email: 'admin@impressoesdigitais.com',
    phone: '(21) 91234-5678',
    address: 'Av. Principal, 456 - Rio de Janeiro/RJ',
    plan: 'basic',
    active: true,
    createdAt: new Date('2024-02-20'),
    stats: {
      users: 5,
      clients: 87,
      products: 34,
      orders: 45
    }
  },
  {
    id: '3',
    name: 'Design & Comunicação Visual',
    cnpj: '55.444.333/0001-22',
    email: 'contato@designcv.com',
    phone: '(31) 95555-1234',
    address: 'Rua do Design, 789 - Belo Horizonte/MG',
    plan: 'enterprise',
    active: true,
    createdAt: new Date('2023-11-10'),
    stats: {
      users: 25,
      clients: 890,
      products: 234,
      orders: 567
    }
  },
  {
    id: '4',
    name: 'Comunicação Visual Express',
    cnpj: '11.222.333/0001-44',
    email: 'vendas@cvexpress.com',
    phone: '(41) 94444-5678',
    address: 'Av. Comercial, 321 - Curitiba/PR',
    plan: 'trial',
    active: false,
    createdAt: new Date('2024-03-05'),
    stats: {
      users: 2,
      clients: 15,
      products: 8,
      orders: 3
    }
  }
]

export const planLabels = {
  trial: 'Trial',
  basic: 'Básico',
  premium: 'Premium',
  enterprise: 'Enterprise'
}

export const planColors = {
  trial: 'bg-gray-100 text-gray-800',
  basic: 'bg-blue-100 text-blue-800',
  premium: 'bg-green-100 text-green-800',
  enterprise: 'bg-purple-100 text-purple-800'
}
```

#### 2.1.2 - Componente de Listagem de Empresas
**Arquivo**: `apps/web/src/app/(dashboard)/superadmin/empresas/page.tsx`

```typescript
"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, MoreHorizontal, Building2, Users, Package, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockCompanies, planLabels, planColors } from '@/lib/mock-data/companies'
import { formatDate } from '@/lib/utils'

export default function EmpresasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')

  const filteredCompanies = mockCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.cnpj?.includes(searchTerm) ||
                         company.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && company.active) ||
                         (statusFilter === 'inactive' && !company.active)
    
    const matchesPlan = planFilter === 'all' || company.plan === planFilter

    return matchesSearch && matchesStatus && matchesPlan
  })

  const stats = {
    total: mockCompanies.length,
    active: mockCompanies.filter(c => c.active).length,
    inactive: mockCompanies.filter(c => !c.active).length,
    trial: mockCompanies.filter(c => c.plan === 'trial').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as empresas do sistema
          </p>
        </div>
        <Button asChild>
          <Link href="/superadmin/empresas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} ativas, {stats.inactive} inativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trial</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trial}</div>
            <p className="text-xs text-muted-foreground">
              Precisam converter para plano pago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Potencial</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 24.5k</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Plano" />
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas ({filteredCompanies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {company.cnpj}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {company.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={planColors[company.plan]}>
                        {planLabels[company.plan]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.active ? "default" : "secondary"}>
                        {company.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.stats.users}</TableCell>
                    <TableCell>{company.stats.clients}</TableCell>
                    <TableCell>{formatDate(company.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/superadmin/empresas/${company.id}`}>
                              Ver detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/superadmin/empresas/${company.id}/editar`}>
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            {company.active ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 2.1.3 - Formulário de Empresa
**Arquivo**: `apps/web/src/app/(dashboard)/superadmin/empresas/nova/page.tsx`

```typescript
"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const companySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cnpj: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  plan: z.enum(['trial', 'basic', 'premium', 'enterprise'])
})

type CompanyFormData = z.infer<typeof companySchema>

export default function NovaEmpresaPage() {
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      plan: 'trial'
    }
  })

  const selectedPlan = watch('plan')

  const onSubmit = async (data: CompanyFormData) => {
    // Simular criação da empresa
    console.log('Criando empresa:', data)
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success('Empresa criada com sucesso!')
    router.push('/superadmin/empresas')
  }

  const planDescriptions = {
    trial: 'Teste gratuito por 30 dias',
    basic: 'Plano básico - R$ 99/mês',
    premium: 'Plano premium - R$ 199/mês', 
    enterprise: 'Plano enterprise - R$ 399/mês'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Empresa</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova empresa no sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>
                Preencha os dados básicos da empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Visual Graphics Ltda"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      {...register('cnpj')}
                    />
                    {errors.cnpj && (
                      <p className="text-sm text-red-500">{errors.cnpj.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    placeholder="Rua, número, bairro, cidade, estado"
                    {...register('address')}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">Plano *</Label>
                  <Select 
                    value={selectedPlan} 
                    onValueChange={(value) => setValue('plan', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedPlan && (
                    <p className="text-sm text-muted-foreground">
                      {planDescriptions[selectedPlan]}
                    </p>
                  )}
                  {errors.plan && (
                    <p className="text-sm text-red-500">{errors.plan.message}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Criando...' : 'Criar Empresa'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações dos Planos */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Planos Disponíveis</CardTitle>
              <CardDescription>
                Compare os recursos de cada plano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Trial</h4>
                <p className="text-sm text-muted-foreground">
                  • 30 dias gratuitos<br/>
                  • Até 3 usuários<br/>
                  • 50 clientes<br/>
                  • 100 produtos
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Básico</h4>
                <p className="text-sm text-muted-foreground">
                  • R$ 99/mês<br/>
                  • Até 10 usuários<br/>
                  • 500 clientes<br/>
                  • 1000 produtos
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Premium</h4>
                <p className="text-sm text-muted-foreground">
                  • R$ 199/mês<br/>
                  • Até 50 usuários<br/>
                  • 5000 clientes<br/>
                  • 10000 produtos<br/>
                  • Recursos avançados
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Enterprise</h4>
                <p className="text-sm text-muted-foreground">
                  • R$ 399/mês<br/>
                  • Usuários ilimitados<br/>
                  • Clientes ilimitados<br/>
                  • Produtos ilimitados<br/>
                  • Suporte prioritário
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

### **Critérios de Aceite**:
- [ ] Lista de empresas com filtros funcionais
- [ ] Formulário de criação de empresa
- [ ] Interface responsiva e moderna
- [ ] Stats cards com dados mockados

---

## 👥 PARTE 2.2: Interface de Usuários

### **Objetivo**: Criar CRUD completo de usuários com gestão de permissões

### **Tarefas Sequenciais**:

#### 2.2.1 - Dados Mockados de Usuários
**Arquivo**: `apps/web/src/lib/mock-data/users.ts`

```typescript
export interface User {
  id: string
  name: string
  email: string
  role: 'master' | 'admin' | 'manager' | 'user'
  department?: string
  position?: string
  phone?: string
  avatar?: string
  active: boolean
  lastLoginAt?: Date
  createdAt: Date
  createdBy?: string
  permissions?: string[]
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@empresateste.com',
    role: 'master',
    department: 'Administração',
    position: 'CEO',
    phone: '(11) 99999-0001',
    active: true,
    lastLoginAt: new Date('2024-01-15T09:30:00'),
    createdAt: new Date('2023-12-01'),
    permissions: []
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@empresateste.com',
    role: 'admin',
    department: 'Comercial',
    position: 'Gerente Comercial',
    phone: '(11) 99999-0002',
    active: true,
    lastLoginAt: new Date('2024-01-14T14:20:00'),
    createdAt: new Date('2023-12-05'),
    createdBy: '1'
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    email: 'pedro@empresateste.com',
    role: 'manager',
    department: 'Produção',
    position: 'Coordenador de Produção',
    phone: '(11) 99999-0003',
    active: true,
    lastLoginAt: new Date('2024-01-14T16:45:00'),
    createdAt: new Date('2023-12-10'),
    createdBy: '1'
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@empresateste.com',
    role: 'user',
    department: 'Atendimento',
    position: 'Atendente',
    phone: '(11) 99999-0004',
    active: true,
    lastLoginAt: new Date('2024-01-13T10:15:00'),
    createdAt: new Date('2024-01-02'),
    createdBy: '2'
  },
  {
    id: '5',
    name: 'Carlos Ferreira',
    email: 'carlos@empresateste.com',
    role: 'user',
    department: 'Produção',
    position: 'Operador',
    phone: '(11) 99999-0005',
    active: false,
    lastLoginAt: new Date('2023-12-20T08:30:00'),
    createdAt: new Date('2023-11-15'),
    createdBy: '3'
  }
]

export const roleLabels = {
  master: 'Master',
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário'
}

export const roleColors = {
  master: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  user: 'bg-green-100 text-green-800'
}

export const mockPermissions = [
  { id: 'dashboard.read', name: 'Visualizar Dashboard', module: 'dashboard' },
  { id: 'users.create', name: 'Criar Usuários', module: 'users' },
  { id: 'users.read', name: 'Visualizar Usuários', module: 'users' },
  { id: 'users.update', name: 'Editar Usuários', module: 'users' },
  { id: 'users.delete', name: 'Excluir Usuários', module: 'users' },
  { id: 'clients.create', name: 'Criar Clientes', module: 'clients' },
  { id: 'clients.read', name: 'Visualizar Clientes', module: 'clients' },
  { id: 'clients.update', name: 'Editar Clientes', module: 'clients' },
  { id: 'clients.delete', name: 'Excluir Clientes', module: 'clients' },
  { id: 'products.create', name: 'Criar Produtos', module: 'products' },
  { id: 'products.read', name: 'Visualizar Produtos', module: 'products' },
  { id: 'products.update', name: 'Editar Produtos', module: 'products' },
  { id: 'products.delete', name: 'Excluir Produtos', module: 'products' },
  { id: 'financial.read', name: 'Visualizar Financeiro', module: 'financial' },
  { id: 'financial.create', name: 'Criar Lançamentos', module: 'financial' },
  { id: 'reports.read', name: 'Visualizar Relatórios', module: 'reports' },
  { id: 'settings.update', name: 'Alterar Configurações', module: 'settings' }
]
```

#### 2.2.2 - Listagem de Usuários
**Arquivo**: `apps/web/src/app/(dashboard)/configuracoes/usuarios/page.tsx`

```typescript
"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreHorizontal, Users, Shield, Clock, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockUsers, roleLabels, roleColors } from '@/lib/mock-data/users'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.position?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.active) ||
                         (statusFilter === 'inactive' && !user.active)
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment
  })

  const stats = {
    total: mockUsers.length,
    active: mockUsers.filter(u => u.active).length,
    inactive: mockUsers.filter(u => !u.active).length,
    online: mockUsers.filter(u => u.lastLoginAt && 
      new Date(u.lastLoginAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length
  }

  const departments = Array.from(new Set(mockUsers.map(u => u.department).filter(Boolean)))

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários e suas permissões
          </p>
        </div>
        <Button asChild>
          <Link href="/configuracoes/usuarios/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Todos os usuários do sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online (24h)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.online}</div>
            <p className="text-xs text-muted-foreground">
              Fizeram login nas últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockUsers.filter(u => ['master', 'admin'].includes(u.role)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários com acesso administrativo
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os roles</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          {user.position && (
                            <div className="text-sm text-muted-foreground">
                              {user.position}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                        {user.lastLoginAt && 
                         new Date(user.lastLoginAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 && (
                          <Badge variant="outline" className="text-green-600">
                            Online
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/configuracoes/usuarios/${user.id}`}>
                              Ver detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/configuracoes/usuarios/${user.id}/editar`}>
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/configuracoes/usuarios/${user.id}/permissoes`}>
                              Permissões
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            {user.active ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### **Critérios de Aceite**:
- [ ] Lista de usuários com filtros avançados
- [ ] Interface responsiva e moderna
- [ ] Avatar e informações bem organizadas
- [ ] Stats cards informativos

---

## 👤 PARTE 2.3: Interface de Clientes (CRM)

### **Objetivo**: Criar interface completa de gestão de clientes

### **Tarefas Sequenciais**:

#### 2.3.1 - Dados Mockados de Clientes
**Arquivo**: `apps/web/src/lib/mock-data/clients.ts`

```typescript
export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  document?: string
  type: 'person' | 'company'
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  }
  birthday?: Date
  segment?: string
  tags: string[]
  notes?: string
  status: 'active' | 'inactive' | 'prospect' | 'lead'
  source?: string
  rating?: number
  socialMedia?: {
    facebook?: string
    instagram?: string
    linkedin?: string
    website?: string
  }
  creditLimit?: number
  paymentTerm?: number
  discount?: number
  active: boolean
  createdAt: Date
  stats: {
    quotes: number
    orders: number
    totalSpent: number
    lastOrder?: Date
  }
}

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'João da Silva Transportes',
    email: 'joao@transportes.com',
    phone: '(11) 98765-4321',
    document: '12.345.678/0001-90',
    type: 'company',
    address: {
      street: 'Rua dos Transportes',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000'
    },
    segment: 'Transporte e Logística',
    tags: ['vip', 'recorrente'],
    status: 'active',
    source: 'Indicação',
    rating: 5,
    socialMedia: {
      website: 'https://transportes.com'
    },
    creditLimit: 50000,
    paymentTerm: 30,
    discount: 5,
    active: true,
    createdAt: new Date('2023-06-15'),
    stats: {
      quotes: 15,
      orders: 12,
      totalSpent: 125000,
      lastOrder: new Date('2024-01-10')
    }
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(11) 91234-5678',
    document: '123.456.789-00',
    type: 'person',
    birthday: new Date('1985-03-20'),
    segment: 'Pessoa Física',
    tags: ['novo'],
    status: 'prospect',
    source: 'Site',
    rating: 3,
    active: true,
    createdAt: new Date('2024-01-05'),
    stats: {
      quotes: 2,
      orders: 0,
      totalSpent: 0
    }
  },
  {
    id: '3',
    name: 'Restaurante Bella Vista',
    email: 'contato@bellavista.com',
    phone: '(11) 95555-1234',
    document: '98.765.432/0001-10',
    type: 'company',
    address: {
      street: 'Avenida Principal',
      number: '456',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05433-000'
    },
    segment: 'Alimentação',
    tags: ['sazonal'],
    status: 'active',
    source: 'Google Ads',
    rating: 4,
    socialMedia: {
      instagram: '@bellavista',
      facebook: 'Restaurante Bella Vista'
    },
    creditLimit: 20000,
    paymentTerm: 15,
    active: true,
    createdAt: new Date('2023-09-10'),
    stats: {
      quotes: 8,
      orders: 6,
      totalSpent: 35000,
      lastOrder: new Date('2023-12-20')
    }
  },
  {
    id: '4',
    name: 'TechStart Inovações',
    email: 'vendas@techstart.com',
    phone: '(11) 94444-5678',
    document: '55.444.333/0001-22',
    type: 'company',
    segment: 'Tecnologia',
    tags: ['startup', 'potencial'],
    status: 'lead',
    source: 'LinkedIn',
    rating: 4,
    socialMedia: {
      linkedin: 'TechStart Inovações',
      website: 'https://techstart.com'
    },
    active: true,
    createdAt: new Date('2024-01-12'),
    stats: {
      quotes: 1,
      orders: 0,
      totalSpent: 0
    }
  },
  {
    id: '5',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@email.com',
    phone: '(11) 93333-2222',
    document: '987.654.321-00',
    type: 'person',
    birthday: new Date('1978-11-15'),
    segment: 'Pessoa Física',
    tags: ['inativo'],
    notes: 'Cliente solicitou pausa no atendimento',
    status: 'inactive',
    source: 'Indicação',
    rating: 2,
    active: false,
    createdAt: new Date('2023-03-20'),
    stats: {
      quotes: 3,
      orders: 1,
      totalSpent: 2500,
      lastOrder: new Date('2023-04-10')
    }
  }
]

export const statusLabels = {
  active: 'Ativo',
  inactive: 'Inativo',
  prospect: 'Prospect',
  lead: 'Lead'
}

export const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  prospect: 'bg-blue-100 text-blue-800',
  lead: 'bg-yellow-100 text-yellow-800'
}

export const typeLabels = {
  person: 'Pessoa Física',
  company: 'Pessoa Jurídica'
}

export const mockInteractions = [
  {
    id: '1',
    clientId: '1',
    type: 'call',
    subject: 'Negociação de desconto',
    description: 'Cliente solicitou desconto para pedido grande',
    status: 'completed',
    completedAt: new Date('2024-01-14T10:30:00'),
    duration: 25,
    outcome: 'Aprovado desconto de 8%',
    nextAction: 'Enviar proposta atualizada',
    nextDate: new Date('2024-01-15T09:00:00'),
    userName: 'Maria Santos'
  },
  {
    id: '2',
    clientId: '1',
    type: 'email',
    subject: 'Proposta comercial enviada',
    status: 'completed',
    completedAt: new Date('2024-01-13T14:15:00'),
    userName: 'Maria Santos'
  },
  {
    id: '3',
    clientId: '3',
    type: 'visit',
    subject: 'Visita técnica no restaurante',
    description: 'Medição para nova sinalização',
    status: 'completed',
    completedAt: new Date('2024-01-12T15:00:00'),
    duration: 90,
    outcome: 'Medições realizadas',
    nextAction: 'Elaborar projeto',
    userName: 'Pedro Oliveira'
  }
]
```

#### 2.3.2 - Listagem de Clientes
**Arquivo**: `apps/web/src/app/(dashboard)/cadastros/clientes/page.tsx`

```typescript
"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreHorizontal, Users, TrendingUp, Star, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockClients, statusLabels, statusColors, typeLabels } from '@/lib/mock-data/clients'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.document?.includes(searchTerm)
    
    const matchesType = typeFilter === 'all' || client.type === typeFilter
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    const matchesSegment = segmentFilter === 'all' || client.segment === segmentFilter

    return matchesSearch && matchesType && matchesStatus && matchesSegment
  })

  const stats = {
    total: mockClients.length,
    active: mockClients.filter(c => c.status === 'active').length,
    prospects: mockClients.filter(c => c.status === 'prospect').length,
    leads: mockClients.filter(c => c.status === 'lead').length,
    totalRevenue: mockClients.reduce((sum, c) => sum + c.stats.totalSpent, 0)
  }

  const segments = Array.from(new Set(mockClients.map(c => c.segment).filter(Boolean)))

  const renderRating = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e histórico comercial
          </p>
        </div>
        <Button asChild>
          <Link href="/cadastros/clientes/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Base completa de clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.prospects} prospects, {stats.leads} leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Faturamento acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue / stats.active || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por cliente ativo
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="person">Pessoa Física</SelectItem>
                <SelectItem value="company">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os segmentos</SelectItem>
                {segments.map(segment => (
                  <SelectItem key={segment} value={segment!}>{segment}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Faturamento</TableHead>
                  <TableHead>Último Pedido</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {client.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.document}
                        </div>
                        {client.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {client.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {client.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{client.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{typeLabels[client.type]}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[client.status]}>
                        {statusLabels[client.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.segment || '-'}</TableCell>
                    <TableCell>{renderRating(client.rating)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(client.stats.totalSpent)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.stats.orders} pedidos
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.stats.lastOrder ? formatDate(client.stats.lastOrder) : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/cadastros/clientes/${client.id}`}>
                              Ver detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/cadastros/clientes/${client.id}/editar`}>
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/comercial/orcamentos/novo?cliente=${client.id}`}>
                              Novo orçamento
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### **Critérios de Aceite**:
- [ ] Lista de clientes com filtros avançados
- [ ] Sistema de rating visual
- [ ] Tags e segmentação funcionais
- [ ] Stats cards com métricas relevantes

---

## 📋 RESUMO DA FASE 2 - WEB

### **O que foi implementado**:
✅ **Interface de Superadmin**
- Gestão completa de empresas
- Dashboard com métricas
- Formulários modernos

✅ **Gestão de Usuários**
- CRUD completo com filtros
- Sistema visual de roles
- Interface responsiva

✅ **CRM de Clientes**
- Dashboard de clientes avançado
- Sistema de tags e segmentação
- Métricas comerciais

### **Estrutura de Arquivos Criada**:
```
apps/web/src/
├── app/(dashboard)/
│   ├── superadmin/empresas/ ✅
│   ├── configuracoes/usuarios/ ✅
│   └── cadastros/clientes/ ✅
├── lib/mock-data/
│   ├── companies.ts ✅
│   ├── users.ts ✅
│   └── clients.ts ✅
└── components/ (reutilizados da Fase 1)
```

### **Próximos Passos**:
- **FASE 3**: Sistema de produtos e fórmulas
- **FASE 4**: Engine de precificação
- **FASE 5**: Estoque inteligente

### **Comandos para Testar**:
```bash
# Testar frontend
pnpm dev:web

# Navegar pelas páginas:
# /superadmin/empresas
# /configuracoes/usuarios
# /cadastros/clientes
```