"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Clock,
  Zap,
  Activity,
  AlertTriangle,
  Download,
  Calendar,
  Calculator,
  Target,
  Gauge
} from "lucide-react";

interface ReportsTabProps {
  equipmentId: string;
  equipmentType?: string;
}

export function ReportsTab({ equipmentId, equipmentType }: ReportsTabProps) {
  // Mock data - em produção virá da API
  const mockData = {
    totalOperatingHours: 1250,
    totalJobs: 487,
    totalRevenue: 125000,
    totalCosts: 45000,
    currentDepreciation: 8500,
    efficiency: 87,
    consumablesUsed: {
      ink: { total: 2500, cost: 1250 },
      printHead: { total: 2, cost: 1000 },
      tools: { total: 15, cost: 375 }
    },
    monthlyStats: [
      { month: "Jan", hours: 180, revenue: 15000, costs: 5500 },
      { month: "Fev", hours: 165, revenue: 13500, costs: 5200 },
      { month: "Mar", hours: 195, revenue: 18000, costs: 6200 },
      { month: "Abr", hours: 210, revenue: 21000, costs: 6800 },
      { month: "Mai", hours: 220, revenue: 23500, costs: 7100 },
      { month: "Jun", hours: 180, revenue: 18000, costs: 5800 }
    ],
    passesUsage: {
      draft: { count: 125, hours: 45, revenue: 8500 },
      normal: { count: 280, hours: 180, revenue: 42000 },
      high: { count: 65, hours: 85, revenue: 28500 },
      photo: { count: 17, hours: 42, revenue: 21000 }
    }
  };

  const profitMargin = ((mockData.totalRevenue - mockData.totalCosts) / mockData.totalRevenue * 100);
  const costPerHour = mockData.totalCosts / mockData.totalOperatingHours;
  const revenuePerHour = mockData.totalRevenue / mockData.totalOperatingHours;
  const utilizationRate = (mockData.totalOperatingHours / (30 * 24 * 6)) * 100; // Assumindo 6 meses de operação

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mockData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Em {mockData.totalJobs} trabalhos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mockData.totalRevenue - mockData.totalCosts)} lucro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Operação</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.totalOperatingHours}h</div>
            <p className="text-xs text-muted-foreground">
              {utilizationRate.toFixed(1)}% de utilização
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.efficiency}%</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant={mockData.efficiency > 85 ? "default" : "secondary"}>
                {mockData.efficiency > 85 ? "Excelente" : "Bom"}
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Custos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" />
              Análise de Custos
            </CardTitle>
            <CardDescription>
              Breakdown detalhado dos custos operacionais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Custo por Hora:</span>
                <span className="text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(costPerHour)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Receita por Hora:</span>
                <span className="text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenuePerHour)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Depreciação Acumulada:</span>
                <span className="text-sm">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mockData.currentDepreciation)}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <h5 className="text-sm font-medium mb-2">Consumíveis por Tipo:</h5>
              <div className="space-y-2">
                {Object.entries(mockData.consumablesUsed).map(([type, data]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type}:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Performance do Equipamento
            </CardTitle>
            <CardDescription>
              Métricas de desempenho e eficiência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Taxa de Utilização</span>
                <span className="text-sm">{utilizationRate.toFixed(1)}%</span>
              </div>
              <Progress value={utilizationRate} className="w-full" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Eficiência Operacional</span>
                <span className="text-sm">{mockData.efficiency}%</span>
              </div>
              <Progress value={mockData.efficiency} className="w-full" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Margem de Lucro</span>
                <span className="text-sm">{profitMargin.toFixed(1)}%</span>
              </div>
              <Progress value={profitMargin} className="w-full" />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold">{mockData.totalJobs}</div>
                <div className="text-muted-foreground">Trabalhos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{(mockData.totalOperatingHours / mockData.totalJobs).toFixed(1)}h</div>
                <div className="text-muted-foreground">Média/Trabalho</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Passadas (apenas para impressoras) */}
      {equipmentType === "printing" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Análise de Qualidades de Impressão
            </CardTitle>
            <CardDescription>
              Performance por tipo de passada configurada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(mockData.passesUsage).map(([passType, data]) => (
                <div key={passType} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium capitalize">{passType}</h5>
                    <Badge variant={passType === 'normal' ? 'default' : 'secondary'}>
                      {data.count} jobs
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Horas:</span>
                      <span>{data.hours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Receita:</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>R$/hora:</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.revenue / data.hours)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tendência Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Tendência dos Últimos 6 Meses
          </CardTitle>
          <CardDescription>
            Evolução de horas, receita e custos mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockData.monthlyStats.map((month, index) => (
              <div key={month.month} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{month.month}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{month.hours}h</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(month.revenue)}</span>
                    <Badge variant={(month.revenue - month.costs) / month.revenue > 0.6 ? 'default' : 'secondary'}>
                      {(((month.revenue - month.costs) / month.revenue) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-xs">Receita</div>
                    <Progress 
                      value={(month.revenue / Math.max(...mockData.monthlyStats.map(m => m.revenue))) * 100} 
                      className="flex-1 h-2" 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-xs">Custos</div>
                    <Progress 
                      value={(month.costs / Math.max(...mockData.monthlyStats.map(m => m.costs))) * 100} 
                      className="flex-1 h-2" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertas e Recomendações */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-yellow-800 dark:text-yellow-300">
            <AlertTriangle className="h-4 w-4" />
            Insights e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700 dark:text-yellow-400 space-y-2">
          {mockData.efficiency < 80 && (
            <p>• <strong>Eficiência baixa:</strong> Revisar configurações de passadas e manutenção preventiva.</p>
          )}
          {utilizationRate < 60 && (
            <p>• <strong>Baixa utilização:</strong> Equipamento subutilizado. Considerar mais projetos ou redistribuição de carga.</p>
          )}
          {profitMargin < 50 && (
            <p>• <strong>Margem baixa:</strong> Revisar precificação ou otimizar custos operacionais.</p>
          )}
          <p>• <strong>Performance geral:</strong> {
            mockData.efficiency > 85 && profitMargin > 60 && utilizationRate > 70 
              ? "Excelente performance. Equipamento bem otimizado."
              : "Há oportunidades de otimização identificadas acima."
          }</p>
        </CardContent>
      </Card>

      {/* Ações de Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Exportar Relatórios
          </CardTitle>
          <CardDescription>
            Baixe relatórios detalhados para análise offline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Relatório Completo (PDF)
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Histórico Mensal (Excel)
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dados de Performance (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}