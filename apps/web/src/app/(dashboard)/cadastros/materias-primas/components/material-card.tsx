"use client"

import Link from 'next/link'
import { Edit, Package, MapPin } from 'lucide-react'
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
import { Material } from '@/lib/mock-data/materials'

interface MaterialCardProps {
  material: Material
}

export function MaterialCard({ material }: MaterialCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStockStatus = () => {
    if (!material.stock || !material.minStock) return 'normal'
    if (material.stock <= material.minStock) return 'low'
    if (material.maxStock && material.stock >= material.maxStock) return 'high'
    return 'normal'
  }

  const stockStatus = getStockStatus()
  const stockBadgeVariant = stockStatus === 'low' ? 'destructive' : stockStatus === 'high' ? 'secondary' : 'default'

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {material.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>{material.code}</span>
              {material.category && (
                <Badge variant="outline" className="text-xs">
                  {material.category}
                </Badge>
              )}
            </CardDescription>
          </div>
          <Badge variant={material.active ? 'default' : 'secondary'} className="shrink-0">
            {material.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Custo:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(material.cost)} / {material.unit}
            </span>
          </div>
          
          {material.stock !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estoque:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {material.stock} {material.unit}
                </span>
                <Badge variant={stockBadgeVariant} className="text-xs">
                  {stockStatus === 'low' ? 'Baixo' : stockStatus === 'high' ? 'Alto' : 'OK'}
                </Badge>
              </div>
            </div>
          )}
          
          {material.brand && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Marca:</span>
              <span className="text-sm font-medium">{material.brand}</span>
            </div>
          )}
          
          {material.supplier && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fornecedor:</span>
              <span className="text-sm font-medium truncate ml-2" title={material.supplier}>
                {material.supplier}
              </span>
            </div>
          )}
        </div>
        
        {material.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{material.location}</span>
          </div>
        )}
        
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {material.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{material.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={`/cadastros/materias-primas/${material.id}`}>
              <Package className="h-4 w-4 mr-1" />
              Detalhes
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/cadastros/materias-primas/${material.id}/editar`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}