# 🖥️ FASE 2 - CADASTROS FUNDAMENTAIS SERVER (Semanas 3-4)

## 📋 Visão Geral da Fase
Implementar sistema multi-tenancy robusto, gestão completa de usuários com permissões granulares e CRUD de clientes com funcionalidades CRM.

---

## 🏢 PARTE 2.1: Sistema Multi-Tenancy (Empresas)

### **Objetivo**: Implementar isolamento completo de dados por empresa

### **Pré-requisitos**:
- FASE 1 concluída
- Schema base aplicado
- Autenticação funcionando

### **Tarefas Sequenciais**:

#### 2.1.1 - Router de Empresas
**Arquivo**: `apps/server/src/routers/companies.ts`

```typescript
import { z } from 'zod'
import { router, protectedProcedure, masterProcedure } from '../lib/trpc'
import { requireAuth, requireRole } from '../lib/auth'
import { TRPCError } from '@trpc/server'

export const companiesRouter = router({
  // Listar empresas (apenas superadmin)
  list: protectedProcedure
    .use(async ({ ctx, next }) => {
      // Verificar se é superadmin (role especial do sistema)
      if (ctx.user?.role !== 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Superadmin access required'
        })
      }
      return next()
    })
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      plan: z.string().optional(),
      active: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, plan, active } = input
      const offset = (page - 1) * limit

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { cnpj: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        }),
        ...(plan && { plan }),
        ...(active !== undefined && { active })
      }

      const [companies, total] = await Promise.all([
        ctx.db.company.findMany({
          where,
          skip: offset,
          take: limit,
          include: {
            _count: {
              select: {
                users: true,
                clients: true,
                products: true,
                orders: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        ctx.db.company.count({ where })
      ])

      return {
        companies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }),

  // Obter empresa atual
  current: protectedProcedure
    .query(async ({ ctx }) => {
      const user = requireAuth(ctx)
      
      const company = await ctx.db.company.findUnique({
        where: { id: user.companyId },
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              products: true,
              materials: true,
              equipments: true,
              orders: true,
              quotes: true
            }
          }
        }
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found'
        })
      }

      return company
    }),

  // Criar empresa (superadmin)
  create: protectedProcedure
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Superadmin access required'
        })
      }
      return next()
    })
    .input(z.object({
      name: z.string().min(2).max(100),
      cnpj: z.string().min(14).max(18).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      plan: z.enum(['trial', 'basic', 'premium', 'enterprise']).default('trial')
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se CNPJ já existe (se fornecido)
      if (input.cnpj) {
        const existingCompany = await ctx.db.company.findUnique({
          where: { cnpj: input.cnpj }
        })
        
        if (existingCompany) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'CNPJ already exists'
          })
        }
      }

      const company = await ctx.db.company.create({
        data: input,
        include: {
          _count: {
            select: { users: true }
          }
        }
      })

      return company
    }),

  // Atualizar empresa
  update: masterProcedure
    .input(z.object({
      id: z.string().optional(), // Superadmin pode especificar ID
      name: z.string().min(2).max(100).optional(),
      cnpj: z.string().min(14).max(18).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      plan: z.enum(['trial', 'basic', 'premium', 'enterprise']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      
      // Se não especificar ID, usa a empresa do usuário
      const companyId = id || ctx.user!.companyId
      
      // Verificar permissão: superadmin ou master da própria empresa
      if (ctx.user!.role !== 'superadmin' && companyId !== ctx.user!.companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot update other companies'
        })
      }

      // Verificar se CNPJ já existe em outra empresa
      if (data.cnpj) {
        const existingCompany = await ctx.db.company.findFirst({
          where: {
            cnpj: data.cnpj,
            id: { not: companyId }
          }
        })
        
        if (existingCompany) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'CNPJ already exists'
          })
        }
      }

      const company = await ctx.db.company.update({
        where: { id: companyId },
        data,
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              products: true
            }
          }
        }
      })

      return company
    }),

  // Ativar/Desativar empresa (superadmin)
  toggleActive: protectedProcedure
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Superadmin access required'
        })
      }
      return next()
    })
    .input(z.object({
      id: z.string(),
      active: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.update({
        where: { id: input.id },
        data: { active: input.active }
      })

      return company
    }),

  // Estatísticas da empresa
  stats: masterProcedure
    .input(z.object({
      companyId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = input.companyId || ctx.user!.companyId
      
      // Verificar permissão
      if (ctx.user!.role !== 'superadmin' && companyId !== ctx.user!.companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot access other company stats'
        })
      }

      const [
        totalUsers,
        totalClients,
        totalProducts,
        totalOrders,
        totalQuotes,
        recentOrders,
        monthlyRevenue
      ] = await Promise.all([
        ctx.db.user.count({ where: { companyId, active: true } }),
        ctx.db.client.count({ where: { companyId, active: true } }),
        ctx.db.product.count({ where: { companyId, active: true } }),
        ctx.db.order.count({ where: { companyId } }),
        ctx.db.quote.count({ where: { companyId } }),
        ctx.db.order.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            client: { select: { name: true } }
          }
        }),
        ctx.db.order.aggregate({
          where: {
            companyId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _sum: { totalPrice: true }
        })
      ])

      return {
        totalUsers,
        totalClients,
        totalProducts,
        totalOrders,
        totalQuotes,
        recentOrders,
        monthlyRevenue: monthlyRevenue._sum.totalPrice || 0
      }
    })
})
```

