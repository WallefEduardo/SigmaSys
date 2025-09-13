"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter, 
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { OrdersList } from "@/components/commercial/orders-list";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";

export default function OrdensPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const { data: stats } = api.orders.stats.useQuery({});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Ordens de Serviço
          </h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas ordens de serviço
          </p>
        </div>
        
        <Button onClick={() => router.push("/comercial/ordens/nova")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ordem
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalValue || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues no Prazo</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.onTime || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status das Ordens */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats?.byStatus.map((status) => (
          <Card key={status.status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {getStatusLabel(status.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{status.count}</div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(status.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, título ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Mais Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ordens */}
      <OrdersList search={search} />
    </div>
  );
}

function getStatusLabel(status: string): string {
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