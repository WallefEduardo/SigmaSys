"use client"

import { Shield, AlertTriangle, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function AccessDeniedPage() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acesso Negado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Usuário:</strong> {user?.name || "Não identificado"}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {user?.email || "Não identificado"}
                </p>
                <p className="text-sm">
                  <strong>Role:</strong> {user?.role || "Não identificado"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Se você acredita que deveria ter acesso a esta página, entre em contato com o administrador do sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-secondary/10 p-4 rounded-lg border border-secondary">
            <h4 className="font-semibold text-sm mb-2">Informações de Debug:</h4>
            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{JSON.stringify({
  user: user || null,
  pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
  timestamp: new Date().toISOString()
}, null, 2)}
            </pre>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.back()}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button 
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              Ir para Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}