#### 2.1.2 - Middleware de Tenancy
**Arquivo**: `apps/server/src/lib/tenancy.ts`

```typescript
import { TRPCError } from '@trpc/server'
import { Context } from './context'

export function ensureCompanyAccess(companyId?: string) {
  return (ctx: Context) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      })
    }

    // Superadmin pode acessar qualquer empresa
    if (ctx.user.role === 'superadmin') {
      return companyId || ctx.user.companyId
    }

    // Usuários normais só acessam sua própria empresa
    if (companyId && companyId !== ctx.user.companyId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied to this company'
      })
    }

    return ctx.user.companyId
  }
}

export function withCompanyFilter<T extends Record<string, any>>(
  where: T,
  companyId: string
): T & { companyId: string } {
  return {
    ...where,
    companyId
  }
}

export class TenancyService {
  static async validateCompanyAccess(
    db: any,
    userId: string,
    targetCompanyId: string
  ): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { company: true }
    })

    if (!user) return false

    // Superadmin pode acessar qualquer empresa
    if (user.role === 'superadmin') return true

    // Usuário só pode acessar sua própria empresa
    return user.companyId === targetCompanyId
  }

  static async getCompanyLimits(db: any, companyId: string) {
    const company = await db.company.findUnique({
      where: { id: companyId }
    })

    if (!company) return null

    // Limites por plano
    const limits = {
      trial: {
        users: 3,
        clients: 50,
        products: 100,
        orders: 20,
        storage: 1024 * 1024 * 100 // 100MB
      },
      basic: {
        users: 10,
        clients: 500,
        products: 1000,
        orders: 200,
        storage: 1024 * 1024 * 1024 // 1GB
      },
      premium: {
        users: 50,
        clients: 5000,
        products: 10000,
        orders: 2000,
        storage: 1024 * 1024 * 1024 * 10 // 10GB
      },
      enterprise: {
        users: -1, // ilimitado
        clients: -1,
        products: -1,
        orders: -1,
        storage: -1
      }
    }

    return limits[company.plan as keyof typeof limits] || limits.trial
  }

  static async checkLimit(
    db: any,
    companyId: string,
    resource: string,
    currentCount?: number
  ): Promise<boolean> {
    const limits = await this.getCompanyLimits(db, companyId)
    if (!limits) return false

    const limit = limits[resource as keyof typeof limits]
    if (limit === -1) return true // ilimitado

    if (currentCount === undefined) {
      // Contar automaticamente
      const counts = await this.getResourceCounts(db, companyId)
      currentCount = counts[resource as keyof typeof counts] || 0
    }

    return currentCount < limit
  }

  static async getResourceCounts(db: any, companyId: string) {
    const [users, clients, products, orders] = await Promise.all([
      db.user.count({ where: { companyId } }),
      db.client.count({ where: { companyId } }),
      db.product.count({ where: { companyId } }),
      db.order.count({ where: { companyId } })
    ])

    return { users, clients, products, orders }
  }
}
```

### **Critérios de Aceite**:
- [ ] Router de empresas funcional
- [ ] Isolamento de dados por empresa
- [ ] Limites por plano implementados
- [ ] Superadmin pode gerenciar todas empresas

