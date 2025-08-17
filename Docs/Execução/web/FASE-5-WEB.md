# FASE 5 WEB - ESTOQUE INTELIGENTE (Frontend)

## 🎯 OBJETIVO

Desenvolver interfaces para gestão de estoque com foco no estoque fracionado e otimização visual de cortes.

## 🏗️ COMPONENTES PRINCIPAIS

### Dashboard de Estoque
```typescript
// estoque/page.tsx
export default function EstoquePage() {
  return (
    <div className="space-y-6">
      <StockOverview />
      <StockAlerts />
      <StockMovements />
      <FractionalInventory />
    </div>
  )
}
```

### Visualizador Fracionado
```typescript
// components/fractional-viewer.tsx
export function FractionalViewer({ item }: { item: FractionalItem }) {
  return (
    <div className="relative border border-gray-300">
      <svg width={item.width * 100} height={item.height * 100}>
        {/* Visualizar cortes existentes */}
        {item.cuts.map(cut => (
          <rect
            key={cut.id}
            x={cut.position.x * 100}
            y={cut.position.y * 100}
            width={cut.dimensions.width * 100}
            height={cut.dimensions.height * 100}
            fill="rgba(255,0,0,0.3)"
            stroke="red"
          />
        ))}
        
        {/* Áreas disponíveis */}
        {item.availableAreas.map(area => (
          <rect
            key={`area-${area.position.x}-${area.position.y}`}
            x={area.position.x * 100}
            y={area.position.y * 100}
            width={area.dimensions.width * 100}
            height={area.dimensions.height * 100}
            fill="rgba(0,255,0,0.1)"
            stroke="green"
            strokeDasharray="5,5"
          />
        ))}
      </svg>
    </div>
  )
}
```

### Otimizador de Cortes
```typescript
// components/cutting-optimizer.tsx
export function CuttingOptimizer() {
  const [requiredCuts, setRequiredCuts] = useState([])
  const [optimizationResult, setOptimizationResult] = useState(null)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Otimizador de Cortes</CardTitle>
      </CardHeader>
      <CardContent>
        <CutRequirements 
          cuts={requiredCuts}
          onChange={setRequiredCuts}
        />
        
        {optimizationResult && (
          <OptimizationPreview result={optimizationResult} />
        )}
        
        <Button onClick={handleOptimize}>
          Otimizar Cortes
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Interface de Movimentações
```typescript
// components/movement-form.tsx
export function MovementForm() {
  return (
    <Form>
      <FormField name="type" label="Tipo">
        <Select>
          <SelectItem value="in">Entrada</SelectItem>
          <SelectItem value="out">Saída</SelectItem>
          <SelectItem value="transfer">Transferência</SelectItem>
          <SelectItem value="adjustment">Ajuste</SelectItem>
        </Select>
      </FormField>
      
      <FormField name="inventoryId" label="Item de Estoque">
        <InventorySelector />
      </FormField>
      
      <FormField name="quantity" label="Quantidade" type="number" />
      <FormField name="reason" label="Motivo" />
      
      <Button type="submit">Registrar Movimentação</Button>
    </Form>
  )
}
```

## 📊 MOCK DATA

```typescript
// src/lib/mock-data/inventory.ts
export const mockInventoryData = {
  items: [
    {
      id: '1',
      material: { name: 'Acrílico Cristal 3mm', unit: 'm²' },
      quantity: 6.0,
      availableQty: 4.5,
      location: 'Estoque B - Área 2',
      fractionalData: {
        originalDimensions: { width: 2, height: 3 },
        cuts: [
          {
            position: { x: 0, y: 0 },
            dimensions: { width: 1, height: 0.5 },
            purpose: 'Placa cliente A'
          }
        ],
        availableAreas: [
          {
            position: { x: 1, y: 0 },
            dimensions: { width: 1, height: 3 },
            area: 3.0,
            usable: true
          }
        ]
      }
    }
  ],
  
  movements: [
    {
      id: '1',
      type: 'out',
      quantity: 1.5,
      reason: 'Produção OS-001',
      createdAt: new Date(),
      user: { name: 'João Silva' }
    }
  ]
}
```

---

**IMPORTANTE**: Interface visual rica para estoque fracionado com otimização de cortes em tempo real.