"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { mockUnits, getUnitsByCategory, getUnitById, type Unit } from "@/lib/mock-data/units"

interface UnitsSelectorProps {
  value?: string
  onChange?: (value: string) => void
  category?: Unit['category']
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function UnitsSelector({
  value,
  onChange,
  category,
  placeholder = "Selecione uma unidade...",
  className,
  disabled = false
}: UnitsSelectorProps) {
  const [open, setOpen] = React.useState(false)
  
  // Filtra unidades por categoria se especificada
  const availableUnits = React.useMemo(() => {
    return category ? getUnitsByCategory(category) : mockUnits
  }, [category])

  const selectedUnit = value ? getUnitById(value) : undefined

  const groupedUnits = React.useMemo(() => {
    const groups: Record<string, Unit[]> = {}
    
    availableUnits.forEach(unit => {
      if (!groups[unit.category]) {
        groups[unit.category] = []
      }
      groups[unit.category].push(unit)
    })
    
    return groups
  }, [availableUnits])

  const categoryLabels = {
    area: 'Área',
    length: 'Comprimento', 
    volume: 'Volume',
    weight: 'Peso',
    quantity: 'Quantidade',
    time: 'Tempo'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedUnit ? (
            <div className="flex items-center gap-2">
              <span>{selectedUnit.name}</span>
              <Badge variant="secondary" className="text-xs">
                {selectedUnit.symbol}
              </Badge>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar unidade..." />
          <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
          
          {Object.entries(groupedUnits).map(([categoryKey, units]) => (
            <CommandGroup 
              key={categoryKey} 
              heading={categoryLabels[categoryKey as keyof typeof categoryLabels]}
            >
              {units.map((unit) => (
                <CommandItem
                  key={unit.id}
                  value={`${unit.name} ${unit.symbol} ${unit.description || ''}`}
                  onSelect={() => {
                    onChange?.(unit.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === unit.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{unit.name}</span>
                      {unit.description && (
                        <span className="text-xs text-muted-foreground">
                          {unit.description}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {unit.symbol}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Componente simplificado para apenas mostrar a unidade selecionada
export function UnitDisplay({ unitId, className }: { unitId?: string; className?: string }) {
  const unit = unitId ? getUnitById(unitId) : undefined
  
  if (!unit) return null
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-sm text-muted-foreground">{unit.name}</span>
      <Badge variant="outline" className="text-xs">
        {unit.symbol}
      </Badge>
    </div>
  )
}