---

## 👥 PARTE 2.2: Gestão de Usuários e Permissões

### **Objetivo**: Sistema robusto de usuários com permissões granulares

### **Tarefas Sequenciais**:

#### 2.2.1 - Expandir Schema de Usuários
**Arquivo**: `apps/server/prisma/schema.prisma` (adicionar aos modelos existentes)

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String
  role        String   @default("user") // superadmin, master, admin, manager, user
  permissions Json?    // permissões específicas
  department  String?  // setor do usuário
  position    String?  // cargo
  avatar      String?  // URL do avatar
  phone       String?
  active      Boolean  @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdBy   String?  // quem criou este usuário
  creator     User?    @relation("UserCreator", fields: [createdBy], references: [id])
  createdUsers User[]  @relation("UserCreator")
  
  @@map("users")
}

model Permission {
  id          String   @id @default(cuid())
  name        String   // nome único da permissão
  description String?
  module      String   // módulo do sistema (users, products, orders, etc)
  action      String   // ação (create, read, update, delete, export, etc)
  resource    String?  // recurso específico (opcional)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@unique([module, action, resource])
  @@map("permissions")
}

model Role {
  id          String   @id @default(cuid())
  name        String
  description String?
  permissions Json     // array de IDs de permissões
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([companyId, name])
  @@map("roles")
}
```

#### 2.2.2 - Sistema de Permissões
**Arquivo**: `apps/server/src/lib/permissions.ts`

```typescript
import { TRPCError } from '@trpc/server'
import { Context } from './context'

export interface Permission {
  module: string
  action: string
  resource?: string
}

export class PermissionService {
  // Permissões padrão do sistema
  static readonly DEFAULT_PERMISSIONS = {
    // Dashboard
    'dashboard.read': { module: 'dashboard', action: 'read' },
    
    // Usuários
    'users.create': { module: 'users', action: 'create' },
    'users.read': { module: 'users', action: 'read' },
    'users.update': { module: 'users', action: 'update' },
    'users.delete': { module: 'users', action: 'delete' },
    'users.manage': { module: 'users', action: 'manage' },
    
    // Clientes
    'clients.create': { module: 'clients', action: 'create' },
    'clients.read': { module: 'clients', action: 'read' },
    'clients.update': { module: 'clients', action: 'update' },
    'clients.delete': { module: 'clients', action: 'delete' },
    'clients.export': { module: 'clients', action: 'export' },
    
    // Produtos
    'products.create': { module: 'products', action: 'create' },
    'products.read': { module: 'products', action: 'read' },
    'products.update': { module: 'products', action: 'update' },
    'products.delete': { module: 'products', action: 'delete' },
    'products.pricing': { module: 'products', action: 'pricing' },
    
    // Orçamentos
    'quotes.create': { module: 'quotes', action: 'create' },
    'quotes.read': { module: 'quotes', action: 'read' },
    'quotes.update': { module: 'quotes', action: 'update' },
    'quotes.delete': { module: 'quotes', action: 'delete' },
    'quotes.approve': { module: 'quotes', action: 'approve' },
    'quotes.export': { module: 'quotes', action: 'export' },
    
    // Ordens de Serviço
    'orders.create': { module: 'orders', action: 'create' },
    'orders.read': { module: 'orders', action: 'read' },
    'orders.update': { module: 'orders', action: 'update' },
    'orders.delete': { module: 'orders', action: 'delete' },
    'orders.production': { module: 'orders', action: 'production' },
    
    // Financeiro
    'financial.read': { module: 'financial', action: 'read' },
    'financial.create': { module: 'financial', action: 'create' },
    'financial.update': { module: 'financial', action: 'update' },
    'financial.delete': { module: 'financial', action: 'delete' },
    'financial.reports': { module: 'financial', action: 'reports' },
    
    // Estoque
    'inventory.read': { module: 'inventory', action: 'read' },
    'inventory.create': { module: 'inventory', action: 'create' },
    'inventory.update': { module: 'inventory', action: 'update' },
    'inventory.movements': { module: 'inventory', action: 'movements' },
    
    // Produção
    'production.read': { module: 'production', action: 'read' },
    'production.manage': { module: 'production', action: 'manage' },
    'production.tracking': { module: 'production', action: 'tracking' },
    
    // Configurações
    'settings.read': { module: 'settings', action: 'read' },
    'settings.update': { module: 'settings', action: 'update' },
    'settings.company': { module: 'settings', action: 'company' },
    
    // Relatórios
    'reports.read': { module: 'reports', action: 'read' },
    'reports.export': { module: 'reports', action: 'export' },
    'reports.advanced': { module: 'reports', action: 'advanced' }
  }

