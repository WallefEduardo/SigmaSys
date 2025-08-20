# 🎯 ROADMAP - ERP Sistema de Comunicação Visual

## 📋 Visão Geral

Sistema ERP completo para empresas de comunicação visual com foco em:
- Formação de preços inteligente com IA
- Gestão de orçamentos e ordens de serviço
- Controle financeiro robusto
- PCP com Kanban
- Integração WhatsApp
- Estoque fracionado
- Banco de fórmulas flexível

## 🏗️ Arquitetura Base

### Stack Tecnológica
- **Frontend**: Next.js 14+ + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Fastify + tRPC + Prisma + PostgreSQL
- **Monorepo**: Turborepo + pnpm
- **Testes**: Jest + Testing Library + Playwright
- **Estilização**: Tailwind + Framer Motion + Lucide Icons
- **IA**: OpenAI/Anthropic API integration
- **Cache**: Redis + React Query
- **Segurança**: NextAuth.js + Rate limiting + CSP

### Estrutura de Pastas

```
erp-sys/
├── apps/
│   ├── web/                          # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   │   ├── (auth)/          # Auth pages
│   │   │   │   ├── (dashboard)/     # Dashboard layout
│   │   │   │   │   ├── cadastros/   # Registration pages
│   │   │   │   │   ├── comercial/   # Sales & CRM
│   │   │   │   │   ├── financeiro/  # Financial
│   │   │   │   │   ├── producao/    # Production/PCP
│   │   │   │   │   ├── estoque/     # Inventory
│   │   │   │   │   ├── chat/        # WhatsApp integration
│   │   │   │   │   ├── configuracoes/ # Settings
│   │   │   │   │   └── relatorios/  # Reports
│   │   │   │   └── globals.css
│   │   │   ├── components/          # Shared components
│   │   │   │   ├── ui/             # shadcn/ui components
│   │   │   │   ├── forms/          # Form components
│   │   │   │   ├── charts/         # Chart components
│   │   │   │   ├── layout/         # Layout components
│   │   │   │   └── features/       # Feature components
│   │   │   ├── hooks/              # Custom hooks
│   │   │   ├── lib/                # Utilities
│   │   │   │   ├── api.ts          # tRPC client
│   │   │   │   ├── auth.ts         # Auth config
│   │   │   │   ├── theme.ts        # Theme system
│   │   │   │   ├── formulas.ts     # Formula engine
│   │   │   │   └── utils.ts        # General utils
│   │   │   ├── stores/             # Zustand stores
│   │   │   ├── styles/             # Global styles
│   │   │   └── types/              # TypeScript types
│   │   ├── package.json
│   │   └── tailwind.config.js
│   └── server/                      # Backend Fastify
│       ├── src/
│       │   ├── routers/            # tRPC routers
│       │   │   ├── auth.ts
│       │   │   ├── companies.ts
│       │   │   ├── users.ts
│       │   │   ├── products.ts
│       │   │   ├── materials.ts
│       │   │   ├── equipments.ts
│       │   │   ├── processes.ts
│       │   │   ├── quotes.ts
│       │   │   ├── orders.ts
│       │   │   ├── financial.ts
│       │   │   ├── inventory.ts
│       │   │   ├── pcp.ts
│       │   │   ├── chat.ts
│       │   │   └── ai.ts
│       │   ├── lib/                # Server utilities
│       │   │   ├── db.ts           # Prisma client
│       │   │   ├── auth.ts         # Auth middleware
│       │   │   ├── cache.ts        # Redis cache
│       │   │   ├── security.ts     # Security utils
│       │   │   ├── pricing.ts      # Pricing engine
│       │   │   ├── formulas.ts     # Formula parser
│       │   │   └── ai.ts           # AI integrations
│       │   ├── middleware/         # Fastify middleware
│       │   ├── schemas/            # Validation schemas
│       │   ├── services/           # Business logic
│       │   ├── types/              # Server types
│       │   └── index.ts            # Server entry
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seeds/
│       └── package.json
├── packages/                        # Shared packages
│   ├── shared-types/               # Shared TypeScript types
│   ├── ui-components/              # Shared UI components
│   └── eslint-config/              # ESLint config
├── tools/                          # Development tools
├── docs/                           # Documentation
└── package.json                    # Root package.json
```

---

## 🗺️ ROADMAP SEQUENCIAL

### **FASE 1: FUNDAÇÃO E INFRAESTRUTURA (Semanas 1-2)**

#### **Etapa 1.1: Setup Base do Projeto**
**Objetivo**: Configurar infraestrutura base do monorepo

**Tarefas**:
1. Configurar estrutura de pastas completa
2. Setup do sistema de temas (Dark/Light)
3. Configurar componentes base do shadcn/ui
4. Implementar sistema de ícones (Lucide)
5. Setup de animações (Framer Motion)

