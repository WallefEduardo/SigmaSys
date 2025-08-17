# FASE 3 - SISTEMA DE PRODUTOS E FÓRMULAS (Semanas 5-7)

## 🎯 OBJETIVO GERAL

Implementar sistema completo de produtos e fórmulas com engine matemático robusto, cadastro de matérias-primas, equipamentos, processos e acabamentos. Sistema deve ser flexível para diferentes tipos de cálculo e unidades de medida.

## 📋 CRONOGRAMA DETALHADO

### Semana 5: Engine de Fórmulas e Materiais
- **Etapa 3.1**: Engine de Fórmulas (2 dias)
- **Etapa 3.2**: Cadastro de Matérias-Primas (3 dias)

### Semana 6: Equipamentos e Processos
- **Etapa 3.3**: Cadastro de Equipamentos (2.5 dias)
- **Etapa 3.4**: Processos e Setores (2.5 dias)

### Semana 7: Acabamentos e Integração
- **Etapa 3.5**: Sistema de Acabamentos (2 dias)
- **Integração e Testes**: Testes completos e ajustes (3 dias)

## 🏗️ ARQUITETURA DA FASE

### Backend (Real Data)
```
apps/server/src/
├── lib/
│   ├── formulas.ts         # Engine de fórmulas matemáticas
│   ├── units.ts           # Sistema de unidades de medida
│   └── pricing-engine.ts  # Cálculo de custos (base para Fase 4)
├── routers/
│   ├── materials.ts       # CRUD de matérias-primas
│   ├── equipments.ts      # CRUD de equipamentos
│   ├── processes.ts       # CRUD de processos
│   ├── finishes.ts        # CRUD de acabamentos
│   └── products.ts        # CRUD de produtos
└── prisma/
    ├── schema.prisma      # Novos modelos da Fase 3
    └── seeds/phase3-seed.ts # Dados de teste
```

### Frontend (Mock + Real)
```
apps/web/src/app/(dashboard)/cadastros/
├── materias-primas/       # Interface de materiais
├── equipamentos/          # Interface de equipamentos
├── processos/            # Interface de processos
├── acabamentos/          # Interface de acabamentos
└── produtos/             # Interface de produtos
```

## 🔧 ETAPAS DETALHADAS

### **Etapa 3.1: Engine de Fórmulas**
**Objetivo**: Sistema flexível de cálculos matemáticos

**Backend**:
- Parser de fórmulas matemáticas com `mathjs`
- Sistema de unidades de medida (30+ unidades)
- Validação e preview de fórmulas
- Contexto de variáveis (largura, altura, quantidade, etc.)

**Frontend**:
- Construtor visual de fórmulas
- Preview em tempo real
- Validação de sintaxe
- Lista de variáveis disponíveis

**Critérios de Aceite**:
- [ ] Parser de fórmulas funcional com mathjs
- [ ] 30+ unidades implementadas (m², ml, kg, un, etc.)
- [ ] Validação de fórmulas com preview
- [ ] Context variables funcionais

### **Etapa 3.2: Cadastro de Matérias-Primas**
**Objetivo**: Gestão completa de materiais

**Backend**:
- CRUD completo de materiais
- Controle de preços e histórico
- Sistema de unidades diversas
- Gestão de fornecedores
- Controle de estoque mínimo/máximo

**Frontend**:
- Interface de cadastro responsiva
- Busca e filtros avançados
- Histórico de preços visual
- Upload de imagens
- Códigos de barras

**Critérios de Aceite**:
- [ ] CRUD de materiais funcional
- [ ] Histórico de preços implementado
- [ ] Sistema de unidades integrado
- [ ] Fornecedores gerenciados

### **Etapa 3.3: Cadastro de Equipamentos**
**Objetivo**: Gestão de máquinas e equipamentos

**Backend**:
- Dois tipos: impressão e usinagem
- Cálculo de custos por tempo/área
- Configurações específicas por tipo
- Gestão de manutenção
- Capacidade e disponibilidade

**Frontend**:
- Interfaces específicas por tipo
- Calculadora de custos
- Agenda de manutenção
- Dashboards de utilização

**Critérios de Aceite**:
- [ ] Tipos impressão/usinagem implementados
- [ ] Cálculos de custo funcionais
- [ ] Gestão de manutenção ativa
- [ ] Capacidades configuradas

### **Etapa 3.4: Processos e Setores**
**Objetivo**: Gestão de mão de obra

**Backend**:
- CRUD de processos/setores
- Cálculo de tempos por unidade
- Custo/hora por setor
- Vinculação de colaboradores

**Frontend**:
- Interface de cadastro de processos
- Calculadora de tempos
- Gestão de setores
- Relatórios de eficiência

**Critérios de Aceite**:
- [ ] CRUD de processos funcional
- [ ] Cálculos de tempo implementados
- [ ] Custos por setor ativos
- [ ] Setores organizados

### **Etapa 3.5: Sistema de Acabamentos**
**Objetivo**: Acabamentos compostos

**Backend**:
- CRUD de acabamentos
- Composição (material + processo)
- Cálculo de custos combinados
- Reutilização em produtos

**Frontend**:
- Interface de composição
- Preview de custos
- Biblioteca de acabamentos
- Sistema de clonagem