  // Roles padrão
  static readonly DEFAULT_ROLES = {
    master: {
      name: 'Master',
      description: 'Acesso total ao sistema',
      permissions: Object.keys(this.DEFAULT_PERMISSIONS)
    },
    admin: {
      name: 'Administrador',
      description: 'Acesso administrativo completo',
      permissions: [
        'dashboard.read',
        'users.create', 'users.read', 'users.update',
        'clients.create', 'clients.read', 'clients.update', 'clients.delete', 'clients.export',
        'products.create', 'products.read', 'products.update', 'products.delete', 'products.pricing',
        'quotes.create', 'quotes.read', 'quotes.update', 'quotes.delete', 'quotes.approve', 'quotes.export',
        'orders.create', 'orders.read', 'orders.update', 'orders.delete', 'orders.production',
        'financial.read', 'financial.create', 'financial.update', 'financial.reports',
        'inventory.read', 'inventory.create', 'inventory.update', 'inventory.movements',
        'production.read', 'production.manage', 'production.tracking',
        'settings.read', 'settings.update',
        'reports.read', 'reports.export', 'reports.advanced'
      ]
    },
    manager: {
      name: 'Gerente',
      description: 'Gestão operacional',
      permissions: [
        'dashboard.read',
        'clients.create', 'clients.read', 'clients.update', 'clients.export',
        'products.read', 'products.pricing',
        'quotes.create', 'quotes.read', 'quotes.update', 'quotes.approve', 'quotes.export',
        'orders.create', 'orders.read', 'orders.update', 'orders.production',
        'financial.read', 'financial.reports',
        'inventory.read', 'inventory.movements',
        'production.read', 'production.tracking',
        'reports.read', 'reports.export'
      ]
    },
    user: {
      name: 'Usuário',
      description: 'Acesso básico',
      permissions: [
        'dashboard.read',
        'clients.read',
        'products.read',
        'quotes.read',
        'orders.read',
        'inventory.read',
        'production.read',
        'reports.read'
      ]
    }
  }

  static hasPermission(
    userPermissions: string[] | null,
    userRole: string,
    requiredPermission: string
  ): boolean {
    // Superadmin e master têm acesso total
    if (userRole === 'superadmin' || userRole === 'master') {
      return true
    }

    // Verificar permissões específicas do usuário
    if (userPermissions && userPermissions.includes(requiredPermission)) {
      return true
    }

    // Verificar permissões do role padrão
    const rolePermissions = this.DEFAULT_ROLES[userRole as keyof typeof this.DEFAULT_ROLES]
    if (rolePermissions && rolePermissions.permissions.includes(requiredPermission)) {
      return true
    }

    return false
  }

  static requirePermission(permission: string) {
    return (ctx: Context) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        })
      }

      const hasAccess = this.hasPermission(
        ctx.user.permissions as string[] | null,
        ctx.user.role,
        permission
      )

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Permission required: ${permission}`
        })
      }

      return ctx.user
    }
  }

  static async createDefaultPermissions(db: any) {
    const permissions = Object.entries(this.DEFAULT_PERMISSIONS).map(([key, perm]) => ({
      name: key,
      description: `Permission to ${perm.action} ${perm.module}`,
      module: perm.module,
      action: perm.action,
      resource: perm.resource
    }))

    for (const permission of permissions) {
      await db.permission.upsert({
        where: {
          module_action_resource: {
            module: permission.module,
            action: permission.action,
            resource: permission.resource || ''
          }
        },
        update: {},
        create: permission
      })
    }
  }

  static async createDefaultRoles(db: any, companyId: string) {
    for (const [roleKey, roleData] of Object.entries(this.DEFAULT_ROLES)) {
      await db.role.upsert({
        where: {
          companyId_name: {
            companyId,
            name: roleKey
          }
        },
        update: {
          permissions: roleData.permissions
        },
        create: {
          name: roleKey,
          description: roleData.description,
          permissions: roleData.permissions,
          companyId
        }
      })
    }
  }
}
```

