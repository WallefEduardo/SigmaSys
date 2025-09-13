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
  ClipboardList,
  Calendar,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/trpc";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface OrdersListProps {
  search: string;
}

export function OrdersList({ search }: OrdersListProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const { data, isLoading, refetch } = api.orders.list.useQuery({
    page,
    search: search || undefined,
    status: status || undefined,
  });

  const deleteMutation = api.orders.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ordem de serviço deletada com sucesso",
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

  const duplicateMutation = api.orders.duplicate.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Ordem de serviço duplicada com sucesso",
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

  const cancelMutation = api.orders.cancel.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Ordem de serviço cancelada",
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

  const isOverdue = (order: any) => {
    if (!order.deliveryDate || order.status === 'delivered') return false;
    return new Date(order.deliveryDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Ordens de Serviço ({data?.pagination.total || 0})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovada</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
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
                <TableHead>Entrega</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {data?.orders.map((order) => (
                <TableRow 
                  key={order.id}
                  className={cn(
                    isOverdue(order) && "bg-red-50 dark:bg-red-950/20"
                  )}
                >
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {order.number}
                      {isOverdue(order) && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.client.name}</div>
                      {order.client.email && (
                        <div className="text-sm text-muted-foreground">
                          {order.client.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {order.title}
                    </div>
                    {order.quote && (
                      <div className="text-xs text-muted-foreground">
                        De: {order.quote.number}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={getOrderStatusVariant(order.status)}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    {formatCurrency(order.totalPrice)}
                  </TableCell>
                  
                  <TableCell>
                    {order.deliveryDate ? (
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        isOverdue(order) && "text-red-600"
                      )}>
                        <Calendar className="h-3 w-3" />
                        {formatDate(order.deliveryDate)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {formatDate(order.createdAt)}
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
                          onClick={() => router.push(`/comercial/ordens/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => router.push(`/comercial/ordens/${order.id}?edit=true`)}
                          disabled={order.status === 'delivered'}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => duplicateMutation.mutate({ id: order.id })}
                          disabled={duplicateMutation.isLoading}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                const reason = prompt("Motivo do cancelamento:");
                                if (reason) {
                                  cancelMutation.mutate({ id: order.id, reason });
                                }
                              }}
                              disabled={cancelMutation.isLoading}
                              className="text-orange-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteMutation.mutate({ id: order.id })}
                          disabled={
                            ['production', 'completed', 'delivered'].includes(order.status) || 
                            deleteMutation.isLoading
                          }
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
              
              {data?.orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {search ? "Nenhuma ordem de serviço encontrada" : "Nenhuma ordem de serviço cadastrada"}
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

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    production: "Produção",
    paused: "Pausada",
    completed: "Concluída",
    delivered: "Entregue",
    cancelled: "Cancelada",
  };
  
  return labels[status] || status;
}

function getOrderStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    approved: "secondary",
    production: "default",
    paused: "outline",
    completed: "default",
    delivered: "default",
    cancelled: "destructive",
  };
  
  return variants[status] || "outline";
}