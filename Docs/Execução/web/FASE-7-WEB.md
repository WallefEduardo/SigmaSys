# FASE 7 WEB - FINANCEIRO COMPLETO (Frontend)

## 🎯 OBJETIVO

Desenvolver interfaces financeiras com DRE, fluxo de caixa, gestão de contas e análise de ponto de equilíbrio.

## 📊 DASHBOARD FINANCEIRO

### Página Principal
```typescript
// financeiro/page.tsx
export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <FinancialOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart />
        <DREChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AccountsPayable />
        <AccountsReceivable />
        <BreakEvenAnalysis />
      </div>
    </div>
  )
}
```

### Contas a Pagar/Receber
```typescript
// financeiro/contas/page.tsx
export default function ContasPage() {
  const [accountType, setAccountType] = useState('receivable')
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contas</h1>
        <div className="flex gap-2">
          <Button 
            variant={accountType === 'receivable' ? 'default' : 'outline'}
            onClick={() => setAccountType('receivable')}
          >
            A Receber
          </Button>
          <Button 
            variant={accountType === 'payable' ? 'default' : 'outline'}
            onClick={() => setAccountType('payable')}
          >
            A Pagar
          </Button>
        </div>
      </div>
      
      <AccountsTable type={accountType} />
    </div>
  )
}
```

### Análise de Ponto de Equilíbrio
```typescript
// components/break-even-analysis.tsx
export function BreakEvenAnalysis() {
  const breakEvenData = {
    fixedCosts: 15000,
    averageMargin: 40,
    breakEvenRevenue: 37500,
    currentRevenue: 45000,
    safetyMargin: 20
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ponto de Equilíbrio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MetricDisplay 
              label="Custos Fixos"
              value={formatCurrency(breakEvenData.fixedCosts)}
              icon={TrendingDown}
            />
            <MetricDisplay 
              label="Margem Média"
              value={`${breakEvenData.averageMargin}%`}
              icon={Percent}
            />
          </div>
          
          <div className="border-t pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(breakEvenData.breakEvenRevenue)}
              </div>
              <div className="text-sm text-muted-foreground">
                Faturamento de Equilíbrio
              </div>
            </div>
          </div>
          
          <BreakEvenChart data={breakEvenData} />
        </div>
      </CardContent>
    </Card>
  )
}
```

### DRE Visual
```typescript
// components/dre-chart.tsx
export function DREChart() {
  const dreData = {
    revenue: 150000,
    cogs: 90000,
    grossProfit: 60000,
    expenses: 35000,
    netProfit: 25000,
    margin: 16.7
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>DRE - Demonstrativo de Resultados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DREItem 
            label="Receita Bruta"
            value={dreData.revenue}
            percentage={100}
            color="green"
          />
          <DREItem 
            label="(-) Custos dos Produtos"
            value={dreData.cogs}
            percentage={(dreData.cogs / dreData.revenue) * 100}
            color="red"
          />
          <DREItem 
            label="Lucro Bruto"
            value={dreData.grossProfit}
            percentage={(dreData.grossProfit / dreData.revenue) * 100}
            color="blue"
          />
          <DREItem 
            label="(-) Despesas Operacionais"
            value={dreData.expenses}
            percentage={(dreData.expenses / dreData.revenue) * 100}
            color="orange"
          />
          <DREItem 
            label="Lucro Líquido"
            value={dreData.netProfit}
            percentage={dreData.margin}
            color="purple"
            highlight
          />
        </div>
      </CardContent>
    </Card>
  )
}
```

---

**IMPORTANTE**: Dashboard financeiro completo com DRE automático, fluxo de caixa e indicadores em tempo real.