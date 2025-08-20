"use client"

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, FileText, DollarSign, Settings, Zap, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch-simple'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const planSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  yearlyPrice: z.number().optional(),
  maxUsers: z.number().min(1),
  maxClients: z.number().min(1),
  maxProducts: z.number().min(1),
  maxOrders: z.number().min(1),
  maxQuotes: z.number().min(1),
  maxStorage: z.number().min(100),
  trialDays: z.number().min(0).max(365).default(15),
  active: z.boolean().default(true),
  popular: z.boolean().default(false),
  // Funcionalidades
  dashboardBasico: z.boolean().default(true),
  dashboardCompleto: z.boolean().default(false),
  dashboardAvancado: z.boolean().default(false),
  dashboardExecutivo: z.boolean().default(false),
  cadastroClientes: z.boolean().default(true),
  cadastroProdutos: z.boolean().default(true),
  // Módulos
  moduloDashboard: z.boolean().default(true),
  moduloCadastros: z.boolean().default(true),
  moduloComercial: z.boolean().default(false),
  moduloComercialBasico: z.boolean().default(false),
  moduloEstoque: z.boolean().default(false),
  moduloFinanceiro: z.boolean().default(false)
})

type PlanFormData = z.infer<typeof planSchema>

export default function NovoPlanoPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      maxUsers: 1,
      maxClients: 100,
      maxProducts: 50,
      maxOrders: 100,
      maxQuotes: 100,
      maxStorage: 1024,
      trialDays: 15,
      active: true,
      popular: false,
      // Funcionalidades
      dashboardBasico: true,
      dashboardCompleto: false,
      dashboardAvancado: false,
      dashboardExecutivo: false,
      cadastroClientes: true,
      cadastroProdutos: true,
      // Módulos
      moduloDashboard: true,
      moduloCadastros: true,
      moduloComercial: false,
      moduloComercialBasico: false,
      moduloEstoque: false,
      moduloFinanceiro: false
    }
  })

  const onSubmit = async (data: PlanFormData) => {
    console.log('Form data:', data)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Novo Plano</h1>
            <p className="text-muted-foreground">
              Crie um novo plano de assinatura para o sistema
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Informações Básicas */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Profissional" 
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Status do Plano</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="active"
                    checked={watch("active")}
                    onCheckedChange={(checked) => setValue("active", checked)}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    {watch("active") ? "Ativo" : "Inativo"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição detalhada do plano..."
                  rows={3}
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="popular">Plano Popular</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="popular"
                    checked={watch("popular")}
                    onCheckedChange={(checked) => setValue("popular", checked)}
                  />
                  <Label htmlFor="popular" className="cursor-pointer">
                    {watch("popular") ? "Plano destacado" : "Plano normal"}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preços */}
        <Card className="border-l-4 border-l-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <DollarSign className="h-5 w-5" />
              Preços e Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Preço Mensal (R$) *</Label>
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01" 
                  placeholder="99.90" 
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearlyPrice">Preço Anual (R$)</Label>
                <Input 
                  id="yearlyPrice" 
                  type="number" 
                  step="0.01" 
                  placeholder="999.00" 
                  {...register("yearlyPrice", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limites e Recursos */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Settings className="h-5 w-5" />
              Limites e Recursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Máximo de Usuários *</Label>
                <Input 
                  id="maxUsers" 
                  type="number" 
                  min="1" 
                  placeholder="10" 
                  {...register("maxUsers", { valueAsNumber: true })}
                />
                {errors.maxUsers && (
                  <p className="text-sm text-red-500">{errors.maxUsers.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxClients">Máximo de Clientes *</Label>
                <Input 
                  id="maxClients" 
                  type="number" 
                  min="1" 
                  placeholder="100" 
                  {...register("maxClients", { valueAsNumber: true })}
                />
                {errors.maxClients && (
                  <p className="text-sm text-red-500">{errors.maxClients.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxProducts">Máximo de Produtos *</Label>
                <Input 
                  id="maxProducts" 
                  type="number" 
                  min="1" 
                  placeholder="50" 
                  {...register("maxProducts", { valueAsNumber: true })}
                />
                {errors.maxProducts && (
                  <p className="text-sm text-red-500">{errors.maxProducts.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxOrders">Máximo de Pedidos por Mês *</Label>
                <Input 
                  id="maxOrders" 
                  type="number" 
                  min="1" 
                  placeholder="100" 
                  {...register("maxOrders", { valueAsNumber: true })}
                />
                {errors.maxOrders && (
                  <p className="text-sm text-red-500">{errors.maxOrders.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxQuotes">Máximo de Orçamentos por Mês *</Label>
                <Input 
                  id="maxQuotes" 
                  type="number" 
                  min="1" 
                  placeholder="100" 
                  {...register("maxQuotes", { valueAsNumber: true })}
                />
                {errors.maxQuotes && (
                  <p className="text-sm text-red-500">{errors.maxQuotes.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStorage">Armazenamento (MB) *</Label>
                <Input 
                  id="maxStorage" 
                  type="number" 
                  min="100" 
                  placeholder="1024" 
                  {...register("maxStorage", { valueAsNumber: true })}
                />
                {errors.maxStorage && (
                  <p className="text-sm text-red-500">{errors.maxStorage.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades e Módulos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Funcionalidades Incluídas */}
          <Card className="border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <Zap className="h-5 w-5" />
                Funcionalidades Incluídas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="dashboardBasico" className="cursor-pointer">Dashboard Básico</Label>
                <Switch
                  id="dashboardBasico"
                  checked={watch("dashboardBasico")}
                  onCheckedChange={(checked) => setValue("dashboardBasico", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="dashboardCompleto" className="cursor-pointer">Dashboard Completo</Label>
                <Switch
                  id="dashboardCompleto"
                  checked={watch("dashboardCompleto")}
                  onCheckedChange={(checked) => setValue("dashboardCompleto", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="dashboardAvancado" className="cursor-pointer">Dashboard Avançado</Label>
                <Switch
                  id="dashboardAvancado"
                  checked={watch("dashboardAvancado")}
                  onCheckedChange={(checked) => setValue("dashboardAvancado", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="dashboardExecutivo" className="cursor-pointer">Dashboard Executivo</Label>
                <Switch
                  id="dashboardExecutivo"
                  checked={watch("dashboardExecutivo")}
                  onCheckedChange={(checked) => setValue("dashboardExecutivo", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="cadastroClientes" className="cursor-pointer">Cadastro de Clientes</Label>
                <Switch
                  id="cadastroClientes"
                  checked={watch("cadastroClientes")}
                  onCheckedChange={(checked) => setValue("cadastroClientes", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="cadastroProdutos" className="cursor-pointer">Cadastro de Produtos</Label>
                <Switch
                  id="cadastroProdutos"
                  checked={watch("cadastroProdutos")}
                  onCheckedChange={(checked) => setValue("cadastroProdutos", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Módulos Disponíveis */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Package className="h-5 w-5" />
                Módulos Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="moduloDashboard" className="cursor-pointer">Dashboard</Label>
                <Switch
                  id="moduloDashboard"
                  checked={watch("moduloDashboard")}
                  onCheckedChange={(checked) => setValue("moduloDashboard", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="moduloCadastros" className="cursor-pointer">Cadastros</Label>
                <Switch
                  id="moduloCadastros"
                  checked={watch("moduloCadastros")}
                  onCheckedChange={(checked) => setValue("moduloCadastros", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="moduloComercial" className="cursor-pointer">Comercial</Label>
                <Switch
                  id="moduloComercial"
                  checked={watch("moduloComercial")}
                  onCheckedChange={(checked) => setValue("moduloComercial", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="moduloComercialBasico" className="cursor-pointer">Comercial Básico</Label>
                <Switch
                  id="moduloComercialBasico"
                  checked={watch("moduloComercialBasico")}
                  onCheckedChange={(checked) => setValue("moduloComercialBasico", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="moduloEstoque" className="cursor-pointer">Estoque</Label>
                <Switch
                  id="moduloEstoque"
                  checked={watch("moduloEstoque")}
                  onCheckedChange={(checked) => setValue("moduloEstoque", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label htmlFor="moduloFinanceiro" className="cursor-pointer">Financeiro</Label>
                <Switch
                  id="moduloFinanceiro"
                  checked={watch("moduloFinanceiro")}
                  onCheckedChange={(checked) => setValue("moduloFinanceiro", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

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
                {isSubmitting ? 'Salvando...' : 'Salvar Plano'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}