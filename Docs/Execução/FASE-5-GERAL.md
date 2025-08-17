# FASE 5 - ESTOQUE INTELIGENTE (Semanas 10-11)

## 🎯 OBJETIVO GERAL

Implementar sistema completo de gestão de estoque com foco no estoque fracionado, específico para empresas de comunicação visual. Sistema deve controlar entradas, saídas, movimentações e otimização de cortes.

## 📋 CRONOGRAMA DETALHADO

### Semana 10: Gestão Base de Estoque
- **Etapa 5.1**: Gestão de Estoque Base (2.5 dias)
- **Etapa 5.2**: Estoque Fracionado - Parte 1 (2.5 dias)

### Semana 11: Estoque Fracionado Avançado
- **Etapa 5.2**: Estoque Fracionado - Parte 2 (2 dias)
- **Integração e Testes**: Validação completa e otimizações (3 dias)

## 🏗️ ARQUITETURA DA FASE

### Backend (Real Data)
```
apps/server/src/
├── lib/
│   ├── inventory-manager.ts    # Gestão principal do estoque
│   ├── fractional-inventory.ts # Lógica de estoque fracionado
│   ├── cutting-optimizer.ts    # Otimização de cortes
│   └── stock-movements.ts      # Controle de movimentações
├── routers/
│   ├── inventory.ts            # CRUD de estoque
│   ├── movements.ts            # Movimentações
│   └── cutting.ts              # Otimizador de cortes
└── prisma/
    ├── schema.prisma           # Novos modelos de estoque
    └── seeds/phase5-seed.ts    # Dados de estoque
```

### Frontend (Mock + Real)
```
apps/web/src/app/(dashboard)/estoque/
├── page.tsx                    # Dashboard principal
├── movimentacoes/             # Histórico de movimentações
├── fracionado/                # Gestão fracionada
├── otimizador/                # Otimizador de cortes
└── components/
    ├── stock-card.tsx         # Card de item de estoque
    ├── movement-form.tsx      # Formulário de movimentação
    ├── cutting-planner.tsx    # Planejador de cortes
    └── fractional-viewer.tsx  # Visualizador fracionado
```

## 🔧 ETAPAS DETALHADAS

### **Etapa 5.1: Gestão de Estoque Base**
**Objetivo**: Controle básico de estoque com CRUD completo

**Backend**:
- CRUD de itens de estoque
- Movimentações (entrada/saída/ajuste/transferência)
- Controle de lotes e validades
- Relatórios de posição de estoque
- Alertas de estoque mínimo
- Histórico completo de movimentações

**Frontend**:
- Dashboard com visão geral
- Interface de movimentações
- Relatórios visuais
- Sistema de alertas
- Busca e filtros avançados

**Critérios de Aceite**:
- [ ] CRUD de estoque funcional
- [ ] Movimentações registradas corretamente
- [ ] Controle de lotes implementado
- [ ] Alertas de estoque mínimo ativos
- [ ] Relatórios precisos

### **Etapa 5.2: Estoque Fracionado**
**Objetivo**: Controle avançado para materiais fracionáveis

**Backend**:
- Saída parcial de materiais (cortes de chapas)
- Controle por dimensões (largura x altura)
- Rastreabilidade de posição no estoque
- Otimização de aproveitamento
- Cálculo de sobras e retalhos
- Histórico de cortes

**Frontend**:
- Visualizador gráfico de materiais
- Planejador de cortes
- Otimizador de aproveitamento
- Interface de retalhos
- Relatórios de desperdício

**Critérios de Aceite**:
- [ ] Estoque fracionado funcional
- [ ] Rastreabilidade implementada
- [ ] Otimização de cortes ativa
- [ ] Controle de sobras preciso
- [ ] Visualização gráfica clara

## 🗄️ MODELOS PRISMA

