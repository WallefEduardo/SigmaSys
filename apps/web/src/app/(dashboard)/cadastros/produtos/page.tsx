"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Package, Calculator, Edit } from 'lucide-react'
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

// Mock data para produtos
interface Product {
  id: string
  name: string
  description?: string
  code?: string
  category?: string
  formula?: string
  margin: {
    markup: number
    liquidMargin: number
  }
  baseCost: number
  finalPrice: number
  active: boolean
  complexity: 'simple' | 'medium' | 'complex'
  tags: string[]
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Placa de Acrílico Personalizada',
    description: 'Placa de acrílico com impressão UV e corte personalizado',
    code: 'PRD-ACR-001',
    category: 'Placas',
    formula: 'largura * altura * 45.80 + perimetro * 12.50',
    margin: { markup: 2.5, liquidMargin: 60 },
    baseCost: 125.40,
    finalPrice: 313.50,
    active: true,
    complexity: 'medium',
    tags: ['acrílico', 'impressão', 'corte', 'personalizado']
  },
  {
    id: '2',
    name: 'Banner em Lona',
    description: 'Banner impresso em lona 440g com acabamento soldado',
    code: 'PRD-LON-001',
    category: 'Banners',
    formula: 'largura * altura * 8.90 + perimetro * 2.50',
    margin: { markup: 3.0, liquidMargin: 67 },
    baseCost: 89.50,
    finalPrice: 268.50,
    active: true,
    complexity: 'simple',
    tags: ['lona', 'banner', 'impressão', 'soldado']
  },
  {
    id: '3',
    name: 'Letreiro em Aço Inox',
    description: 'Letreiro corporativo em aço inox com LED',
    code: 'PRD-LET-001',
    category: 'Letreiros',
    formula: 'largura * altura * 150.00 + quantidade * 45.00',
    margin: { markup: 2.8, liquidMargin: 64 },
    baseCost: 420.00,
    finalPrice: 1176.00,
    active: true,
    complexity: 'complex',
    tags: ['aço', 'inox', 'led', 'corporativo']
  },
  {
    id: '4',
    name: 'Adesivo para Vitrine',
    description: 'Adesivo recortado para aplicação em vitrine',
    code: 'PRD-ADE-001',
    category: 'Adesivos',
    formula: 'area * 15.50 + max(largura, altura) * 5.00',
    margin: { markup: 3.5, liquidMargin: 71 },
    baseCost: 45.80,
    finalPrice: 160.30,
    active: true,
    complexity: 'simple',
    tags: ['adesivo', 'vitrine', 'recorte']
  },
  {
    id: '5',
    name: 'Estrutura para Outdoor',
    description: 'Estrutura metálica para outdoor com impressão',
    code: 'PRD-OUT-001',
    category: 'Outdoor',
    formula: 'largura * altura * 25.00 + volume * 180.00',
    margin: { markup: 2.2, liquidMargin: 55 },
    baseCost: 850.00,
    finalPrice: 1870.00,
    active: false,
    complexity: 'complex',
    tags: ['outdoor', 'estrutura', 'metálica']
  }
]

export default function ProdutosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [complexityFilter, setComplexityFilter] = useState('all')
  const [view, setView] = useState<'card' | 'table'>('card')
  
  const categories = [...new Set(mockProducts.map(p => p.category).filter(Boolean))]
  
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesComplexity = complexityFilter === 'all' || product.complexity === complexityFilter
    return matchesSearch && matchesCategory && matchesComplexity && product.active
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getComplexityColor = (complexity: string) => {
    const colors = {
      simple: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      complex: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    return colors[complexity as keyof typeof colors] || colors.simple
  }

  const getComplexityLabel = (complexity: string) => {
    const labels = {
      simple: 'Simples',
      medium: 'Médio',
      complex: 'Complexo'
    }
    return labels[complexity as keyof typeof labels] || 'Simples'
  }

  const productColumns = [
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
      key: 'complexity',
      label: 'Complexidade',
      render: (value: string) => (
        <Badge className={getComplexityColor(value)}>
          {getComplexityLabel(value)}
        </Badge>
      )
    },
    {
      key: 'baseCost',
      label: 'Custo Base',
      render: (value: number) => (
        <div className="text-red-600 font-medium">{formatCurrency(value)}</div>
      )
    },
    {
      key: 'finalPrice',
      label: 'Preço Final',
      render: (value: number) => (
        <div className="text-green-600 font-medium">{formatCurrency(value)}</div>
      )
    },
    {
      key: 'margin.liquidMargin',
      label: 'Margem',
      render: (value: number) => (
        <div className="text-blue-600 font-medium">{value}%</div>
      )
    },
    {
      key: 'formula',
      label: 'Fórmula',
      render: (value: string) => value ? (
        <div className="flex items-center gap-1">
          <Calculator className="h-3 w-3" />
          <span className="text-xs">Sim</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">Não</span>
      )
    }
  ]

  const handleEdit = (product: any) => {
    router.push(`/cadastros/produtos/${product.id}/editar`)
  }

  const handleView = (product: any) => {
    router.push(`/cadastros/produtos/${product.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie produtos, fórmulas e precificação
          </p>
        </div>
        <Button asChild>
          <Link href="/cadastros/produtos/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Link>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margem Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(filteredProducts.reduce((sum, p) => sum + p.margin.liquidMargin, 0) / filteredProducts.length || 0)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(filteredProducts.reduce((sum, p) => sum + p.finalPrice, 0) / filteredProducts.length || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com Fórmulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {filteredProducts.filter(p => p.formula).length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos por nome, código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
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
        
        <Select value={complexityFilter} onValueChange={setComplexityFilter}>
          <SelectTrigger className="w-full md:w-48">
            <Package className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Complexidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas complexidades</SelectItem>
            <SelectItem value="simple">Simples</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="complex">Complexo</SelectItem>
          </SelectContent>
        </Select>
        
        <ViewToggle view={view} onViewChange={setView} />
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchTerm || categoryFilter !== 'all' || complexityFilter !== 'all'
              ? 'Nenhum produto encontrado com os filtros aplicados'
              : 'Nenhum produto cadastrado'
            }
          </div>
          <Button asChild variant="outline">
            <Link href="/cadastros/produtos/novo">
              Cadastrar primeiro produto
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{filteredProducts.length} produtos encontrados</span>
          </div>
          
          {view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {product.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{product.code}</span>
                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={getComplexityColor(product.complexity)}>
                      {getComplexityLabel(product.complexity)}
                    </Badge>
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 space-y-3">
                  {/* Preços */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Custo base:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(product.baseCost)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Preço final:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(product.finalPrice)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Margem:</span>
                      <span className="font-medium text-blue-600">
                        {product.margin.liquidMargin}%
                      </span>
                    </div>
                  </div>

                  {/* Fórmula */}
                  {product.formula && (
                    <div className="bg-muted/50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Calculator className="h-3 w-3" />
                        <span className="text-xs font-medium text-muted-foreground">FÓRMULA</span>
                      </div>
                      <code className="text-xs font-mono break-all">
                        {product.formula}
                      </code>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {product.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <div className="p-6 pt-3">
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/cadastros/produtos/${product.id}`}>
                        <Package className="h-4 w-4 mr-1" />
                        Detalhes
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/cadastros/produtos/${product.id}/editar`}>
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
              data={filteredProducts}
              columns={productColumns}
              onEdit={handleEdit}
              onView={handleView}
              emptyMessage="Nenhum produto encontrado"
            />
          )}
        </>
      )}
    </div>
  )
}