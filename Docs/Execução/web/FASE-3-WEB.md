# FASE 3 WEB - SISTEMA DE PRODUTOS E FÓRMULAS (Frontend)

## 🎯 OBJETIVO

Desenvolver interfaces frontend para o sistema de produtos e fórmulas, começando com dados mockados para desenvolvimento visual e posteriormente integrando com as APIs reais do backend.

## 📋 ESTRUTURA DE DESENVOLVIMENTO

### Estratégia de Dados
1. **Primeira etapa**: Dados mockados para desenvolvimento visual
2. **Segunda etapa**: Integração com APIs reais
3. **Terceira etapa**: Otimizações e ajustes finais

### Arquitetura Frontend
```
apps/web/src/app/(dashboard)/cadastros/
├── materias-primas/
│   ├── page.tsx                 # Lista de materiais
│   ├── novo/page.tsx           # Formulário de criação
│   ├── [id]/page.tsx           # Detalhes/edição
│   └── components/
│       ├── material-form.tsx   # Formulário reutilizável
│       ├── material-list.tsx   # Lista com filtros
│       ├── price-history.tsx   # Histórico de preços
│       └── material-card.tsx   # Card individual
├── equipamentos/
│   ├── page.tsx
│   ├── novo/page.tsx
│   ├── [id]/page.tsx
│   └── components/
│       ├── equipment-form.tsx
│       ├── equipment-list.tsx
│       ├── maintenance-schedule.tsx
│       └── equipment-config.tsx
├── processos/
│   ├── page.tsx
│   ├── novo/page.tsx
│   ├── [id]/page.tsx
│   └── components/
├── acabamentos/
│   ├── page.tsx
│   ├── novo/page.tsx
│   ├── [id]/page.tsx
│   └── components/
│       ├── finish-composer.tsx  # Composição de acabamentos
│       └── cost-calculator.tsx  # Calculadora de custos
└── produtos/
    ├── page.tsx
    ├── novo/page.tsx
    ├── [id]/page.tsx
    └── components/
        ├── product-form.tsx
        ├── formula-builder.tsx   # Construtor de fórmulas
        ├── checklist-builder.tsx # Construtor de checklist
        └── cost-breakdown.tsx    # Composição de custos
```

## 🛠️ ETAPAS DE IMPLEMENTAÇÃO

### **Etapa 3.1: Engine de Fórmulas (Frontend)**

#### Componentes a Desenvolver
1. **FormulaBuilder** (`src/components/forms/formula-builder.tsx`)
```typescript
interface FormulaBuilderProps {
  value: string
  onChange: (formula: string) => void
  variables: string[]
  onValidate: (formula: string) => Promise<ValidationResult>
}
```

2. **FormulaPreview** (`src/components/forms/formula-preview.tsx`)
```typescript
interface FormulaPreviewProps {
  formula: string
  context: Record<string, number>
  targetUnit?: string
}
```

3. **UnitsSelector** (`src/components/forms/units-selector.tsx`)
```typescript
interface UnitsSelectorProps {
  category?: 'area' | 'length' | 'volume' | 'weight' | 'quantity' | 'time'
  value: string
  onChange: (unit: string) => void
}
```

#### Mock Data - Unidades
```typescript
// src/lib/mock-data/units.ts
export const mockUnits = [
  // Area
  { id: 'm2', name: 'Metro Quadrado', symbol: 'm²', category: 'area' },
  { id: 'cm2', name: 'Centímetro Quadrado', symbol: 'cm²', category: 'area' },
  // Length
  { id: 'ml', name: 'Metro Linear', symbol: 'ml', category: 'length' },
  { id: 'cm', name: 'Centímetro', symbol: 'cm', category: 'length' },
  { id: 'mm', name: 'Milímetro', symbol: 'mm', category: 'length' },
  // Volume
  { id: 'litro', name: 'Litro', symbol: 'L', category: 'volume' },
  { id: 'ml_vol', name: 'Mililitro', symbol: 'ml', category: 'volume' },
  // Weight
  { id: 'kg', name: 'Quilograma', symbol: 'kg', category: 'weight' },
  { id: 'g', name: 'Grama', symbol: 'g', category: 'weight' },
  // Quantity
  { id: 'un', name: 'Unidade', symbol: 'un', category: 'quantity' },
  { id: 'par', name: 'Par', symbol: 'par', category: 'quantity' },
  // Time
  { id: 'hora', name: 'Hora', symbol: 'h', category: 'time' },
  { id: 'minuto', name: 'Minuto', symbol: 'min', category: 'time' }
]
```

