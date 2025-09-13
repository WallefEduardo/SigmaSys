"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Plus,
  Trash2,
  Calculator,
  FileText,
  User,
  Calendar,
  DollarSign
} from "lucide-react";
import { api } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { QuoteItemForm } from "@/components/commercial/quote-item-form";
import { QuotePreview } from "@/components/commercial/quote-preview";
import Link from "next/link";

interface QuoteItem {
  id: string;
  productId: string;
  product?: any;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  totalCost: number;
  totalPrice: number;
  checklist?: Record<string, any>;
}

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientId: "",
    validUntil: "",
    notes: "",
  });
  
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: clients } = api.clients.list.useQuery({ limit: 1000 });
  
  const createMutation = api.quotes.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso",
      });
      router.push(`/comercial/orcamentos/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = (item: Omit<QuoteItem, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(36) };
    setItems(prev => [...prev, newItem]);
    setShowItemForm(false);
  };

  const handleEditItem = (item: QuoteItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
    setEditingItem(null);
    setShowItemForm(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const getTotals = () => {
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const margin = totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0;
    
    return { totalCost, totalPrice, margin };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.clientId) {
      toast({
        title: "Erro", 
        description: "Cliente é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao orçamento",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...formData,
      items: items.map(({ id, product, ...item }) => item),
    });
  };

  const { totalCost, totalPrice, margin } = getTotals();

  if (showPreview) {
    return (
      <QuotePreview
        quote={{
          title: formData.title,
          client: clients?.clients.find(c => c.id === formData.clientId),
          items,
          totalCost,
          totalPrice,
          margin,
          validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
          notes: formData.notes,
        }}
        onBack={() => setShowPreview(false)}
        onConfirm={() => {
          setShowPreview(false);
          handleSubmit({ preventDefault: () => {} } as React.FormEvent);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/comercial">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Novo Orçamento</h1>
            <p className="text-muted-foreground">
              Crie um novo orçamento para seu cliente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={items.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Orçamento
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados Principais */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Digite o título do orçamento"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente *</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => handleInputChange('clientId', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Válido até</Label>
                    <Input
                      id="validUntil"
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrição do orçamento"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Observações internas"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Itens do Orçamento */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Itens do Orçamento
                  </CardTitle>
                  
                  <Button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setShowItemForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum item adicionado ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <h4 className="font-medium">
                                {item.product?.name || 'Produto não encontrado'}
                              </h4>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Qtd:</span>
                                <span className="ml-1 font-medium">{item.quantity}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Unit:</span>
                                <span className="ml-1 font-medium">{formatCurrency(item.unitPrice)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total:</span>
                                <span className="ml-1 font-medium">{formatCurrency(item.totalPrice)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Margem:</span>
                                <span className="ml-1 font-medium">
                                  {item.totalPrice > 0 ? 
                                    `${(((item.totalPrice - item.totalCost) / item.totalPrice) * 100).toFixed(1)}%` 
                                    : '0%'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingItem(item);
                                setShowItemForm(true);
                              }}
                            >
                              <Calculator className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Itens:</span>
                    <span>{items.length}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo Total:</span>
                    <span className="font-medium">{formatCurrency(totalCost)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço Total:</span>
                    <span className="font-medium">{formatCurrency(totalPrice)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Margem:</span>
                    <span className={margin > 0 ? "text-green-600" : "text-red-600"}>
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <Separator />

                {formData.clientId && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Cliente Selecionado</h4>
                    <div className="text-sm">
                      {clients?.clients.find(c => c.id === formData.clientId)?.name}
                    </div>
                  </div>
                )}

                {formData.validUntil && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Válido até
                    </h4>
                    <div className="text-sm">
                      {new Date(formData.validUntil).toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Formulário de Item */}
      {showItemForm && (
        <QuoteItemForm
          item={editingItem}
          onSave={editingItem ? handleEditItem : handleAddItem}
          onCancel={() => {
            setShowItemForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}