### InventoryItem (Atualizado)
```prisma
model InventoryItem {
  id              String   @id @default(cuid())
  materialId      String
  quantity        Decimal
  availableQty    Decimal  // Quantidade disponível (descontando reservas)
  minStock        Decimal?
  maxStock        Decimal?
  location        String?
  batch           String?
  expiryDate      DateTime?
  dimensions      Json?    // { width, height, thickness, usableArea }
  fractionalData  Json?    // Dados específicos do fracionado
  cost            Decimal  // Custo do lote
  supplier        String?
  invoiceNumber   String?
  receivedDate    DateTime?
  status          String   @default("available") // available, reserved, used, expired
  companyId       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  company         Company @relation(fields: [companyId], references: [id])
  material        Material @relation(fields: [materialId], references: [id])
  movements       InventoryMovement[]
  reservations    InventoryReservation[]
  cuts            FractionalCut[]
  
  @@map("inventory_items")
}
```

### FractionalCut
```prisma
model FractionalCut {
  id              String   @id @default(cuid())
  inventoryId     String
  cutNumber       Int      // Número sequencial do corte
  dimensions      Json     // { x, y, width, height }
  area            Decimal  // Área do corte
  purpose         String?  // Para que foi usado
  orderId         String?  // Ordem relacionada
  quoteId         String?  // Orçamento relacionado
  waste           Boolean  @default(false) // Se é retalho
  usable          Boolean  @default(true)  // Se ainda é utilizável
  cutDate         DateTime @default(now())
  cutBy           String
  
  // Relations
  inventory       InventoryItem @relation(fields: [inventoryId], references: [id])
  cutter          User @relation(fields: [cutBy], references: [id])
  order           Order? @relation(fields: [orderId], references: [id])
  quote           Quote? @relation(fields: [quoteId], references: [id])
  
  @@map("fractional_cuts")
}
```

### InventoryReservation
```prisma
model InventoryReservation {
  id              String   @id @default(cuid())
  inventoryId     String
  quantity        Decimal
  reservedFor     String   // order, quote, production
  referenceId     String   // ID da ordem/orçamento
  dimensions      Json?    // Dimensões específicas reservadas
  reservedAt      DateTime @default(now())
  reservedBy      String
  expiresAt       DateTime?
  status          String   @default("active") // active, consumed, expired, cancelled
  
  // Relations
  inventory       InventoryItem @relation(fields: [inventoryId], references: [id])
  reserver        User @relation(fields: [reservedBy], references: [id])
  
  @@map("inventory_reservations")
}
```

### CuttingPlan
```prisma
model CuttingPlan {
  id              String   @id @default(cuid())
  name            String
  description     String?
  materialId      String
  sheetDimensions Json     // Dimensões da chapa original
  cuts            Json     // Array de cortes planejados
  efficiency      Decimal  // Percentual de aproveitamento
  waste           Decimal  // Área de desperdício
  status          String   @default("planned") // planned, in_progress, completed
  plannedBy       String
  executedBy      String?
  plannedAt       DateTime @default(now())
  executedAt      DateTime?
  companyId       String
  
  // Relations
  material        Material @relation(fields: [materialId], references: [id])
  planner         User @relation("PlannedBy", fields: [plannedBy], references: [id])
  executor        User? @relation("ExecutedBy", fields: [executedBy], references: [id])
  company         Company @relation(fields: [companyId], references: [id])
  
  @@map("cutting_plans")
}
```

## 🧮 SISTEMA DE ESTOQUE FRACIONADO

### Lógica Principal
```typescript
interface FractionalItem {
  id: string
  materialId: string
  originalDimensions: {
    width: number
    height: number
    thickness?: number
  }
  currentDimensions: {
    width: number
    height: number
    usableArea: number
  }
  cuts: CutRecord[]
  availableAreas: AvailableArea[]
  position: {
    location: string
    shelf?: string
    position?: string
  }
}

interface CutRecord {
  id: string
  position: { x: number, y: number }
  dimensions: { width: number, height: number }
  purpose: string
  date: Date
  waste: boolean
}

interface AvailableArea {
  position: { x: number, y: number }
  dimensions: { width: number, height: number }
  area: number
  usable: boolean
}
```