**Comandos**:
```bash
# Instalar dependências adicionais
pnpm add @radix-ui/react-icons lucide-react framer-motion
pnpm add -D @types/node

# Setup do tema
pnpm add next-themes
```

**Artefatos**:
- `apps/web/src/lib/theme.ts` - Sistema de temas centralizado
- `apps/web/src/components/ui/` - Componentes base do shadcn/ui
- `apps/web/src/components/layout/sidebar.tsx` - Sidebar colapsável
- `apps/web/src/styles/globals.css` - Estilos globais

**Critérios de Aceite**:
- [ ] Projeto executa sem erros com `pnpm dev`
- [ ] Troca de tema Dark/Light funcional
- [ ] Sidebar colapsável com popover quando minimizada
- [ ] Animações básicas implementadas

#### **Etapa 1.2: Autenticação e Autorização**
**Objetivo**: Sistema completo de auth com roles

**Tarefas**:
1. Configurar NextAuth.js
2. Implementar sistema de roles e permissões
3. Criar middleware de autorização
4. Setup de páginas de login/registro

**Comandos**:
```bash
pnpm add next-auth @auth/prisma-adapter
pnpm add bcryptjs jsonwebtoken
pnpm add -D @types/bcryptjs @types/jsonwebtoken
```

**Artefatos**:
- `apps/web/src/lib/auth.ts` - Configuração NextAuth
- `apps/server/src/lib/auth.ts` - Middleware de auth
- `apps/web/src/app/(auth)/` - Páginas de autenticação
- `apps/server/src/routers/auth.ts` - Router de autenticação

**Critérios de Aceite**:
- [ ] Login/logout funcionais
- [ ] Sistema de roles implementado
- [ ] Middleware de autorização ativo
- [ ] Proteção de rotas funcionando

#### **Etapa 1.3: Database Schema Base**
**Objetivo**: Criar schema Prisma completo

**Tarefas**:
1. Definir schema completo do Prisma
2. Configurar relacionamentos
3. Setup de migrations
4. Criar seeds iniciais

**Comandos**:
```bash
pnpm db:push
pnpm db:generate
```

**Artefatos**:
- `apps/server/prisma/schema.prisma` - Schema completo
- `apps/server/prisma/seeds/` - Seeds de dados iniciais

**Critérios de Aceite**:
- [ ] Database criado sem erros
- [ ] Relacionamentos funcionais
- [ ] Seeds executam corretamente

### **FASE 2: CADASTROS FUNDAMENTAIS (Semanas 3-4)**

#### **Etapa 2.1: Sistema de Empresas (Multi-tenancy)**
**Objetivo**: Implementar sistema multi-empresa

**Tarefas**:
1. Criar modelo de empresas
2. Implementar isolamento de dados
3. Interface de superadmin
4. Sistema de planos

**Artefatos**:
- `apps/server/src/routers/companies.ts`
- `apps/web/src/app/(dashboard)/superadmin/`
- `apps/server/src/lib/tenancy.ts`

**Critérios de Aceite**:
- [ ] Isolamento de dados por empresa
- [ ] Interface de superadmin funcional
- [ ] Sistema de planos ativo

#### **Etapa 2.2: Gestão de Usuários e Permissões**
**Objetivo**: Sistema robusto de usuários

**Tarefas**:
1. CRUD de usuários
2. Sistema de permissões granular
3. Interface de gestão de roles
4. Auditoria de ações

**Artefatos**:
- `apps/web/src/app/(dashboard)/configuracoes/usuarios/`
- `apps/server/src/routers/users.ts`
- `apps/server/src/lib/permissions.ts`

**Critérios de Aceite**:
- [ ] CRUD de usuários funcional
- [ ] Permissões granulares ativas
- [ ] Auditoria registrando ações

#### **Etapa 2.3: Cadastro de Clientes (CRM Base)**
**Objetivo**: Sistema completo de clientes

**Tarefas**:
1. CRUD de clientes
2. Histórico de interações
3. Segmentação de clientes
4. Dados para pipeline de vendas

**Artefatos**:
- `apps/web/src/app/(dashboard)/cadastros/clientes/`
- `apps/server/src/routers/clients.ts`

**Critérios de Aceite**:
- [ ] CRUD de clientes funcional
- [ ] Histórico de interações registrado
- [ ] Segmentação implementada

### **FASE 3: SISTEMA DE PRODUTOS E FÓRMULAS (Semanas 5-7)**

#### **Etapa 3.1: Engine de Fórmulas**
**Objetivo**: Sistema flexível de cálculos

**Tarefas**:
1. Parser de fórmulas matemáticas
2. Sistema de unidades de medida
3. Validação e preview de fórmulas
4. Engine de cálculo otimizado

