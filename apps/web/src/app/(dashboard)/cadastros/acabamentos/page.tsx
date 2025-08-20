"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Layers, Calculator, Package, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { ViewToggle } from '@/components/ui/view-toggle'
import { mockFinishes, getFinishesByType } from '@/lib/mock-data/finishes'

export default function AcabamentosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'simple' | 'composed'>('all')
  const [view, setView] = useState<'card' | 'table'>('card')
  
  const filteredFinishes = mockFinishes.filter(finish => {
    const matchesSearch = finish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         finish.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || finish.type === typeFilter
    return matchesSearch && matchesType && finish.active
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTypeInfo = (type: string) => {
    return type === 'simple' 
      ? { label: 'Simples', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
      : { label: 'Composto', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
  }

  const finishColumns = [
    {
      key: 'name',
      label: 'Nome',
      render: (value: string, item: any) => (
        <div>
          <div className="font-medium">{value}</div>
          {item.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">{item.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (value: string) => {
        const typeInfo = getTypeInfo(value)
        return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
      }
    },
    {
      key: 'baseCost',
      label: 'Custo Base',
      render: (value: number, item: any) => (
        <div className="text-red-600 font-medium">{formatCurrency(value)} / {item.unit}</div>
      )
    },
    {
      key: 'finalPrice',
      label: 'Preço Final',
      render: (value: number, item: any) => (
        <div className="text-green-600 font-medium">{formatCurrency(value)} / {item.unit}</div>
      )
    },
    {
      key: 'margin',
      label: 'Margem',
      render: (value: number) => (
        <div className="text-blue-600 font-medium">{value}x</div>
      )
    },
    {
      key: 'composition',
      label: 'Composição',
      render: (value: any, item: any) => {
        if (item.type === 'simple') return <span className="text-muted-foreground text-xs">-</span>
        if (!value) return <span className="text-muted-foreground text-xs">-</span>
        
        const materialsCount = value.materials?.length || 0
        const processesCount = value.processes?.length || 0
        
        return (
          <div className="text-xs">
            {materialsCount > 0 && <div>{materialsCount} materiais</div>}
            {processesCount > 0 && <div>{processesCount} processos</div>}
          </div>
        )
      }
    }
  ]

  const handleEdit = (finish: any) => {
    router.push(`/cadastros/acabamentos/${finish.id}/editar`)
  }

  const handleView = (finish: any) => {
    router.push(`/cadastros/acabamentos/${finish.id}`)
  }

  // Estatísticas
  const stats = {
    total: filteredFinishes.length,
    simple: filteredFinishes.filter(f => f.type === 'simple').length,
    composed: filteredFinishes.filter(f => f.type === 'composed').length,
    avgMargin: Math.round(filteredFinishes.reduce((sum, f) => sum + f.margin, 0) / filteredFinishes.length || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Acabamentos</h1>
          <p className="text-muted-foreground">
            Gerencie acabamentos simples e compostos
          </p>
        </div>
        <Button asChild>
          <Link href="/cadastros/acabamentos/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Acabamento
          </Link>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Simples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.simple}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compostos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.composed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margem Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.avgMargin}x</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar acabamentos por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="simple">Simples</SelectItem>
            <SelectItem value="composed">Composto</SelectItem>
          </SelectContent>
        </Select>
        
        <ViewToggle view={view} onViewChange={setView} />
      </div>
      
      {filteredFinishes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || typeFilter !== 'all'
              ? 'Nenhum acabamento encontrado com os filtros aplicados'
              : 'Nenhum acabamento cadastrado'
            }
          </div>
          <Button asChild variant="outline">
            <Link href="/cadastros/acabamentos/novo">
              Cadastrar primeiro acabamento
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{filteredFinishes.length} acabamentos encontrados</span>
          </div>
          
          {view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFinishes.map((finish) => (
              <Card key={finish.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {finish.name}
                      </CardTitle>
                      {finish.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {finish.description}
                        </p>
                      )}
                    </div>
                    <Badge className={getTypeInfo(finish.type).color}>
                      {getTypeInfo(finish.type).label}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 space-y-3">
                  {/* Preços */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Custo base:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(finish.baseCost)} / {finish.unit}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Preço final:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(finish.finalPrice)} / {finish.unit}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Margem:</span>
                      <span className="font-medium text-blue-600">
                        {finish.margin}x
                      </span>
                    </div>
                  </div>

                  {/* Composição */}
                  {finish.type === 'composed' && finish.composition && (
                    <div className="bg-muted/50 p-3 rounded text-sm">
                      <div className="font-medium text-muted-foreground mb-2">Composição:</div>
                      <div className="space-y-1">
                        {finish.composition.materials.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{finish.composition.materials.length} materiais</span>
                          </div>
                        )}
                        {finish.composition.processes.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            <span>{finish.composition.processes.length} processos</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {finish.tags && finish.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {finish.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {finish.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{finish.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <div className="p-6 pt-3">
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/cadastros/acabamentos/${finish.id}`}>
                        <Layers className="h-4 w-4 mr-1" />
                        Detalhes
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/cadastros/acabamentos/${finish.id}/editar`}>
                        <Calculator className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          ) : (
            <DataTable
              data={filteredFinishes}
              columns={finishColumns}
              onEdit={handleEdit}
              onView={handleView}
              emptyMessage="Nenhum acabamento encontrado"
            />
          )}
        </>
      )}
    </div>
  )
}