### **Etapa 3.2: Matérias-Primas (Frontend)**

#### Tela de Lista (`cadastros/materias-primas/page.tsx`)
```typescript
"use client"

import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MaterialCard } from './components/material-card'
import { mockMaterials } from '@/lib/mock-data/materials'

export default function MateriasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  const filteredMaterials = mockMaterials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter
    return matchesSearch && matchesCategory && material.active
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Matérias-Primas</h1>
        <Button asChild>
          <Link href="/cadastros/materias-primas/novo">
            <Plus className="h-4 w-4 mr-2" />
            Nova Matéria-Prima
          </Link>
        </Button>
      </div>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="Vinil">Vinil</SelectItem>
            <SelectItem value="Acrílico">Acrílico</SelectItem>
            <SelectItem value="Tinta">Tinta</SelectItem>
            <SelectItem value="Fixação">Fixação</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
          <MaterialCard key={material.id} material={material} />
        ))}
      </div>
    </div>
  )
}
```

#### Mock Data - Materiais
```typescript
// src/lib/mock-data/materials.ts
export const mockMaterials = [
  {
    id: '1',
    name: 'Vinil Adesivo Branco',
    description: 'Vinil adesivo branco para impressão digital',
    code: 'VIN-001',
    unit: 'm2',
    cost: 12.50,
    category: 'Vinil',
    brand: 'Avery Dennison',
    color: 'Branco',
    dimensions: { width: 1.37, thickness: 0.1 },
    tags: ['adesivo', 'vinil', 'impressão'],
    supplier: 'Materiais Gráficos LTDA',
    supplierCode: 'AVE-WHT-137',
    minStock: 100,
    maxStock: 500,
    location: 'Estoque A - Prateleira 1',
    active: true,
    priceHistory: [
      { date: '2024-01-01', cost: 11.80 },
      { date: '2024-02-01', cost: 12.10 },
      { date: '2024-03-01', cost: 12.50 }
    ]
  },
  {
    id: '2',
    name: 'Acrílico Cristal 3mm',
    description: 'Placa de acrílico cristal transparente 3mm',
    code: 'ACR-003',
    unit: 'm2',
    cost: 45.80,
    category: 'Acrílico',
    brand: 'Acrigel',
    color: 'Cristal',
    dimensions: { width: 2.0, height: 3.0, thickness: 3.0 },
    tags: ['acrílico', 'transparente', 'placa'],
    supplier: 'Plásticos Industriais SA',
    supplierCode: 'ACG-CRI-3MM',
    minStock: 20,
    maxStock: 100,
    location: 'Estoque B - Área 2',
    active: true,
    priceHistory: [
      { date: '2024-01-01', cost: 42.50 },
      { date: '2024-02-01', cost: 44.20 },
      { date: '2024-03-01', cost: 45.80 }
    ]
  }
  // ... mais materiais
]
```

### **Etapa 3.3: Equipamentos (Frontend)**

