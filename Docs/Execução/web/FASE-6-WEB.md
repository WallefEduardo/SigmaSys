# FASE 6 WEB - COMERCIAL E CRM (Frontend)

## 🎯 OBJETIVO

Desenvolver interfaces comerciais com orçamentos inteligentes, funil Kanban e conversão para OS.

## 🏗️ COMPONENTES PRINCIPAIS

### Criador de Orçamentos
```typescript
// comercial/orcamentos/novo/page.tsx
export default function NovoOrcamentoPage() {
  const [quote, setQuote] = useState({
    title: '',
    clientId: '',
    items: []
  })
  
  return (
    <div className="space-y-6">
      <QuoteHeader quote={quote} onChange={setQuote} />
      <ClientSelector value={quote.clientId} onChange={handleClientChange} />
      <QuoteItems items={quote.items} onChange={handleItemsChange} />
      <QuoteSummary quote={quote} />
      <QuoteActions quote={quote} />
    </div>
  )
}
```

### Kanban do Funil
```typescript
// comercial/funil/page.tsx
export default function FunilPage() {
  const [quotes, setQuotes] = useState([])
  const [stages] = useState([
    { id: 'elaboracao', name: 'Elaboração', color: 'gray' },
    { id: 'enviado', name: 'Enviado', color: 'blue' },
    { id: 'negociacao', name: 'Negociação', color: 'yellow' },
    { id: 'aprovado', name: 'Aprovado', color: 'green' }
  ])
  
  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {stages.map(stage => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          quotes={quotes.filter(q => q.stage === stage.id)}
          onMoveQuote={handleMoveQuote}
        />
      ))}
    </div>
  )
}
```

### Kanban Column
```typescript
// components/kanban-column.tsx
export function KanbanColumn({ stage, quotes, onMoveQuote }) {
  const [{ isOver }, drop] = useDrop({
    accept: 'quote',
    drop: (item) => onMoveQuote(item.id, stage.id),
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })
  
  return (
    <div
      ref={drop}
      className={`min-w-80 bg-gray-50 rounded-lg p-4 ${isOver ? 'bg-blue-50' : ''}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`} />
        <h3 className="font-semibold">{stage.name}</h3>
        <Badge variant="secondary">{quotes.length}</Badge>
      </div>
      
      <div className="space-y-3">
        {quotes.map(quote => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            draggable
          />
        ))}
      </div>
    </div>
  )
}
```

### Quote Card
```typescript
// components/quote-card.tsx
export function QuoteCard({ quote, draggable = false }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'quote',
    item: { id: quote.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })
  
  return (
    <Card
      ref={draggable ? drag : null}
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium truncate">{quote.title}</h4>
          <Badge variant={getStatusVariant(quote.status)}>
            {quote.status}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">
          {quote.client.name}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-green-600">
            {formatCurrency(quote.totalPrice)}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDate(quote.createdAt)}
          </span>
        </div>
        
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Dashboard Comercial
```typescript
// comercial/page.tsx
export default function ComercialPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Orçamentos em Aberto"
          value={23}
          icon={FileText}
          trend={+5}
        />
        <MetricCard
          title="Taxa de Conversão"
          value="65%"
          icon={TrendingUp}
          trend={+8}
        />
        <MetricCard
          title="Ticket Médio"
          value="R$ 2.450"
          icon={DollarSign}
          trend={+12}
        />
        <MetricCard
          title="Vendas do Mês"
          value="R$ 45.600"
          icon={Target}
          trend={+18}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesFunnelChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>
      </div>
      
      <RecentQuotes />
      <TopClients />
    </div>
  )
}
```

### Conversor para OS
```typescript
// components/quote-to-order-converter.tsx
export function QuoteToOrderConverter({ quote }) {
  const [orderData, setOrderData] = useState({
    startDate: new Date(),
    deliveryDate: addDays(new Date(), 7),
    notes: ''
  })
  
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Converter Orçamento em OS</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <QuoteSummary quote={quote} readonly />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início</Label>
              <DatePicker
                value={orderData.startDate}
                onChange={handleStartDateChange}
              />
            </div>
            
            <div>
              <Label>Data de Entrega</Label>
              <DatePicker
                value={orderData.deliveryDate}
                onChange={handleDeliveryDateChange}
              />
            </div>
          </div>
          
          <div>
            <Label>Observações</Label>
            <Textarea
              value={orderData.notes}
              onChange={handleNotesChange}
              placeholder="Observações adicionais..."
            />
          </div>
          
          <MaterialReservation quote={quote} />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConvert}>
            Converter em OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## 📊 MOCK DATA

```typescript
// src/lib/mock-data/commercial.ts
export const mockCommercialData = {
  quotes: [
    {
      id: '1',
      number: 'ORC-2024-001',
      title: 'Adesivos Loja ABC',
      client: { name: 'Loja ABC Ltda' },
      totalPrice: 2450.00,
      stage: 'negociacao',
      status: 'sent',
      createdAt: new Date('2024-01-15'),
      validUntil: new Date('2024-02-15'),
      items: [
        {
          product: { name: 'Adesivo Personalizado' },
          quantity: 10,
          unitPrice: 245.00,
          totalPrice: 2450.00
        }
      ]
    }
  ],
  
  pipeline: {
    stages: [
      { id: 'elaboracao', name: 'Elaboração', count: 5 },
      { id: 'enviado', name: 'Enviado', count: 8 },
      { id: 'negociacao', name: 'Negociação', count: 3 },
      { id: 'aprovado', name: 'Aprovado', count: 2 }
    ]
  },
  
  metrics: {
    conversionRate: 65,
    averageTicket: 2450,
    monthlyRevenue: 45600,
    openQuotes: 23
  }
}
```

---

**IMPORTANTE**: Interface comercial visual com Kanban drag-and-drop e integração completa com sistema de precificação.