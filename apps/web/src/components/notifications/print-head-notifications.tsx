"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, AlertTriangle, Clock, Settings, RefreshCw, Info } from "lucide-react";
import { 
  PrintHeadAlert, 
  PrintHeadStatus,
  getAllPrintHeadAlerts,
  getUnacknowledgedAlerts,
  formatTimeRemaining,
  getAlertColor 
} from "@/lib/utils/print-head-alerts";
import { toast } from "sonner";

interface PrintHeadNotificationsProps {
  printHeads: PrintHeadStatus[];
  onAlertAcknowledge?: (alertId: string) => void;
}

const iconMap = {
  AlertTriangle,
  Clock,
  Settings,
  RefreshCw,
  Info
};

export function PrintHeadNotifications({ printHeads, onAlertAcknowledge }: PrintHeadNotificationsProps) {
  const [alerts, setAlerts] = React.useState<PrintHeadAlert[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Atualizar alertas quando as cabeças mudarem
  React.useEffect(() => {
    if (printHeads && Array.isArray(printHeads)) {
      const allAlerts = getAllPrintHeadAlerts(printHeads);
      setAlerts(allAlerts);
    } else {
      setAlerts([]);
    }
  }, [printHeads]);

  const unacknowledgedAlerts = getUnacknowledgedAlerts(alerts);
  const criticalAlerts = alerts.filter(a => a.type === "critical" && !a.acknowledged);
  const warningAlerts = alerts.filter(a => a.type === "warning" && !a.acknowledged);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    onAlertAcknowledge?.(alertId);
    toast.success("Alerta reconhecido");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "critical":
        return AlertTriangle;
      case "warning":
        return Clock;
      case "maintenance":
        return Settings;
      case "replacement":
        return RefreshCw;
      default:
        return Info;
    }
  };

  const getPriorityColor = (priority: PrintHeadAlert["priority"]) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "secondary";
      case "medium":
        return "outline";
      default:
        return "outline";
    }
  };

  if (unacknowledgedAlerts.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Botão de notificação */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unacknowledgedAlerts.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {unacknowledgedAlerts.length}
          </Badge>
        )}
      </Button>

      {/* Painel de notificações */}
      {showNotifications && (
        <div className="absolute top-full right-0 mt-2 w-96 max-h-96 overflow-y-auto z-50 bg-background border rounded-lg shadow-lg">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Alertas de Cabeças de Impressão</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {unacknowledgedAlerts.length} alertas não reconhecidos
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {unacknowledgedAlerts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum alerta pendente</p>
              </div>
            ) : (
              unacknowledgedAlerts.map((alert) => {
                const Icon = getIcon(alert.type);
                return (
                  <div key={alert.id} className="p-4 border-b last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${
                        alert.type === "critical" ? "text-red-500" :
                        alert.type === "warning" ? "text-yellow-500" :
                        alert.type === "maintenance" ? "text-blue-500" :
                        "text-gray-500"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <Badge variant={getPriorityColor(alert.priority)} className="text-xs">
                            {alert.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>Ação:</strong> {alert.actionRequired}
                        </p>
                        
                        {alert.estimatedDaysRemaining !== undefined && (
                          <p className="text-xs text-muted-foreground mb-2">
                            <strong>Tempo estimado:</strong> {formatTimeRemaining(alert.estimatedDaysRemaining)}
                          </p>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-xs"
                          >
                            Reconhecer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {unacknowledgedAlerts.length > 0 && (
            <div className="p-4 border-t bg-muted/30">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  unacknowledgedAlerts.forEach(alert => acknowledgeAlert(alert.id));
                }}
                className="w-full text-xs"
              >
                Reconhecer Todos
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para exibir resumo dos alertas no dashboard
export function PrintHeadAlertsSummary({ printHeads }: { printHeads: PrintHeadStatus[] }) {
  const allAlerts = getAllPrintHeadAlerts(printHeads || []);
  const criticalCount = allAlerts.filter(a => a.type === "critical").length;
  const warningCount = allAlerts.filter(a => a.type === "warning").length;
  const maintenanceCount = allAlerts.filter(a => a.type === "maintenance").length;

  if (allAlerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
            <Settings className="h-5 w-5" />
            <div>
              <p className="font-medium">Cabeças de Impressão</p>
              <p className="text-sm">Todas as cabeças funcionando normalmente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300 mb-3">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Cabeças de Impressão</p>
            <p className="text-sm">Atenção necessária</p>
          </div>
        </div>
        
        <div className="flex gap-4 text-sm">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{criticalCount} crítica{criticalCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1 text-yellow-600">
              <Clock className="h-3 w-3" />
              <span>{warningCount} atenção</span>
            </div>
          )}
          {maintenanceCount > 0 && (
            <div className="flex items-center gap-1 text-blue-600">
              <Settings className="h-3 w-3" />
              <span>{maintenanceCount} manutenção</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}