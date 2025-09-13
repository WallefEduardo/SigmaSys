"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  FileText,
  ArrowRightCircle,
  Calendar
} from "lucide-react";
import { api } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface QuotesListProps {
  search: string;
}

export function QuotesList({ search }: QuotesListProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const router = useRouter();
  const { toast } = useToast();

  const { data, isLoading, refetch } = api.quotes.list.useQuery({
    page,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });

  const deleteMutation = api.quotes.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Orçamento deletado com sucesso",
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

  const duplicateMutation = api.quotes.duplicate.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Orçamento duplicado com sucesso",
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-9 w-[120px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Orçamentos ({data?.pagination.total || 0})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Válido até</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {data?.quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono text-sm">
                    {quote.number}
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">{quote.client.name}</div>
                      {quote.client.email && (
                        <div className="text-sm text-muted-foreground">
                          {quote.client.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {quote.title}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={getStatusVariant(quote.status)}>
                      {getStatusLabel(quote.status)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    {formatCurrency(quote.totalPrice)}
                  </TableCell>
                  
                  <TableCell>
                    {quote.validUntil ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(quote.validUntil)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {formatDate(quote.createdAt)}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/comercial/orcamentos/${quote.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => router.push(`/comercial/orcamentos/${quote.id}?edit=true`)}
                          disabled={quote.status === 'converted'}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => duplicateMutation.mutate({ id: quote.id })}
                          disabled={duplicateMutation.isLoading}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        
                        {quote.status === 'approved' && !quote.order && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => convertToOrderMutation.mutate({ quoteId: quote.id })}
                              disabled={convertToOrderMutation.isLoading}
                            >
                              <ArrowRightCircle className="h-4 w-4 mr-2" />
                              Converter em OS
                            </DropdownMenuItem>
                          </>
                        )}
                        
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
                  </TableCell>
                </TableRow>
              ))}
              
              {data?.quotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {search ? "Nenhum orçamento encontrado" : "Nenhum orçamento cadastrado"}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginação */}
        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Página {data.pagination.page} de {data.pagination.pages}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= data.pagination.pages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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