**Comandos**:
```bash
pnpm add mathjs
pnpm add -D @types/mathjs
```

**Artefatos**:
- `apps/server/src/lib/formulas.ts` - Engine de fórmulas
- `apps/web/src/components/forms/formula-builder.tsx`
- `apps/server/src/lib/units.ts` - Sistema de unidades

**Critérios de Aceite**:
- [ ] Parser de fórmulas funcional
- [ ] Unidades de medida implementadas
- [ ] Validação e preview ativos
- [ ] Performance otimizada

#### **Etapa 3.2: Cadastro de Matérias-Primas**
**Objetivo**: Gestão completa de materiais

**Tarefas**:
1. CRUD de matérias-primas
2. Sistema de unidades diversas
3. Controle de preços e fornecedores
4. Histórico de alterações

**Artefatos**:
- `apps/web/src/app/(dashboard)/cadastros/materias-primas/`
- `apps/server/src/routers/materials.ts`

**Critérios de Aceite**:
- [ ] CRUD de materiais funcional
- [ ] Unidades diversas implementadas
- [ ] Controle de preços ativo

#### **Etapa 3.3: Cadastro de Equipamentos**
**Objetivo**: Gestão de máquinas e equipamentos

**Tarefas**:
1. Dois tipos de equipamentos (impressão/usinagem)
2. Cálculo de custos por tempo/m²
3. Gestão de insumos por equipamento
4. Capacidade e disponibilidade

**Artefatos**:
- `apps/web/src/app/(dashboard)/cadastros/equipamentos/`
- `apps/server/src/routers/equipments.ts`
- `apps/server/src/lib/equipment-costing.ts`

**Critérios de Aceite**:
- [ ] Dois tipos de equipamentos funcionais
- [ ] Cálculo de custos implementado
- [ ] Gestão de insumos ativa

#### **Etapa 3.4: Processos e Setores**
**Objetivo**: Gestão de mão de obra e processos

**Tarefas**:
1. CRUD de processos/setores
2. Cálculo de tempos por unidade
3. Custo hora por setor
4. Vinculação de colaboradores

**Artefatos**:
- `apps/web/src/app/(dashboard)/cadastros/processos/`
- `apps/server/src/routers/processes.ts`

**Critérios de Aceite**:
- [ ] CRUD de processos funcional
- [ ] Cálculo de tempos implementado
- [ ] Custos por setor ativos

#### **Etapa 3.5: Sistema de Acabamentos**
**Objetivo**: Gestão de acabamentos complexos

**Tarefas**:
1. CRUD de acabamentos
2. Composição (material + processo)
3. Cálculo de custos combinados
4. Reutilização em produtos

**Artefatos**:
- `apps/web/src/app/(dashboard)/cadastros/acabamentos/`
- `apps/server/src/routers/finishes.ts`

**Critérios de Aceite**:
- [ ] CRUD de acabamentos funcional
- [ ] Composição implementada
- [ ] Reutilização ativa

### **FASE 4: ENGINE DE PRECIFICAÇÃO (Semanas 8-9)**

#### **Etapa 4.1: Sistema de Produtos Complexos**
**Objetivo**: Cadastro robusto de produtos/serviços

**Tarefas**:
1. CRUD de produtos
2. Composição complexa (materiais + processos + equipamentos)
3. Sistema de checklist inteligente
4. Cálculo automático de custos

**Artefatos**:
- `apps/web/src/app/(dashboard)/cadastros/produtos/`
- `apps/server/src/routers/products.ts`
- `apps/server/src/lib/product-costing.ts`

**Critérios de Aceite**:
- [ ] CRUD de produtos funcional
- [ ] Composição complexa implementada
- [ ] Checklist inteligente ativo
- [ ] Cálculo automático preciso

#### **Etapa 4.2: Engine de Precificação (Custeio Direto)**
**Objetivo**: Sistema robusto de formação de preços

**Tarefas**:
1. Implementar método de custeio direto
2. Cálculo de custos fixos proporcionais
3. Sistema de margens (Mark-up, Margem líquida, Preço final)
4. Relatórios de composição de custos

**Artefatos**:
- `apps/server/src/lib/pricing-engine.ts`
- `apps/web/src/components/charts/cost-breakdown.tsx`

**Critérios de Aceite**:
- [ ] Custeio direto implementado
- [ ] Margens configuráveis
- [ ] Relatórios precisos

#### **Etapa 4.3: Parâmetros do Sistema**
**Objetivo**: Configuração de custos fixos

**Tarefas**:
1. Parâmetros manuais e automáticos
2. Média de faturamento/despesas
3. Transição automática por data
4. Impacto nos cálculos

**Artefatos**:
- `apps/web/src/app/(dashboard)/configuracoes/parametros/`
- `apps/server/src/lib/parameters.ts`