### Algoritmo de Otimização
```typescript
export class CuttingOptimizer {
  /**
   * Otimizar aproveitamento de material
   */
  static optimizeCutting(
    sheetDimensions: Dimensions,
    requiredCuts: RequiredCut[]
  ): OptimizationResult {
    // Implementar algoritmo de bin packing 2D
    // Considerar rotação de peças
    // Minimizar desperdício
    // Retornar melhor combinação
  }
  
  /**
   * Calcular aproveitamento
   */
  static calculateEfficiency(
    totalArea: number,
    usedArea: number
  ): number {
    return (usedArea / totalArea) * 100
  }
}
```

## 📊 DASHBOARD DE ESTOQUE

### KPIs Principais
- Valor total do estoque
- Itens abaixo do estoque mínimo
- Rotatividade de estoque
- Eficiência de aproveitamento
- Desperdício por período
- Previsão de reposição

### Relatórios
- Posição atual de estoque
- Movimentações por período
- Análise de desperdício
- Eficiência de cortes
- Custos de estoque
- Previsão de necessidades

## 🧪 TESTES DE ACEITAÇÃO

### Testes de Estoque Base
```bash
# Teste CRUD de estoque
GET /api/inventory
POST /api/inventory
PUT /api/inventory/:id
DELETE /api/inventory/:id

# Teste movimentações
POST /api/inventory/movements
{
  "type": "out",
  "inventoryId": "xxx",
  "quantity": 2.5,
  "reason": "Produção OS-001"
}
```

### Testes de Estoque Fracionado
```bash
# Teste corte fracionado
POST /api/inventory/fractional-cut
{
  "inventoryId": "xxx",
  "cuts": [
    {
      "position": { "x": 0, "y": 0 },
      "dimensions": { "width": 1, "height": 0.5 },
      "purpose": "Adesivo cliente A"
    }
  ]
}

# Teste otimização
POST /api/inventory/optimize-cutting
{
  "sheetDimensions": { "width": 2, "height": 3 },
  "requiredCuts": [
    { "width": 0.5, "height": 0.3, "quantity": 5 },
    { "width": 1, "height": 0.8, "quantity": 2 }
  ]
}
```

## 📈 MÉTRICAS DE PERFORMANCE

### Targets de Eficiência
- Aproveitamento de material > 85%
- Tempo de localização < 30s
- Precisão de estoque > 98%
- Redução de desperdício > 20%

### Otimizações
- Cache de posições de estoque
- Índices otimizados para buscas
- Algoritmos de corte eficientes
- Interface responsiva para mobile

## 🔄 INTEGRAÇÃO COM OUTRAS FASES

### Depende de:
- **Fase 3**: Sistema de materiais
- **Fase 4**: Precificação com custos reais

### Prepara para:
- **Fase 6**: Reservas para orçamentos/OS
- **Fase 8**: Controle de produção
- **Fase 7**: Valorização de estoque

## 📝 CRITÉRIOS FINAIS DE ACEITE

### Funcionais
- [ ] Gestão básica de estoque operacional
- [ ] Sistema fracionado implementado
- [ ] Otimização de cortes funcional
- [ ] Rastreabilidade completa
- [ ] Relatórios precisos
- [ ] Alertas configurados

### Técnicos
- [ ] Performance de consultas < 2s
- [ ] Interface responsiva
- [ ] Algoritmos otimizados
- [ ] Backup de dados
- [ ] Auditoria completa

### Negócio
- [ ] Redução de desperdício mensurável
- [ ] Controle de custos preciso
- [ ] Otimização de espaço
- [ ] Facilidade de uso
- [ ] ROI positivo

## 🚀 PRÓXIMOS PASSOS

Após conclusão da Fase 5:
1. **Fase 6**: Integrar estoque com orçamentos
2. **Fase 8**: Conectar com produção
3. Monitorar eficiência de aproveitamento
4. Refinar algoritmos de otimização
5. Expandir para outros tipos de material

---

**IMPORTANTE**: O estoque fracionado é uma necessidade específica da comunicação visual. O sistema deve ser intuitivo para operadores e eficiente para gestores, sempre priorizando a redução de desperdício.