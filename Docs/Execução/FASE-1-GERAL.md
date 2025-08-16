# 🚀 FASE 1 - FUNDAÇÃO GERAL (Semanas 1-2)

## 📋 Visão Geral da Fase
Coordenação entre desenvolvimento do servidor e frontend, com foco na fundação sólida do sistema ERP.

---

## 📅 CRONOGRAMA INTEGRADO

### **Semana 1**
- **Dias 1-2**: Setup base servidor + Configuração inicial frontend
- **Dias 3-4**: Sistema de autenticação completo (server + web)
- **Dia 5**: Database schema + Layout/sidebar frontend

### **Semana 2**
- **Dias 1-2**: Integração tRPC + Sistema de temas
- **Dias 3-4**: Testes de integração + Ajustes
- **Dia 5**: Documentação e preparação para Fase 2

---

## 🔄 EXECUÇÃO SEQUENCIAL COORDENADA

### **ETAPA 1.1: Setup Inicial (Dia 1)**

#### **Servidor (2h)**
```bash
cd apps/server

# Dependências base
pnpm add fastify @fastify/cors @fastify/helmet
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next
pnpm add prisma @prisma/client bcryptjs jsonwebtoken zod
pnpm add -D @types/bcryptjs @types/jsonwebtoken

# Criar estrutura de pastas
mkdir -p src/{lib,routers,middleware,schemas,services,types}
```

#### **Frontend (2h)**
```bash
cd apps/web

# Dependências base
pnpm add @radix-ui/react-icons lucide-react framer-motion
pnpm add next-themes clsx tailwind-merge
pnpm add @tanstack/react-query @trpc/client @trpc/react-query @trpc/next
pnpm add react-hook-form @hookform/resolvers zod sonner
pnpm add -D @types/node

# Configurar shadcn/ui
pnpx shadcn-ui@latest init
```

**Critérios de Aceite**:
- [ ] Dependências instaladas sem erros
- [ ] Estrutura de pastas criada
- [ ] shadcn/ui configurado

---

### **ETAPA 1.2: Database e Context (Dia 2)**

#### **Servidor (3h)**
1. **Configurar Prisma Schema** (1h)
   - Modelos Company e User
   - Relacionamentos básicos
   - Aplicar schema: `pnpm db:push`

2. **Database Client** (30min)
   - Criar `src/lib/db.ts`
   - Função de conexão e health check

3. **Context tRPC** (1h)
   - Criar `src/lib/context.ts`
   - Middleware de autenticação
   - Isolamento por empresa

4. **Servidor Base** (30min)
   - Configurar Fastify
   - Middleware de segurança
   - Health check endpoint

#### **Frontend (2h)**
1. **Sistema de Temas** (1h)
   - Configurar `src/lib/theme.ts`
   - CSS global com cores atualizadas
   - Provider de temas

2. **Componentes Base** (1h)
   - Instalar componentes shadcn/ui essenciais
   - Utilitários CSS
   - Toggle de tema

**Comandos de Teste**:
```bash
# Testar servidor
cd apps/server && pnpm dev:server

# Testar frontend
cd apps/web && pnpm dev:web

# Verificar health
curl http://localhost:3000/health
```

**Critérios de Aceite**:
- [ ] Database conecta sem erros
- [ ] Servidor responde no /health
- [ ] Frontend carrega com temas funcionais

---

### **ETAPA 1.3: Autenticação Completa (Dias 3-4)**

#### **Dia 3 - Backend Auth (4h)**
1. **Serviços de Auth** (2h)
   - Criar `src/lib/auth.ts`
   - Hash de senhas
   - Geração de JWT
   - Middleware de autorização

2. **Router de Auth** (2h)
   - Criar `src/routers/auth.ts`
   - Registro de usuário
   - Login/logout
   - Refresh token
   - Verificação de sessão

#### **Dia 4 - Frontend Auth (4h)**
1. **Cliente tRPC** (1h)
   - Configurar `src/lib/api.ts`
   - Headers automáticos com token
   - Provider de API

2. **Store de Auth** (1h)
   - Hook `use-auth.ts`
   - Zustand com persist
   - Gestão de estado global

3. **Páginas de Auth** (2h)
   - Layout de autenticação
   - Página de login
   - AuthGuard para proteção

**Comandos de Teste**:
```bash
# Testar seeds
cd apps/server && pnpm db:seed

# Testar login via API
curl -X POST http://localhost:3000/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresateste.com","password":"123456"}'

# Testar frontend
# Acessar http://localhost:3001/login
# Usar credenciais: admin@empresateste.com / 123456
```

**Critérios de Aceite**:
- [ ] Login funcional no backend
- [ ] Frontend autentica com backend real
- [ ] Token persiste entre sessões
- [ ] Rotas protegidas funcionam

---

### **ETAPA 1.4: Layout e Navegação (Dia 5)**

#### **Servidor (1h)**
1. **Router Principal** (30min)
   - Criar `src/routers/index.ts`
   - Exportar tipos TypeScript

2. **Middleware de Segurança** (30min)
   - Rate limiting
   - Headers de segurança
   - Logging

#### **Frontend (3h)**
1. **Sidebar Colapsável** (2h)
   - Componente sidebar completo
   - Menu com ícones (sem emojis)
   - Popover quando minimizada
   - Grupos de menus hierárquicos

