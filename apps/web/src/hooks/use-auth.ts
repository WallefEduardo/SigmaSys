"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Company } from '@/types'

interface AuthState {
  user: User | null
  company: Company | null
  token: string | null
  isAuthenticated: boolean
  login: (userData: { user: User; company: Company; token: string }) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      token: null,
      isAuthenticated: false,

      login: ({ user, company, token }) => {
        // Salvar token no localStorage para o tRPC
        localStorage.setItem('auth-token', token)
        
        set({
          user,
          company,
          token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        // Remover token do localStorage
        localStorage.removeItem('auth-token')
        
        set({
          user: null,
          company: null,
          token: null,
          isAuthenticated: false,
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export function useAuth() {
  return useAuthStore()
}