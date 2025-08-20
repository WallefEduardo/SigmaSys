"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { api } from '@/lib/trpc'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Mail, Lock, ArrowRight, Building2, User, Settings } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      // Chamar a função login que salva no cookie
      login(data)
      
      toast.success('Login realizado com sucesso!')
      
      // Verificar se há redirect URL
      const urlParams = new URLSearchParams(window.location.search)
      const redirectUrl = urlParams.get('redirect')
      
      // Usar router.push para navegação
      router.push(redirectUrl || '/dashboard')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao fazer login')
    },
  })

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,#58DDAA_0%,transparent_50%),radial-gradient(circle_at_75%_75%,#151C24_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-secondary to-primary rounded-2xl shadow-lg">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ErpSys</h1>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            <Settings className="w-4 h-4" />
            Sistema de Comunicação Visual
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-slate-400">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-secondary focus:ring-secondary/20"
                    {...register('email')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-secondary focus:ring-secondary/20"
                    {...register('password')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold h-11 transition-all duration-200 shadow-lg hover:shadow-secondary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Entrar no Sistema
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-3">
                <User className="w-4 h-4" />
                Credenciais de Demonstração
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Super Admin:</span>
                  <span>superadmin@erpsys.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Admin:</span>
                  <span>admin@empresateste.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Gerente:</span>
                  <span>gerente@empresateste.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Usuário:</span>
                  <span>usuario@empresateste.com</span>
                </div>
                <div className="text-center mt-2 pt-2 border-t border-amber-500/20">
                  <span className="font-semibold">Senhas: admin123 (Super) / 123456 (Outros)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-slate-500 text-sm">
          © 2024 ErpSys. Sistema ERP para Comunicação Visual.
        </div>
      </div>
    </div>
  )
}