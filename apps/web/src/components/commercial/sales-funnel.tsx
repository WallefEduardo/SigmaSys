"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from "@hello-pangea/dnd";
import { 
  Calendar,
  DollarSign,
  User,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { api } from "@/lib/trpc";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const KANBAN_COLUMNS = {
  pending: {
    title: "Pendentes",
    color: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300"
  },
  approved: {
    title: "Aprovadas", 
    color: "bg-blue-100 dark:bg-blue-900",
    textColor: "text-blue-700 dark:text-blue-300"
  },
  production: {
    title: "Em Produção",
    color: "bg-yellow-100 dark:bg-yellow-900", 
    textColor: "text-yellow-700 dark:text-yellow-300"
  },
  completed: {
    title: "Concluídas",
    color: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-700 dark:text-green-300"
  }
};

export function SalesFunnel() {
  const router = useRouter();
  const { toast } = useToast();
  
  const { data, isLoading, refetch } = api.orders.kanban.useQuery();
  
  const updatePositionMutation = api.orders.updateKanbanPosition.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      refetch(); // Revert on error
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !data) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as keyof typeof KANBAN_COLUMNS;
    
    updatePositionMutation.mutate({
      orderId: draggableId,
      newStatus,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(KANBAN_COLUMNS).map(([key, column]) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-[100px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTotalValue = (columnKey: string) => {
    const orders = data?.[columnKey as keyof typeof data] || [];
    return orders.reduce((sum: number, order: any) => sum + Number(order.totalPrice), 0);
  };

  const isOverdue = (order: any) => {
    if (!order.deliveryDate || order.status === 'delivered') return false;
    return new Date(order.deliveryDate) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(KANBAN_COLUMNS).map(([key, column]) => {
          const orders = data?.[key as keyof typeof data] || [];
          const totalValue = getTotalValue(key);
          
          return (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{column.title}</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-sm font-medium">{formatCurrency(totalValue)}</p>
                  </div>
                </div>
                <Progress 
                  value={orders.length} 
                  max={100} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(KANBAN_COLUMNS).map(([columnKey, column]) => {
            const orders = data?.[columnKey as keyof typeof data] || [];
            
            return (
              <Card key={columnKey} className={cn("min-h-[600px]", column.color)}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-lg flex items-center justify-between", column.textColor)}>
                    <span>{column.title}</span>
                    <Badge variant="secondary">{orders.length}</Badge>
                  </CardTitle>
                </CardHeader>

                <Droppable droppableId={columnKey}>
                  {(provided, snapshot) => (
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "space-y-3 min-h-[500px]",
                        snapshot.isDraggingOver && "bg-white/50 dark:bg-gray-900/50 rounded-lg"
                      )}
                    >
                      {orders.map((order: any, index: number) => (
                        <Draggable
                          key={order.id}
                          draggableId={order.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "cursor-grab active:cursor-grabbing transition-shadow",
                                snapshot.isDragging && "shadow-lg rotate-3",
                                isOverdue(order) && "ring-2 ring-red-500"
                              )}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-sm truncate">
                                      {order.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {order.number}
                                    </p>
                                  </div>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => router.push(`/comercial/ordens/${order.id}`)}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Visualizar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{order.client.name}</span>
                                  </div>

                                  <div className="flex items-center gap-1 text-green-600 font-medium">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(order.totalPrice)}
                                  </div>

                                  {order.deliveryDate && (
                                    <div className={cn(
                                      "flex items-center gap-1",
                                      isOverdue(order) ? "text-red-600" : "text-muted-foreground"
                                    )}>
                                      {isOverdue(order) && <AlertTriangle className="h-3 w-3" />}
                                      <Calendar className="h-3 w-3" />
                                      <span>{formatDate(order.deliveryDate)}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDate(order.createdAt)}</span>
                                  </div>

                                  {order.items.length > 0 && (
                                    <div className="pt-1 border-t">
                                      <Badge variant="outline" className="text-xs">
                                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {orders.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Nenhuma ordem nesta etapa
                        </div>
                      )}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}