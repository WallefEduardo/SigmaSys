"use client"

import React from 'react'
import { useAuth } from '@/hooks/use-auth'

export default function DashboardPage() {
  const { user, company } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema ERP de comunicação visual
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Usuário</h3>
          <p className="text-sm text-muted-foreground">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Empresa</h3>
          <p className="text-sm text-muted-foreground">{company?.name || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">Plano: {company?.plan || 'N/A'}</p>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Sistema</h3>
          <p className="text-sm text-muted-foreground">FASE 1 - Implementada</p>
          <p className="text-sm text-muted-foreground">Status: ✅ Funcional</p>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Próximos Passos</h3>
          <p className="text-sm text-muted-foreground">FASE 2 - Cadastros</p>
          <p className="text-sm text-muted-foreground">Em desenvolvimento</p>
        </div>
      </div>
    </div>
  )
}