**Critérios de Aceite**:
- [ ] Parâmetros configuráveis
- [ ] Transição automática funcional
- [ ] Impacto nos cálculos correto

### **FASE 5: ESTOQUE INTELIGENTE (Semanas 10-11)**

#### **Etapa 5.1: Gestão de Estoque Base**
**Objetivo**: Controle básico de estoque

**Tarefas**:
1. CRUD de itens de estoque
2. Movimentações (entrada/saída)
3. Controle de lotes
4. Relatórios básicos

**Artefatos**:
- `apps/web/src/app/(dashboard)/estoque/`
- `apps/server/src/routers/inventory.ts`

**Critérios de Aceite**:
- [ ] CRUD de estoque funcional
- [ ] Movimentações registradas
- [ ] Controle de lotes ativo

#### **Etapa 5.2: Estoque Fracionado**
**Objetivo**: Controle avançado de estoque

**Tarefas**:
1. Saída parcial de materiais
2. Controle por dimensões
3. Rastreabilidade de posição
4. Otimização de cortes

**Artefatos**:
- `apps/server/src/lib/fractional-inventory.ts`
- `apps/web/src/components/inventory/cutting-optimizer.tsx`

**Critérios de Aceite**:
- [ ] Estoque fracionado funcional
- [ ] Rastreabilidade implementada
- [ ] Otimização de cortes ativa

### **FASE 6: COMERCIAL E CRM (Semanas 12-13)**

#### **Etapa 6.1: Sistema de Orçamentos**
**Objetivo**: Criação robusta de orçamentos

**Tarefas**:
1. CRUD de orçamentos
2. Uso do checklist inteligente
3. Cálculo automático com composição de custos
4. Aprovação e versionamento

**Artefatos**:
- `apps/web/src/app/(dashboard)/comercial/orcamentos/`
- `apps/server/src/routers/quotes.ts`

**Critérios de Aceite**:
- [ ] CRUD de orçamentos funcional
- [ ] Checklist inteligente ativo
- [ ] Cálculo automático preciso
- [ ] Versionamento implementado

#### **Etapa 6.2: Funil de Vendas (Kanban)**
**Objetivo**: Gestão visual de oportunidades

**Tarefas**:
1. Kanban customizável
2. Métricas de conversão
3. Automações de pipeline
4. Relatórios de performance

**Artefatos**:
- `apps/web/src/app/(dashboard)/comercial/funil/`
- `apps/web/src/components/kanban/sales-board.tsx`

**Critérios de Aceite**:
- [ ] Kanban customizável funcional
- [ ] Métricas implementadas
- [ ] Automações ativas

#### **Etapa 6.3: Ordens de Serviço**
**Objetivo**: Conversão de orçamentos e criação direta

**Tarefas**:
1. Conversão automática orçamento → OS
2. Criação direta de OS
3. Gestão de status e progresso
4. Integração com PCP

**Artefatos**:
- `apps/web/src/app/(dashboard)/comercial/ordens-servico/`
- `apps/server/src/routers/orders.ts`

**Critérios de Aceite**:
- [ ] Conversão automática funcional
- [ ] Criação direta implementada
- [ ] Integração com PCP ativa

### **FASE 7: FINANCEIRO COMPLETO (Semanas 14-16)**

#### **Etapa 7.1: Contas a Pagar e Receber**
**Objetivo**: Gestão financeira básica

**Tarefas**:
1. CRUD de contas a pagar/receber
2. Vencimentos e notificações
3. Baixas e conciliação
4. Relatórios financeiros

**Artefatos**:
- `apps/web/src/app/(dashboard)/financeiro/contas-pagar/`
- `apps/web/src/app/(dashboard)/financeiro/contas-receber/`
- `apps/server/src/routers/financial.ts`

**Critérios de Aceite**:
- [ ] CRUD de contas funcional
- [ ] Notificações ativas
- [ ] Conciliação implementada

#### **Etapa 7.2: Plano de Contas e Centros de Custo**
**Objetivo**: Estrutura contábil robusta

**Tarefas**:
1. Hierarquia de contas
2. Centros de custo
3. Rateio automático
4. Relatórios gerenciais

**Artefatos**:
- `apps/web/src/app/(dashboard)/financeiro/plano-contas/`
- `apps/server/src/lib/accounting.ts`

**Critérios de Aceite**:
- [ ] Hierarquia implementada
- [ ] Rateio automático funcional
- [ ] Relatórios precisos

#### **Etapa 7.3: Formas de Pagamento e Comissões**
**Objetivo**: Gestão completa de recebimentos

**Tarefas**:
1. Cadastro de formas de pagamento
2. Custos de cartão de crédito
3. Regras de comissão
4. Cálculo automático

**Artefatos**:
- `apps/web/src/app/(dashboard)/financeiro/formas-pagamento/`
- `apps/server/src/lib/commissions.ts`

