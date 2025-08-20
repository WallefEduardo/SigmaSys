"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormulaBuilder } from '@/components/forms/formula-builder'

export default function NovoProdutoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    category: '',
    formula: '',
    targetUnit: 'm2',
    markup: 2.5,
    complexidade: 'medium'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Product data:', formData)
    // TODO: Integrar com API real
    alert('Produto cadastrado com sucesso! (Mock)')
    router.back()
  }

  const categories = [
    'Placas',
    'Banners', 
    'Letreiros',
    'Adesivos',
    'Outdoor',
    'Fachadas',
    'Totens',
    'Displays'
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Produto</h1>
          <p className="text-muted-foreground">
            Cadastre um novo produto com sua fórmula de cálculo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Nome do Produto *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Placa de Acrílico Personalizada"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Código</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: PRD-ACR-001"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva as características e especificações do produto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Complexidade</label>
                <Select 
                  value={formData.complexidade} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, complexidade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simples</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="complex">Complexo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Markup Padrão</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.markup}
                  onChange={(e) => setFormData(prev => ({ ...prev, markup: parseFloat(e.target.value) }))}
                  placeholder="2.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fórmula de Cálculo */}
        <FormulaBuilder
          value={formData.formula}
          onChange={(formula) => setFormData(prev => ({ ...prev, formula }))}
          targetUnit={formData.targetUnit}
          onTargetUnitChange={(unit) => setFormData(prev => ({ ...prev, targetUnit: unit }))}
        />

        {/* Informações de Precificação */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Preços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Como funciona o cálculo?
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>1. <strong>Custo Base:</strong> Resultado da fórmula criada acima</p>
                <p>2. <strong>Markup:</strong> Multiplicador aplicado sobre o custo base</p>
                <p>3. <strong>Preço Final:</strong> Custo Base × Markup</p>
                <p>4. <strong>Margem Líquida:</strong> (Preço Final - Custo Base) / Preço Final × 100</p>
              </div>
            </div>

            {formData.formula && (
              <div className="bg-muted/50 p-4 rounded">
                <h4 className="font-medium mb-2">Exemplo de Cálculo</h4>
                <div className="text-sm space-y-1">
                  <div>Fórmula: <code className="bg-background px-1 rounded">{formData.formula}</code></div>
                  <div>Para largura=2m, altura=1.5m:</div>
                  <div className="ml-4 text-muted-foreground">
                    • Custo Base: R$ 150,00 (exemplo)
                  </div>
                  <div className="ml-4 text-muted-foreground">
                    • Markup: {formData.markup}x
                  </div>
                  <div className="ml-4 font-medium text-green-600">
                    • Preço Final: R$ {(150 * formData.markup).toFixed(2)}
                  </div>
                  <div className="ml-4 text-muted-foreground">
                    • Margem: {Math.round((1 - 1/formData.markup) * 100)}%
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Salvar Produto
          </Button>
        </div>
      </form>
    </div>
  )
}