#### 2.2.3 - Router de Usuários
**Arquivo**: `apps/server/src/routers/users.ts`

```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { PermissionService } from '../lib/permissions'
import { authService } from '../lib/auth'
import { TRPCError } from '@trpc/server'
import { ensureCompanyAccess } from '../lib/tenancy'

export const usersRouter = router({
  // Listar usuários
  list: protectedProcedure
    .use(PermissionService.requirePermission('users.read'))
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      role: z.string().optional(),
      active: z.boolean().optional(),
      department: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { page, limit, search, role, active, department } = input
      const offset = (page - 1) * limit

      const where = {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { position: { contains: search, mode: 'insensitive' as const } }
          ]
        }),
        ...(role && { role }),
        ...(active !== undefined && { active }),
        ...(department && { department })
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip: offset,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            position: true,
            phone: true,
            active: true,
            lastLoginAt: true,
            createdAt: true,
            creator: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        ctx.db.user.count({ where })
      ])

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }),

  // Obter usuário por ID
  getById: protectedProcedure
    .use(PermissionService.requirePermission('users.read'))
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.id,
          companyId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          department: true,
          position: true,
          phone: true,
          avatar: true,
          active: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: { name: true, email: true }
          }
        }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      return user
    }),

  // Criar usuário
  create: protectedProcedure
    .use(PermissionService.requirePermission('users.create'))
    .input(z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['admin', 'manager', 'user']),
      department: z.string().optional(),
      position: z.string().optional(),
      phone: z.string().optional(),
      permissions: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se email já existe
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email }
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already exists'
        })
      }

      // Verificar limite de usuários
      const currentUserCount = await ctx.db.user.count({
        where: { companyId }
      })

      // Implementar verificação de limite aqui se necessário

      const hashedPassword = await authService.hashPassword(input.password)

      const user = await ctx.db.user.create({
        data: {
          ...input,
          password: hashedPassword,
          companyId,
          createdBy: ctx.user!.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
          phone: true,
          active: true,
          createdAt: true
        }
      })

      return user
    }),

  // Atualizar usuário
  update: protectedProcedure
    .use(PermissionService.requirePermission('users.update'))
    .input(z.object({
      id: z.string(),
      name: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
      role: z.enum(['admin', 'manager', 'user']).optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      phone: z.string().optional(),
      permissions: z.array(z.string()).optional(),
      active: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { id, email, ...data } = input

      // Verificar se usuário existe na empresa
      const existingUser = await ctx.db.user.findFirst({
        where: { id, companyId }
      })

      if (!existingUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      // Verificar se email já existe em outro usuário
      if (email && email !== existingUser.email) {
        const emailExists = await ctx.db.user.findUnique({
          where: { email }
        })

        if (emailExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already exists'
          })
        }
      }

      // Não permitir alterar próprio role (exceto master/superadmin)
      if (ctx.user!.id === id && data.role && !['master', 'superadmin'].includes(ctx.user!.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change your own role'
        })
      }

      const user = await ctx.db.user.update({
        where: { id },
        data: {
          ...data,
          ...(email && { email })
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
          phone: true,
          active: true,
          updatedAt: true
        }
      })

      return user
    }),

  // Alterar senha
  changePassword: protectedProcedure
    .input(z.object({
      id: z.string().optional(), // Se não especificar, altera própria senha
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6)
    }))
    .mutation(async ({ ctx, input }) => {
      const targetUserId = input.id || ctx.user!.id
      const companyId = ensureCompanyAccess()(ctx)

      // Se alterando senha de outro usuário, precisa de permissão
      if (targetUserId !== ctx.user!.id) {
        PermissionService.requirePermission('users.update')(ctx)
      }

      const user = await ctx.db.user.findFirst({
        where: { id: targetUserId, companyId }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      // Verificar senha atual (apenas se alterando própria senha)
      if (targetUserId === ctx.user!.id && input.currentPassword) {
        const isValidPassword = await authService.comparePassword(
          input.currentPassword,
          user.password
        )

        if (!isValidPassword) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect'
          })
        }
      }

      const hashedPassword = await authService.hashPassword(input.newPassword)

      await ctx.db.user.update({
        where: { id: targetUserId },
        data: { password: hashedPassword }
      })

      return { success: true }
    }),

  // Desativar usuário
  deactivate: protectedProcedure
    .use(PermissionService.requirePermission('users.delete'))
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Não permitir desativar a si mesmo
      if (ctx.user!.id === input.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot deactivate yourself'
        })
      }

      const user = await ctx.db.user.update({
        where: {
          id: input.id,
          companyId
        },
        data: { active: false }
      })

      return user
    }),

  // Perfil do usuário atual
  profile: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user!.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          department: true,
          position: true,
          phone: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
              plan: true
            }
          }
        }
      })

      return user
    }),

  // Atualizar perfil
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(100).optional(),
      phone: z.string().optional(),
      avatar: z.string().url().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.user!.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          updatedAt: true
        }
      })

      return user
    })
})
```

