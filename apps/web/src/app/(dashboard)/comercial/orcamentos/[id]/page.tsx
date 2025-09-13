"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  FileText,
  Send,
  Check,
  X,
  Clock,
  ArrowRightCircle,
  Calendar,
  User,
  DollarSign,
  Package
} from "lucide-react";
import { api } from "@/lib/trpc";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { QuoteStatusUpdate } from "@/components/commercial/quote-status-update";

interface PageProps {
  params: { id: string };
}

export default function OrcamentoDetalhePage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';
  const { toast } = useToast();
  
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);

  const { data: quote, isLoading, refetch } = api.quotes.byId.useQuery({ id: params.id });
  
  const deleteMutation = api.quotes.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Orçamento deletado com sucesso",
      });
      router.push("/comercial");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const duplicateMutation = api.quotes.duplicate.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Orçamento duplicado com sucesso",
      });
      router.push(`/comercial/orcamentos/${data.id}?edit=true`);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const convertToOrderMutation = api.quotes.convertToOrder.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Orçamento convertido em ordem de serviço",
      });
      router.push(`/comercial/ordens/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = api.quotes.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate({
      id: params.id,
      status,
    });
  };

  const handleConvertToOrder = () => {
    const deliveryDate = prompt("Data de entrega (deixe vazio para não definir):");
    convertToOrderMutation.mutate({
      quoteId: params.id,
      deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-4 w-[300px] mt-2" />
            </div>
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[100px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Orçamento não encontrado</h2>
          <p className="text-muted-foreground mt-2">
            O orçamento que você está procurando não existe ou foi removido.
          </p>
          <Button asChild className="mt-4">
            <Link href="/comercial">Voltar ao Comercial</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Se está em modo de edição, redirecionar para a página de edição
  if (isEditing && quote.status !== 'converted') {
    router.push(`/comercial/orcamentos/${params.id}/editar`);
    return null;
  }

  const isOverdue = quote.validUntil ? new Date(quote.validUntil) < new Date() : false;

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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {quote.title}
              <Badge variant={getStatusVariant(quote.status)}>
                {getStatusLabel(quote.status)}
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Orçamento {quote.number} • {formatDate(quote.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {quote.status === 'draft' && (
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('sent')}
              disabled={updateStatusMutation.isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          )}

          {quote.status === 'sent' && (
            <>
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('approved')}
                disabled={updateStatusMutation.isLoading}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={updateStatusMutation.isLoading}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </>
          )}

          {quote.status === 'approved' && !quote.order && (
            <Button
              onClick={handleConvertToOrder}
              disabled={convertToOrderMutation.isLoading}
            >
              <ArrowRightCircle className="h-4 w-4 mr-2" />
              Converter em OS
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/comercial/orcamentos/${quote.id}?edit=true`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => duplicateMutation.mutate({ id: quote.id })}
                disabled={duplicateMutation.isLoading}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setShowStatusUpdate(true)}>
                <Clock className="h-4 w-4 mr-2" />
                Alterar Status
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate({ id: quote.id })}
                disabled={quote.status === 'converted' || deleteMutation.isLoading}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{quote.client.name}</h3>
                {quote.client.email && (
                  <p className="text-muted-foreground">{quote.client.email}</p>
                )}
                {quote.client.phone && (
                  <p className="text-muted-foreground">{quote.client.phone}</p>
                )}
              </div>
              
              {quote.description && (
                <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-muted-foreground">{quote.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens do Orçamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens ({quote.items.length})
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {quote.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <h4 className="font-medium">{item.product.name}</h4>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(item.totalPrice)}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                    </div>
                    
                    {item.product.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.product.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Quantidade:</span>
                        <div className="font-medium">{item.quantity}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Custo Unit.:</span>
                        <div className="font-medium">{formatCurrency(item.unitCost)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preço Unit.:</span>
                        <div className="font-medium">{formatCurrency(item.unitPrice)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Margem:</span>
                        <div className="font-medium">
                          {item.totalPrice > 0 ? 
                            `${(((item.totalPrice - item.totalCost) / item.totalPrice) * 100).toFixed(1)}%` 
                            : '0%'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo Total:</span>
                <span className="font-medium">{formatCurrency(quote.totalCost)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço Total:</span>
                <span className="font-medium">{formatCurrency(quote.totalPrice)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Margem:</span>
                <span className={cn(
                  "font-bold",
                  quote.margin > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {quote.margin.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div>
                <span className="text-muted-foreground">Número:</span>
                <div className="font-mono font-medium">{quote.number}</div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div>
                  <Badge variant={getStatusVariant(quote.status)}>
                    {getStatusLabel(quote.status)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Criado em:</span>
                <div className="font-medium">{formatDate(quote.createdAt)}</div>
              </div>
              
              {quote.validUntil && (
                <div>
                  <span className="text-muted-foreground">Válido até:</span>
                  <div className={cn(
                    "font-medium flex items-center gap-2",
                    isOverdue && "text-red-600"
                  )}>
                    <Calendar className="h-4 w-4" />
                    {formatDate(quote.validUntil)}
                    {isOverdue && <Badge variant="destructive" className="text-xs">Expirado</Badge>}
                  </div>
                </div>
              )}
              
              {quote.order && (
                <div>
                  <span className="text-muted-foreground">Ordem de Serviço:</span>
                  <div>
                    <Link 
                      href={`/comercial/ordens/${quote.order.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {quote.order.number}
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Atualização de Status */}
      {showStatusUpdate && (
        <QuoteStatusUpdate
          currentStatus={quote.status}
          onStatusUpdate={handleStatusUpdate}
          onClose={() => setShowStatusUpdate(false)}
          isLoading={updateStatusMutation.isLoading}
        />
      )}
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviado",
    approved: "Aprovado",
    rejected: "Rejeitado",
    expired: "Expirado",
    converted: "Convertido",
  };
  
  return labels[status] || status;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    sent: "secondary",
    approved: "default",
    rejected: "destructive",
    expired: "destructive",
    converted: "default",
  };
  
  return variants[status] || "outline";
}