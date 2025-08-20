"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Package, Edit } from 'lucide-react'
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
import { MaterialCard } from './components/material-card'
import { DataTable } from '@/components/ui/data-table'
import { ViewToggle } from '@/components/ui/view-toggle'
import { mockMaterials, getMaterialCategories } from '@/lib/mock-data/materials'

export default function MateriasPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [view, setView] = useState<'card' | 'table'>('card')
  
  const categories = getMaterialCategories()
  
  const filteredMaterials = mockMaterials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter
    return matchesSearch && matchesCategory && material.active
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const materialColumns = [
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
      key: 'category',
      label: 'Categoria',
      render: (value: string) => value ? (
        <Badge variant="outline">{value}</Badge>
      ) : '-'
    },
    {
      key: 'cost',
      label: 'Custo',
      render: (value: number, item: any) => (
        <div className="text-green-600 font-medium">
          {formatCurrency(value)} / {item.unit}
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Estoque',
      render: (value: number, item: any) => {
        if (!value && value !== 0) return '-'
        const status = !item.minStock ? 'normal' : 
                      value <= item.minStock ? 'low' : 
                      (item.maxStock && value >= item.maxStock) ? 'high' : 'normal'
        const badgeVariant = status === 'low' ? 'destructive' : status === 'high' ? 'secondary' : 'default'
        
        return (
          <div className="flex items-center gap-2">
            <span>{value} {item.unit}</span>
            <Badge variant={badgeVariant} className="text-xs">
              {status === 'low' ? 'Baixo' : status === 'high' ? 'Alto' : 'OK'}
            </Badge>
          </div>
        )
      }
    },
    {
      key: 'supplier',
      label: 'Fornecedor',
      render: (value: string) => value || '-'
    }
  ]

  const handleEdit = (material: any) => {
    router.push(`/cadastros/materias-primas/${material.id}/editar`)
  }

  const handleView = (material: any) => {
    router.push(`/cadastros/materias-primas/${material.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Matérias-Primas</h1>
          <p className="text-muted-foreground">
            Gerencie materiais, preços e estoque
          </p>
        </div>
        <Button asChild>
          <Link href="/cadastros/materias-primas/novo">
            <Plus className="h-4 w-4 mr-2" />
            Nova Matéria-Prima
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais por nome, código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <ViewToggle view={view} onViewChange={setView} />
      </div>
      
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Nenhum material encontrado com os filtros aplicados'
              : 'Nenhuma matéria-prima cadastrada'
            }
          </div>
          <Button asChild variant="outline">
            <Link href="/cadastros/materias-primas/novo">
              Cadastrar primeira matéria-prima
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{filteredMaterials.length} materiais encontrados</span>
          </div>
          
          {view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          ) : (
            <DataTable
              data={filteredMaterials}
              columns={materialColumns}
              onEdit={handleEdit}
              onView={handleView}
              emptyMessage="Nenhum material encontrado"
            />
          )}
        </>
      )}
    </div>
  )
}