"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Building2, CreditCard, Settings, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputMask, unmaskValue } from '@/components/ui/input-mask'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/trpc'
import { toast } from '@/hooks/use-toast'

const companySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cnpj: z.string().optional().refine((val) => {
    if (!val) return true // Opcional
    const unmasked = val.replace(/\D/g, '')
    return unmasked.length === 14 // CNPJ deve ter 14 dígitos
  }, 'CNPJ deve ter 14 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().refine((val) => {
    if (!val) return true // Opcional
    const unmasked = val.replace(/\D/g, '')
    return unmasked.length === 10 || unmasked.length === 11 // Telefone 10 ou 11 dígitos
  }, 'Telefone deve ter 10 ou 11 dígitos'),
  address: z.string().optional(),
  planId: z.string().optional(),
  trialDays: z.number().min(0).max(365).default(15)
})

type CompanyFormData = z.infer<typeof companySchema>

export default function NovaEmpresaPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      trialDays: 15
    }
  })

  // Buscar planos disponíveis
  const { data: plans, isLoading: loadingPlans } = api.companies.plans.useQuery()

  // Mutation para criar empresa
  const createCompanyMutation = api.companies.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Empresa criada',
        description: 'A empresa foi criada com sucesso.'
      })
      router.push('/superadmin/empresas')
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const onSubmit = async (data: CompanyFormData) => {
    // Limpar campos vazios e remover máscaras
    const cleanData = {
      ...data,
      email: data.email || undefined,
      cnpj: data.cnpj ? unmaskValue(data.cnpj) : undefined,
      phone: data.phone ? unmaskValue(data.phone) : undefined,
      address: data.address || undefined,
      planId: data.planId === "none" ? undefined : data.planId
    }
    
    createCompanyMutation.mutate(cleanData)
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
            <h1 className="text-3xl font-bold">Nova Empresa</h1>
            <p className="text-muted-foreground">
              Criar uma nova empresa no sistema
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Informações Básicas */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Empresa ABC Ltda" 
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <InputMask 
                  id="cnpj" 
                  mask="cnpj"
                  placeholder="00.000.000/0001-00" 
                  {...register("cnpj")}
                />
                {errors.cnpj && (
                  <p className="text-sm text-red-500">{errors.cnpj.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="contato@empresa.com" 
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                placeholder="Rua, número, bairro, cidade, estado, CEP"
                rows={3}
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plano e Configurações */}
        <Card className="border-l-4 border-l-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <CreditCard className="h-5 w-5" />
              Plano e Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="planId">Plano</Label>
                <Select
                  value={watch("planId") || ""}
                  onValueChange={(value) => setValue("planId", value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingPlans ? "Carregando planos..." : "Selecione um plano (opcional)"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem plano (apenas trial)</SelectItem>
                    {plans?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {plan.maxUsers} usuário(s) • {plan.maxClients || '∞'} cliente(s)
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-green-600">
                              R$ {plan.price.toString()}/mês
                            </span>
                            {plan.popular && (
                              <div className="text-xs text-yellow-600 font-medium">Popular</div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialDays">Dias de Trial</Label>
                <Input 
                  id="trialDays" 
                  type="number" 
                  min="0" 
                  max="365" 
                  placeholder="15" 
                  {...register("trialDays", { valueAsNumber: true })}
                />
                {errors.trialDays && (
                  <p className="text-sm text-red-500">{errors.trialDays.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Número de dias que a empresa poderá usar o sistema gratuitamente
                </p>
              </div>
            </div>

            {watch("planId") && plans && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Resumo do Plano Selecionado</h4>
                {(() => {
                  const selectedPlan = plans.find(p => p.id === watch("planId"))
                  if (!selectedPlan) return null
                  
                  return (
                    <div className="space-y-1 text-sm">
                      <div><strong>Nome:</strong> {selectedPlan.name}</div>
                      <div><strong>Preço:</strong> R$ {selectedPlan.price}/mês</div>
                      {selectedPlan.description && (
                        <div><strong>Descrição:</strong> {selectedPlan.description}</div>
                      )}
                      <div><strong>Limites:</strong></div>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Usuários: {selectedPlan.maxUsers}</li>
                        <li>Clientes: {selectedPlan.maxClients}</li>
                        <li>Produtos: {selectedPlan.maxProducts}</li>
                        <li>Armazenamento: {selectedPlan.maxStorage} MB</li>
                      </ul>
                    </div>
                  )
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                className="min-w-[120px]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px] bg-primary hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Criar Empresa'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}