# FASE 4 WEB - ENGINE DE PRECIFICAÇÃO (Frontend)

## 🎯 OBJETIVO

Desenvolver interfaces frontend para o sistema de precificação, incluindo calculadora interativa, configuração de parâmetros, visualização de custos e relatórios gráficos.

## 📋 ESTRATÉGIA DE DESENVOLVIMENTO

### Abordagem
1. **Mock Data First**: Interfaces com dados simulados
2. **Componentes Reutilizáveis**: Sistema de calculadoras modulares
3. **Tempo Real**: Cálculos instantâneos conforme usuário digita
4. **Visualização Rica**: Gráficos e dashboards interativos

### Arquitetura Frontend
```
apps/web/src/app/(dashboard)/
├── cadastros/produtos/
│   └── components/
│       ├── pricing-calculator.tsx    # Calculadora principal
│       ├── cost-breakdown.tsx        # Detalhamento visual
│       ├── margin-configurator.tsx   # Config de margens
│       └── formula-tester.tsx        # Testador de fórmulas
├── configuracoes/
│   └── parametros/
│       ├── page.tsx                  # Lista de parâmetros
│       ├── [id]/page.tsx            # Edição de parâmetros
│       └── components/
│           ├── parameter-form.tsx    # Formulário de parâmetros
│           ├── impact-analyzer.tsx   # Análise de impacto
│           └── auto-update.tsx       # Configuração automática
└── relatorios/
    └── precificacao/
        ├── page.tsx                  # Dashboard de precificação
        └── components/
            ├── pricing-charts.tsx    # Gráficos de preços
            ├── margin-analysis.tsx   # Análise de margens
            └── sensitivity-chart.tsx # Análise de sensibilidade
```

## 🛠️ COMPONENTES PRINCIPAIS

### **1. Calculadora de Precificação**

```typescript
// cadastros/produtos/components/pricing-calculator.tsx
"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Calculator, Refresh } from 'lucide-react'
import { CostBreakdown } from './cost-breakdown'
import { MarginConfigurator } from './margin-configurator'
import { api } from '@/lib/trpc'

interface PricingCalculatorProps {
  productId: string
  onPriceCalculated?: (breakdown: CostBreakdown) => void
}

export function PricingCalculator({ productId, onPriceCalculated }: PricingCalculatorProps) {
  const [variables, setVariables] = useState({
    largura: 1,
    altura: 1,
    quantidade: 1,
    espessura: 1
  })
  
  const [isCalculating, setIsCalculating] = useState(false)
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null)
  
  // Hook para cálculo de preço
  const calculatePrice = api.pricing.calculate.useMutation({
    onSuccess: (data) => {
      setBreakdown(data)
      onPriceCalculated?.(data)
      setIsCalculating(false)
    },
    onError: (error) => {
      console.error('Erro no cálculo:', error)
      setIsCalculating(false)
    }
  })
  
  // Recalcular automaticamente quando variáveis mudam
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (Object.values(variables).every(v => v > 0)) {
        handleCalculate()
      }
    }, 500) // Debounce de 500ms
    
    return () => clearTimeout(debounceTimer)
  }, [variables])
  
  const handleCalculate = () => {
    setIsCalculating(true)
    calculatePrice.mutate({
      productId,
      variables
    })
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  return (
    <div className="space-y-6">
      {/* Entrada de Variáveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Preços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Largura (m)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={variables.largura}
                onChange={(e) => setVariables(prev => ({
                  ...prev,
                  largura: Number(e.target.value)
                }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Altura (m)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={variables.altura}
                onChange={(e) => setVariables(prev => ({
                  ...prev,
                  altura: Number(e.target.value)
                }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                min="1"
                value={variables.quantidade}
                onChange={(e) => setVariables(prev => ({
                  ...prev,
                  quantidade: Number(e.target.value)
                }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Espessura (mm)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={variables.espessura}
                onChange={(e) => setVariables(prev => ({
                  ...prev,
                  espessura: Number(e.target.value)
                }))}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <Button 
              onClick={handleCalculate}
              disabled={isCalculating}
              className="flex items-center gap-2"
            >
              {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Refresh className="h-4 w-4" />
              )}
              Recalcular
            </Button>
            
            {breakdown && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Preço Final</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(breakdown.finalPrice)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Detalhamento de Custos */}
      {breakdown && (
        <CostBreakdown 
          breakdown={breakdown}
          variables={variables}
        />
      )}
    </div>
  )
}
```

### **2. Detalhamento Visual de Custos**

