// Mock data para unidades de medida
export interface Unit {
  id: string
  name: string
  symbol: string
  category: 'area' | 'length' | 'volume' | 'weight' | 'quantity' | 'time'
}

export const mockUnits: Unit[] = [
  // Area
  { id: 'm2', name: 'Metro Quadrado', symbol: 'm²', category: 'area' },
  { id: 'cm2', name: 'Centímetro Quadrado', symbol: 'cm²', category: 'area' },
  { id: 'mm2', name: 'Milímetro Quadrado', symbol: 'mm²', category: 'area' },
  
  // Length
  { id: 'ml', name: 'Metro Linear', symbol: 'ml', category: 'length' },
  { id: 'cm', name: 'Centímetro', symbol: 'cm', category: 'length' },
  { id: 'mm', name: 'Milímetro', symbol: 'mm', category: 'length' },
  { id: 'perimetro', name: 'Perímetro', symbol: 'per', category: 'length' },
  
  // Volume
  { id: 'litro', name: 'Litro', symbol: 'L', category: 'volume' },
  { id: 'ml_vol', name: 'Mililitro', symbol: 'ml', category: 'volume' },
  { id: 'm3', name: 'Metro Cúbico', symbol: 'm³', category: 'volume' },
  
  // Weight
  { id: 'kg', name: 'Quilograma', symbol: 'kg', category: 'weight' },
  { id: 'g', name: 'Grama', symbol: 'g', category: 'weight' },
  { id: 't', name: 'Tonelada', symbol: 't', category: 'weight' },
  
  // Quantity
  { id: 'un', name: 'Unidade', symbol: 'un', category: 'quantity' },
  { id: 'par', name: 'Par', symbol: 'par', category: 'quantity' },
  { id: 'duzia', name: 'Dúzia', symbol: 'dz', category: 'quantity' },
  { id: 'peca', name: 'Peça', symbol: 'pç', category: 'quantity' },
  
  // Time
  { id: 'hora', name: 'Hora', symbol: 'h', category: 'time' },
  { id: 'minuto', name: 'Minuto', symbol: 'min', category: 'time' },
  { id: 'segundo', name: 'Segundo', symbol: 's', category: 'time' }
]

export const getUnitsByCategory = (category: Unit['category']) => {
  return mockUnits.filter(unit => unit.category === category)
}

export const getUnitById = (id: string) => {
  return mockUnits.find(unit => unit.id === id)
}