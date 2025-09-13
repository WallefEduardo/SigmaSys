'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc'
import { useQueryClient } from '@tanstack/react-query'
import { getQueryKey } from '@trpc/react-query'
import { toast } from 'sonner'
import { 
  Plus, 
  FolderOpen, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  Palette,
  Search
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import FloatingChatButton from '@/components/financial/FloatingChatButton'

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

export default function CategoriesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Queries
  const { data: categories, isLoading } = api.financial.categories.list.useQuery({
    type: selectedType === 'all' ? undefined : selectedType as 'INCOME' | 'EXPENSE',
    search: searchTerm || undefined
  })
  
  const { data: categoryStats } = api.financial.categories.getStats.useQuery({})

  // Mutations

  const updateMutation = api.financial.categories.update.useMutation({
    onSuccess: () => {
      toast.success('Categoria atualizada com sucesso!')
      setEditingCategory(null)
      setIsEditDialogOpen(false)
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['financial', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['financial', 'categories', 'getStats'] })
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar categoria: ${error.message}`)
    }
  })

  const toggleActiveMutation = api.financial.categories.update.useMutation({
    onMutate: async ({ id, data }) => {
      // Obter a query key correta
      const queryInput = { 
        type: selectedType === 'all' ? undefined : selectedType as 'INCOME' | 'EXPENSE',
        search: searchTerm || undefined
      }
      const queryKey = getQueryKey(api.financial.categories.list, queryInput, 'query')
      
      // Cancelar queries em andamento para evitar conflitos
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot do estado anterior
      const previousCategories = queryClient.getQueryData(queryKey)
      
      // Atualização otimista
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old
        
        return old.map((category: any) => 
          category.id === id 
            ? { ...category, active: data.active }
            : {
                ...category,
                children: category.children?.map((child: any) =>
                  child.id === id ? { ...child, active: data.active } : child
                )
              }
        )
      })
      
      return { previousCategories, queryKey }
    },
    onSuccess: () => {
      toast.success('Status da categoria atualizado!')
      // Invalidar queries para garantir sincronização
      queryClient.invalidateQueries({ queryKey: ['financial', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['financial', 'categories', 'getStats'] })
    },
    onError: (error, variables, context) => {
      toast.error(`Erro ao atualizar status: ${error.message}`)
      // Reverter em caso de erro
      if (context?.previousCategories && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousCategories)
      }
    }
  })

  const deleteMutation = api.financial.categories.delete.useMutation({
    onSuccess: () => {
      toast.success('Categoria excluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['financial', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['financial', 'categories', 'getStats'] })
    },
    onError: (error) => {
      toast.error(`Erro ao excluir categoria: ${error.message}`)
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

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        ...processedData
      })
    }
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    form.reset({
      name: category.name,
      description: category.description || '',
      type: category.type,
      color: category.color,
      parentId: category.parentId || 'none',
      active: category.active
    })
    setIsEditDialogOpen(true)
  }

  const handleToggleActive = (category: any) => {
    toggleActiveMutation.mutate({
      id: category.id,
      data: { active: !category.active }
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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
      case 'INCOME': return <TrendingUp className="h-3 w-3" />
      case 'EXPENSE': return <TrendingDown className="h-3 w-3" />
      default: return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME': return 'text-green-500 dark:text-green-400'
      case 'EXPENSE': return 'text-red-500 dark:text-red-400'
      default: return 'text-muted-foreground'
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'INCOME': return 'default'
      case 'EXPENSE': return 'destructive'
      default: return 'outline'
    }
  }

  // Organizar categorias em hierarquia
  const organizeCategories = (categories: any[]) => {
    const parentCategories = categories.filter(cat => !cat.parentId)
    const childCategories = categories.filter(cat => cat.parentId)
    
    return parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => child.parentId === parent.id)
    }))
  }

  const organizedCategories = categories ? organizeCategories(categories) : []

  return (
    <>
      <FloatingChatButton />
      <div className="w-full py-8 space-y-8 px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Organize suas transações financeiras
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/financeiro/categorias/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Categoria</DialogTitle>
                <DialogDescription>
                  Atualize as informações da categoria
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EXPENSE">Despesa</SelectItem>
                            <SelectItem value="INCOME">Receita</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {categories?.filter(cat => !cat.parentId && cat.id !== editingCategory?.id).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            {CATEGORY_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-full border-2 ${
                                  field.value === color ? 'border-primary scale-110' : 'border-border'
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

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Atualizar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      {categoryStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
              <FolderOpen className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {categoryStats.activeCategories} ativas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500 dark:text-green-400">{categoryStats.incomeCategories}</div>
              <p className="text-xs text-muted-foreground">
                Categorias de receita
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500 dark:text-red-400">{categoryStats.expenseCategories}</div>
              <p className="text-xs text-muted-foreground">
                Categorias de despesa
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mais Usada</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryStats.mostUsed?.name || '-'}</div>
              <p className="text-xs text-muted-foreground">
                {categoryStats.mostUsed?.count || 0} transações
              </p>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Lista de Categorias */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>
                Gerencie suas categorias financeiras
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="INCOME">Receitas</SelectItem>
                  <SelectItem value="EXPENSE">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Transações</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizedCategories.map((category) => (
                  <React.Fragment key={category.id}>
                    {/* Categoria Pai */}
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(category.type)}>
                          <div className="flex items-center gap-1">
                            {getTypeIcon(category.type)}
                            {getTypeLabel(category.type)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{category.transactionCount || 0}</TableCell>
                      <TableCell className={getTypeColor(category.type)}>
                        {category.totalAmount ? formatCurrency(category.totalAmount) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.active ? 'default' : 'secondary'}>
                          {category.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(category)}>
                              <Archive className="h-4 w-4 mr-2" />
                              {category.active ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500 dark:text-red-400"
                              onClick={() => deleteMutation.mutate({ id: category.id })}
                              disabled={category.transactionCount > 0}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    
                    {/* Subcategorias */}
                    {category.children?.map((child: any) => (
                      <TableRow key={child.id} className="bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3 ml-6">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: child.color }}
                            />
                            <div>
                              <p className="font-medium text-sm">↳ {child.name}</p>
                              {child.description && (
                                <p className="text-xs text-muted-foreground">
                                  {child.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeBadgeVariant(child.type)} className="text-xs">
                            <div className="flex items-center gap-1">
                              {getTypeIcon(child.type)}
                              {getTypeLabel(child.type)}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{child.transactionCount || 0}</TableCell>
                        <TableCell className={getTypeColor(child.type)}>
                          {child.totalAmount ? formatCurrency(child.totalAmount) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={child.active ? 'default' : 'secondary'} className="text-xs">
                            {child.active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(child)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(child)}>
                                <Archive className="h-4 w-4 mr-2" />
                                {child.active ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-500 dark:text-red-400"
                                onClick={() => deleteMutation.mutate({ id: child.id })}
                                disabled={child.transactionCount > 0}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma categoria encontrada</p>
              <p className="text-muted-foreground">
                Crie suas primeiras categorias para organizar as transações
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}