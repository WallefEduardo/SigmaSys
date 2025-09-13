# Dashboard Financeiro - Roadmap Completo

## 📋 Visão Geral do Projeto

Dashboard financeiro moderno e estilizado para controle de orçado vs realizado, desenvolvido como SaaS com Next.js, PostgreSQL e Redis.

### 🎯 Funcionalidades Principais
- **Orçado**: Sistema dinâmico para criar categorias de orçamento (Gastos, Gastos Fixos, Receitas, Vendas, etc.)
- **Realizado**: Registro das movimentações realizadas 
- **Dashboard**: Gráficos interativos e modernos para análise
- **Multi-tenant**: Sistema SaaS com cadastro de empresas
- **Planos**: Sistema de assinaturas e planos
- **Autenticação**: Sistema seguro de login e registro

### 🛠️ Stack Tecnológica
- **Frontend/Backend**: Next.js 14+ (App Router)
- **Banco de Dados**: PostgreSQL (Docker)
- **Cache**: Redis (Docker)
- **UI**: Tailwind CSS + shadcn/ui
- **Gráficos**: Chart.js ou Recharts
- **Autenticação**: NextAuth.js
- **ORM**: Prisma
- **Containerização**: Docker Compose (apenas DB e Redis)

---

## 🏗️ Estrutura do Projeto

```
dashboardfinanceiro/
├── src/
│   ├── app/                 # App Router (Next.js 14)
│   │   ├── (auth)/         # Grupo de rotas de autenticação
│   │   ├── (dashboard)/    # Grupo de rotas do dashboard
│   │   ├── api/           # API Routes
│   │   └── globals.css    # Estilos globais
│   ├── components/        # Componentes reutilizáveis
│   │   ├── ui/           # Componentes shadcn/ui
│   │   ├── charts/       # Componentes de gráficos
│   │   └── forms/        # Formulários
│   ├── lib/              # Utilitários e configurações
│   ├── types/            # Tipos TypeScript
│   └── hooks/            # Custom hooks
├── prisma/               # Schema e migrações
├── docker-compose.yml    # PostgreSQL + Redis
└── .env.local           # Variáveis de ambiente
```

---

## 📊 Modelagem de Dados

### Principais Entidades

```sql
-- Empresas (Multi-tenant)
Companies
├── id, name, slug
├── plan_id, subscription_status
└── created_at, updated_at

-- Usuários
Users
├── id, email, name, password_hash
├── company_id (FK)
└── role (admin, user)

-- Categorias de Orçamento (Dinâmicas)
BudgetCategories
├── id, name, type (receita/despesa)
├── company_id (FK)
└── color, icon

-- Orçamentos Mensais
Budgets
├── id, category_id (FK), company_id (FK)
├── month, year, planned_amount
└── created_at, updated_at

-- Realizados
Transactions
├── id, category_id (FK), company_id (FK)
├── amount, description, date
└── created_at, updated_at

-- Planos
Plans
├── id, name, price, features
└── max_users, max_categories
```

---

## 🎨 Interface e UX

### Páginas Principais

1. **Landing Page** - Apresentação do produto
2. **Login/Registro** - Autenticação segura
3. **Dashboard** - Visão geral com gráficos
4. **Orçamentos** - CRUD de categorias e valores orçados
5. **Realizados** - Registro de movimentações
6. **Relatórios** - Análises detalhadas
7. **Configurações** - Perfil, empresa e planos

### Componentes de Dashboard

- **Cards de Resumo**: Orçado vs Realizado
- **Gráfico de Pizza**: Distribuição por categoria
- **Gráfico de Barras**: Comparativo mensal
- **Linha do Tempo**: Evolução ao longo do tempo
- **Tabela de Transações**: Últimas movimentações

---

## 🚀 Fases de Desenvolvimento

### **FASE 1: Configuração Base** (2-3 dias)

#### 1.1 Configuração do Ambiente
- [ ] Inicializar projeto Next.js 14 com TypeScript
- [ ] Configurar Tailwind CSS + shadcn/ui
- [ ] Criar docker-compose.yml (PostgreSQL + Redis)
- [ ] Configurar Prisma ORM
- [ ] Configurar NextAuth.js
- [ ] Estrutura de pastas e arquivos base

#### 1.2 Banco de Dados
- [ ] Criar schema Prisma completo
- [ ] Executar primeira migração
- [ ] Configurar conexão com PostgreSQL
- [ ] Configurar Redis para cache/sessões
- [ ] Seeds básicos (planos, dados de teste)

#### 1.3 Autenticação Base
- [ ] Configurar providers (email/senha)
- [ ] Páginas de login e registro
- [ ] Middleware de autenticação
- [ ] Proteção de rotas

---

### **FASE 2: Core do Sistema** (4-5 dias)