2. **Layout Principal** (1h)
   - Header com menu de usuário
   - Notificações mockadas
   - Layout responsivo
   - MainLayout wrapper

**Comandos de Teste**:
```bash
# Testar navegação
# Fazer login e verificar:
# - Sidebar colapsa/expande
# - Popover aparece quando minimizada
# - Menu de usuário funciona
# - Tema muda corretamente
```

**Critérios de Aceite**:
- [ ] Sidebar funcional e responsiva
- [ ] Menu hierarchico implementado
- [ ] Layout adaptativo mobile/desktop
- [ ] Rate limiting ativo no servidor

---

## 🧪 ETAPA 1.5: Integração e Testes (Semana 2)

### **Dia 1-2: Integração tRPC Completa**

#### **Tarefas Coordenadas**:
1. **Tipos Compartilhados** (2h)
   - Definir interfaces em `apps/web/src/types/`
   - Garantir consistência server/client
   - Configurar exportação de tipos

2. **Queries de Teste** (2h)
   - Implementar `auth.me` no servidor
   - Testar queries no frontend
   - Verificar cache e invalidação

3. **Error Handling** (2h)
   - Middleware de erro no servidor
   - Toast notifications no frontend
   - Tratamento de erros de rede

### **Dia 3-4: Ajustes e Polish**

#### **Performance e UX** (4h):
1. **Animações Suaves** (2h)
   - Framer Motion nas transições
   - Loading states
   - Skeleton screens

2. **Responsividade** (2h)
   - Testar em diferentes telas
   - Ajustar breakpoints
   - Mobile-first approach

### **Dia 5: Documentação e Deploy Prep**

#### **Documentação** (3h):
1. **README Atualizado** (1h)
   - Comandos de setup
   - Credenciais de teste
   - Estrutura do projeto

2. **Variáveis de Ambiente** (1h)
   - `.env.example` completo
   - Configurações de produção
   - Secrets management

3. **Scripts de Desenvolvimento** (1h)
   - Comandos padronizados
   - Hot reload configurado
   - Debugging setup

---

## 📋 CHECKLIST FINAL DA FASE 1

### **Servidor**
- [ ] Database schema aplicado
- [ ] Autenticação JWT funcional
- [ ] Middleware de segurança ativo
- [ ] Rate limiting configurado
- [ ] Health check respondendo
- [ ] Seeds de desenvolvimento

### **Frontend**
- [ ] Sistema de temas Dark/Light
- [ ] Sidebar colapsável responsiva
- [ ] Autenticação com backend real
- [ ] Proteção de rotas ativa
- [ ] Layout moderno e funcional
- [ ] Animações suaves implementadas

### **Integração**
- [ ] tRPC funcionando end-to-end
- [ ] Tipos TypeScript consistentes
- [ ] Error handling robusto
- [ ] Performance otimizada
- [ ] Mobile responsivo

---

## 🎯 ENTREGÁVEIS DA FASE 1

### **Funcionalidades Prontas**:
✅ **Sistema de Autenticação Completo**
- Login/logout funcional
- Gestão de sessões
- Proteção de rotas

✅ **Infraestrutura Base**
- Database configurado
- Servidor seguro
- Frontend moderno

✅ **UI/UX Foundation**
- Temas Dark/Light
- Layout responsivo
- Navegação intuitiva

### **Próximas Fases**:
- **FASE 2**: Cadastros fundamentais (empresas, usuários, clientes)
- **FASE 3**: Sistema de produtos e fórmulas
- **FASE 4**: Engine de precificação

### **Comandos de Teste Final**:
```bash
# Iniciar tudo
pnpm dev

# Testar fluxo completo:
# 1. Acessar http://localhost:3001
# 2. Fazer login: admin@empresateste.com / 123456
# 3. Navegar pelo sistema
# 4. Testar mudança de tema
# 5. Verificar responsividade

# Verificar backend
curl http://localhost:3000/health
```

---

## 🏗️ ESTRUTURA FINAL DO PROJETO

```
apps/
├── server/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── db.ts ✅
│   │   │   ├── auth.ts ✅
│   │   │   ├── context.ts ✅
│   │   │   └── trpc.ts ✅
│   │   ├── routers/
│   │   │   ├── auth.ts ✅
│   │   │   └── index.ts ✅
│   │   ├── middleware/
│   │   │   └── security.ts ✅
│   │   └── index.ts ✅
│   ├── prisma/
│   │   ├── schema.prisma ✅
│   │   └── seeds/ ✅
│   └── package.json ✅
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/ ✅
│   │   │   └── globals.css ✅
│   │   ├── components/
│   │   │   ├── ui/ ✅
│   │   │   ├── layout/ ✅
│   │   │   └── auth/ ✅
│   │   ├── hooks/
│   │   │   └── use-auth.ts ✅
│   │   ├── lib/
│   │   │   ├── api.ts ✅
│   │   │   ├── theme.ts ✅
│   │   │   └── utils.ts ✅
│   │   ├── providers/ ✅
│   │   └── types/ ✅
│   └── tailwind.config.js ✅
└── package.json ✅
```

A **FASE 1** estabelece uma base sólida e moderna para todo o sistema ERP, com autenticação real, infraestrutura robusta e UI/UX de alta qualidade.