### **Critérios de Aceite**:
- [ ] Sistema de permissões granular funcional
- [ ] CRUD de usuários com validações
- [ ] Roles padrão criados automaticamente
- [ ] Perfil de usuário atualizável

---

## 👤 PARTE 2.3: CRUD de Clientes (CRM Base)

### **Objetivo**: Sistema completo de gestão de clientes

### **Tarefas Sequenciais**:

#### 2.3.1 - Expandir Schema de Clientes
**Arquivo**: `apps/server/prisma/schema.prisma` (atualizar modelo Client)

```prisma
model Client {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  document    String?  // CPF ou CNPJ
  type        String   @default("person") // person, company
  address     Json?    // endereço completo
  birthday    DateTime?
  segment     String?  // segmento de mercado
  tags        String[] // tags para categorização
  notes       String?
  status      String   @default("active") // active, inactive, prospect, lead
  source      String?  // origem do lead
  rating      Int?     // classificação 1-5
  socialMedia Json?    // redes sociais
  preferences Json?    // preferências do cliente
  
  // Campos comerciais
  creditLimit Decimal? @db.Decimal(12, 4)
  paymentTerm Int?     // prazo de pagamento padrão (dias)
  discount    Decimal? @db.Decimal(5, 2) // desconto padrão (%)
  
  // Campos de controle
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdBy   String?
  creator     User?    @relation("ClientCreator", fields: [createdBy], references: [id])
  
  // Relacionamentos comerciais
  quotes      Quote[]
  orders      Order[]
  interactions ClientInteraction[]

  @@map("clients")
}

model ClientInteraction {
  id          String   @id @default(cuid())
  type        String   // call, email, meeting, whatsapp, visit, etc
  subject     String
  description String?
  status      String   @default("completed") // scheduled, completed, cancelled
  scheduledAt DateTime?
  completedAt DateTime?
  duration    Int?     // duração em minutos
  outcome     String?  // resultado da interação
  nextAction  String?  // próxima ação
  nextDate    DateTime?
  
  // Relations
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation("UserInteraction", fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("client_interactions")
}
```

#### 2.3.2 - Router de Clientes
**Arquivo**: `apps/server/src/routers/clients.ts`