```typescript
// cadastros/produtos/components/cost-breakdown.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Settings, 
  Wrench, 
  Sparkles, 
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

interface CostBreakdownProps {
  breakdown: CostBreakdown
  variables: Record<string, number>
}

export function CostBreakdown({ breakdown, variables }: CostBreakdownProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1) + '%'
  }
  
  // Dados para gráfico de pizza
  const pieData = [
    { name: 'Materiais', value: breakdown.materials.reduce((sum, item) => sum + item.totalCost, 0), color: '#16a34a' },
    { name: 'Equipamentos', value: breakdown.equipment.reduce((sum, item) => sum + item.totalCost, 0), color: '#3b82f6' },
    { name: 'Processos', value: breakdown.processes.reduce((sum, item) => sum + item.totalCost, 0), color: '#a855f7' },
    { name: 'Acabamentos', value: breakdown.finishes.reduce((sum, item) => sum + item.totalCost, 0), color: '#f59e0b' },
    { name: 'Custos Fixos', value: breakdown.fixedCosts, color: '#ef4444' },
    { name: 'Custos Variáveis', value: breakdown.variableCosts, color: '#f97316' },
    { name: 'Margem', value: breakdown.margin.value, color: '#10b981' }
  ].filter(item => item.value > 0)
  
  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(breakdown.directCosts)}
              </div>
              <div className="text-sm text-muted-foreground">Custos Diretos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(breakdown.fixedCosts + breakdown.variableCosts)}
              </div>
              <div className="text-sm text-muted-foreground">Custos Indiretos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(breakdown.margin.value)}
              </div>
              <div className="text-sm text-muted-foreground">
                Margem ({breakdown.margin.percentage.toFixed(1)}%)
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(breakdown.finalPrice)}
              </div>
              <div className="text-sm text-muted-foreground">Preço Final</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Gráfico de Composição */}
      <Card>
        <CardHeader>
          <CardTitle>Composição de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Detalhamento por Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Materiais */}
        {breakdown.materials.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Materiais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {breakdown.materials.map((material, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {material.quantity} {material.unit} × {formatCurrency(material.unitCost)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(material.totalCost)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercentage(material.totalCost, breakdown.finalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Equipamentos */}
        {breakdown.equipment.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Equipamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {breakdown.equipment.map((equipment, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{equipment.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {equipment.timeNeeded}h × {formatCurrency(equipment.costPerHour)}/h
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(equipment.totalCost)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercentage(equipment.totalCost, breakdown.finalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Processos */}
        {breakdown.processes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-purple-600" />
                Processos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {breakdown.processes.map((process, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{process.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {process.timeNeeded} {process.unit} × {formatCurrency(process.costPerHour)}
                        {process.sector && (
                          <Badge variant="outline" className="ml-2">{process.sector}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(process.totalCost)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercentage(process.totalCost, breakdown.finalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Acabamentos */}
        {breakdown.finishes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Acabamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {breakdown.finishes.map((finish, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{finish.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {finish.quantity} × {formatCurrency(finish.unitCost)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(finish.totalCost)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercentage(finish.totalCost, breakdown.finalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Calculado em:</div>
              <div className="text-muted-foreground">
                {new Date(breakdown.calculatedAt).toLocaleString('pt-BR')}
              </div>
            </div>
            
            <div>
              <div className="font-medium">Área Total:</div>
              <div className="text-muted-foreground">
                {(variables.largura * variables.altura).toFixed(2)} m²
              </div>
            </div>
            
            <div>
              <div className="font-medium">Perímetro:</div>
              <div className="text-muted-foreground">
                {(2 * (variables.largura + variables.altura)).toFixed(2)} ml
              </div>
            </div>
            
            <div>
              <div className="font-medium">Tipo de Margem:</div>
              <div className="text-muted-foreground capitalize">
                {breakdown.margin.type}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### **3. Configurador de Margens**

```typescript
// cadastros/produtos/components/margin-configurator.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingUp } from 'lucide-react'

interface MarginConfig {
  type: 'markup' | 'liquid' | 'final'
  percentage?: number
  value?: number
}

interface MarginConfiguratorProps {
  margin: MarginConfig
  baseCost: number
  onChange: (margin: MarginConfig) => void
}

