"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  FileText, 
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface QuotePreviewProps {
  quote: {
    title: string;
    client?: any;
    items: any[];
    totalCost: number;
    totalPrice: number;
    margin: number;
    validUntil?: Date | null;
    notes?: string;
  };
  onBack: () => void;
  onConfirm: () => void;
}

export function QuotePreview({ quote, onBack, onConfirm }: QuotePreviewProps) {
  const today = new Date();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Prévia do Orçamento</h1>
            <p className="text-muted-foreground">
              Revise as informações antes de salvar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            Editar
          </Button>
          <Button onClick={onConfirm}>
            <FileText className="h-4 w-4 mr-2" />
            Confirmar e Salvar
          </Button>
        </div>
      </div>

      {/* Preview do Orçamento */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">ORÇAMENTO</h1>
              <p className="text-muted-foreground">
                {today.toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-8">
            {/* Informações do Cliente */}
            {quote.client && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados do Cliente
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="font-medium text-lg">{quote.client.name}</div>
                    
                    {quote.client.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {quote.client.email}
                      </div>
                    )}
                    
                    {quote.client.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {quote.client.phone}
                      </div>
                    )}
                    
                    {quote.client.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <div>{quote.client.address}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações do Orçamento</h3>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Título:</span>
                      <div className="font-medium">{quote.title}</div>
                    </div>
                    
                    {quote.validUntil && (
                      <div>
                        <span className="text-muted-foreground">Válido até:</span>
                        <div className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(quote.validUntil)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Itens */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Itens do Orçamento</h3>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-4 grid grid-cols-12 gap-4 font-medium text-sm">
                  <div className="col-span-1">Item</div>
                  <div className="col-span-5">Descrição</div>
                  <div className="col-span-2 text-center">Qtd</div>
                  <div className="col-span-2 text-right">Unit.</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                
                {quote.items.map((item, index) => (
                  <div key={index} className="p-4 border-t grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <Badge variant="outline">{index + 1}</Badge>
                    </div>
                    
                    <div className="col-span-5">
                      <div className="font-medium">{item.product?.name || 'Produto'}</div>
                      {item.product?.description && (
                        <div className="text-sm text-muted-foreground">
                          {item.product.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-2 text-center">
                      {item.quantity}
                    </div>
                    
                    <div className="col-span-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </div>
                    
                    <div className="col-span-2 text-right font-medium">
                      {formatCurrency(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totais */}
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(quote.totalPrice)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span className="text-green-600">{formatCurrency(quote.totalPrice)}</span>
                  </div>
                  
                  <div className="text-right text-sm text-muted-foreground">
                    Margem: {quote.margin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            {quote.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold">Observações</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-line">
                    {quote.notes}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Rodapé */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <div>Orçamento válido por 30 dias a partir da data de emissão</div>
              <div>Este orçamento foi gerado automaticamente pelo sistema ERP</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}