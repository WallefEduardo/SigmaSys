'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'
import { 
  Bell, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  X,
  Eye,
  Trash2,
  Clock,
  DollarSign
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Alert {
  id: string
  type: 'budget_exceeded' | 'goal_deadline' | 'low_balance' | 'unusual_expense' | 'positive_trend'
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  isRead: boolean
  createdAt: Date
  data?: any
}

export default function AlertsDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  // Queries
  const { data: alerts, refetch } = api.financial.alerts.list.useQuery({
    limit: 10,
    includeRead: false
  })

  const { data: alertStats } = api.financial.alerts.getStats.useQuery()

  // Mutations
  const markAsReadMutation = api.financial.alerts.markAsRead.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  const deleteAlertMutation = api.financial.alerts.delete.useMutation({
    onSuccess: () => {
      toast.success('Alerta removido')
      refetch()
    }
  })

  const markAllAsReadMutation = api.financial.alerts.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success('Todos os alertas foram marcados como lidos')
      refetch()
    }
  })

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'budget_exceeded':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'goal_deadline':
        return <Target className="h-4 w-4 text-yellow-500" />
      case 'low_balance':
        return <DollarSign className="h-4 w-4 text-orange-500" />
      case 'unusual_expense':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'positive_trend':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-l-red-500 bg-red-50'
      case 'warning': return 'border-l-yellow-500 bg-yellow-50'
      case 'success': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-blue-500 bg-blue-50'
    }
  }

  const handleMarkAsRead = (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    markAsReadMutation.mutate({ id: alertId })
  }

  const handleDeleteAlert = (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    deleteAlertMutation.mutate({ id: alertId })
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate({})
  }

  const unreadCount = alertStats?.unread || 0

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 max-h-[500px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas Financeiros
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Marcar todos como lidos
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {alerts && alerts.length > 0 ? (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1 p-1">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${getSeverityColor(alert.severity)} ${
                    !alert.isRead ? 'ring-1 ring-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getAlertIcon(alert.type, alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold truncate">
                            {alert.title}
                          </h4>
                          {!alert.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.createdAt), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                          <div className="flex items-center gap-1">
                            {!alert.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleMarkAsRead(alert.id, e)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteAlert(alert.id, e)}
                              className="h-6 w-6 p-0 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dados específicos do alerta */}
                  {alert.data && (
                    <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                      {alert.type === 'budget_exceeded' && alert.data.budgetName && (
                        <div className="flex items-center justify-between">
                          <span>Orçamento: {alert.data.budgetName}</span>
                          <span className="font-medium">
                            {alert.data.percentage}% usado
                          </span>
                        </div>
                      )}
                      {alert.type === 'goal_deadline' && alert.data.goalName && (
                        <div className="flex items-center justify-between">
                          <span>Meta: {alert.data.goalName}</span>
                          <span className="font-medium">
                            {alert.data.daysRemaining} dias restantes
                          </span>
                        </div>
                      )}
                      {alert.type === 'unusual_expense' && alert.data.amount && (
                        <div className="flex items-center justify-between">
                          <span>Valor incomum detectado</span>
                          <span className="font-medium text-red-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(alert.data.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Nenhum alerta no momento
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Você está em dia com suas finanças! 🎉
            </p>
          </div>
        )}

        <DropdownMenuSeparator />
        
        <div className="p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-xs"
            onClick={() => {
              setIsOpen(false)
              window.location.href = '/financeiro/configuracoes'
            }}
          >
            <Bell className="h-3 w-3 mr-2" />
            Configurar alertas
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}