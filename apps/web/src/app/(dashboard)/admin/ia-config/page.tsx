'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CustomTabs } from '@/components/ui/custom-tabs'
import { Separator } from '@/components/ui/separator'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'
import { Loader2, Bot, Eye, EyeOff, TestTube, Activity, BarChart3 } from 'lucide-react'

const aiConfigSchema = z.object({
  openaiApiKey: z.string().optional(),
  claudeApiKey: z.string().optional(),
  openrouterApiKey: z.string().optional(),
  aiDefaultProvider: z.enum(['openai', 'claude', 'openrouter']),
  aiDefaultModel: z.string().optional(),
  aiEnabled: z.boolean()
})

type AIConfigForm = z.infer<typeof aiConfigSchema>

export default function AIConfigPage() {
  const router = useRouter()
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)

  // Modelos por provedor
  const providerModels = {
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o', price: '$0.005/1K tokens' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', price: '$0.00015/1K tokens' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', price: '$0.01/1K tokens' }
    ],
    claude: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', price: '$0.003/1K tokens' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', price: '$0.00025/1K tokens' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', price: '$0.015/1K tokens' }
    ],
    openrouter: [
      { id: 'qwen/qwq-32b', name: 'Qwen QwQ 32B (Reasoning)', price: '$0.000000075/token' },
      { id: 'qwen/qwen-plus', name: 'Qwen Plus (131K context)', price: '$0.0000004/token' },
      { id: 'qwen/qwen-max', name: 'Qwen Max (MoE)', price: '$0.0000016/token' },
      { id: 'deepseek/deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill Qwen 32B', price: '$0.000000075/token' },
      { id: 'deepseek/deepseek-r1-distill-qwen-1.5b', name: 'DeepSeek R1 Distill Qwen 1.5B', price: '$0.00000018/token' },
      { id: 'qwen/qwen1.5-14b-chat:free', name: 'Qwen1.5 14B Chat (Free)', price: 'Free' },
      { id: 'qwen/qwq-32b:free', name: 'Qwen QwQ 32B (Free)', price: 'Free' },
      { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct', price: '$0.00000004/token' }
    ]
  }

  const providerInfo = {
    openai: { name: 'OpenAI', apiKeyPrefix: 'sk-', description: 'GPT-4o e outros modelos da OpenAI' },
    claude: { name: 'Claude Anthropic', apiKeyPrefix: 'sk-ant-', description: 'Claude Sonnet e Haiku da Anthropic' },
    openrouter: { name: 'OpenRouter', apiKeyPrefix: 'sk-or-', description: 'IAs chinesas baratas e inteligentes' }
  }

  // Queries
  const { data: config, isLoading: configLoading } = api.admin.ai.get.useQuery()
  const { data: status } = api.admin.ai.getStatus.useQuery(undefined, {
    refetchInterval: 30000 // Refresh every 30s
  })
  const { data: usageStats } = api.admin.ai.getUsageStats.useQuery({})

  // Mutations
  const utils = api.useUtils()
  const updateMutation = api.admin.ai.update.useMutation({
    onSuccess: () => {
      // Invalidar as queries para forçar refetch
      utils.admin.ai.get.invalidate()
      utils.admin.ai.getStatus.invalidate()
      
      toast.success('Configuração de IA atualizada com sucesso!', {
        duration: 4000,
        position: 'top-center'
      })
      router.refresh()
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar configuração: ${error.message}`, {
        duration: 5000,
        position: 'top-center'
      })
    }
  })

  const testMutation = api.admin.ai.test.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message, {
          duration: 5000,
          position: 'top-center'
        })
      } else {
        toast.error(result.message, {
          duration: 5000,
          position: 'top-center'
        })
      }
    },
    onError: (error) => {
      toast.error(`Erro no teste: ${error.message}`, {
        duration: 5000,
        position: 'top-center'
      })
    },
    onSettled: () => {
      setTestingProvider(null)
    }
  })

  const form = useForm<AIConfigForm>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      openaiApiKey: '',
      claudeApiKey: '',
      openrouterApiKey: '',
      aiDefaultProvider: 'openai',
      aiDefaultModel: 'qwen/qwq-32b',
      aiEnabled: false
    }
  })

  // Carregar dados no form
  useEffect(() => {
    if (config) {
      form.reset({
        openaiApiKey: '',
        claudeApiKey: '',
        openrouterApiKey: '',
        aiDefaultProvider: config.aiDefaultProvider as 'openai' | 'claude' | 'openrouter' || 'openai',
        aiDefaultModel: config.aiDefaultModel || 'qwen/qwq-32b',
        aiEnabled: config.aiEnabled
      })
    }
  }, [config, form])

  const selectedProvider = form.watch('aiDefaultProvider')
  const selectedProviderInfo = providerInfo[selectedProvider]
  const availableModels = providerModels[selectedProvider]

  const onSubmit = (data: AIConfigForm) => {
    updateMutation.mutate(data)
  }

  const testConnection = async () => {
    const provider = selectedProvider
    let apiKey = ''
    
    switch (provider) {
      case 'openai':
        apiKey = form.getValues('openaiApiKey') || ''
        break
      case 'claude':
        apiKey = form.getValues('claudeApiKey') || ''
        break
      case 'openrouter':
        apiKey = form.getValues('openrouterApiKey') || ''
        break
    }
    
    if (!apiKey) {
      toast.error(`Insira a API key do ${selectedProviderInfo.name} primeiro`)
      return
    }

    setTestingProvider(provider)
    testMutation.mutate({ provider, apiKey })
  }

  if (configLoading) {
    return (
      <div className="w-full py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-10 space-y-8">
      <div className="flex items-center gap-2">
        <Bot className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuração de IA</h1>
          <p className="text-muted-foreground">
            Configure as APIs de inteligência artificial para o sistema financeiro
          </p>
        </div>
      </div>

      <CustomTabs
        defaultTab="config"
        tabs={[
          {
            id: "config",
            label: "Configuração",
            content: (
              <div className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de IA</CardTitle>
                  <CardDescription>
                    Selecione o provedor e configure suas credenciais de acesso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ativar IA */}
                  <FormField
                    control={form.control}
                    name="aiEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativar IA</FormLabel>
                          <FormDescription>
                            Habilitar funcionalidades de inteligência artificial
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

                  {form.watch('aiEnabled') && (
                    <>
                      <Separator />
                      
                      {/* Seleção de Provedor */}
                      <FormField
                        control={form.control}
                        name="aiDefaultProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-medium">Provedor de IA</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o provedor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="openai">OpenAI</SelectItem>
                                <SelectItem value="claude">Claude Anthropic</SelectItem>
                                <SelectItem value="openrouter">OpenRouter</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {selectedProviderInfo.description}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      {/* Configuração do Provedor Selecionado */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">{selectedProviderInfo.name}</h3>
                          {((selectedProvider === 'openai' && config?.hasOpenaiKey) ||
                            (selectedProvider === 'claude' && config?.hasClaudeKey) ||
                            (selectedProvider === 'openrouter' && config?.hasOpenrouterKey)) && (
                            <Badge variant="outline" className="text-green-600">
                              Configurado
                            </Badge>
                          )}
                        </div>
                        
                        {/* Status da API Key - só mostra quando há chave configurada */}
                        {((selectedProvider === 'openai' && config?.hasOpenaiKey) ||
                          (selectedProvider === 'claude' && config?.hasClaudeKey) ||
                          (selectedProvider === 'openrouter' && config?.hasOpenrouterKey)) && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-green-800">
                                  API {selectedProviderInfo.name} ativa
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const fieldName = `${selectedProvider}ApiKey` as keyof AIConfigForm
                                  // Limpar a API key do provedor selecionado
                                  const currentData = form.getValues()
                                  
                                  // Verificar se esta é a única API key ativa
                                  const hasOtherKeys = (
                                    (selectedProvider !== 'openai' && config?.hasOpenaiKey) ||
                                    (selectedProvider !== 'claude' && config?.hasClaudeKey) ||
                                    (selectedProvider !== 'openrouter' && config?.hasOpenrouterKey)
                                  )
                                  
                                  const updateData = {
                                    ...currentData,
                                    [fieldName]: '', // Usar string vazia em vez de undefined
                                    // Se não há outras chaves, desabilitar a IA
                                    aiEnabled: hasOtherKeys
                                  }
                                  
                                  try {
                                    await updateMutation.mutateAsync(updateData)
                                    // Limpar o campo no formulário após sucesso
                                    form.setValue(fieldName, '' as any)
                                    // Se não há outras chaves, desabilitar o switch também
                                    if (!hasOtherKeys) {
                                      form.setValue('aiEnabled', false)
                                    }
                                  } catch (error) {
                                    console.error('Erro ao desativar API:', error)
                                  }
                                }}
                                disabled={updateMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {updateMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Desativando...
                                  </>
                                ) : (
                                  'Desativar API'
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              Chave configurada e salva no sistema
                            </p>
                          </div>
                        )}

                        {/* Campo de API Key dinâmico */}
                        <FormField
                          control={form.control}
                          name={`${selectedProvider}ApiKey` as keyof AIConfigForm}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {((selectedProvider === 'openai' && config?.hasOpenaiKey) ||
                                  (selectedProvider === 'claude' && config?.hasClaudeKey) ||
                                  (selectedProvider === 'openrouter' && config?.hasOpenrouterKey))
                                  ? `Alterar API Key ${selectedProviderInfo.name}`
                                  : `API Key ${selectedProviderInfo.name}`
                                }
                              </FormLabel>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <FormControl>
                                    <Input
                                      type={showApiKey ? 'text' : 'password'}
                                      placeholder={
                                        ((selectedProvider === 'openai' && config?.hasOpenaiKey) ||
                                         (selectedProvider === 'claude' && config?.hasClaudeKey) ||
                                         (selectedProvider === 'openrouter' && config?.hasOpenrouterKey))
                                          ? 'Cole uma nova chave para alterar...'
                                          : selectedProviderInfo.apiKeyPrefix + '...'
                                      }
                                      {...field}
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                  >
                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={!field.value || testingProvider === selectedProvider}
                                  onClick={() => testConnection()}
                                >
                                  {testingProvider === selectedProvider ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Testando...
                                    </>
                                  ) : (
                                    <>
                                      <TestTube className="h-4 w-4 mr-2" />
                                      Testar
                                    </>
                                  )}
                                </Button>
                              </div>
                              <FormDescription>
                                {((selectedProvider === 'openai' && config?.hasOpenaiKey) ||
                                  (selectedProvider === 'claude' && config?.hasClaudeKey) ||
                                  (selectedProvider === 'openrouter' && config?.hasOpenrouterKey))
                                  ? 'Deixe em branco para manter a chave atual'
                                  : `Chave da API ${selectedProviderInfo.name}`
                                }
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Seleção de Modelo */}
                        <FormField
                          control={form.control}
                          name="aiDefaultModel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modelo</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o modelo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableModels.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                      <div className="flex justify-between items-center w-full">
                                        <span>{model.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">{model.price}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Modelo padrão do provedor selecionado
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configuração
                </Button>
              </div>
            </form>
          </Form>
              </div>
            )
          },
          {
            id: "status",
            label: "Status",
            content: (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status do Serviço de IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {status ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge variant={status.enabled ? 'default' : 'secondary'}>
                      {status.enabled ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <span className="font-medium">OpenAI:</span>
                      <Badge variant={status.providers.openai ? 'default' : 'secondary'}>
                        {status.providers.openai ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="font-medium">Claude:</span>
                      <Badge variant={status.providers.claude ? 'default' : 'secondary'}>
                        {status.providers.claude ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <span className="font-medium">OpenRouter:</span>
                      <Badge variant={status.providers.openrouter ? 'default' : 'secondary'}>
                        {status.providers.openrouter ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>{status.message}</AlertDescription>
                  </Alert>
                </>
              ) : (
                <p className="text-muted-foreground">Carregando status...</p>
              )}
            </CardContent>
          </Card>
            )
          },
          {
            id: "usage",
            label: "Estatísticas",
            content: (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Insights Gerados</h4>
                    <p className="text-2xl font-bold">{usageStats.insights.total}</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {Object.entries(usageStats.insights.byModel).map(([model, count]) => (
                        <div key={model} className="flex justify-between">
                          <span>{model}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Transações IA</h4>
                    <p className="text-2xl font-bold">{usageStats.transactions.aiCategorized}</p>
                    <p className="text-sm text-muted-foreground">Categorizadas automaticamente</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Alertas IA</h4>
                    <p className="text-2xl font-bold">{usageStats.alerts.aiGenerated}</p>
                    <p className="text-sm text-muted-foreground">Alertas gerados</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Carregando estatísticas...</p>
              )}
            </CardContent>
          </Card>
            )
          }
        ]}
      />
    </div>
  )
}