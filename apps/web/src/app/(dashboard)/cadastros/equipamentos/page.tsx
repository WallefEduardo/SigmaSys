"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Settings, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EquipmentCard } from './components/equipment-card'
import { DataTable } from '@/components/ui/data-table'
import { ViewToggle } from '@/components/ui/view-toggle'
import { mockEquipments, getEquipmentTypes } from '@/lib/mock-data/equipments'

export default function EquipamentosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'printing' | 'machining'>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState<'card' | 'table'>('card')
  
  const equipmentTypes = getEquipmentTypes()
  const statusOptions = ['available', 'maintenance', 'in_use', 'broken']
  
  const filteredEquipments = mockEquipments.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || equipment.type === typeFilter
    const matchesStatus = statusFilter === 'all' || equipment.status === statusFilter
    return matchesSearch && matchesType && matchesStatus && equipment.active
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      available: { variant: 'default' as const, label: 'Disponível' },
      maintenance: { variant: 'secondary' as const, label: 'Manutenção' },
      in_use: { variant: 'destructive' as const, label: 'Em Uso' },
      broken: { variant: 'destructive' as const, label: 'Quebrado' }
    }
    return variants[status as keyof typeof variants] || variants.available
  }

  const equipmentColumns = [
    {
      key: 'name',
      label: 'Nome',
      render: (value: string, item: any) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{item.code}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (value: string) => (
        <Badge className={value === 'printing' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
          {value === 'printing' ? 'Impressão' : 'Usinagem'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const statusInfo = getStatusBadge(value)
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      }
    },
    {
      key: 'costPerHour',
      label: 'Custo/Hora',
      render: (value: number) => (
        <div className="text-green-600 font-medium">{formatCurrency(value)}</div>
      )
    },
    {
      key: 'manufacturer',
      label: 'Fabricante',
      render: (value: string) => value || '-'
    },
    {
      key: 'location',
      label: 'Localização',
      render: (value: string) => value || '-'
    }
  ]

  const handleEdit = (equipment: any) => {
    router.push(`/cadastros/equipamentos/${equipment.id}/editar`)
  }

  const handleView = (equipment: any) => {
    router.push(`/cadastros/equipamentos/${equipment.id}`)
  }

  const statusCounts = {
    total: filteredEquipments.length,
    available: filteredEquipments.filter(e => e.status === 'available').length,
    maintenance: filteredEquipments.filter(e => e.status === 'maintenance').length,
    in_use: filteredEquipments.filter(e => e.status === 'in_use').length,
    broken: filteredEquipments.filter(e => e.status === 'broken').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie máquinas, impressoras e equipamentos
          </p>
        </div>
        <Button asChild>
          <Link href="/cadastros/equipamentos/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Link>
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-2xl font-bold">{statusCounts.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{statusCounts.available}</div>
          <div className="text-sm text-green-600">Disponível</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{statusCounts.in_use}</div>
          <div className="text-sm text-blue-600">Em Uso</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.maintenance}</div>
          <div className="text-sm text-yellow-600">Manutenção</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{statusCounts.broken}</div>
          <div className="text-sm text-red-600">Quebrado</div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipamentos por nome, código ou fabricante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
          <SelectTrigger className="w-full md:w-48">
            <Settings className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="printing">Impressão</SelectItem>
            <SelectItem value="machining">Usinagem</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {statusOptions.map(status => {
              const statusInfo = getStatusBadge(status)
              return (
                <SelectItem key={status} value={status}>
                  {statusInfo.label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        
        <ViewToggle view={view} onViewChange={setView} />
      </div>
      
      {filteredEquipments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Nenhum equipamento encontrado com os filtros aplicados'
              : 'Nenhum equipamento cadastrado'
            }
          </div>
          <Button asChild variant="outline">
            <Link href="/cadastros/equipamentos/novo">
              Cadastrar primeiro equipamento
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{filteredEquipments.length} equipamentos encontrados</span>
          </div>
          
          {view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipments.map((equipment) => (
                <EquipmentCard key={equipment.id} equipment={equipment} />
              ))}
            </div>
          ) : (
            <DataTable
              data={filteredEquipments}
              columns={equipmentColumns}
              onEdit={handleEdit}
              onView={handleView}
              emptyMessage="Nenhum equipamento encontrado"
            />
          )}
        </>
      )}
    </div>
  )
}