# FASE 4 - ENGINE DE PRECIFICAÇÃO (Semanas 8-9)

## 🎯 OBJETIVO GERAL

Implementar sistema completo de precificação com método de custeio direto, incluindo sistema robusto de produtos complexos, engine de formação de preços, parâmetros automáticos e manuais, e relatórios detalhados de composição de custos.

## 📋 CRONOGRAMA DETALHADO

### Semana 8: Sistema de Produtos e Engine Base
- **Etapa 4.1**: Sistema de Produtos Complexos (2.5 dias)
- **Etapa 4.2**: Engine de Precificação - Custeio Direto (2.5 dias)

### Semana 9: Parâmetros e Otimização
- **Etapa 4.3**: Parâmetros do Sistema (2 dias)
- **Integração e Testes**: Validação completa e otimizações (3 dias)

## 🏗️ ARQUITETURA DA FASE

### Backend (Real Data)
```
apps/server/src/
├── lib/
│   ├── pricing-engine.ts      # Engine principal de precificação
│   ├── product-costing.ts     # Cálculo de custos de produtos
│   ├── parameters.ts          # Gestão de parâmetros do sistema
│   ├── cost-breakdown.ts      # Detalhamento de custos
│   └── margin-calculator.ts   # Cálculo de margens
├── routers/
│   ├── products.ts            # Atualizado com cálculos
│   ├── pricing.ts             # Rotas de precificação
│   └── parameters.ts          # CRUD de parâmetros
└── prisma/
    ├── schema.prisma          # Novos modelos da Fase 4
    └── seeds/phase4-seed.ts   # Parâmetros e produtos de teste
```

### Frontend (Mock + Real)
```
apps/web/src/app/(dashboard)/
├── cadastros/produtos/        # Interface aprimorada de produtos
│   └── components/
│       ├── cost-calculator.tsx    # Calculadora em tempo real
│       ├── margin-configurator.tsx # Configuração de margens
│       └── composition-viewer.tsx  # Visualização de composição
├── configuracoes/
│   └── parametros/            # Gestão de parâmetros
└── components/
    ├── charts/
    │   └── cost-breakdown.tsx # Gráficos de composição
    └── forms/
        └── pricing-form.tsx   # Formulários de precificação
```

## 🔧 ETAPAS DETALHADAS

### **Etapa 4.1: Sistema de Produtos Complexos**
**Objetivo**: Cadastro robusto de produtos com composição complexa

**Backend**:
- CRUD de produtos aprimorado
- Composição complexa (materiais + processos + equipamentos + acabamentos)
- Sistema de checklist inteligente
- Cálculo automático de custos base
- Versionamento de produtos
- Clonagem e templates

**Frontend**:
- Interface de cadastro avançada
- Assistente de criação step-by-step
- Preview de custos em tempo real
- Biblioteca de templates
- Sistema de clonagem

**Critérios de Aceite**:
- [ ] CRUD de produtos completo
- [ ] Composição complexa implementada
- [ ] Checklist inteligente funcional
- [ ] Cálculo automático preciso
- [ ] Templates e clonagem ativos
- [ ] Versionamento funcional

### **Etapa 4.2: Engine de Precificação (Custeio Direto)**
**Objetivo**: Sistema robusto de formação de preços

**Backend**:
- Implementação do método de custeio direto
- Cálculo de custos fixos proporcionais
- Sistema de margens flexível (Mark-up, Margem líquida, Preço final)
- Relatórios detalhados de composição
- Cache de cálculos para performance
- API de precificação em lote

**Frontend**:
- Calculadora interativa de preços
- Visualização gráfica de composição
- Comparador de cenários
- Simulador de margens
- Relatórios visuais

**Critérios de Aceite**:
- [ ] Custeio direto implementado
- [ ] Margens configuráveis
- [ ] Relatórios precisos
- [ ] Performance otimizada
- [ ] Cache funcionando
- [ ] API de lote ativa