```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { PermissionService } from '../lib/permissions'
import { ensureCompanyAccess } from '../lib/tenancy'
import { TRPCError } from '@trpc/server'

const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('Brasil')
}).optional()

const socialMediaSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  twitter: z.string().url().optional(),
  website: z.string().url().optional()
}).optional()

export const clientsRouter = router({
  // Listar clientes
  list: protectedProcedure
    .use(PermissionService.requirePermission('clients.read'))
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      type: z.enum(['person', 'company']).optional(),
      status: z.enum(['active', 'inactive', 'prospect', 'lead']).optional(),
      segment: z.string().optional(),
      tags: z.array(z.string()).optional(),
      rating: z.number().min(1).max(5).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { page, limit, search, type, status, segment, tags, rating } = input
      const offset = (page - 1) * limit

      const where = {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { document: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } }
          ]
        }),
        ...(type && { type }),
        ...(status && { status }),
        ...(segment && { segment }),
        ...(tags && { tags: { hasSome: tags } }),
        ...(rating && { rating })
      }

      const [clients, total] = await Promise.all([
        ctx.db.client.findMany({
          where,
          skip: offset,
          take: limit,
          include: {
            creator: {
              select: { name: true }
            },
            _count: {
              select: {
                quotes: true,
                orders: true,
                interactions: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        ctx.db.client.count({ where })
      ])

      return {
        clients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }),

  // Obter cliente por ID
  getById: protectedProcedure
    .use(PermissionService.requirePermission('clients.read'))
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const client = await ctx.db.client.findFirst({
        where: {
          id: input.id,
          companyId
        },
        include: {
          creator: {
            select: { name: true, email: true }
          },
          quotes: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
              totalPrice: true,
              createdAt: true
            }
          },
          orders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
              totalPrice: true,
              createdAt: true
            }
          },
          interactions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true }
              }
            }
          },
          _count: {
            select: {
              quotes: true,
              orders: true,
              interactions: true
            }
          }
        }
      })

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found'
        })
      }

      return client
    }),

  // Criar cliente
  create: protectedProcedure
    .use(PermissionService.requirePermission('clients.create'))
    .input(z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      document: z.string().optional(),
      type: z.enum(['person', 'company']).default('person'),
      address: addressSchema,
      birthday: z.string().datetime().optional(),
      segment: z.string().optional(),
      tags: z.array(z.string()).default([]),
      notes: z.string().optional(),
      status: z.enum(['active', 'inactive', 'prospect', 'lead']).default('active'),
      source: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      socialMedia: socialMediaSchema,
      creditLimit: z.number().optional(),
      paymentTerm: z.number().optional(),
      discount: z.number().min(0).max(100).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se documento já existe (se fornecido)
      if (input.document) {
        const existingClient = await ctx.db.client.findFirst({
          where: {
            document: input.document,
            companyId
          }
        })

        if (existingClient) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Document already exists'
          })
        }
      }

      const { birthday, creditLimit, discount, ...data } = input

      const client = await ctx.db.client.create({
        data: {
          ...data,
          ...(birthday && { birthday: new Date(birthday) }),
          ...(creditLimit && { creditLimit }),
          ...(discount && { discount }),
          companyId,
          createdBy: ctx.user!.id
        },
        include: {
          creator: {
            select: { name: true }
          },
          _count: {
            select: {
              quotes: true,
              orders: true,
              interactions: true
            }
          }
        }
      })

      return client
    }),

  // Atualizar cliente
  update: protectedProcedure
    .use(PermissionService.requirePermission('clients.update'))
    .input(z.object({
      id: z.string(),
      name: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      document: z.string().optional(),
      type: z.enum(['person', 'company']).optional(),
      address: addressSchema,
      birthday: z.string().datetime().optional(),
      segment: z.string().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      status: z.enum(['active', 'inactive', 'prospect', 'lead']).optional(),
      source: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      socialMedia: socialMediaSchema,
      creditLimit: z.number().optional(),
      paymentTerm: z.number().optional(),
      discount: z.number().min(0).max(100).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { id, birthday, creditLimit, discount, document, ...data } = input

      // Verificar se cliente existe
      const existingClient = await ctx.db.client.findFirst({
        where: { id, companyId }
      })

      if (!existingClient) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found'
        })
      }

      // Verificar se documento já existe em outro cliente
      if (document && document !== existingClient.document) {
        const documentExists = await ctx.db.client.findFirst({
          where: {
            document,
            companyId,
            id: { not: id }
          }
        })

        if (documentExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Document already exists'
          })
        }
      }

      const client = await ctx.db.client.update({
        where: { id },
        data: {
          ...data,
          ...(document && { document }),
          ...(birthday && { birthday: new Date(birthday) }),
          ...(creditLimit !== undefined && { creditLimit }),
          ...(discount !== undefined && { discount })
        },
        include: {
          creator: {
            select: { name: true }
          },
          _count: {
            select: {
              quotes: true,
              orders: true,
              interactions: true
            }
          }
        }
      })

      return client
    }),

  // Desativar cliente
  deactivate: protectedProcedure
    .use(PermissionService.requirePermission('clients.delete'))
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const client = await ctx.db.client.update({
        where: {
          id: input.id,
          companyId
        },
        data: { active: false }
      })

      return client
    }),

  // Adicionar interação
  addInteraction: protectedProcedure
    .use(PermissionService.requirePermission('clients.update'))
    .input(z.object({
      clientId: z.string(),
      type: z.enum(['call', 'email', 'meeting', 'whatsapp', 'visit', 'other']),
      subject: z.string().min(2).max(200),
      description: z.string().optional(),
      status: z.enum(['scheduled', 'completed', 'cancelled']).default('completed'),
      scheduledAt: z.string().datetime().optional(),
      completedAt: z.string().datetime().optional(),
      duration: z.number().optional(),
      outcome: z.string().optional(),
      nextAction: z.string().optional(),
      nextDate: z.string().datetime().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { clientId, scheduledAt, completedAt, nextDate, ...data } = input

      // Verificar se cliente existe na empresa
      const client = await ctx.db.client.findFirst({
        where: { id: clientId, companyId }
      })

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found'
        })
      }

      const interaction = await ctx.db.clientInteraction.create({
        data: {
          ...data,
          ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
          ...(completedAt && { completedAt: new Date(completedAt) }),
          ...(nextDate && { nextDate: new Date(nextDate) }),
          clientId,
          userId: ctx.user!.id
        },
        include: {
          user: {
            select: { name: true }
          }
        }
      })

      return interaction
    }),

  // Listar interações do cliente
  getInteractions: protectedProcedure
    .use(PermissionService.requirePermission('clients.read'))
    .input(z.object({
      clientId: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20)
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { clientId, page, limit } = input
      const offset = (page - 1) * limit

      // Verificar se cliente existe na empresa
      const client = await ctx.db.client.findFirst({
        where: { id: clientId, companyId }
      })

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found'
        })
      }

      const [interactions, total] = await Promise.all([
        ctx.db.clientInteraction.findMany({
          where: { clientId },
          skip: offset,
          take: limit,
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        ctx.db.clientInteraction.count({ where: { clientId } })
      ])

      return {
        interactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }),

  // Estatísticas dos clientes
  stats: protectedProcedure
    .use(PermissionService.requirePermission('clients.read'))
    .query(async ({ ctx }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const [
        totalClients,
        activeClients,
        prospects,
        leads,
        topSegments,
        recentClients,
        birthdays
      ] = await Promise.all([
        ctx.db.client.count({ where: { companyId } }),
        ctx.db.client.count({ where: { companyId, status: 'active' } }),
        ctx.db.client.count({ where: { companyId, status: 'prospect' } }),
        ctx.db.client.count({ where: { companyId, status: 'lead' } }),
        ctx.db.client.groupBy({
          by: ['segment'],
          where: { companyId, segment: { not: null } },
          _count: true,
          take: 5,
          orderBy: { _count: { segment: 'desc' } }
        }),
        ctx.db.client.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            createdAt: true
          }
        }),
        ctx.db.client.findMany({
          where: {
            companyId,
            birthday: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
            }
          },
          select: {
            id: true,
            name: true,
            birthday: true
          },
          orderBy: { birthday: 'asc' }
        })
      ])

      return {
        totalClients,
        activeClients,
        prospects,
        leads,
        topSegments,
        recentClients,
        birthdays
      }
    })
})
```

