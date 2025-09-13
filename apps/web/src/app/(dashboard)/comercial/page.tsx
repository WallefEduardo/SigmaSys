"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  ClipboardList, 
  TrendingUp,
  Calendar,
  Users,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { QuotesList } from "@/components/commercial/quotes-list";
import { OrdersList } from "@/components/commercial/orders-list";
import { SalesFunnel } from "@/components/commercial/sales-funnel";
import { CommercialStats } from "@/components/commercial/commercial-stats";

export default function ComercialPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("quotes");
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comercial</h1>
          <p className="text-muted-foreground">
            Gerencie orçamentos, ordens de serviço e oportunidades de venda
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/comercial/funil")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Funil de Vendas
          </Button>
          
          {activeTab === "quotes" ? (
            <Button onClick={() => router.push("/comercial/orcamentos/novo")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          ) : (
            <Button onClick={() => router.push("/comercial/ordens/nova")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <CommercialStats />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
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
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Ordens de Serviço
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Funil de Vendas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4">
          <QuotesList search={search} />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <OrdersList search={search} />
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <SalesFunnel />
        </TabsContent>
      </Tabs>
    </div>
  );
}