**Critérios de Aceite**:
- [ ] Formas de pagamento configuradas
- [ ] Custos de cartão implementados
- [ ] Comissões automatizadas

#### **Etapa 7.4: Ponto de Equilíbrio**
**Objetivo**: Análise financeira avançada

**Tarefas**:
1. Cálculo de ponto de equilíbrio
2. Projeções e cenários
3. Gráficos interativos
4. Alertas e metas

**Artefatos**:
- `apps/web/src/app/(dashboard)/financeiro/ponto-equilibrio/`
- `apps/web/src/components/charts/break-even.tsx`

**Critérios de Aceite**:
- [ ] Cálculo preciso implementado
- [ ] Gráficos interativos funcionais
- [ ] Alertas configurados

### **FASE 8: PCP E PRODUÇÃO (Semanas 17-18)**

#### **Etapa 8.1: PCP com Kanban**
**Objetivo**: Controle visual da produção

**Tarefas**:
1. Kanban de produção customizável
2. Capacidade de máquinas
3. Sequenciamento automático
4. Métricas de performance

**Artefatos**:
- `apps/web/src/app/(dashboard)/producao/pcp/`
- `apps/web/src/components/kanban/production-board.tsx`

**Critérios de Aceite**:
- [ ] Kanban de produção funcional
- [ ] Capacidade configurada
- [ ] Sequenciamento implementado

#### **Etapa 8.2: Apontamento de Produção**
**Objetivo**: Registro de tempos e custos reais

**Tarefas**:
1. Interface de apontamento
2. Comparação real vs planejado
3. Controle de qualidade
4. Relatórios de eficiência

**Artefatos**:
- `apps/web/src/app/(dashboard)/producao/apontamento/`
- `apps/server/src/lib/production-tracking.ts`

**Critérios de Aceite**:
- [ ] Apontamento funcional
- [ ] Comparação implementada
- [ ] Relatórios precisos

### **FASE 9: INTEGRAÇÃO WHATSAPP (Semana 19)**

#### **Etapa 9.1: Chat WhatsApp**
**Objetivo**: Integração completa com WhatsApp

**Tarefas**:
1. Integração Baileys e Meta Oficial
2. Chatbot inteligente
3. Integração com OS/orçamentos
4. Histórico unificado

**Comandos**:
```bash
pnpm add @whiskeysockets/baileys qrcode
```

**Artefatos**:
- `apps/web/src/app/(dashboard)/chat/`
- `apps/server/src/lib/whatsapp.ts`

**Critérios de Aceite**:
- [ ] Duas APIs funcionais
- [ ] Chatbot implementado
- [ ] Integração com sistema ativa

### **FASE 10: INTELIGÊNCIA ARTIFICIAL (Semanas 20-21)**

#### **Etapa 10.1: IA para Cadastros**
**Objetivo**: Assistente para cadastro de produtos

**Tarefas**:
1. IA para sugestão de materiais
2. Geração automática de fórmulas
3. Otimização de processos
4. Assistente de precificação

**Comandos**:
```bash
pnpm add openai @anthropic-ai/sdk
```

**Artefatos**:
- `apps/server/src/lib/ai.ts`
- `apps/web/src/components/ai/product-assistant.tsx`

**Critérios de Aceite**:
- [ ] IA de cadastros funcional
- [ ] Geração de fórmulas ativa
- [ ] Assistente de preços implementado

#### **Etapa 10.2: IA para Relatórios**
**Objetivo**: Insights automáticos

**Tarefas**:
1. Análise automática de dados
2. Geração de insights
3. Recomendações de negócio
4. Relatórios em linguagem natural

**Artefatos**:
- `apps/web/src/components/ai/report-assistant.tsx`
- `apps/server/src/lib/ai-analytics.ts`

**Critérios de Aceite**:
- [ ] Análise automática funcional
- [ ] Insights precisos
- [ ] Relatórios em linguagem natural

### **FASE 11: SEGURANÇA E PERFORMANCE (Semana 22)**

#### **Etapa 11.1: Segurança Avançada**
**Objetivo**: Sistema robusto de segurança

**Tarefas**:
1. Rate limiting
2. CSP e headers de segurança
3. Auditoria completa
4. Sanitização de dados

**Comandos**:
```bash
pnpm add helmet express-rate-limit
```

**Artefatos**:
- `apps/server/src/middleware/security.ts`
- `apps/server/src/lib/audit.ts`

**Critérios de Aceite**:
- [ ] Rate limiting ativo
- [ ] Headers de segurança configurados
- [ ] Auditoria implementada

#### **Etapa 11.2: Sistema de Logs Estruturado**
**Objetivo**: Logs profissionais por ambiente