### **Critérios de Aceite**:
- [ ] CRUD completo de clientes funcional
- [ ] Sistema de interações implementado
- [ ] Segmentação e tags funcionais
- [ ] Estatísticas de clientes disponíveis

---

## 📋 RESUMO DA FASE 2 - SERVER

### **O que foi implementado**:
✅ **Sistema Multi-Tenancy Completo**
- Isolamento total de dados por empresa
- Limites por plano configuráveis
- Interface de superadmin

✅ **Gestão de Usuários Robusta**
- Sistema de permissões granular
- Roles padrão automatizados
- CRUD completo com validações

✅ **CRM Base Funcional**
- CRUD de clientes avançado
- Sistema de interações
- Segmentação e estatísticas

### **Estrutura de Arquivos Criada**:
```
apps/server/src/
├── routers/
│   ├── companies.ts ✅
│   ├── users.ts ✅
│   └── clients.ts ✅
├── lib/
│   ├── tenancy.ts ✅
│   └── permissions.ts ✅
└── prisma/
    └── schema.prisma ✅ (atualizado)
```

### **Próximos Passos**:
- **FASE 3**: Sistema de produtos e fórmulas
- **FASE 4**: Engine de precificação
- **FASE 5**: Estoque inteligente

### **Comandos para Testar**:
```bash
# Atualizar schema
pnpm db:push

# Testar routers
pnpm dev:server

# Verificar permissões
# Fazer login e testar endpoints protegidos
```