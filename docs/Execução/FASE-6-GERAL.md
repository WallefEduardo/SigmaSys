# FASE 6 - COMERCIAL E CRM (Semanas 12-13)

## 🎯 OBJETIVO GERAL

Implementar sistema completo de gestão comercial com foco em orçamentos inteligentes, funil de vendas em Kanban, e ordens de serviço integradas. Sistema deve usar todo o poder do engine de precificação desenvolvido na Fase 4.

## 📋 CRONOGRAMA DETALHADO

### Semana 12: Orçamentos e Funil
- **Etapa 6.1**: Sistema de Orçamentos (2.5 dias)
- **Etapa 6.2**: Funil de Vendas (Kanban) (2.5 dias)

### Semana 13: Ordens de Serviço
- **Etapa 6.3**: Ordens de Serviço (3 dias)
- **Integração e Testes**: Validação completa (2 dias)

## 🏗️ ARQUITETURA DA FASE

### Backend
- Sistema de orçamentos com versionamento
- Funil de vendas configurável
- Conversão automática orçamento → OS
- Integração completa com precificação
- Workflow de aprovações

### Frontend
- Interface de criação de orçamentos
- Kanban drag-and-drop para funil
- Dashboard comercial
- Relatórios de conversão
- Pipeline de vendas visual

## 🔧 ETAPAS DETALHADAS

### **Etapa 6.1: Sistema de Orçamentos**
- CRUD completo de orçamentos
- Uso do checklist inteligente de produtos
- Cálculo automático com engine de precificação
- Sistema de aprovação e versionamento
- Templates e clonagem
- Exportação em PDF/email

### **Etapa 6.2: Funil de Vendas (Kanban)**
- Kanban customizável por empresa
- Métricas de conversão em tempo real
- Automações de pipeline
- Notificações e follow-ups
- Relatórios de performance
- Integração com WhatsApp (preparação)

### **Etapa 6.3: Ordens de Serviço**
- Conversão automática orçamento → OS
- Criação direta de OS
- Gestão de status e progresso
- Integração com PCP (preparação)
- Controle de prazos
- Assinatura digital

## 🗄️ MODELOS PRINCIPAIS

### Quote (Orçamento)
```prisma
model Quote {
  id              String   @id @default(cuid())
  number          String   @unique
  title           String
  description     String?
  version         Int      @default(1)
  status          String   @default("draft")
  stage           String?  // Estágio no funil
  totalCost       Decimal
  totalPrice      Decimal
  margin          Decimal
  validUntil      DateTime?
  approvedAt      DateTime?
  approvedBy      String?
  clientNotes     String?
  internalNotes   String?
  template        Boolean  @default(false)
  companyId       String
  clientId        String
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  company         Company @relation(fields: [companyId], references: [id])
  client          Client @relation(fields: [clientId], references: [id])
  creator         User @relation(fields: [createdBy], references: [id])
  items           QuoteItem[]
  order           Order?
  versions        Quote[] @relation("QuoteVersions")
  parent          Quote? @relation("QuoteVersions", fields: [parentId], references: [id])
  parentId        String?
  
  @@map("quotes")
}
```

### SalesPipeline
```prisma
model SalesPipeline {
  id          String   @id @default(cuid())
  name        String
  description String?
  stages      Json     // Array de estágios configuráveis
  rules       Json?    // Regras de automação
  active      Boolean  @default(true)
  companyId   String
  createdAt   DateTime @default(now())
  
  // Relations
  company     Company @relation(fields: [companyId], references: [id])
  
  @@map("sales_pipelines")
}
```

## 📊 CRITÉRIOS DE ACEITE

### Funcionais
- [ ] Orçamentos com precificação automática
- [ ] Funil de vendas configurável
- [ ] Conversão orçamento → OS
- [ ] Sistema de aprovações
- [ ] Relatórios comerciais
- [ ] Templates funcionais

### Técnicos
- [ ] Performance < 2s para cálculos
- [ ] Kanban responsivo
- [ ] Exportação PDF
- [ ] Versionamento correto
- [ ] Auditoria completa

### Negócio
- [ ] Aumento da taxa de conversão
- [ ] Redução do tempo de criação
- [ ] Padronização de processos
- [ ] Visibilidade do pipeline
- [ ] ROI mensurável

---

**IMPORTANTE**: Esta fase integra todo o trabalho anterior (produtos, precificação) em um sistema comercial completo e intuitivo.