**Tarefas**:
1. Configurar Pino para logs estruturados
2. Logs coloridos em desenvolvimento
3. Logs JSON estruturados em produção
4. Context loggers por módulo
5. Performance tracking

**Comandos**:
```bash
pnpm add pino pino-pretty
```

**Artefatos**:
- `apps/server/src/lib/logger.ts` - Sistema de logs centralizado
- Context loggers: auth, database, api, error
- Performance logger para operações críticas

**Configuração por Ambiente**:
```typescript
// Desenvolvimento: logs coloridos e verbosos
level: 'debug',
transport: { target: 'pino-pretty' }

// Produção: logs JSON estruturados
level: 'info',
formatters: structured JSON
base: { service, version, hostname }
```

**Critérios de Aceite**:
- [ ] Logs coloridos em desenvolvimento
- [ ] Logs estruturados em produção
- [ ] Context loggers funcionais
- [ ] Performance tracking ativo

#### **Etapa 11.3: Cache e Performance**
**Objetivo**: Otimização máxima

**Tarefas**:
1. Cache Redis
2. Compressão de dados
3. Lazy loading
4. Otimização de queries

**Comandos**:
```bash
pnpm add redis ioredis compression
```

**Artefatos**:
- `apps/server/src/lib/cache.ts`
- `apps/web/src/lib/performance.ts`

**Critérios de Aceite**:
- [ ] Cache Redis funcional
- [ ] Compressão implementada
- [ ] Performance otimizada

### **FASE 12: TESTES E QUALIDADE (Semana 23)**

#### **Etapa 12.1: Testes Automatizados**
**Objetivo**: Cobertura completa de testes

**Tarefas**:
1. Testes unitários (Jest)
2. Testes de integração
3. Testes E2E (Playwright)
4. Cobertura de código

**Comandos**:
```bash
pnpm add -D jest @testing-library/react @testing-library/jest-dom playwright
```

**Artefatos**:
- `apps/web/src/__tests__/`
- `apps/server/src/__tests__/`
- `tests/e2e/`

**Critérios de Aceite**:
- [ ] Cobertura >80%
- [ ] Testes E2E funcionais
- [ ] CI/CD configurado

### **FASE 13: DOCUMENTAÇÃO E DEPLOY (Semana 24)**

#### **Etapa 13.1: Documentação Completa**
**Objetivo**: Documentação técnica e do usuário

**Tarefas**:
1. Documentação da API
2. Manual do usuário
3. Guia de instalação
4. Troubleshooting

**Artefatos**:
- `docs/api/`
- `docs/user-manual/`
- `docs/installation/`

**Critérios de Aceite**:
- [ ] API documentada
- [ ] Manual do usuário completo
- [ ] Guia de instalação funcional

#### **Etapa 13.2: Deploy e Produção**
**Objetivo**: Sistema em produção

**Tarefas**:
1. Configuração de produção
2. CI/CD pipeline
3. Monitoramento
4. Backup automático

**Artefatos**:
- `.github/workflows/`
- `docker-compose.yml`
- `docs/deployment/`

**Critérios de Aceite**:
- [ ] Deploy automatizado
- [ ] Monitoramento ativo
- [ ] Backup configurado

---

## 📊 MODELOS PRISMA BASE

