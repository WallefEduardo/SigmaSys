"use client"

import React from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Company } from '@/types'
import { setAuthCookie, getAuthCookie, removeAuthCookie } from '@/lib/auth-cookies'

interface AuthState {
  user: User | null
  company: Company | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userData: { user: User; company: Company; token: string }) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  validateSession: () => Promise<boolean>
  checkToken: () => boolean
}

// Função para verificar se token está válido
function isTokenValid(token: string | null): boolean {
  if (!token) return false
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    
    // Verificar se não expirou (com margem de 30 segundos)
    return payload.exp > (now + 30)
  } catch {
    return false
  }
}

// Usar as funções importadas ao invés de definir localmente

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: ({ user, company, token }) => {
        // Salvar token APENAS no cookie para evitar problemas de SSR
        setAuthCookie(token)
        
        set({
          user,
          company,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        // Só executar no cliente
        if (typeof window !== 'undefined') {
          // Remover token do cookie
          removeAuthCookie()
          
          // Redirecionar para login
          window.location.href = '/login'
        }
        
        set({
          user: null,
          company: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      updateUser: (userData) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...userData },
          })
        }
      },

      checkToken: () => {
        const { token } = get()
        return isTokenValid(token)
      },

      validateSession: async () => {
        const { token, logout } = get()
        
        // Verificar se token existe e é válido
        if (!isTokenValid(token)) {
          logout()
          return false
        }

        try {
          // Fazer chamada para o backend para validar o token
          const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3005'}/trpc/auth.me`, {
            method: 'GET',
            headers: {
              'authorization': `Bearer ${token}`,
              'content-type': 'application/json',
            },
          })

          if (!response.ok) {
            throw new Error('Token inválido')
          }

          set({ isLoading: false })
          return true
        } catch (error) {
          console.error('Erro ao validar sessão:', error)
          logout()
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Só executar no cliente
        if (typeof window === 'undefined') return
        
        // Validar token após hidratar do storage
        if (state && state.token) {
          if (!isTokenValid(state.token)) {
            state.logout()
          } else {
            state.isLoading = false
          }
        } else {
          if (state) state.isLoading = false
        }
      },
    }
  )
)

export function useAuth() {
  return useAuthStore()
}

// Hook para inicialização de auth
export function useAuthInitialization() {
  const { validateSession, isLoading } = useAuth()
  
  // Executar validação apenas uma vez quando o componente montar
  React.useEffect(() => {
    validateSession()
  }, [validateSession])
  
  return { isLoading }
}