### **Etapa 4.3: Parâmetros do Sistema**
**Objetivo**: Configuração de custos fixos e variáveis

**Backend**:
- Parâmetros manuais e automáticos
- Média de faturamento/despesas
- Transição automática por data
- Histórico de parâmetros
- Impacto nos cálculos
- Alertas de alteração

**Frontend**:
- Interface de configuração
- Dashboard de parâmetros
- Histórico visual
- Simulador de impacto
- Sistema de alertas

**Critérios de Aceite**:
- [ ] Parâmetros configuráveis
- [ ] Transição automática funcional
- [ ] Impacto nos cálculos correto
- [ ] Histórico implementado
- [ ] Alertas ativos

## 🗄️ MODELOS PRISMA

### Product (Atualizado)
```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  code        String?  @unique
  category    String?
  formula     String?  // main calculation formula
  checklist   Json?    // intelligent checklist
  margin      Json     // markup, liquid margin, final price
  baseCost    Decimal? // calculated base cost
  finalPrice  Decimal? // calculated final price
  version     Int      @default(1)
  parentId    String?  // for versioning
  templateId  String?  // for templates
  active      Boolean  @default(true)
  companyId   String
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  company     Company  @relation(fields: [companyId], references: [id])
  creator     User     @relation(fields: [createdBy], references: [id])
  parent      Product? @relation("ProductVersions", fields: [parentId], references: [id])
  versions    Product[] @relation("ProductVersions")
  template    Product? @relation("ProductTemplates", fields: [templateId], references: [id])
  instances   Product[] @relation("ProductTemplates")
  materials   ProductMaterial[]
  equipments  ProductEquipment[]
  processes   ProductProcess[]
  finishes    ProductFinish[]
  costHistory ProductCostHistory[]
  quoteItems  QuoteItem[]
  orderItems  OrderItem[]
  
  @@map("products")
}
```

### ProductCostHistory
```prisma
model ProductCostHistory {
  id            String   @id @default(cuid())
  productId     String
  baseCost      Decimal
  finalPrice    Decimal
  costBreakdown Json     // detailed cost breakdown
  parameters    Json     // parameters used in calculation
  calculatedAt  DateTime @default(now())
  calculatedBy  String
  
  // Relations
  product       Product @relation(fields: [productId], references: [id])
  calculator    User    @relation(fields: [calculatedBy], references: [id])
  
  @@map("product_cost_history")
}
```

### Parameter
```prisma
model Parameter {
  id            String   @id @default(cuid())
  name          String
  description   String?
  value         Json
  type          String   // manual, automatic
  category      String   // fixed_costs, variable_costs, margins, etc
  unit          String?  // percentage, currency, etc
  validFrom     DateTime @default(now())
  validUntil    DateTime?
  autoUpdate    Boolean  @default(false)
  updateFormula String?  // formula for automatic updates
  active        Boolean  @default(true)
  companyId     String
  createdBy     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  company       Company @relation(fields: [companyId], references: [id])
  creator       User    @relation(fields: [createdBy], references: [id])
  history       ParameterHistory[]
  
  @@unique([companyId, name, validFrom])
  @@map("parameters")
}
```

### ParameterHistory
```prisma
model ParameterHistory {
  id          String   @id @default(cuid())
  parameterId String
  oldValue    Json
  newValue    Json
  reason      String?
  changedBy   String
  changedAt   DateTime @default(now())
  
  // Relations
  parameter   Parameter @relation(fields: [parameterId], references: [id])
  changer     User      @relation(fields: [changedBy], references: [id])
  
  @@map("parameter_history")
}
```

### PricingRule
```prisma
model PricingRule {
  id          String   @id @default(cuid())
  name        String
  description String?
  conditions  Json     // conditions for rule application
  actions     Json     // pricing actions to apply
  priority    Int      @default(0)
  active      Boolean  @default(true)
  companyId   String
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  company     Company @relation(fields: [companyId], references: [id])
  creator     User    @relation(fields: [createdBy], references: [id])
  
  @@map("pricing_rules")
}
```