```prisma
// schema.prisma base
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Company {
  id          String   @id @default(cuid())
  name        String
  cnpj        String?  @unique
  email       String?
  phone       String?
  address     String?
  plan        String   @default("basic")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users       User[]
  clients     Client[]
  products    Product[]
  materials   Material[]
  equipments  Equipment[]
  processes   Process[]
  quotes      Quote[]
  orders      Order[]
  inventory   InventoryItem[]
  accounts    Account[]
  parameters  Parameter[]

  @@map("companies")
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String
  role        String   @default("user")
  permissions Json?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  
  @@map("users")
}

model Client {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  document    String?
  address     String?
  birthday    DateTime?
  segment     String?
  tags        String[]
  notes       String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  quotes      Quote[]
  orders      Order[]

  @@map("clients")
}

model Material {
  id           String   @id @default(cuid())
  name         String
  description  String?
  unit         String   // m2, ml, un, kg, etc
  cost         Decimal
  supplier     String?
  minStock     Decimal?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id])
  productItems ProductMaterial[]
  inventory    InventoryItem[]

  @@map("materials")
}

model Equipment {
  id            String   @id @default(cuid())
  name          String
  type          String   // impression, machining
  costPerHour   Decimal
  capacity      Json     // specific configs per type
  maintenance   Json?
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id])
  productItems  ProductEquipment[]

  @@map("equipments")
}

model Process {
  id           String   @id @default(cuid())
  name         String
  description  String?
  costPerHour  Decimal
  sector       String?
  timeUnit     String   // hour, m2, ml, perimeter, etc
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id])
  productItems ProductProcess[]

  @@map("processes")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String?
  formula     Json?    // pricing formula
  checklist   Json?    // intelligent checklist
  margin      Json     // markup, liquid margin, final price
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  materials   ProductMaterial[]
  equipments  ProductEquipment[]
  processes   ProductProcess[]
  finishes    ProductFinish[]
  quoteItems  QuoteItem[]
  orderItems  OrderItem[]

  @@map("products")
}

model ProductMaterial {
  id         String   @id @default(cuid())
  quantity   Decimal
  formula    String?  // calculation formula
  createdAt  DateTime @default(now())

  // Relations
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  materialId String
  material   Material @relation(fields: [materialId], references: [id])

  @@map("product_materials")
}

model ProductEquipment {
  id          String   @id @default(cuid())
  timeNeeded  Decimal
  formula     String?
  createdAt   DateTime @default(now())

  // Relations
  productId   String
  product     Product   @relation(fields: [productId], references: [id])
  equipmentId String
  equipment   Equipment @relation(fields: [equipmentId], references: [id])

  @@map("product_equipments")
}

model ProductProcess {
  id         String   @id @default(cuid())
  timeNeeded Decimal
  formula    String?
  createdAt  DateTime @default(now())

  // Relations
  productId  String
  product    Product @relation(fields: [productId], references: [id])
  processId  String
  process    Process @relation(fields: [processId], references: [id])

  @@map("product_processes")
}

model ProductFinish {
  id        String   @id @default(cuid())
  quantity  Decimal
  createdAt DateTime @default(now())

  // Relations
  productId String
  product   Product @relation(fields: [productId], references: [id])
  finishId  String
  finish    Finish  @relation(fields: [finishId], references: [id])

  @@map("product_finishes")
}

model Finish {
  id          String   @id @default(cuid())
  name        String
  description String?
  composition Json     // materials + processes
  cost        Decimal
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  products    ProductFinish[]

  @@map("finishes")
}

model Quote {
  id          String   @id @default(cuid())
  number      String   @unique
  title       String
  description String?
  status      String   @default("draft") // draft, sent, approved, rejected
  totalCost   Decimal
  totalPrice  Decimal
  margin      Decimal
  validUntil  DateTime?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company    @relation(fields: [companyId], references: [id])
  clientId    String
  client      Client     @relation(fields: [clientId], references: [id])
  items       QuoteItem[]
  order       Order?

  @@map("quotes")
}

model QuoteItem {
  id          String   @id @default(cuid())
  quantity    Decimal
  unitCost    Decimal
  unitPrice   Decimal
  totalCost   Decimal
  totalPrice  Decimal
  checklist   Json?    // filled checklist
  createdAt   DateTime @default(now())

  // Relations
  quoteId     String
  quote       Quote   @relation(fields: [quoteId], references: [id])
  productId   String
  product     Product @relation(fields: [productId], references: [id])

  @@map("quote_items")
}

model Order {
  id          String   @id @default(cuid())
  number      String   @unique
  title       String
  description String?
  status      String   @default("pending") // pending, production, completed, delivered
  totalCost   Decimal
  totalPrice  Decimal
  startDate   DateTime?
  deliveryDate DateTime?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company    @relation(fields: [companyId], references: [id])
  clientId    String
  client      Client     @relation(fields: [clientId], references: [id])
  quoteId     String?    @unique
  quote       Quote?     @relation(fields: [quoteId], references: [id])
  items       OrderItem[]

  @@map("orders")
}

model OrderItem {
  id          String   @id @default(cuid())
  quantity    Decimal
  unitCost    Decimal
  unitPrice   Decimal
  totalCost   Decimal
  totalPrice  Decimal
  status      String   @default("pending")
  createdAt   DateTime @default(now())

  // Relations
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id])
  productId   String
  product     Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model InventoryItem {
  id          String   @id @default(cuid())
  quantity    Decimal
  minStock    Decimal?
  location    String?
  batch       String?
  dimensions  Json?    // for fractional inventory
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  materialId  String
  material    Material @relation(fields: [materialId], references: [id])
  movements   InventoryMovement[]

  @@map("inventory_items")
}

model InventoryMovement {
  id          String   @id @default(cuid())
  type        String   // in, out
  quantity    Decimal
  reason      String
  reference   String?  // order, adjustment, etc
  createdAt   DateTime @default(now())

  // Relations
  inventoryId String
  inventory   InventoryItem @relation(fields: [inventoryId], references: [id])

  @@map("inventory_movements")
}

model Account {
  id          String   @id @default(cuid())
  type        String   // receivable, payable
  description String
  amount      Decimal
  dueDate     DateTime
  paidDate    DateTime?
  status      String   @default("pending") // pending, paid, overdue
  category    String?
  costCenter  String?
  reference   String?  // order, invoice, etc
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company @relation(fields: [companyId], references: [id])

  @@map("accounts")
}

model Parameter {
  id            String   @id @default(cuid())
  name          String
  value         Json
  type          String   // manual, automatic
  validUntil    DateTime?
  description   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  companyId     String
  company       Company @relation(fields: [companyId], references: [id])

  @@map("parameters")
}

// Adicionar outros modelos conforme necessário...
```

