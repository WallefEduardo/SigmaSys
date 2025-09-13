'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/trpc'
import { 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  Bell,
  ArrowRight,
  DollarSign,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

export default function AlertsWidget() {
  const { data: alerts } = api.financial.alerts.list.useQuery({
    limit: 5,
    includeRead: false
  })

  const { data: alertStats } = api.financial.alerts.getStats.useQuery()

  const getAlertIcon = (type: string) => {
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

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      case 'success': return 'default'
      default: return 'outline'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'error': return 'Crítico'
      case 'warning': return 'Atenção'
      case 'success': return 'Positivo'
      default: return 'Info'
    }
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Alertas Financeiros
          </CardTitle>
          <CardDescription>Status dos seus alertas automáticos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium text-green-700">Tudo em ordem! 🎉</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhum alerta ativo no momento
            </p>
            {alertStats && (
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-bold">{alertStats.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{alertStats.resolved || 0}</p>
                  <p className="text-xs text-muted-foreground">Resolvidos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{alertStats.active || 0}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Alertas Financeiros
            </CardTitle>
            <CardDescription>
              {alerts.length} alerta{alerts.length > 1 ? 's' : ''} requer{alerts.length === 1 ? '' : 'em'} sua atenção
            </CardDescription>
          </div>
          {alertStats && alertStats.unread > 0 && (
            <Badge variant="destructive">
              {alertStats.unread} novo{alertStats.unread > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            <div className="shrink-0 mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium truncate">{alert.title}</h4>
                <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs">
                  {getSeverityLabel(alert.severity)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {alert.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(alert.createdAt), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
                {alert.data && (
                  <div className="text-xs">
                    {alert.type === 'budget_exceeded' && (
                      <span className="text-red-600 font-medium">
                        {alert.data.percentage}% usado
                      </span>
                    )}
                    {alert.type === 'goal_deadline' && (
                      <span className="text-yellow-600 font-medium">
                        {alert.data.daysRemaining} dias
                      </span>
                    )}
                    {alert.type === 'unusual_expense' && (
                      <span className="text-red-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(alert.data.amount)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Estatísticas resumidas */}
        {alertStats && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-bold">{alertStats.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">{alertStats.unread || 0}</p>
              <p className="text-xs text-muted-foreground">Não lidos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{alertStats.active || 0}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </div>
        )}

        {/* Link para ver todos */}
        <div className="pt-2">
          <Link href="/financeiro/configuracoes">
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              Configurar alertas
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}