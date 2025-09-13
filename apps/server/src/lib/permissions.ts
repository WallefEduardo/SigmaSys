import type { Context } from './context'
import { TRPCError } from '@trpc/server'

export class PermissionService {
  /**
   * Middleware para verificar permissões
   */
  static requirePermission(permission: string) {
    return ({ ctx, next }: { ctx: Context; next: () => any }) => {
      // Se é superadmin, tem todas as permissões
      if (ctx.user?.role === 'superadmin') {
        return next()
      }

      // Verificar se o usuário tem a permissão específica
      // Por enquanto, vamos permitir todas as ações para usuários autenticados
      // TODO: Implementar sistema completo de permissões baseado em roles
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado'
        })
      }

      // Permissões específicas por role
      const rolePermissions: Record<string, string[]> = {
        superadmin: ['*'], // Todas as permissões
        admin: [
          'admin.*',
          'financial.*',
          'users.read',
          'users.create',
          'users.update'
        ],
        manager: [
          'financial.read',
          'financial.create',
          'financial.update',
          'products.*',
          'orders.*'
        ],
        user: [
          'financial.read',
          'products.read',
          'orders.read'
        ]
      }

      const userPermissions = rolePermissions[ctx.user.role] || rolePermissions.user

      // Verificar se tem a permissão específica ou wildcard
      const hasPermission = userPermissions.some(p => 
        p === '*' || 
        p === permission || 
        (p.endsWith('*') && permission.startsWith(p.slice(0, -1)))
      )

      if (!hasPermission) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Permissão negada para: ${permission}`
        })
      }

      return next()
    }
  }

  /**
   * Verificar se usuário tem permissão específica
   */
  static hasPermission(user: any, permission: string): boolean {
    if (!user) return false
    if (user.role === 'superadmin') return true

    const rolePermissions: Record<string, string[]> = {
      admin: [
        'admin.*',
        'financial.*',
        'users.read',
        'users.create',
        'users.update'
      ],
      manager: [
        'financial.read',
        'financial.create',
        'financial.update',
        'products.*',
        'orders.*'
      ],
      user: [
        'financial.read',
        'products.read',
        'orders.read'
      ]
    }

    const userPermissions = rolePermissions[user.role] || rolePermissions.user

    return userPermissions.some(p => 
      p === '*' || 
      p === permission || 
      (p.endsWith('*') && permission.startsWith(p.slice(0, -1)))
    )
  }

  /**
   * Listar todas as permissões de um usuário
   */
  static getUserPermissions(user: any): string[] {
    if (!user) return []
    if (user.role === 'superadmin') return ['*']

    const rolePermissions: Record<string, string[]> = {
      admin: [
        'admin.*',
        'financial.*',
        'users.read',
        'users.create',
        'users.update'
      ],
      manager: [
        'financial.read',
        'financial.create',
        'financial.update',
        'products.*',
        'orders.*'
      ],
      user: [
        'financial.read',
        'products.read',
        'orders.read'
      ]
    }

    return rolePermissions[user.role] || rolePermissions.user
  }
}