---

## 🎨 SISTEMA DE TEMAS

### Cores Base (apps/web/src/lib/theme.ts)

```typescript
export const themeColors = {
  light: {
    primary: "#151C24",      // Cinza escuro principal
    secondary: "#58DDAA",    // Verde claro para botões e elementos interativos
    accent: "#3b82f6",
    background: "#ffffff",
    foreground: "#151C24",
    muted: "#f7fafc",
    border: "#e2e8f0",
    success: "#58DDAA",
    warning: "#d69e2e",
    error: "#e53e3e",
    info: "#3182ce",
    // Texto sobre secondary (botões verdes)
    "secondary-foreground": "#151C24"  // Texto escuro sobre fundo verde
  },
  dark: {
    primary: "#ffffff",
    secondary: "#58DDAA",    // Verde claro mantido no dark mode
    accent: "#63b3ed",
    background: "#151C24",   // Fundo escuro principal
    foreground: "#ffffff",
    muted: "#2d3748",
    border: "#4a5568",
    success: "#58DDAA",
    warning: "#d69e2e",
    error: "#e53e3e",
    info: "#63b3ed",
    // Texto sobre secondary (botões verdes)
    "secondary-foreground": "#151C24"  // Texto escuro sobre fundo verde
  }
}

// Regras de Contraste para Secondary
export const contrastRules = {
  secondary: {
    background: "#58DDAA",     // Verde claro para botões
    foreground: "#151C24",     // Texto escuro (primary) para contraste
    description: "Todos os textos sobre backgrounds #58DDAA devem usar cor escura (#151C24) para garantir legibilidade"
  }
}

export const animations = {
  fast: "150ms ease",
  normal: "300ms ease",
  slow: "500ms ease",
  bounce: "600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)"
}
```

---

## 🔒 PLANO DE SEGURANÇA

### Headers e Middleware
```typescript
// apps/server/src/middleware/security.ts
export const securityMiddleware = {
  rateLimit: "100 req/min",
  csp: "strict",
  cors: "restricted",
  headers: [
    "X-Frame-Options: DENY",
    "X-Content-Type-Options: nosniff",
    "Referrer-Policy: strict-origin-when-cross-origin"
  ]
}
```

### Auditoria
- Log de todas as ações
- Rastro de alterações
- Detecção de anomalias
- Backup automático

---

## 🧪 PLANO DE TESTES

### Pirâmide de Testes
1. **Unitários (70%)**: Jest + Testing Library
2. **Integração (20%)**: Supertest + Prisma
3. **E2E (10%)**: Playwright

### Cobertura Mínima
- Funções críticas: 95%
- Componentes: 85%
- Integração: 80%
- E2E: Fluxos principais

---

## 🤖 PLANO DE IA

### Pontos de Integração
1. **Cadastro de Produtos**: Sugestão de materiais/processos
2. **Precificação**: Otimização de margens
3. **Relatórios**: Insights automáticos
4. **Chat**: Assistente virtual
5. **PCP**: Otimização de sequenciamento

### APIs Suportadas
- OpenAI GPT-4
- Anthropic Claude
- Google Gemini (fallback)

---

## 📈 MÉTRICAS DE SUCESSO

### Performance
- Tempo de carregamento < 2s
- Tempo de resposta API < 500ms
- Uptime > 99.9%

### Usabilidade
- Tempo de cadastro de produto < 5min
- Geração de orçamento < 3min
- Taxa de erro < 1%

### Negócio
- Redução de 40% no tempo de precificação
- Aumento de 25% na precisão de custos
- ROI positivo em 6 meses

---

## 🚀 COMANDOS DE DESENVOLVIMENTO

```bash
# Desenvolvimento
pnpm dev                    # Inicia tudo
pnpm dev:web               # Apenas frontend
pnpm dev:server            # Apenas backend

# Database
pnpm db:push               # Atualiza schema
pnpm db:studio             # Interface visual
pnpm db:generate           # Gera client

# Qualidade
pnpm check                 # Lint + format
pnpm test                  # Todos os testes
pnpm test:unit             # Testes unitários
pnpm test:e2e              # Testes E2E

# Build
pnpm build                 # Build produção
pnpm start                 # Inicia produção
```

---

Este roadmap garante um desenvolvimento sequencial, onde cada etapa constrói sobre a anterior, mantendo escalabilidade, segurança e performance em todos os níveis. O sistema será moderno, intuitivo e completamente funcional para empresas de comunicação visual.