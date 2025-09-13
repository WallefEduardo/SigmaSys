# 🖥️ FASE 1 - FUNDAÇÃO SERVER (Semanas 1-2)

## 📋 Visão Geral da Fase
Estabelecer a infraestrutura base do servidor com autenticação robusta, database schema completo e sistemas de segurança.

---

## 🔧 PARTE 1.1: Setup Base do Servidor

### **Objetivo**: Configurar infraestrutura base do backend

### **Pré-requisitos**:
- PostgreSQL instalado e rodando
- Node.js 18+ e pnpm configurados
- Projeto base já existe (Better-T-Stack)

### **Comandos Iniciais**:
```bash
cd apps/server

# Instalar dependências específicas do servidor
pnpm add fastify @fastify/cors @fastify/helmet
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next
pnpm add prisma @prisma/client
pnpm add bcryptjs jsonwebtoken
pnpm add zod
pnpm add -D @types/bcryptjs @types/jsonwebtoken
```

### **Tarefas Sequenciais**:

#### 1.1.1 - Configurar Prisma Schema Base
**Arquivo**: `apps/server/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Modelo base para multi-tenancy
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
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@map("users")
}
```

#### 1.1.2 - Configurar Database Client
**Arquivo**: `apps/server/src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Função para verificar conexão
export async function checkDatabaseConnection() {
  try {
    await db.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Função para desconectar
export async function disconnectDatabase() {
  await db.$disconnect()
}
```

#### 1.1.3 - Setup do Servidor Base
**Arquivo**: `apps/server/src/index.ts`

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './routers/index'
import { createContext } from './lib/context'
import { checkDatabaseConnection } from './lib/db'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
})