## 🧮 ENGINE DE PRECIFICAÇÃO

### Estrutura de Cálculo
```typescript
interface CostBreakdown {
  materials: {
    item: string
    quantity: number
    unitCost: number
    totalCost: number
  }[]
  equipment: {
    item: string
    timeNeeded: number
    costPerHour: number
    totalCost: number
  }[]
  processes: {
    item: string
    timeNeeded: number
    costPerHour: number
    totalCost: number
  }[]
  finishes: {
    item: string
    quantity: number
    unitCost: number
    totalCost: number
  }[]
  directCosts: number
  fixedCosts: number
  variableCosts: number
  subtotal: number
  margin: {
    type: 'markup' | 'liquid' | 'final'
    percentage: number
    value: number
  }
  finalPrice: number
}

interface PricingContext {
  productId: string
  variables: Record<string, number> // largura, altura, quantidade, etc
  parameters: Record<string, any>
  date?: Date
}
```

### Métodos de Custeio
```typescript
export class PricingEngine {
  // Custeio Direto - Método principal
  static calculateDirectCosting(context: PricingContext): CostBreakdown {
    const directCosts = this.calculateDirectCosts(context)
    const fixedCosts = this.calculateFixedCosts(context, directCosts)
    const variableCosts = this.calculateVariableCosts(context)
    
    const subtotal = directCosts + fixedCosts + variableCosts
    const margin = this.calculateMargin(context, subtotal)
    
    return {
      directCosts,
      fixedCosts,
      variableCosts,
      subtotal,
      margin,
      finalPrice: subtotal + margin.value
    }
  }
  
  // Cálculo de custos diretos
  private static calculateDirectCosts(context: PricingContext): number {
    // Materiais + Equipamentos + Processos + Acabamentos
  }
  
  // Cálculo de custos fixos proporcionais
  private static calculateFixedCosts(context: PricingContext, directCosts: number): number {
    // Proporção baseada em parâmetros da empresa
  }
  
  // Cálculo de margens flexíveis
  private static calculateMargin(context: PricingContext, baseCost: number): MarginResult {
    // Mark-up, Margem líquida ou Preço final
  }
}
```

## 📊 SISTEMA DE PARÂMETROS

### Tipos de Parâmetros
```typescript
interface SystemParameters {
  fixedCosts: {
    rent: number          // Aluguel mensal
    utilities: number     // Utilidades (luz, água, internet)
    salaries: number      // Salários administrativos
    insurance: number     // Seguros
    depreciation: number  // Depreciação
    other: number        // Outros custos fixos
  }
  
  variableCosts: {
    salesCommission: number    // Comissão de vendas (%)
    taxes: number             // Impostos (%)
    freight: number           // Frete (%)
    packaging: number         // Embalagem (%)
    other: number            // Outros custos variáveis (%)
  }
  
  productivity: {
    hoursPerMonth: number     // Horas produtivas por mês
    efficiency: number        // Eficiência média (%)
    downtime: number         // Tempo de parada (%)
  }
  
  margins: {
    defaultMarkup: number     // Mark-up padrão (%)
    minimumMargin: number     // Margem mínima (%)
    targetMargin: number      // Margem alvo (%)
  }
  
  automatic: {
    updateFrequency: 'daily' | 'weekly' | 'monthly'
    basePeriod: number       // Período base para cálculos (meses)
    autoAdjust: boolean      // Ajuste automático ativo
  }
}
```

### Cálculo Automático
```typescript
export class ParameterCalculator {
  // Atualização automática baseada em dados reais
  static async updateAutomaticParameters(companyId: string): Promise<void> {
    const period = await this.getBasePeriod(companyId)
    const financialData = await this.getFinancialData(companyId, period)
    
    const parameters = {
      averageRevenue: this.calculateAverageRevenue(financialData),
      averageExpenses: this.calculateAverageExpenses(financialData),
      fixedCostsRatio: this.calculateFixedCostsRatio(financialData),
      variableCostsRatio: this.calculateVariableCostsRatio(financialData)
    }
    
    await this.saveParameters(companyId, parameters)
    await this.notifyParameterChange(companyId, parameters)
  }
}
```