#### Formulário de Equipamento
```typescript
// cadastros/equipamentos/components/equipment-form.tsx
interface EquipmentFormProps {
  equipment?: Equipment
  onSubmit: (data: EquipmentFormData) => void
  isLoading?: boolean
}

export function EquipmentForm({ equipment, onSubmit, isLoading }: EquipmentFormProps) {
  const [equipmentType, setEquipmentType] = useState<'printing' | 'machining'>('printing')
  
  return (
    <Form>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados básicos */}
        <FormField name="name" label="Nome do Equipamento" />
        <FormField name="code" label="Código" />
        <FormField name="type" label="Tipo">
          <Select value={equipmentType} onValueChange={setEquipmentType}>
            <SelectItem value="printing">Impressão</SelectItem>
            <SelectItem value="machining">Usinagem</SelectItem>
          </Select>
        </FormField>
        <FormField name="costPerHour" label="Custo por Hora" type="number" />
        
        {/* Configurações específicas */}
        {equipmentType === 'printing' && (
          <PrintingEquipmentConfig />
        )}
        
        {equipmentType === 'machining' && (
          <MachiningEquipmentConfig />
        )}
      </div>
    </Form>
  )
}
```

### **Etapa 3.4: Processos (Frontend)**

#### Lista de Processos
```typescript
// cadastros/processos/page.tsx
export default function ProcessosPage() {
  const [processes] = useState(mockProcesses)
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Processos e Setores"
        action={
          <Button asChild>
            <Link href="/cadastros/processos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Processo
            </Link>
          </Button>
        }
      />
      
      <DataTable
        columns={processColumns}
        data={processes}
        searchableColumns={['name', 'sector']}
        filterableColumns={[
          { id: 'sector', title: 'Setor', options: sectorOptions }
        ]}
      />
    </div>
  )
}
```

### **Etapa 3.5: Acabamentos (Frontend)**

#### Compositor de Acabamentos
```typescript
// cadastros/acabamentos/components/finish-composer.tsx
export function FinishComposer({ finish, onChange }: FinishComposerProps) {
  const [composition, setComposition] = useState({
    materials: [],
    processes: []
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Materiais</h3>
        <MaterialSelector 
          materials={composition.materials}
          onChange={(materials) => setComposition(prev => ({ ...prev, materials }))}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Processos</h3>
        <ProcessSelector 
          processes={composition.processes}
          onChange={(processes) => setComposition(prev => ({ ...prev, processes }))}
        />
      </div>
      
      <CostCalculator composition={composition} />
    </div>
  )
}
```

### **Etapa 3.6: Produtos (Frontend)**

#### Construtor de Checklist Inteligente
```typescript
// cadastros/produtos/components/checklist-builder.tsx
export function ChecklistBuilder({ checklist, onChange }: ChecklistBuilderProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist || [])
  
  const addItem = () => {
    const newItem: ChecklistItem = {
      id: generateId(),
      question: '',
      type: 'text',
      required: false
    }
    setItems([...items, newItem])
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Checklist Inteligente</h3>
        <Button variant="outline" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>
      
      {items.map((item, index) => (
        <ChecklistItemEditor
          key={item.id}
          item={item}
          onChange={(updatedItem) => updateItem(index, updatedItem)}
          onRemove={() => removeItem(index)}
        />
      ))}
    </div>
  )
}
```

## 🎨 SISTEMA DE DESIGN

### Componentes UI Específicos

#### MaterialCard
```typescript
export function MaterialCard({ material }: { material: Material }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{material.name}</CardTitle>
            <CardDescription>{material.code}</CardDescription>
          </div>
          <Badge variant={material.active ? 'default' : 'secondary'}>
            {material.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Custo:</span>
            <span className="font-semibold">
              {formatCurrency(material.cost)} / {material.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Categoria:</span>
            <span>{material.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Estoque:</span>
            <span>{material.stock || 0} {material.unit}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={`/cadastros/materias-primas/${material.id}`}>
              Ver Detalhes
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
```

### Temas e Cores
```css
/* Cores específicas para a Fase 3 */
:root {
  --color-material: hsl(142, 76%, 36%);     /* Verde para materiais */
  --color-equipment: hsl(217, 91%, 60%);    /* Azul para equipamentos */
  --color-process: hsl(262, 83%, 58%);      /* Roxo para processos */
  --color-finish: hsl(25, 95%, 53%);       /* Laranja para acabamentos */
  --color-product: hsl(346, 87%, 43%);     /* Vermelho para produtos */
  --color-formula: hsl(45, 93%, 47%);      /* Amarelo para fórmulas */
}
```

