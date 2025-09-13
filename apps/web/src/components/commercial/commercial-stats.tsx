"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc";
import { 
  FileText, 
  ClipboardList, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function CommercialStats() {
  const { data: quotesStats, isLoading: isLoadingQuotes } = api.quotes.stats.useQuery({});
  const { data: ordersStats, isLoading: isLoadingOrders } = api.orders.stats.useQuery({});

  if (isLoadingQuotes || isLoadingOrders) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-2" />
              <Skeleton className="h-4 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Orçamentos",
      value: quotesStats?.total || 0,
      description: `${formatCurrency(quotesStats?.totalValue || 0)} em valor total`,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Ordens de Serviço",
      value: ordersStats?.total || 0,
      description: `${formatCurrency(ordersStats?.totalValue || 0)} em valor total`,
      icon: ClipboardList,
      color: "text-green-600",
    },
    {
      title: "Taxa de Conversão",
      value: `${quotesStats?.conversionRate.toFixed(1) || 0}%`,
      description: "Orçamentos convertidos",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Valor Médio",
      value: formatCurrency(ordersStats?.averageValue || 0),
      description: "Por ordem de serviço",
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Orçamentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quotesStats?.byStatus.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {getStatusLabel(status.status)}
                </Badge>
                <span className="text-sm font-medium">{status.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Status das Ordens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersStats?.byStatus.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <Badge 
                  variant={getStatusVariant(status.status)} 
                  className="text-xs"
                >
                  {getStatusLabel(status.status)}
                </Badge>
                <span className="text-sm font-medium">{status.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersStats?.overdue > 0 && (
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="text-xs">
                  Atrasadas
                </Badge>
                <span className="text-sm font-medium">{ordersStats.overdue}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                No Prazo
              </Badge>
              <span className="text-sm font-medium">{ordersStats?.onTime || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
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
    pending: "Pendente",
    production: "Produção",
    completed: "Concluído",
    delivered: "Entregue",
    cancelled: "Cancelado",
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
    pending: "outline",
    production: "secondary",
    completed: "default",
    delivered: "default",
    cancelled: "destructive",
  };
  
  return variants[status] || "outline";
}