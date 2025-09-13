'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  FolderOpen,
  Palette,
  Tag,
  Info,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2
} from 'lucide-react'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().min(1, 'Cor é obrigatória'),
  parentId: z.string().optional(),
  active: z.boolean().default(true)
})

type CategoryForm = z.infer<typeof categorySchema>

const CATEGORY_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#64748b', // slate-500
  '#78716c', // stone-500
]

export default function NovaCategoriaPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Queries
  const { data: categories } = api.financial.categories.list.useQuery({})

  // Mutations
  const createMutation = api.financial.categories.create.useMutation({
    onSuccess: () => {
      toast.success('Categoria criada com sucesso!')
      // Invalidar as queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['financial', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['financial', 'categories', 'getStats'] })
      router.push('/financeiro/categorias')
    },
    onError: (error) => {
      toast.error(`Erro ao criar categoria: ${error.message}`)
    }
  })

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'EXPENSE',
      color: CATEGORY_COLORS[0],
      parentId: 'none',
      active: true
    }
  })

  const onSubmit = (data: CategoryForm) => {
    // Tratar parentId "none" como undefined
    const processedData = {
      ...data,
      parentId: data.parentId === 'none' ? undefined : data.parentId
    }

    createMutation.mutate(processedData)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'INCOME': return 'Receita'
      case 'EXPENSE': return 'Despesa'
      default: return type
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME': return <TrendingUp className="h-4 w-4" />
      case 'EXPENSE': return <TrendingDown className="h-4 w-4" />
      default: return <Tag className="h-4 w-4" />
    }
  }

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'INCOME': return 'Para classificar entradas de dinheiro'
      case 'EXPENSE': return 'Para classificar saídas de dinheiro'
      default: return ''
    }
  }

  const selectedColor = form.watch('color')
  const selectedType = form.watch('type')
  const selectedParent = form.watch('parentId')

  const parentCategory = categories?.find(cat => cat.id === selectedParent && selectedParent !== 'none')

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
          <h1 className="text-3xl font-bold tracking-tight">Nova Categoria</h1>
          <p className="text-muted-foreground">
            Crie uma nova categoria para organizar suas transações financeiras
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulário Principal */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                  <CardDescription>
                    Configure as informações principais da categoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Categoria</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Tipo e Classificação
                  </CardTitle>
                  <CardDescription>
                    Defina como esta categoria será utilizada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Transação</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['EXPENSE', 'INCOME'].map((type) => (
                              <div
                                key={type}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                  field.value === type 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => field.onChange(type)}
                              >
                                <div className="flex items-center gap-3">
                                  {getTypeIcon(type)}
                                  <div>
                                    <p className="font-medium">{getTypeLabel(type)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {getTypeDescription(type)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria Pai (opcional)</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                              {categories?.filter(cat => !cat.parentId).map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: category.color }}
                                    />
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Aparência
                  </CardTitle>
                  <CardDescription>
                    Escolha uma cor para identificar visualmente a categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor da Categoria</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                            {CATEGORY_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                  field.value === color 
                                    ? 'border-primary scale-110 shadow-lg' 
                                    : 'border-border hover:border-primary/50 hover:scale-105'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => field.onChange(color)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Categoria
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Sidebar de Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Preview da Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div>
                    <p className="font-medium">
                      {form.watch('name') || 'Nome da categoria'}
                    </p>
                    {parentCategory && (
                      <p className="text-sm text-muted-foreground">
                        Subcategoria de: {parentCategory.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(selectedType)}
                  <Badge variant="outline">
                    {getTypeLabel(selectedType)}
                  </Badge>
                </div>

                {form.watch('description') && (
                  <p className="text-sm text-muted-foreground">
                    {form.watch('description')}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <h4 className="font-medium">Informações:</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{getTypeLabel(selectedType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hierarquia:</span>
                    <span>{parentCategory ? 'Subcategoria' : 'Principal'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cor:</span>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <span className="text-xs font-mono">{selectedColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {getTypeDescription(selectedType)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}