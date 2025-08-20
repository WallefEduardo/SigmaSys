"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, User, Shield, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputMask, unmaskValue } from '@/components/ui/input-mask'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RoleGuard } from '@/components/auth/role-guard'
import { api } from '@/lib/trpc'
import { toast } from '@/hooks/use-toast'

const userSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'manager', 'user'], {
    required_error: 'Selecione um cargo'
  }),
  phone: z.string().optional().refine((val) => {
    if (!val) return true // Opcional
    const unmasked = val.replace(/\D/g, '')
    return unmasked.length === 10 || unmasked.length === 11 // Telefone 10 ou 11 dígitos
  }, 'Telefone deve ter 10 ou 11 dígitos'),
  department: z.string().optional(),
  position: z.string().optional(),
  companyId: z.string({
    required_error: 'Selecione uma empresa'
  }),
  active: z.boolean().default(true)
})

type UserFormData = z.infer<typeof userSchema>

function EditarUsuarioPageContent({ params }: { params: { id: string } }) {
  const router = useRouter()
  const userId = params.id

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  })

  // Buscar dados do usuário
  const { data: user, isLoading: loadingUser, refetch } = api.users.getById.useQuery({
    id: userId
  })

  // Buscar empresas disponíveis
  const { data: companies, isLoading: loadingCompanies } = api.companies.list.useQuery({
    page: 1,
    limit: 100, // Buscar todas as empresas
    active: true
  })

  // Mutation para atualizar usuário
  const updateUserMutation = api.users.update.useMutation({
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso!')
      refetch()
      router.push('/admin/users')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar usuário')
    }
  })

  // Preencher formulário quando os dados do usuário chegarem
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role as 'admin' | 'manager' | 'user',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
        companyId: user.companyId,
        active: user.active
      })
    }
  }, [user, reset])

  const onSubmit = async (data: UserFormData) => {
    // Limpar campos vazios e remover máscaras
    const cleanData = {
      ...data,
      phone: data.phone ? unmaskValue(data.phone) : undefined,
      department: data.department || undefined,
      position: data.position || undefined
    }
    
    updateUserMutation.mutate({
      id: userId,
      ...cleanData
    })
  }

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando dados do usuário...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold">Usuário não encontrado</p>
          <p className="text-muted-foreground mb-4">O usuário solicitado não existe ou foi removido.</p>
          <Button onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Lista
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Usuário</h1>
            <p className="text-muted-foreground">
              Editando: {user.name}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: João da Silva" 
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="joao@empresa.com" 
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <InputMask 
                  id="phone" 
                  mask="phone"
                  placeholder="(11) 99999-9999" 
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <Select 
                  value={watch("active") ? "true" : "false"}
                  onValueChange={(value) => setValue("active", value === "true")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Ativo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="false">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Inativo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Informações Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="role">Cargo no Sistema *</Label>
                <Select 
                  value={watch("role") || ""}
                  onValueChange={(value) => setValue("role", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div>
                          <div className="font-medium">Usuário</div>
                          <div className="text-xs text-muted-foreground">Acesso básico ao sistema</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div>
                          <div className="font-medium">Gerente</div>
                          <div className="text-xs text-muted-foreground">Gerencia equipes e processos</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div>
                          <div className="font-medium">Administrador</div>
                          <div className="text-xs text-muted-foreground">Acesso total à empresa</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyId">Empresa *</Label>
                <Select 
                  value={watch("companyId") || ""}
                  onValueChange={(value) => setValue("companyId", value)}
                  disabled={loadingCompanies}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingCompanies ? "Carregando empresas..." : "Selecione a empresa"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{company.name}</span>
                          <span className="text-xs text-muted-foreground">{company.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companyId && (
                  <p className="text-sm text-red-500">{errors.companyId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input 
                  id="department" 
                  placeholder="Ex: Vendas, Marketing, Produção" 
                  {...register("department")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Cargo na Empresa</Label>
                <Input 
                  id="position" 
                  placeholder="Ex: Vendedor, Designer, Operador" 
                  {...register("position")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || updateUserMutation.isPending}
            className="min-w-[120px]"
          >
            {(isSubmitting || updateUserMutation.isPending) ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function EditarUsuarioPage({ params }: { params: { id: string } }) {
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <EditarUsuarioPageContent params={params} />
    </RoleGuard>
  )
}