export function MarginConfigurator({ margin, baseCost, onChange }: MarginConfiguratorProps) {
  const [localMargin, setLocalMargin] = useState(margin)
  
  const handleTypeChange = (type: 'markup' | 'liquid' | 'final') => {
    const newMargin = { ...localMargin, type }
    setLocalMargin(newMargin)
    onChange(newMargin)
  }
  
  const handleValueChange = (field: 'percentage' | 'value', value: number) => {
    const newMargin = { ...localMargin, [field]: value }
    setLocalMargin(newMargin)
    onChange(newMargin)
  }
  
  const calculateFinalPrice = () => {
    switch (localMargin.type) {
      case 'markup':
        return baseCost * (1 + (localMargin.percentage || 0) / 100)
      case 'liquid':
        return baseCost / (1 - (localMargin.percentage || 0) / 100)
      case 'final':
        return localMargin.value || baseCost
      default:
        return baseCost
    }
  }
  
  const calculateMarginValue = () => {
    const finalPrice = calculateFinalPrice()
    return finalPrice - baseCost
  }
  
  const calculateMarginPercentage = () => {
    const finalPrice = calculateFinalPrice()
    return ((finalPrice - baseCost) / baseCost) * 100
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Configuração de Margem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Margem */}
        <div>
          <Label>Tipo de Margem</Label>
          <Select value={localMargin.type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markup">Mark-up (%)</SelectItem>
              <SelectItem value="liquid">Margem Líquida (%)</SelectItem>
              <SelectItem value="final">Preço Final (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Configuração por Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(localMargin.type === 'markup' || localMargin.type === 'liquid') && (
            <div>
              <Label>
                {localMargin.type === 'markup' ? 'Mark-up (%)' : 'Margem Líquida (%)'}
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={localMargin.percentage || 0}
                onChange={(e) => handleValueChange('percentage', Number(e.target.value))}
              />
            </div>
          )}
          
          {localMargin.type === 'final' && (
            <div>
              <Label>Preço Final (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={baseCost}
                value={localMargin.value || baseCost}
                onChange={(e) => handleValueChange('value', Number(e.target.value))}
              />
            </div>
          )}
          
          <div>
            <Label>Custo Base</Label>
            <Input
              value={formatCurrency(baseCost)}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
        
        {/* Resultados */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {formatCurrency(calculateMarginValue())}
              </div>
              <div className="text-sm text-muted-foreground">Valor da Margem</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {calculateMarginPercentage().toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">% sobre Custo</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(calculateFinalPrice())}
              </div>
              <div className="text-sm text-muted-foreground">Preço Final</div>
            </div>
          </div>
        </div>
        
        {/* Explicações */}
        <div className="bg-muted p-4 rounded-lg text-sm">
          {localMargin.type === 'markup' && (
            <div>
              <strong>Mark-up:</strong> Percentual adicionado sobre o custo base.
              <br />
              Fórmula: Preço Final = Custo × (1 + Mark-up%)
            </div>
          )}
          
          {localMargin.type === 'liquid' && (
            <div>
              <strong>Margem Líquida:</strong> Percentual que a margem representa sobre o preço final.
              <br />
              Fórmula: Preço Final = Custo ÷ (1 - Margem%)
            </div>
          )}
          
          {localMargin.type === 'final' && (
            <div>
              <strong>Preço Final:</strong> Valor fixo do preço de venda.
              <br />
              Margem = Preço Final - Custo Base
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### **4. Gestão de Parâmetros**

```typescript
// configuracoes/parametros/page.tsx
"use client"

import { useState } from 'react'
import { Plus, TrendingUp, AlertTriangle, Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { ParameterForm } from './components/parameter-form'
import { ImpactAnalyzer } from './components/impact-analyzer'
import { api } from '@/lib/trpc'

export default function ParametrosPage() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedParameter, setSelectedParameter] = useState(null)
  
  // Mock data para desenvolvimento
  const mockParameters = [
    {
      id: '1',
      name: 'fixedCostsRate',
      description: 'Taxa de custos fixos sobre custos diretos',
      value: 0.15,
      type: 'automatic',
      category: 'fixed_costs',
      unit: 'percentage',
      active: true,
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      autoUpdate: true,
      creator: { name: 'Sistema' },
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'defaultMarkup',
      description: 'Mark-up padrão para produtos',
      value: 100,
      type: 'manual',
      category: 'margins',
      unit: 'percentage',
      active: true,
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      autoUpdate: false,
      creator: { name: 'Admin' },
      updatedAt: new Date()
    }
  ]
  
  const columns = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.description}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'value',
      header: 'Valor',
      cell: ({ row }) => {
        const value = row.original.value
        const unit = row.original.unit
        
        if (unit === 'percentage') {
          return `${(value * 100).toFixed(1)}%`
        } else if (unit === 'currency') {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value)
        }
        return value
      }
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={row.original.type === 'automatic' ? 'default' : 'secondary'}>
          {row.original.type === 'automatic' ? 'Automático' : 'Manual'}
        </Badge>
      )
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => {
        const categoryMap = {
          fixed_costs: 'Custos Fixos',
          variable_costs: 'Custos Variáveis',
          margins: 'Margens',
          productivity: 'Produtividade'
        }
        return categoryMap[row.original.category] || row.original.category
      }
    },
    {
      accessorKey: 'updatedAt',
      header: 'Atualizado',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.updatedAt.toLocaleDateString('pt-BR')}
          <div className="text-muted-foreground">
            por {row.original.creator.name}
          </div>
        </div>
      )
    }
  ]
  
  const filteredParameters = mockParameters.filter(param => 
    categoryFilter === 'all' || param.category === categoryFilter
  )
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parâmetros do Sistema</h1>
          <p className="text-muted-foreground">
            Configure parâmetros que afetam os cálculos de precificação
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Automáticos
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Parâmetro
          </Button>
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Parâmetros
                </p>
                <p className="text-2xl font-bold">{mockParameters.length}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Automáticos
                </p>
                <p className="text-2xl font-bold">
                  {mockParameters.filter(p => p.type === 'automatic').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Custos Fixos
                </p>
                <p className="text-2xl font-bold">15%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Mark-up Médio
                </p>
                <p className="text-2xl font-bold">100%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="fixed_costs">Custos Fixos</SelectItem>
            <SelectItem value="variable_costs">Custos Variáveis</SelectItem>
            <SelectItem value="margins">Margens</SelectItem>
            <SelectItem value="productivity">Produtividade</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Tabela */}
      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredParameters}
            searchableColumns={['name', 'description']}
          />
        </CardContent>
      </Card>
      
      {/* Formulário Modal */}
      {showForm && (
        <ParameterForm
          parameter={selectedParameter}
          onClose={() => {
            setShowForm(false)
            setSelectedParameter(null)
          }}
          onSave={(parameter) => {
            // Implementar salvamento
            setShowForm(false)
            setSelectedParameter(null)
          }}
        />
      )}
    </div>
  )
}
```

## 📊 MOCK DATA

```typescript
// src/lib/mock-data/pricing.ts
export const mockPricingData = {
  breakdown: {
    materials: [
      {
        id: '1',
        name: 'Vinil Adesivo Branco',
        quantity: 3.3,
        unit: 'm²',
        unitCost: 12.50,
        totalCost: 41.25,
        formula: 'largura * altura * 1.1'
      }
    ],
    equipment: [
      {
        id: '1',
        name: 'Impressora Roland VS-640',
        timeNeeded: 0.48,
        unit: 'hora',
        costPerHour: 25.00,
        totalCost: 12.00,
        formula: '(largura * altura) / 6.2'
      }
    ],
    processes: [
      {
        id: '1',
        name: 'Impressão Digital',
        timeNeeded: 3.0,
        unit: 'm²',
        costPerHour: 20.00,
        totalCost: 60.00,
        formula: 'largura * altura',
        sector: 'Impressão'
      }
    ],
    finishes: [],
    directCosts: 113.25,
    fixedCosts: 16.99,
    variableCosts: 9.06,
    subtotal: 139.30,
    margin: {
      type: 'markup',
      percentage: 100,
      value: 139.30
    },
    finalPrice: 278.60,
    calculatedAt: new Date(),
    parameters: {
      fixedCostsRate: 0.15,
      variableCostsRate: 0.08
    }
  }
}
```

## 🧪 ESTRATÉGIA DE TESTES

### Testes de Componentes
```typescript
// __tests__/components/pricing-calculator.test.tsx
describe('PricingCalculator', () => {
  it('should calculate price when variables change', async () => {
    const onPriceCalculated = jest.fn()
    
    render(
      <PricingCalculator 
        productId="test-product" 
        onPriceCalculated={onPriceCalculated}
      />
    )
    
    const widthInput = screen.getByLabelText(/largura/i)
    fireEvent.change(widthInput, { target: { value: '2' } })
    
    await waitFor(() => {
      expect(onPriceCalculated).toHaveBeenCalled()
    })
  })
  
  it('should display cost breakdown correctly', () => {
    render(<CostBreakdown breakdown={mockBreakdown} variables={mockVariables} />)
    
    expect(screen.getByText('R$ 278,60')).toBeInTheDocument()
    expect(screen.getByText('Vinil Adesivo Branco')).toBeInTheDocument()
  })
})
```

## 📋 CRITÉRIOS DE ACEITE

### Funcionais
- [ ] Calculadora em tempo real funcional
- [ ] Visualização gráfica de custos
- [ ] Configuração de margens implementada
- [ ] Gestão de parâmetros operacional
- [ ] Relatórios visuais criados

### Técnicos
- [ ] Performance < 1s para cálculos
- [ ] Responsividade mobile completa
- [ ] Gráficos interativos funcionais
- [ ] Validações em tempo real
- [ ] Integração com tRPC

### UX/UI
- [ ] Interface intuitiva
- [ ] Feedback visual adequado
- [ ] Gráficos legíveis
- [ ] Animações suaves
- [ ] Estados de loading/error

---

**IMPORTANTE**: O foco está na experiência visual rica e na facilidade de uso. O sistema deve permitir ao usuário compreender facilmente a composição de custos e ajustar parâmetros com confiança.