async function main() {
  // Middlewares de segurança
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
      },
    },
  })

  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com']
      : ['http://localhost:3001'],
    credentials: true,
  })

  // Verificar conexão com database
  const dbConnected = await checkDatabaseConnection()
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...')
    process.exit(1)
  }

  // Registrar tRPC
  await fastify.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { 
      router: appRouter, 
      createContext,
      onError: ({ path, error }) => {
        console.error(`❌ tRPC Error on '${path}':`, error)
      }
    },
  })

  // Health check endpoint
  fastify.get('/health', async () => {
    return { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: await checkDatabaseConnection()
    }
  })

  try {
    const port = Number(process.env.PORT) || 3000
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Server running on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
```

### **Comandos de Execução**:
```bash
# Criar e aplicar primeira migration
pnpm db:push

# Verificar se tudo está funcionando
pnpm dev:server
```

### **Critérios de Aceite**:
- [ ] Servidor inicia sem erros
- [ ] Database conecta com sucesso
- [ ] Endpoint /health retorna status OK
- [ ] tRPC está configurado e acessível

---

## 🔐 PARTE 1.2: Sistema de Autenticação

### **Objetivo**: Implementar sistema robusto de autenticação com JWT

### **Tarefas Sequenciais**:

#### 1.2.1 - Configurar Context do tRPC
**Arquivo**: `apps/server/src/lib/context.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { db } from './db'

export interface User {
  id: string
  email: string
  name: string
  role: string
  companyId: string
  permissions?: any
}

export interface CreateContextOptions {
  req: FastifyRequest
  res: FastifyReply
  user?: User
}

export async function createContext({ req, res }: { req: FastifyRequest; res: FastifyReply }) {
  // Extrair token do header Authorization
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  let user: User | undefined

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      // Buscar usuário completo no database
      const dbUser = await db.user.findUnique({
        where: { id: payload.userId },
        include: { company: true }
      })

      if (dbUser && dbUser.active) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          companyId: dbUser.companyId,
          permissions: dbUser.permissions
        }
      }
    } catch (error) {
      console.warn('Invalid token:', error)
    }
  }

  return {
    req,
    res,
    db,
    user
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

#### 1.2.2 - Utilitários de Autenticação
**Arquivo**: `apps/server/src/lib/auth.ts`

```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { TRPCError } from '@trpc/server'
import { Context } from './context'

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET!
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  generateToken(userId: string, companyId: string): string {
    return jwt.sign(
      { userId, companyId },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    )
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: '30d' }
    )
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret)
    } catch (error) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid token'
      })
    }
  }
}

export const authService = new AuthService()

// Middleware para rotas protegidas
export function requireAuth(ctx: Context) {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    })
  }
  return ctx.user
}

// Middleware para roles específicos
export function requireRole(roles: string[]) {
  return (ctx: Context) => {
    const user = requireAuth(ctx)
    
    if (!roles.includes(user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      })
    }
    
    return user
  }
}

// Middleware para isolar dados por empresa
export function requireCompany(ctx: Context) {
  const user = requireAuth(ctx)
  return user.companyId
}
```

#### 1.2.3 - Router de Autenticação
**Arquivo**: `apps/server/src/routers/auth.ts`

```typescript
import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../lib/trpc'
import { authService } from '../lib/auth'
import { TRPCError } from '@trpc/server'

export const authRouter = router({
  // Registro de usuário (apenas para primeira empresa/superadmin)
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      companyName: z.string().min(2),
      cnpj: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se usuário já existe
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email }
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists'
        })
      }

      // Hash da senha
      const hashedPassword = await authService.hashPassword(input.password)

      // Criar empresa e usuário em transação
      const result = await ctx.db.$transaction(async (tx) => {
        // Criar empresa
        const company = await tx.company.create({
          data: {
            name: input.companyName,
            cnpj: input.cnpj,
            plan: 'trial'
          }
        })

        // Criar usuário master
        const user = await tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            password: hashedPassword,
            role: 'master',
            companyId: company.id
          }
        })

        return { user, company }
      })

      // Gerar tokens
      const token = authService.generateToken(result.user.id, result.company.id)
      const refreshToken = authService.generateRefreshToken(result.user.id)

      return {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          companyId: result.company.id
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          plan: result.company.plan
        },
        token,
        refreshToken
      }
    }),

  // Login
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Buscar usuário
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
        include: { company: true }
      })

      if (!user || !user.active) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        })
      }

      // Verificar senha
      const isValidPassword = await authService.comparePassword(
        input.password,
        user.password
      )

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        })
      }

      // Verificar se empresa está ativa
      if (!user.company.active) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Company account is inactive'
        })
      }

      // Gerar tokens
      const token = authService.generateToken(user.id, user.companyId)
      const refreshToken = authService.generateRefreshToken(user.id)

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        },
        company: {
          id: user.company.id,
          name: user.company.name,
          plan: user.company.plan
        },
        token,
        refreshToken
      }
    }),

  // Refresh token
  refreshToken: publicProcedure
    .input(z.object({
      refreshToken: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const payload = authService.verifyToken(input.refreshToken)
        
        if (payload.type !== 'refresh') {
          throw new Error('Invalid refresh token')
        }

        const user = await ctx.db.user.findUnique({
          where: { id: payload.userId },
          include: { company: true }
        })

        if (!user || !user.active || !user.company.active) {
          throw new Error('User or company inactive')
        }

        const newToken = authService.generateToken(user.id, user.companyId)
        const newRefreshToken = authService.generateRefreshToken(user.id)

        return {
          token: newToken,
          refreshToken: newRefreshToken
        }
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token'
        })
      }
    }),

  // Verificar sessão atual
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user!.id },
        include: { company: true }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          permissions: user.permissions
        },
        company: {
          id: user.company.id,
          name: user.company.name,
          plan: user.company.plan
        }
      }
    }),

  // Logout (opcional - pode ser feito apenas no frontend)
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Aqui você pode implementar blacklist de tokens se necessário
      return { success: true }
    })
})
```

#### 1.2.4 - Configurar Procedures Base do tRPC
**Arquivo**: `apps/server/src/lib/trpc.ts`

```typescript
import { initTRPC, TRPCError } from '@trpc/server'
import { Context } from './context'
import superjson from 'superjson'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause.message : null,
      },
    }
  },
})

// Procedure pública (sem autenticação)
export const publicProcedure = t.procedure

// Procedure protegida (requer autenticação)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

// Procedure para master/admin (requer role específico)
export const masterProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['master', 'admin'].includes(ctx.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Master or admin role required'
    })
  }

  return next({ ctx })
})

export const router = t.router
export const middleware = t.middleware
```

### **Comandos de Execução**:
```bash
# Atualizar schema do database
pnpm db:push

# Testar servidor
pnpm dev:server
```

### **Critérios de Aceite**:
- [ ] Registro de usuário funcional
- [ ] Login retorna token JWT válido
- [ ] Middleware de autenticação bloqueia rotas protegidas
- [ ] Context do tRPC carrega usuário corretamente

---

## 🗃️ PARTE 1.3: Database Schema Completo

### **Objetivo**: Implementar schema completo do Prisma para todo o sistema

### **Tarefas Sequenciais**:

#### 1.3.1 - Expandir Schema Prisma
**Arquivo**: `apps/server/prisma/schema.prisma` (versão completa)

```prisma
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
  finishes    Finish[]
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
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@map("users")
}

model Client {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  document    String?  // CPF ou CNPJ
  type        String   @default("person") // person, company
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
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  quotes      Quote[]
  orders      Order[]

  @@map("clients")
}

model Material {
  id           String   @id @default(cuid())
  name         String
  description  String?
  unit         String   // m2, ml, un, kg, lt, etc
  cost         Decimal  @db.Decimal(10, 4)
  supplier     String?
  supplierCode String?
  minStock     Decimal? @db.Decimal(10, 4)
  category     String?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  productItems ProductMaterial[]
  inventory    InventoryItem[]

  @@map("materials")
}

model Equipment {
  id            String   @id @default(cuid())
  name          String
  type          String   // impression, machining
  costPerHour   Decimal  @db.Decimal(10, 4)
  capacity      Json     // specific configs per type
  maintenance   Json?
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  productItems  ProductEquipment[]

  @@map("equipments")
}

model Process {
  id           String   @id @default(cuid())
  name         String
  description  String?
  costPerHour  Decimal  @db.Decimal(10, 4)
  sector       String?
  timeUnit     String   // hour, m2, ml, perimeter, etc
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  productItems ProductProcess[]

  @@map("processes")
}

model Finish {
  id          String   @id @default(cuid())
  name        String
  description String?
  composition Json     // materials + processes
  cost        Decimal  @db.Decimal(10, 4)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  products    ProductFinish[]

  @@map("finishes")
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
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
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
  quantity   Decimal  @db.Decimal(10, 4)
  formula    String?  // calculation formula
  createdAt  DateTime @default(now())

  // Relations
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  materialId String
  material   Material @relation(fields: [materialId], references: [id], onDelete: Cascade)

  @@map("product_materials")
}

model ProductEquipment {
  id          String   @id @default(cuid())
  timeNeeded  Decimal  @db.Decimal(10, 4)
  formula     String?
  createdAt   DateTime @default(now())

  // Relations
  productId   String
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  equipmentId String
  equipment   Equipment @relation(fields: [equipmentId], references: [id], onDelete: Cascade)

  @@map("product_equipments")
}

model ProductProcess {
  id         String   @id @default(cuid())
  timeNeeded Decimal  @db.Decimal(10, 4)
  formula    String?
  createdAt  DateTime @default(now())

  // Relations
  productId  String
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  processId  String
  process    Process @relation(fields: [processId], references: [id], onDelete: Cascade)

  @@map("product_processes")
}

model ProductFinish {
  id        String   @id @default(cuid())
  quantity  Decimal  @db.Decimal(10, 4)
  createdAt DateTime @default(now())

  // Relations
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  finishId  String
  finish    Finish  @relation(fields: [finishId], references: [id], onDelete: Cascade)

  @@map("product_finishes")
}

model Quote {
  id          String   @id @default(cuid())
  number      String   @unique
  title       String
  description String?
  status      String   @default("draft") // draft, sent, approved, rejected
  totalCost   Decimal  @db.Decimal(12, 4)
  totalPrice  Decimal  @db.Decimal(12, 4)
  margin      Decimal  @db.Decimal(5, 2)
  validUntil  DateTime?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  clientId    String
  client      Client     @relation(fields: [clientId], references: [id], onDelete: Cascade)
  items       QuoteItem[]
  order       Order?

  @@map("quotes")
}

model QuoteItem {
  id          String   @id @default(cuid())
  quantity    Decimal  @db.Decimal(10, 4)
  unitCost    Decimal  @db.Decimal(10, 4)
  unitPrice   Decimal  @db.Decimal(10, 4)
  totalCost   Decimal  @db.Decimal(12, 4)
  totalPrice  Decimal  @db.Decimal(12, 4)
  checklist   Json?    // filled checklist
  createdAt   DateTime @default(now())

  // Relations
  quoteId     String
  quote       Quote   @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  productId   String
  product     Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("quote_items")
}

model Order {
  id          String   @id @default(cuid())
  number      String   @unique
  title       String
  description String?
  status      String   @default("pending") // pending, production, completed, delivered
  totalCost   Decimal  @db.Decimal(12, 4)
  totalPrice  Decimal  @db.Decimal(12, 4)
  startDate   DateTime?
  deliveryDate DateTime?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  clientId    String
  client      Client     @relation(fields: [clientId], references: [id], onDelete: Cascade)
  quoteId     String?    @unique
  quote       Quote?     @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  items       OrderItem[]

  @@map("orders")
}

model OrderItem {
  id          String   @id @default(cuid())
  quantity    Decimal  @db.Decimal(10, 4)
  unitCost    Decimal  @db.Decimal(10, 4)
  unitPrice   Decimal  @db.Decimal(10, 4)
  totalCost   Decimal  @db.Decimal(12, 4)
  totalPrice  Decimal  @db.Decimal(12, 4)
  status      String   @default("pending")
  createdAt   DateTime @default(now())

  // Relations
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  product     Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("order_items")
}

model InventoryItem {
  id          String   @id @default(cuid())
  quantity    Decimal  @db.Decimal(10, 4)
  minStock    Decimal? @db.Decimal(10, 4)
  location    String?
  batch       String?
  dimensions  Json?    // for fractional inventory
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  materialId  String
  material    Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
  movements   InventoryMovement[]

  @@unique([companyId, materialId, location, batch])
  @@map("inventory_items")
}

model InventoryMovement {
  id          String   @id @default(cuid())
  type        String   // in, out
  quantity    Decimal  @db.Decimal(10, 4)
  reason      String
  reference   String?  // order, adjustment, etc
  userId      String   // who made the movement
  createdAt   DateTime @default(now())

  // Relations
  inventoryId String
  inventory   InventoryItem @relation(fields: [inventoryId], references: [id], onDelete: Cascade)

  @@map("inventory_movements")
}

model Account {
  id          String   @id @default(cuid())
  type        String   // receivable, payable
  description String
  amount      Decimal  @db.Decimal(12, 4)
  dueDate     DateTime
  paidDate    DateTime?
  status      String   @default("pending") // pending, paid, overdue
  category    String?
  costCenter  String?
  reference   String?  // order, invoice, etc
  tags        String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

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
  company       Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, name])
  @@map("parameters")
}

// Auditoria (opcional mas recomendado)
model AuditLog {
  id        String   @id @default(cuid())
  action    String   // CREATE, UPDATE, DELETE
  table     String   // table name
  recordId  String   // record ID
  oldData   Json?    // previous data
  newData   Json?    // new data
  userId    String   // who made the change
  companyId String   // company context
  createdAt DateTime @default(now())

  @@map("audit_logs")
}
```

#### 1.3.2 - Configurar Seeds Iniciais
**Arquivo**: `apps/server/prisma/seeds/index.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Seed para desenvolvimento - Empresa de teste
  const testCompany = await prisma.company.upsert({
    where: { cnpj: '12345678000100' },
    update: {},
    create: {
      name: 'Empresa Teste',
      cnpj: '12345678000100',
      email: 'contato@empresateste.com',
      phone: '(11) 99999-9999',
      plan: 'premium',
      active: true,
    }
  })

  // Usuário master para teste
  const hashedPassword = await bcrypt.hash('123456', 12)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'admin@empresateste.com' },
    update: {},
    create: {
      name: 'Administrador Teste',
      email: 'admin@empresateste.com',
      password: hashedPassword,
      role: 'master',
      companyId: testCompany.id,
      active: true,
    }
  })

  // Parâmetros padrão do sistema
  await prisma.parameter.upsert({
    where: {
      companyId_name: {
        companyId: testCompany.id,
        name: 'custos_fixos_mensais'
      }
    },
    update: {},
    create: {
      companyId: testCompany.id,
      name: 'custos_fixos_mensais',
      value: {
        aluguel: 5000,
        energia: 800,
        internet: 200,
        outros: 1000
      },
      type: 'manual',
      description: 'Custos fixos mensais da empresa'
    }
  })

  await prisma.parameter.upsert({
    where: {
      companyId_name: {
        companyId: testCompany.id,
        name: 'margem_padrao'
      }
    },
    update: {},
    create: {
      companyId: testCompany.id,
      name: 'margem_padrao',
      value: {
        markup: 2.5,
        margem_liquida: 60,
        tipo: 'markup'
      },
      type: 'manual',
      description: 'Margem padrão para precificação'
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log('📧 Test user: admin@empresateste.com')
  console.log('🔑 Test password: 123456')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

#### 1.3.3 - Configurar Scripts de Database
**Arquivo**: `apps/server/package.json` (adicionar scripts)

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seeds/index.ts",
    "db:reset": "prisma migrate reset --force"
  }
}
```

### **Comandos de Execução**:
```bash
# Aplicar schema completo
pnpm db:push

# Gerar client do Prisma
pnpm db:generate

# Executar seeds
pnpm db:seed

# Abrir interface visual (opcional)
pnpm db:studio
```

### **Critérios de Aceite**:
- [ ] Schema aplicado sem erros
- [ ] Relacionamentos funcionais
- [ ] Seeds executam corretamente
- [ ] Empresa e usuário de teste criados

---

## 🔧 PARTE 1.4: Router Index e Middleware

### **Objetivo**: Configurar router principal e middleware de segurança

### **Tarefas Sequenciais**:

#### 1.4.1 - Router Principal
**Arquivo**: `apps/server/src/routers/index.ts`

```typescript
import { router } from '../lib/trpc'
import { authRouter } from './auth'

export const appRouter = router({
  auth: authRouter,
  // Outros routers serão adicionados nas próximas fases
})

export type AppRouter = typeof appRouter
```

#### 1.4.2 - Middleware de Segurança
**Arquivo**: `apps/server/src/middleware/security.ts`

```typescript
import { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'

export async function setupSecurityMiddleware(fastify: FastifyInstance) {
  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100, // máximo 100 requests
    timeWindow: '1 minute', // por minuto
    errorResponseBuilder: () => ({
      code: 'RATE_LIMIT_EXCEEDED',
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later.',
      expiresIn: 60
    })
  })

  // Headers de segurança customizados
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('X-XSS-Protection', '1; mode=block')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  })
}
```

#### 1.4.3 - Configurar Variáveis de Ambiente
**Arquivo**: `apps/server/.env.example`

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/erp_system"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"

# Logs
LOG_LEVEL="debug"
```

### **Comandos de Execução**:
```bash
# Instalar dependência de rate limiting
pnpm add @fastify/rate-limit

# Testar servidor completo
pnpm dev:server
```

### **Critérios de Aceite**:
- [ ] Rate limiting funcionando
- [ ] Headers de segurança aplicados
- [ ] Router principal exportando tipos
- [ ] Servidor inicia sem erros

---

## 📋 RESUMO DA FASE 1 - SERVER

### **O que foi implementado**:
✅ Infraestrutura base do servidor Fastify  
✅ Sistema de autenticação JWT completo  
✅ Schema Prisma com todas as entidades  
✅ Middleware de segurança e rate limiting  
✅ Seeds para dados de teste  
✅ Context do tRPC com isolamento por empresa  

### **Próximos Passos**:
- **FASE 2**: Implementar routers de cadastros fundamentais
- **FASE 3**: Sistema de fórmulas e produtos complexos
- **FASE 4**: Engine de precificação

### **Comandos para Testar**:
```bash
# Testar tudo funcionando
pnpm dev:server

# Verificar health check
curl http://localhost:3000/health

# Testar tRPC (exemplo com auth)
curl -X POST http://localhost:3000/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresateste.com","password":"123456"}'
```

### **Estrutura de Arquivos Criada**:
```
apps/server/src/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── context.ts
│   └── trpc.ts
├── routers/
│   ├── auth.ts
│   └── index.ts
├── middleware/
│   └── security.ts
└── index.ts
```