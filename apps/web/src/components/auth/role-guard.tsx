"use client"

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
  showFallback?: boolean
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback,
  showFallback = true 
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth()

  // Se não está autenticado, não renderiza nada (AuthGuard cuida disso)
  if (!isAuthenticated || !user) {
    return null
  }

  // Verificar se o usuário tem permissão
  const hasPermission = allowedRoles.includes(user.role)

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (!showFallback) {
      return null
    }

    // Fallback padrão com mensagem de acesso negado
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Seu perfil:</strong> {user.role}<br/>
              <strong>Perfis permitidos:</strong> {allowedRoles.join(', ')}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

// Hook para verificar permissões
export function useRoleCheck() {
  const { user } = useAuth()

  const hasRole = (allowedRoles: string | string[]) => {
    if (!user) return false
    
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    return roles.includes(user.role)
  }

  const isSuperAdmin = () => hasRole('superadmin')
  const isAdmin = () => hasRole(['admin', 'superadmin'])
  const isManager = () => hasRole(['manager', 'admin', 'superadmin'])

  return {
    hasRole,
    isSuperAdmin,
    isAdmin, 
    isManager,
    userRole: user?.role
  }
}