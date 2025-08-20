"use client"

import React, { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, validateSession, checkToken } = useAuth()

  useEffect(() => {
    // Validar sessão quando o componente montar
    if (!isAuthenticated && !isLoading) {
      validateSession()
    }
  }, [isAuthenticated, isLoading, validateSession])

  // Verificar token periodicamente (a cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !checkToken()) {
        console.warn('Token expirado detectado no check periódico')
        // O hook já vai fazer logout automaticamente
      }
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [isAuthenticated, checkToken])

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Loading component customizado
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex flex-col items-center gap-6 text-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-slate-700 border-r-green-500 rounded-full animate-spin animation-delay-150"></div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">ErpSys</h2>
          <p className="text-slate-400">Carregando sistema...</p>
        </div>
      </div>
    </div>
  )
}