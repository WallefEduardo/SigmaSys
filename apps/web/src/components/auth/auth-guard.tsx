"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login')
    }
  }, [isAuthenticated, token, router])

  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}