"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: any, item: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onEdit?: (item: T) => void
  onView?: (item: T) => void
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  onEdit, 
  onView,
  emptyMessage = "Nenhum item encontrado"
}: DataTableProps<T>) {
  const getValue = (item: T, key: string) => {
    return key.split('.').reduce((obj, k) => obj?.[k], item as any)
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key as string}>
                {column.label}
              </TableHead>
            ))}
            {(onEdit || onView) && <TableHead>Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {columns.map((column) => (
                <TableCell key={column.key as string}>
                  {column.render 
                    ? column.render(getValue(item, column.key as string), item)
                    : getValue(item, column.key as string)
                  }
                </TableCell>
              ))}
              {(onEdit || onView) && (
                <TableCell>
                  <div className="flex gap-2">
                    {onView && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onView(item)}
                      >
                        Ver
                      </Button>
                    )}
                    {onEdit && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}