## 🔗 INTEGRAÇÃO COM BACKEND

### Configuração tRPC
```typescript
// src/lib/trpc.ts - adicionar routers da Fase 3
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }
  },
})

// Novos hooks disponíveis:
// api.materials.list.useQuery()
// api.equipments.list.useQuery()  
// api.processes.list.useQuery()
// api.finishes.list.useQuery()
// api.products.list.useQuery()
// api.formulas.validate.useMutation()
```

### Transição Mock → Real
```typescript
// hooks/use-materials.ts
export function useMaterials() {
  const isDev = process.env.NODE_ENV === 'development'
  
  // Em desenvolvimento, usar mock primeiro
  if (isDev && !process.env.NEXT_PUBLIC_USE_REAL_API) {
    return {
      data: mockMaterials,
      isLoading: false,
      error: null
    }
  }
  
  // Em produção ou quando configurado, usar API real
  return api.materials.list.useQuery()
}
```

## 📱 RESPONSIVIDADE

### Breakpoints Específicos
```typescript
// Configuração para diferentes tamanhos
const responsive = {
  mobile: 'grid-cols-1',      // < 768px
  tablet: 'md:grid-cols-2',   // 768px - 1024px  
  desktop: 'lg:grid-cols-3',  // > 1024px
  wide: 'xl:grid-cols-4'      // > 1280px
}
```

## 🧪 ESTRATÉGIA DE TESTES

### Testes de Componentes
```typescript
// __tests__/components/material-card.test.tsx
describe('MaterialCard', () => {
  it('should display material information correctly', () => {
    render(<MaterialCard material={mockMaterial} />)
    expect(screen.getByText('Vinil Adesivo Branco')).toBeInTheDocument()
    expect(screen.getByText('R$ 12,50 / m²')).toBeInTheDocument()
  })
  
  it('should show active/inactive status', () => {
    render(<MaterialCard material={inactiveMaterial} />)
    expect(screen.getByText('Inativo')).toBeInTheDocument()
  })
})
```

## 📋 CRITÉRIOS DE ACEITE

### Funcionais
- [ ] Todos os formulários de cadastro funcionais
- [ ] Sistema de busca e filtros operacional
- [ ] Construtor de fórmulas visual
- [ ] Checklist inteligente funcional
- [ ] Composição de acabamentos implementada
- [ ] Validações em tempo real

### Técnicos  
- [ ] Responsividade completa (mobile-first)
- [ ] Performance otimizada (< 2s carregamento)
- [ ] Acessibilidade (WCAG 2.1 AA)
- [ ] Testes de componentes > 80% cobertura
- [ ] Integração com tRPC funcionando

### UX/UI
- [ ] Interface intuitiva e consistente
- [ ] Feedback visual adequado
- [ ] Animações suaves
- [ ] Estados de loading/error
- [ ] Navegação fluida

## 🚀 CRONOGRAMA DE ENTREGA

### Semana 1: Fundação
- [ ] Setup de estrutura de pastas
- [ ] Componentes base (forms, cards, lists)
- [ ] Sistema de cores e temas
- [ ] Mock data completo

### Semana 2: Funcionalidades Core  
- [ ] Todas as telas de listagem
- [ ] Formulários de cadastro
- [ ] Sistema de busca e filtros
- [ ] Construtor de fórmulas

### Semana 3: Integração e Refinamento
- [ ] Integração com APIs reais
- [ ] Testes de componentes
- [ ] Ajustes de UX/UI
- [ ] Otimizações de performance
- [ ] Documentação de componentes

---

**IMPORTANTE**: Começar sempre com dados mockados para ter feedback visual rápido, depois integrar com o backend real. Manter foco na experiência do usuário e na consistência visual com o design system estabelecido.