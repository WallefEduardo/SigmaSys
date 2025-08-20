"use client"

import Link from 'next/link'
import { Edit, Settings, MapPin, Calendar, Zap } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Equipment } from '@/lib/mock-data/equipments'

interface EquipmentCardProps {
  equipment: Equipment
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusInfo = (status: string) => {
    const variants = {
      available: { variant: 'default' as const, label: 'Disponível', color: 'text-green-600' },
      maintenance: { variant: 'secondary' as const, label: 'Manutenção', color: 'text-yellow-600' },
      in_use: { variant: 'destructive' as const, label: 'Em Uso', color: 'text-blue-600' },
      broken: { variant: 'destructive' as const, label: 'Quebrado', color: 'text-red-600' }
    }
    return variants[status as keyof typeof variants] || variants.available
  }

  const getTypeInfo = (type: string) => {
    return type === 'printing' 
      ? { label: 'Impressão', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
      : { label: 'Usinagem', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
  }

  const statusInfo = getStatusInfo(equipment.status)
  const typeInfo = getTypeInfo(equipment.type)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isMaintenanceDue = () => {
    if (!equipment.nextMaintenance) return false
    return new Date(equipment.nextMaintenance) <= new Date()
  }

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {equipment.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>{equipment.code}</span>
              <Badge className={typeInfo.color}>
                {typeInfo.label}
              </Badge>
            </CardDescription>
          </div>
          <Badge variant={statusInfo.variant} className="shrink-0">
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Custo/hora:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(equipment.costPerHour)}
            </span>
          </div>
          
          {equipment.manufacturer && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fabricante:</span>
              <span className="text-sm font-medium">{equipment.manufacturer}</span>
            </div>
          )}
          
          {equipment.model && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Modelo:</span>
              <span className="text-sm font-medium">{equipment.model}</span>
            </div>
          )}
          
          {equipment.year && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ano:</span>
              <span className="text-sm font-medium">{equipment.year}</span>
            </div>
          )}
        </div>

        {/* Especificações Técnicas */}
        <div className="bg-muted/50 p-3 rounded text-sm space-y-1">
          <div className="font-medium text-muted-foreground mb-2">Especificações</div>
          {equipment.maxWidth && equipment.maxHeight && (
            <div className="flex justify-between">
              <span>Área máx:</span>
              <span>{equipment.maxWidth} × {equipment.maxHeight} mm</span>
            </div>
          )}
          {equipment.maxThickness && (
            <div className="flex justify-between">
              <span>Espessura máx:</span>
              <span>{equipment.maxThickness} mm</span>
            </div>
          )}
          {equipment.energyCost && (
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Energia/h:
              </span>
              <span>{formatCurrency(equipment.energyCost)}</span>
            </div>
          )}
        </div>
        
        {equipment.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{equipment.location}</span>
          </div>
        )}

        {/* Manutenção */}
        {equipment.nextMaintenance && (
          <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
            <Calendar className="h-3 w-3 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Próxima manutenção:</span>
                <span className={isMaintenanceDue() ? 'text-red-600 font-medium' : ''}>
                  {formatDate(equipment.nextMaintenance)}
                </span>
              </div>
              {isMaintenanceDue() && (
                <div className="text-red-600 text-xs font-medium">
                  Manutenção em atraso!
                </div>
              )}
            </div>
          </div>
        )}
        
        {equipment.tags && equipment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {equipment.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {equipment.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{equipment.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={`/cadastros/equipamentos/${equipment.id}`}>
              <Settings className="h-4 w-4 mr-1" />
              Detalhes
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/cadastros/equipamentos/${equipment.id}/editar`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}