## 🧪 TESTES DE ACEITAÇÃO

### Testes de Cálculo
```bash
# Teste de precificação básica
POST /api/pricing/calculate
{
  "productId": "xxx",
  "context": {
    "largura": 2,
    "altura": 1.5,
    "quantidade": 10
  }
}
# Expect: Breakdown detalhado de custos

# Teste de parâmetros
GET /api/parameters
POST /api/parameters
PUT /api/parameters/:id

# Teste de produtos complexos
POST /api/products/clone/:id
GET /api/products/:id/cost-history
POST /api/products/calculate-batch
```

### Validações de Negócio
```typescript
describe('PricingEngine', () => {
  it('should calculate direct costing correctly', () => {
    const result = PricingEngine.calculateDirectCosting(context)
    expect(result.directCosts).toBeGreaterThan(0)
    expect(result.finalPrice).toBeGreaterThan(result.subtotal)
  })
  
  it('should apply margins correctly', () => {
    const markup = PricingEngine.calculateMargin(context, 100)
    expect(markup.type).toBe('markup')
    expect(markup.value).toBe(50) // 50% markup = 50 reais
  })
})
```

## 📈 MÉTRICAS DE PERFORMANCE

### Benchmarks de Cálculo
```typescript
interface PerformanceMetrics {
  calculationTime: number     // < 500ms
  cacheHitRate: number       // > 80%
  accuracyRate: number       // > 99%
  throughput: number         // calculations per second
}
```

### Otimizações
- Cache de cálculos repetidos
- Cálculo em lote para múltiplos produtos
- Pré-cálculo de parâmetros fixos
- Lazy loading de componentes complexos

## 📊 DASHBOARD DE PRECIFICAÇÃO

### KPIs Principais
- Margem média por produto
- Evolução de custos
- Produtos mais rentáveis
- Impacto de mudanças de parâmetros
- Comparação de cenários

### Relatórios
- Composição detalhada de custos
- Histórico de precificação
- Análise de sensibilidade
- Comparativo com concorrência
- Simulação de cenários

## 🔄 INTEGRAÇÃO COM OUTRAS FASES

### Depende de:
- **Fase 3**: Sistema de produtos e fórmulas
- **Fase 2**: Multi-tenancy e usuários
- **Fase 1**: Autenticação e database

### Prepara para:
- **Fase 5**: Estoque com custos precisos
- **Fase 6**: Orçamentos com precificação
- **Fase 7**: Análise financeira avançada

## 📝 CRITÉRIOS FINAIS DE ACEITE

### Funcionais
- [ ] Engine de precificação 100% funcional
- [ ] Método de custeio direto implementado
- [ ] Sistema de parâmetros completo
- [ ] Produtos complexos operacionais
- [ ] Relatórios precisos
- [ ] Cache de performance ativo

### Técnicos
- [ ] Performance < 500ms por cálculo
- [ ] Cache hit rate > 80%
- [ ] Precisão > 99%
- [ ] APIs de lote funcionais
- [ ] Testes automatizados passando

### Negócio
- [ ] Margens configuráveis
- [ ] Parâmetros automáticos ativos
- [ ] Histórico de alterações
- [ ] Alertas funcionando
- [ ] Relatórios intuitivos

## 🚀 PRÓXIMOS PASSOS

Após conclusão da Fase 4:
1. **Fase 5**: Integrar precificação com estoque
2. **Fase 6**: Usar engine nos orçamentos
3. **Fase 7**: Análise financeira avançada
4. Monitorar precisão dos cálculos
5. Otimizar performance continuamente

---

**IMPORTANTE**: Esta fase é o coração do sistema de precificação. Todos os cálculos devem ser precisos, auditáveis e performáticos. A flexibilidade do sistema de parâmetros é crucial para diferentes tipos de empresas.