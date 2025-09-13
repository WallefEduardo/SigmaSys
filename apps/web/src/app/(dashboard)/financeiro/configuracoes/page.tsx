'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  Settings, 
  Bell,
  Palette,
  Database,
  Shield,
  Bot,
  Loader2,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import FloatingChatButton from '@/components/financial/FloatingChatButton'

const financialSettingsSchema = z.object({
  currency: z.string().min(1, 'Moeda é obrigatória'),
  timezone: z.string().min(1, 'Fuso horário é obrigatório'),
  budgetCycle: z.enum(['monthly', 'quarterly', 'yearly']),
  autoCategorizationEnabled: z.boolean(),
  reminderEnabled: z.boolean(),
  reminderDaysBefore: z.number().min(1).max(30),
  backupEnabled: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  alertThresholds: z.object({
    budgetExceeded: z.number().min(50).max(100),
    lowBalance: z.number().min(0),
    unusualExpense: z.number().min(100)
  }),
  aiSettings: z.object({
    insightsEnabled: z.boolean(),
    autoReportsEnabled: z.boolean(),
    suggestionLevel: z.enum(['basic', 'intermediate', 'advanced']),
    privacyMode: z.boolean()
  })
})

type FinancialSettingsForm = z.infer<typeof financialSettingsSchema>

export default function FinancialSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [isTesting, setIsTesting] = useState(false)

  // Queries
  const { data: settings, isLoading } = api.financial.settings.get.useQuery()
  const { data: systemStatus } = api.financial.settings.getSystemStatus.useQuery()

  // Mutations
  const updateMutation = api.financial.settings.update.useMutation({
    onSuccess: () => {
      toast.success('Configurações salvas com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`)
    }
  })

  const testConnectionMutation = api.financial.settings.testConnection.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Conexão testada com sucesso!')
      } else {
        toast.error('Falha na conexão')
      }
    },
    onError: () => {
      toast.error('Erro ao testar conexão')
    }
  })

  const form = useForm<FinancialSettingsForm>({
    resolver: zodResolver(financialSettingsSchema),
    defaultValues: {
      currency: 'BRL',
      timezone: 'America/Sao_Paulo',
      budgetCycle: 'monthly',
      autoCategorizationEnabled: true,
      reminderEnabled: true,
      reminderDaysBefore: 3,
      backupEnabled: true,
      backupFrequency: 'weekly',
      alertThresholds: {
        budgetExceeded: 80,
        lowBalance: 100,
        unusualExpense: 500
      },
      aiSettings: {
        insightsEnabled: true,
        autoReportsEnabled: false,
        suggestionLevel: 'intermediate',
        privacyMode: false
      }
    }
  })

  // Carregar dados no form
  useEffect(() => {
    if (settings) {
      form.reset(settings)
    }
  }, [settings, form])

  const onSubmit = (data: FinancialSettingsForm) => {
    updateMutation.mutate(data)
  }

  const handleTestConnection = () => {
    setIsTesting(true)
    testConnectionMutation.mutate({}, {
      onSettled: () => setIsTesting(false)
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="space-y-6">
          <Skeleton className="h-8 w-[300px]" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <FloatingChatButton />
      <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-2">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações Financeiras</h1>
          <p className="text-muted-foreground">
            Configure as preferências do sistema financeiro
          </p>
        </div>
      </div>

      {/* Status do Sistema */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">Banco de Dados</p>
                  <p className="text-sm text-muted-foreground">Conectado</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">Backup</p>
                  <p className="text-sm text-muted-foreground">Ativo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium">IA</p>
                  <p className="text-sm text-muted-foreground">Funcionando</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="font-medium">Alertas</p>
                  <p className="text-sm text-muted-foreground">2 pendentes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="ai">Inteligência Artificial</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>
                    Configurações básicas do sistema financeiro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Moeda Padrão</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                              <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                              <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Moeda utilizada para exibir valores
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuso Horário</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                              <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                              <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Fuso horário para relatórios e alertas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="budgetCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciclo de Orçamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="quarterly">Trimestral</SelectItem>
                            <SelectItem value="yearly">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Período padrão para novos orçamentos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoCategorizationEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Categorização Automática</FormLabel>
                          <FormDescription>
                            Usar IA para categorizar transações automaticamente
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações e Lembretes
                  </CardTitle>
                  <CardDescription>
                    Configure como e quando receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="reminderEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Lembretes de Metas</FormLabel>
                          <FormDescription>
                            Receber lembretes sobre prazos de metas financeiras
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('reminderEnabled') && (
                    <FormField
                      control={form.control}
                      name="reminderDaysBefore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dias de Antecedência</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                            />
                          </FormControl>
                          <FormDescription>
                            Quantos dias antes do prazo enviar o lembrete
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Limites de Alerta</h3>
                    
                    <FormField
                      control={form.control}
                      name="alertThresholds.budgetExceeded"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orçamento Excedido (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="50"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 80)}
                            />
                          </FormControl>
                          <FormDescription>
                            Alertar quando o orçamento atingir esta porcentagem
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="alertThresholds.lowBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Saldo Baixo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 100)}
                            />
                          </FormControl>
                          <FormDescription>
                            Alertar quando o saldo ficar abaixo deste valor ({formatCurrency(field.value)})
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="alertThresholds.unusualExpense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Despesa Incomum</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="100"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 500)}
                            />
                          </FormControl>
                          <FormDescription>
                            Alertar sobre despesas acima de {formatCurrency(field.value)}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Inteligência Artificial
                  </CardTitle>
                  <CardDescription>
                    Configure como a IA deve funcionar no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="aiSettings.insightsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Insights Inteligentes</FormLabel>
                          <FormDescription>
                            Gerar insights automáticos sobre suas finanças
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiSettings.autoReportsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Relatórios Automáticos</FormLabel>
                          <FormDescription>
                            Gerar relatórios mensais automaticamente
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiSettings.suggestionLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Sugestões</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="basic">Básico - Sugestões simples</SelectItem>
                            <SelectItem value="intermediate">Intermediário - Análises detalhadas</SelectItem>
                            <SelectItem value="advanced">Avançado - Insights complexos</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Complexidade das sugestões e análises da IA
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiSettings.privacyMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Modo Privacidade</FormLabel>
                          <FormDescription>
                            Processar dados localmente quando possível
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Backup e Sincronização
                  </CardTitle>
                  <CardDescription>
                    Configure backup automático dos seus dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="backupEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Backup Automático</FormLabel>
                          <FormDescription>
                            Fazer backup dos dados automaticamente
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('backupEnabled') && (
                    <FormField
                      control={form.control}
                      name="backupFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequência do Backup</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Diário</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Com que frequência realizar backup automático
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex justify-between items-center pt-4">
                    <div>
                      <p className="font-medium">Testar Conexão</p>
                      <p className="text-sm text-muted-foreground">
                        Verificar se o sistema de backup está funcionando
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Testar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Segurança
                  </CardTitle>
                  <CardDescription>
                    Configurações de segurança e privacidade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Autenticação de Dois Fatores</p>
                        <p className="text-sm text-muted-foreground">
                          Adicionar camada extra de segurança
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configurar
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Log de Atividades</p>
                        <p className="text-sm text-muted-foreground">
                          Registrar todas as ações do usuário
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Criptografia de Dados</p>
                        <p className="text-sm text-muted-foreground">
                          Criptografar dados sensíveis
                        </p>
                      </div>
                      <Switch defaultChecked disabled />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </Form>
      </div>
    </>
  )
}