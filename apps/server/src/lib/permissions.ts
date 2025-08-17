import { TRPCError } from '@trpc/server'
import type { Context } from './context'

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
      resource: (perm as any).resource || null
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