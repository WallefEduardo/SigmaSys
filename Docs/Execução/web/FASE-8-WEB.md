# FASE 8 WEB - PCP E PRODUÇÃO (Frontend)

## 🎯 OBJETIVO

Desenvolver interfaces para PCP com Kanban visual, apontamento de produção e dashboards de eficiência.

## 📊 KANBAN DE PRODUÇÃO

### Board Principal
```typescript
// producao/pcp/page.tsx
export default function PCPPage() {
  const [orders, setOrders] = useState([])
  const [stages] = useState([
    { id: 'fila', name: 'Fila', color: 'gray' },
    { id: 'impressao', name: 'Impressão', color: 'blue' },
    { id: 'acabamento', name: 'Acabamento', color: 'yellow' },
    { id: 'qualidade', name: 'Qualidade', color: 'purple' },
    { id: 'entrega', name: 'Entrega', color: 'green' }
  ])
  
  return (
    <div className="h-full flex flex-col">
      <PCPHeader />
      
      <div className="flex-1 flex gap-4 overflow-x-auto p-4">
        {stages.map(stage => (
          <ProductionColumn
            key={stage.id}
            stage={stage}
            orders={orders.filter(o => o.stage === stage.id)}
            onMoveOrder={handleMoveOrder}
          />
        ))}
      </div>
      
      <PCPFooter />
    </div>
  )
}
```

### Card de Ordem de Produção
```typescript
// components/production-order-card.tsx
export function ProductionOrderCard({ order }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'order',
    item: { id: order.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })
  
  return (
    <Card
      ref={drag}
      className={`cursor-move hover:shadow-lg transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium">{order.number}</h4>
          <PriorityBadge priority={order.priority} />
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">
          {order.client.name}
        </p>
        
        <div className="space-y-2">
          <ProgressBar 
            value={order.progress}
            className="h-2"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Início: {formatDate(order.startDate)}</span>
            <span>Entrega: {formatDate(order.deliveryDate)}</span>
          </div>
        </div>
        
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline">
            <Play className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline">
            <Eye className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline">
            <Clock className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Apontamento de Produção
```typescript
// producao/apontamento/page.tsx
export default function ApontamentoPage() {
  const [activeSession, setActiveSession] = useState(null)
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActiveOperations />
        <EquipmentStatus />
        <QualityControl />
      </div>
      
      {activeSession ? (
        <ActiveProductionSession 
          session={activeSession}
          onComplete={handleCompleteSession}
        />
      ) : (
        <StartProductionForm 
          onStart={setActiveSession}
        />
      )}
      
      <ProductionHistory />
    </div>
  )
}
```

### Dashboard de OEE
```typescript
// components/oee-dashboard.tsx
export function OEEDashboard() {
  const oeeData = {
    availability: 85,
    performance: 92,
    quality: 95,
    oee: 74.3
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>OEE - Overall Equipment Effectiveness</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OEEMetric 
            label="Disponibilidade"
            value={oeeData.availability}
            color="blue"
          />
          <OEEMetric 
            label="Performance"
            value={oeeData.performance}
            color="green"
          />
          <OEEMetric 
            label="Qualidade"
            value={oeeData.quality}
            color="purple"
          />
          <OEEMetric 
            label="OEE Total"
            value={oeeData.oee}
            color="orange"
            highlight
          />
        </div>
        
        <div className="mt-6">
          <OEEChart data={oeeData} />
        </div>
      </CardContent>
    </Card>
  )
}
```

### Controle de Capacidade
```typescript
// components/capacity-control.tsx
export function CapacityControl() {
  const capacityData = {
    totalCapacity: 480, // minutos
    usedCapacity: 360,
    availableCapacity: 120,
    utilizationRate: 75
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controle de Capacidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Capacidade Total</span>
            <span className="font-semibold">
              {Math.floor(capacityData.totalCapacity / 60)}h {capacityData.totalCapacity % 60}min
            </span>
          </div>
          
          <ProgressBar 
            value={capacityData.utilizationRate}
            className="h-4"
          />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Utilizada:</span>
              <span className="ml-2 font-medium">
                {Math.floor(capacityData.usedCapacity / 60)}h {capacityData.usedCapacity % 60}min
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Disponível:</span>
              <span className="ml-2 font-medium">
                {Math.floor(capacityData.availableCapacity / 60)}h {capacityData.availableCapacity % 60}min
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

**IMPORTANTE**: Interface visual de produção com Kanban drag-and-drop, apontamento em tempo real e métricas de eficiência.