**Critérios de Aceite**:
- [ ] CRUD de acabamentos funcional
- [ ] Composição implementada
- [ ] Cálculos de custo precisos
- [ ] Reutilização ativa

## 🗄️ MODELOS PRISMA

### Material
```prisma
model Material {
  id           String   @id @default(cuid())
  name         String
  description  String?
  code         String?  @unique
  unit         String   // m2, ml, kg, un, etc
  cost         Decimal
  category     String?
  brand        String?
  color        String?
  dimensions   Json?    // width, height, thickness
  tags         String[]
  supplier     String?
  supplierCode String?
  minStock     Decimal?
  maxStock     Decimal?
  location     String?
  barcode      String?
  image        String?
  active       Boolean  @default(true)
  companyId    String
  createdBy    String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  company      Company  @relation(fields: [companyId], references: [id])
  creator      User     @relation(fields: [createdBy], references: [id])
  priceHistory MaterialPriceHistory[]
  productItems ProductMaterial[]
  inventory    InventoryItem[]
}
```

### Equipment
```prisma
model Equipment {
  id               String   @id @default(cuid())
  name             String
  description      String?
  code             String?  @unique
  type             String   // printing, machining
  costPerHour      Decimal
  maintenanceCost  Decimal?
  energyCost       Decimal?
  maxWidth         Decimal?
  maxHeight        Decimal?
  maxThickness     Decimal?
  printingConfig   Json?    // for printing equipment
  machiningConfig  Json?    // for machining equipment
  status           String   @default("available")
  location         String?
  serialNumber     String?
  manufacturer     String?
  model            String?
  year             Int?
  maintenanceInterval Int?  // days
  lastMaintenance  DateTime?
  nextMaintenance  DateTime?
  tags             String[]
  active           Boolean  @default(true)
  companyId        String
  createdBy        String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Relations
  company          Company  @relation(fields: [companyId], references: [id])
  creator          User     @relation(fields: [createdBy], references: [id])
  productItems     ProductEquipment[]
  usageHistory     EquipmentUsage[]
}
```

### Process
```prisma
model Process {
  id           String   @id @default(cuid())
  name         String
  description  String?
  costPerHour  Decimal
  sector       String?
  timeUnit     String   // hour, m2, ml, perimeter, etc
  companyId    String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  company      Company  @relation(fields: [companyId], references: [id])
  productItems ProductProcess[]
}
```

### Product
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
  active      Boolean  @default(true)
  companyId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  company     Company  @relation(fields: [companyId], references: [id])
  materials   ProductMaterial[]
  equipments  ProductEquipment[]
  processes   ProductProcess[]
  finishes    ProductFinish[]
}
```

## 🧪 TESTES DE ACEITAÇÃO

### Testes Backend
```bash
# Teste engine de fórmulas
POST /api/formulas/validate
{
  "formula": "largura * altura * 1.1",
  "context": { "largura": 2, "altura": 1.5 }
}
# Expect: { valid: true, result: 3.3 }

# Teste CRUD materiais
GET /api/materials
POST /api/materials
PUT /api/materials/:id
DELETE /api/materials/:id

# Teste cálculo de produto
POST /api/products/calculate
{
  "productId": "xxx",
  "context": { "largura": 2, "altura": 1.5 }
}
# Expect: cost breakdown detalhado
```

### Testes Frontend
- [ ] Formulários de cadastro funcionais
- [ ] Validações em tempo real
- [ ] Busca e filtros operacionais
- [ ] Responsividade em mobile
- [ ] Integração com backend

## 📊 MÉTRICAS DE SUCESSO

### Performance
- Tempo de cálculo de fórmula < 100ms
- Tempo de carregamento de listas < 2s
- Responsividade mobile completa

### Funcionalidade
- 100% dos CRUDs funcionais
- Engine de fórmulas com 0% erro
- Sistema de unidades completo

### Usabilidade
- Cadastro de produto < 3min
- Busca de material < 5s
- Interface intuitiva

## 🔄 INTEGRAÇÃO COM OUTRAS FASES

### Depende de:
- **Fase 1**: Autenticação e database
- **Fase 2**: Multi-tenancy e usuários

### Prepara para:
- **Fase 4**: Engine de precificação
- **Fase 5**: Estoque fracionado
- **Fase 6**: Orçamentos e OS

## 📝 CRITÉRIOS FINAIS DE ACEITE

- [ ] Engine de fórmulas 100% funcional
- [ ] Todos os CRUDs implementados
- [ ] Sistema de unidades completo
- [ ] Seeds de dados criados
- [ ] Testes de integração passando
- [ ] Documentação atualizada
- [ ] Performance otimizada
- [ ] Frontend responsivo
- [ ] Validações robustas
- [ ] Logs e auditoria ativos

## 🚀 PRÓXIMOS PASSOS

Após conclusão da Fase 3, prosseguir para:
1. **Fase 4**: Engine de Precificação
2. Validar todos os cálculos estão corretos
3. Preparar dados para sistema de orçamentos
4. Documentar fórmulas e padrões

---

**IMPORTANTE**: Esta fase é crítica pois estabelece a base para todo o sistema de precificação. Todos os cálculos devem ser precisos e o sistema flexível para suportar diferentes tipos de produtos da comunicação visual.