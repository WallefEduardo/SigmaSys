"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Package, DollarSign } from "lucide-react";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

interface QuoteItemFormProps {
  item?: QuoteItem | null;
  onSave: (item: Omit<QuoteItem, 'id'>) => void;
  onCancel: () => void;
}

export function QuoteItemForm({ item, onSave, onCancel }: QuoteItemFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    productId: item?.productId || "",
    quantity: item?.quantity || 1,
    unitCost: item?.unitCost || 0,
    unitPrice: item?.unitPrice || 0,
    checklist: item?.checklist || {},
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: products } = api.products.list.useQuery({ limit: 1000 });
  
  const { data: productDetails, isLoading: isLoadingProduct } = api.products.byId.useQuery(
    { id: formData.productId },
    { enabled: !!formData.productId }
  );

  const calculateMutation = api.calculations.calculateProduct.useMutation({
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        unitCost: data.totalCost,
        unitPrice: data.totalPrice,
      }));
    },
    onError: (error) => {
      toast({
        title: "Erro no cálculo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Buscar detalhes do produto quando selecionado
  useEffect(() => {
    if (productDetails) {
      setSelectedProduct(productDetails);
      
      // Se não temos custos definidos, calcular automaticamente
      if (formData.unitCost === 0 || formData.unitPrice === 0) {
        calculateMutation.mutate({
          productId: formData.productId,
          checklist: formData.checklist,
        });
      }
    }
  }, [productDetails]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (productId: string) => {
    const product = products?.products.find(p => p.id === productId);
    setFormData(prev => ({
      ...prev,
      productId,
      unitCost: 0,
      unitPrice: 0,
      checklist: {},
    }));
  };

  const handleChecklistChange = (field: string, value: any) => {
    const newChecklist = { ...formData.checklist, [field]: value };
    setFormData(prev => ({ ...prev, checklist: newChecklist }));
    
    // Recalcular com nova checklist
    if (formData.productId) {
      calculateMutation.mutate({
        productId: formData.productId,
        checklist: newChecklist,
      });
    }
  };

  const handleRecalculate = () => {
    if (!formData.productId) {
      toast({
        title: "Erro",
        description: "Selecione um produto primeiro",
        variant: "destructive",
      });
      return;
    }

    calculateMutation.mutate({
      productId: formData.productId,
      checklist: formData.checklist,
    });
  };

  const handleSubmit = () => {
    if (!formData.productId) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantity <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (formData.unitPrice <= 0) {
      toast({
        title: "Erro",
        description: "Preço unitário deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    const totalCost = formData.unitCost * formData.quantity;
    const totalPrice = formData.unitPrice * formData.quantity;

    onSave({
      productId: formData.productId,
      product: selectedProduct,
      quantity: formData.quantity,
      unitCost: formData.unitCost,
      unitPrice: formData.unitPrice,
      totalCost,
      totalPrice,
      checklist: formData.checklist,
    });
  };

  const getTotals = () => {
    const totalCost = formData.unitCost * formData.quantity;
    const totalPrice = formData.unitPrice * formData.quantity;
    const margin = totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0;
    
    return { totalCost, totalPrice, margin };
  };

  const { totalCost, totalPrice, margin } = getTotals();

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item ? 'Editar Item' : 'Adicionar Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Produto e Quantidade</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Produto *</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={handleProductChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Custo Unitário</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unitCost}
                      onChange={(e) => handleInputChange('unitCost', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preço Unitário *</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => handleInputChange('unitPrice', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRecalculate}
                    disabled={!formData.productId || calculateMutation.isLoading}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {calculateMutation.isLoading ? 'Calculando...' : 'Recalcular'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Checklist Inteligente */}
            {selectedProduct?.checklist && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuração do Produto</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {Object.entries(selectedProduct.checklist).map(([key, config]: [string, any]) => (
                    <div key={key} className="space-y-2">
                      <Label>{config.label}</Label>
                      
                      {config.type === 'select' && (
                        <Select
                          value={formData.checklist[key] || ""}
                          onValueChange={(value) => handleChecklistChange(key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={config.placeholder || "Selecione"} />
                          </SelectTrigger>
                          <SelectContent>
                            {config.options?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {config.type === 'number' && (
                        <Input
                          type="number"
                          min={config.min || 0}
                          max={config.max}
                          step={config.step || 1}
                          value={formData.checklist[key] || ""}
                          onChange={(e) => handleChecklistChange(key, Number(e.target.value))}
                          placeholder={config.placeholder}
                        />
                      )}
                      
                      {config.type === 'text' && (
                        <Input
                          type="text"
                          value={formData.checklist[key] || ""}
                          onChange={(e) => handleChecklistChange(key, e.target.value)}
                          placeholder={config.placeholder}
                        />
                      )}
                      
                      {config.type === 'textarea' && (
                        <Textarea
                          value={formData.checklist[key] || ""}
                          onChange={(e) => handleChecklistChange(key, e.target.value)}
                          placeholder={config.placeholder}
                        />
                      )}
                      
                      {config.description && (
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo */}
          <div>
            <Card className="sticky top-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5" />
                  Resumo do Item
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="font-medium">{formData.quantity}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo Unit.:</span>
                    <span className="font-medium">{formatCurrency(formData.unitCost)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço Unit.:</span>
                    <span className="font-medium">{formatCurrency(formData.unitPrice)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo Total:</span>
                    <span className="font-medium">{formatCurrency(totalCost)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço Total:</span>
                    <span className="font-semibold text-lg">{formatCurrency(totalPrice)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Margem:</span>
                    <Badge 
                      variant={margin > 0 ? "default" : "destructive"}
                      className="font-semibold"
                    >
                      {margin.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                {selectedProduct && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">Produto Selecionado</h4>
                      <p className="text-sm">{selectedProduct.name}</p>
                      {selectedProduct.description && (
                        <p className="text-xs text-muted-foreground">
                          {selectedProduct.description}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                {item ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}