#### 2.1 Multi-tenancy
- [ ] Sistema de empresas
- [ ] Middleware de tenant
- [ ] Cadastro de nova empresa
- [ ] Associação usuário-empresa

#### 2.2 CRUD de Categorias
- [ ] API para categorias de orçamento
- [ ] Interface para criar/editar categorias
- [ ] Sistema dinâmico de tipos
- [ ] Validações e permissões

#### 2.3 Sistema de Orçamentos
- [ ] API para orçamentos mensais
- [ ] Interface para definir valores orçados
- [ ] Seleção de mês/ano
- [ ] Cálculos automáticos

---

### **FASE 3: Realizados e Transações** (3-4 dias)

#### 3.1 Registro de Transações
- [ ] API para transações
- [ ] Formulário de registro
- [ ] Categorização automática
- [ ] Validações de negócio

#### 3.2 Importação/Integração
- [ ] Upload de CSV/Excel
- [ ] Mapeamento de colunas
- [ ] Processamento em background
- [ ] Logs de importação

---

### **FASE 4: Dashboard e Gráficos** (4-5 dias)

#### 4.1 Componentes de Gráficos
- [ ] Instalar e configurar Chart.js/Recharts
- [ ] Componente de gráfico de pizza
- [ ] Componente de gráfico de barras
- [ ] Componente de linha do tempo
- [ ] Responsividade mobile

#### 4.2 Dashboard Principal
- [ ] Layout responsivo
- [ ] Cards de resumo
- [ ] Integração com gráficos
- [ ] Filtros por período
- [ ] Performance e cache

#### 4.3 APIs de Dados
- [ ] Endpoint para dados do dashboard
- [ ] Aggregações no banco
- [ ] Cache com Redis
- [ ] Otimizações de query

---

### **FASE 5: Sistema de Planos** (3-4 dias)

#### 5.1 Planos e Assinaturas
- [ ] CRUD de planos
- [ ] Sistema de limites
- [ ] Controle de features
- [ ] Interface de upgrade

#### 5.2 Billing (Básico)
- [ ] Estrutura para pagamentos
- [ ] Status de assinatura
- [ ] Notificações de vencimento
- [ ] Trial period

---

### **FASE 6: Relatórios e Análises** (3-4 dias)

#### 6.1 Relatórios Avançados
- [ ] Relatório mensal detalhado
- [ ] Comparativo entre períodos
- [ ] Análise de tendências
- [ ] Export para PDF/Excel

#### 6.2 Análises Inteligentes
- [ ] Indicadores de performance
- [ ] Alertas automáticos
- [ ] Sugestões de otimização
- [ ] Projeções futuras

---

### **FASE 7: UX/UI e Polish** (3-4 dias)

#### 7.1 Interface Final
- [ ] Design system completo
- [ ] Animações e transições
- [ ] Estados de loading
- [ ] Tratamento de erros
- [ ] Feedback visual

#### 7.2 Performance
- [ ] Otimização de imagens
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Caching estratégico
- [ ] SEO básico

---

### **FASE 8: Testes e Deploy** (2-3 dias)

#### 8.1 Testes
- [ ] Testes unitários críticos
- [ ] Testes de integração
- [ ] Testes E2E básicos
- [ ] Validação de segurança

#### 8.2 Deploy e Monitoramento
- [ ] Configuração para produção
- [ ] Scripts de deploy
- [ ] Monitoramento básico
- [ ] Backup automático

---

## 🔧 Comandos Principais

### Desenvolvimento Local
```bash
# Subir banco e redis
docker-compose up -d

# Instalar dependências
npm install

# Executar migrações
npx prisma migrate dev

# Iniciar desenvolvimento
npm run dev
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dashboard_financeiro
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 📈 Cronograma Total

**Duração Estimada: 25-30 dias úteis**

| Fase | Duração | Descrição |
|------|---------|-----------|
| Fase 1 | 2-3 dias | Setup inicial e configuração |
| Fase 2 | 4-5 dias | Core do sistema (auth, multi-tenant, categorias) |
| Fase 3 | 3-4 dias | Sistema de transações |
| Fase 4 | 4-5 dias | Dashboard e gráficos |
| Fase 5 | 3-4 dias | Sistema de planos |
| Fase 6 | 3-4 dias | Relatórios avançados |
| Fase 7 | 3-4 dias | Polish e UX |
| Fase 8 | 2-3 dias | Testes e deploy |

---

## 🎯 Próximos Passos

1. **Confirmar roadmap** com stakeholders
2. **Iniciar Fase 1** - Setup do projeto
3. **Criar repositório** e configurar CI/CD básico
4. **Definir design system** e paleta de cores
5. **Configurar ambiente de desenvolvimento**

---

*Roadmap criado em: 08/09/2025*
*Versão: 1.0*