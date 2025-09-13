'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Bot,
  Plus,
  Trash2,
  Loader2,
  Target,
  Calculator
} from 'lucide-react'
import { startOfMonth, endOfMonth } from 'date-fns'

const budgetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  totalAmount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.string(),
  endDate: z.string(),
  categories: z.array(z.object({
    categoryId: z.string(),
    amount: z.number().min(0)
  })).min(1, 'Pelo menos uma categoria é obrigatória')
})

type BudgetForm = z.infer<typeof budgetSchema>

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const [budgetCategories, setBudgetCategories] = useState<Array<{categoryId: string, amount: number, amountDisplay?: string}>>([])
  const [totalAmountDisplay, setTotalAmountDisplay] = useState('')

  // Queries
  const { data: categories } = api.financial.categories.list.useQuery({})
  // TODO: Implementar sugestões de IA
  // const { data: aiSuggestions } = api.financial.ai.getBudgetSuggestions.useQuery({
  //   period: new Date().toISOString().slice(0, 7)
  // })

  // Funções de máscara de moeda
  const formatCurrencyInput = (value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '')
    
    if (!numericValue) return ''
    
    // Converte para número e formata
    const numberValue = parseFloat(numericValue) / 100
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numberValue)
  }

  const parseCurrencyInput = (value: string): number => {
    // Remove símbolos de moeda e converte para número
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(numericValue) || 0
  }

  // Mutations
  const createMutation = api.financial.budgetPlans.create.useMutation({
    onSuccess: (data) => {
      console.log('Success:', data)
      toast.success('Orçamento criado com sucesso!')
      router.push('/financeiro/orcamentos')
    },
    onError: (error) => {
      console.error('Error:', error)
      toast.error(`Erro ao criar orçamento: ${error.message}`)
    }
  })

  const form = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      totalAmount: 0,
      period: 'monthly',
      startDate: startOfMonth(new Date()).toISOString().split('T')[0],
      endDate: endOfMonth(new Date()).toISOString().split('T')[0],
      categories: []
    }
  })

  const onSubmit = (data: BudgetForm) => {
    console.log('Form data:', data)
    console.log('Budget categories:', budgetCategories)
    
    // Filtrar categorias com dados válidos
    const validCategories = budgetCategories.filter(cat => 
      cat.categoryId && cat.categoryId !== '' && cat.amount > 0
    ).map(cat => ({
      categoryId: cat.categoryId,
      amount: cat.amount
    }))
    
    if (validCategories.length === 0) {
      toast.error('Adicione pelo menos uma categoria com valor maior que zero')
      return
    }
    
    const payload = {
      ...data,
      categories: validCategories
    }
    
    console.log('Sending payload:', payload)
    createMutation.mutate(payload)
  }

  const addCategory = () => {
    setBudgetCategories([...budgetCategories, { categoryId: '', amount: 0, amountDisplay: '' }])
  }

  const updateCategory = (index: number, field: 'categoryId' | 'amount' | 'amountDisplay', value: string | number) => {
    const updated = [...budgetCategories]
    updated[index] = { ...updated[index], [field]: value }
    setBudgetCategories(updated)
    
    // Sincronizar com o React Hook Form sempre
    const validCategories = updated.filter(cat => 
      cat.categoryId && cat.categoryId !== '' && cat.amount > 0
    ).map(cat => ({
      categoryId: cat.categoryId,
      amount: cat.amount
    }))
    form.setValue('categories', validCategories)
  }

  const updateCategoryAmount = (index: number, displayValue: string) => {
    const formattedValue = formatCurrencyInput(displayValue)
    const numericValue = parseCurrencyInput(formattedValue)
    
    const updated = [...budgetCategories]
    updated[index] = { 
      ...updated[index], 
      amount: numericValue,
      amountDisplay: formattedValue
    }
    setBudgetCategories(updated)
    
    // Sincronizar com o React Hook Form
    const validCategories = updated.filter(cat => 
      cat.categoryId && cat.categoryId !== '' && cat.amount > 0
    ).map(cat => ({
      categoryId: cat.categoryId,
      amount: cat.amount
    }))
    form.setValue('categories', validCategories)
  }

  const removeCategory = (index: number) => {
    const updated = budgetCategories.filter((_, i) => i !== index)
    setBudgetCategories(updated)
    
    // Sincronizar com o React Hook Form
    const validCategories = updated.filter(cat => 
      cat.categoryId && cat.categoryId !== '' && cat.amount > 0
    ).map(cat => ({
      categoryId: cat.categoryId,
      amount: cat.amount
    }))
    form.setValue('categories', validCategories)
  }

  const handleAISuggestion = () => {
    // TODO: Implementar sugestões de IA
    toast.info('Sugestões de IA serão implementadas em breve!')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const calculateTotal = () => {
    return budgetCategories.reduce((sum, cat) => sum + cat.amount, 0)
  }

  return (
    <div className="w-full py-8 space-y-8 px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Orçamento</h1>
          <p className="text-muted-foreground">
            Crie um novo orçamento para controlar seus gastos
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulário Principal */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={(e) => {
              console.log('Form submitted!', e)
              console.log('Form errors:', form.formState.errors)
              console.log('Form values:', form.getValues())
              console.log('Form is valid:', form.formState.isValid)
              
              return form.handleSubmit(
                (data) => {
                  console.log('Validation SUCCESS, calling onSubmit')
                  onSubmit(data)
                },
                (errors) => {
                  console.log('Validation FAILED:', errors)
                }
              )(e)
            }} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                  <CardDescription>
                    Configure as informações principais do orçamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Orçamento</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total</FormLabel>
                          <FormControl>
                            <Input
                              value={totalAmountDisplay}
                              onChange={(e) => {
                                const formattedValue = formatCurrencyInput(e.target.value)
                                setTotalAmountDisplay(formattedValue)
                                const numericValue = parseCurrencyInput(formattedValue)
                                field.onChange(numericValue)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Período</FormLabel>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Início</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Fim</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Categorias do Orçamento
                  </CardTitle>
                  <CardDescription>
                    Defina o orçamento para cada categoria de despesa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAISuggestion}
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        Sugestão IA
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCategory}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Categoria
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {budgetCategories.map((budgetCategory, index) => (
                      <div key={index} className="flex gap-2 items-end p-4 border rounded-lg">
                        <div className="flex-1">
                          <label className="text-sm font-medium">Categoria</label>
                          <Select
                            value={budgetCategory.categoryId}
                            onValueChange={(value) => updateCategory(index, 'categoryId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories?.filter(cat => !budgetCategories.some((bc, i) => i !== index && bc.categoryId === cat.id)).map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium">Valor Orçado</label>
                          <Input
                            value={budgetCategory.amountDisplay || ''}
                            onChange={(e) => updateCategoryAmount(index, e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCategory(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {budgetCategories.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Nenhuma categoria adicionada</p>
                        <p className="text-muted-foreground">
                          Clique em "Adicionar Categoria" para começar
                        </p>
                      </div>
                    )}
                  </div>
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
                  disabled={createMutation.isPending}
                  onClick={() => console.log('Button clicked!')}
                >
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Orçamento
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Sidebar de Resumo */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total das Categorias:</span>
                  <span className="font-medium">{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Valor Total Definido:</span>
                  <span className="font-medium">{formatCurrency(form.watch('totalAmount') || 0)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Diferença:</span>
                    <span className={`${
                      (form.watch('totalAmount') || 0) - calculateTotal() >= 0 
                        ? 'text-green-500 dark:text-green-400' 
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      {formatCurrency((form.watch('totalAmount') || 0) - calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>

              {budgetCategories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Categorias:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {budgetCategories.map((cat, index) => {
                      const category = categories?.find(c => c.id === cat.categoryId)
                      return (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="truncate">{category?.name || 'Categoria'}</span>
                          <span>{formatCurrency(cat.amount)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}