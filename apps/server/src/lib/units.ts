export interface Unit {
  id: string
  name: string
  symbol: string
  category: 'area' | 'length' | 'volume' | 'weight' | 'quantity' | 'time'
  baseUnit?: string
  factor?: number
  formula?: string
}

export const defaultUnits: Unit[] = [
  // Área
  { id: 'm2', name: 'Metro Quadrado', symbol: 'm²', category: 'area' },
  { id: 'cm2', name: 'Centímetro Quadrado', symbol: 'cm²', category: 'area', baseUnit: 'm2', factor: 0.0001 },
  
  // Comprimento/Linear
  { id: 'ml', name: 'Metro Linear', symbol: 'ml', category: 'length' },
  { id: 'cm', name: 'Centímetro', symbol: 'cm', category: 'length', baseUnit: 'ml', factor: 0.01 },
  { id: 'mm', name: 'Milímetro', symbol: 'mm', category: 'length', baseUnit: 'ml', factor: 0.001 },
  
  // Perímetro (calculado)
  { id: 'perimetro', name: 'Perímetro', symbol: 'per', category: 'length', formula: '2 * (largura + altura)' },
  { id: 'perimetro_total', name: 'Perímetro Total', symbol: 'ptot', category: 'length', formula: '2 * largura + 2 * altura + 2 * espessura' },
  
  // Metro Linear específicos
  { id: 'ml_largura', name: 'Metro Linear Largura', symbol: 'ml_l', category: 'length', formula: 'largura' },
  { id: 'ml_altura', name: 'Metro Linear Altura', symbol: 'ml_a', category: 'length', formula: 'altura' },
  { id: 'ml_travas', name: 'Metro Linear Travas', symbol: 'ml_t', category: 'length', formula: 'altura / espacamento_travas' },
  { id: 'ml_travas_altura', name: 'Metro Linear Travas Altura', symbol: 'ml_ta', category: 'length', formula: 'altura' },
  
  // Metro Quadrado específicos
  { id: 'm2_largura_altura', name: 'Metro Quadrado (L x A)', symbol: 'm²_la', category: 'area', formula: 'largura * altura' },
  { id: 'm2_largura_espessura', name: 'Metro Quadrado (L x E)', symbol: 'm²_le', category: 'area', formula: 'largura * espessura' },
  { id: 'm2_altura_espessura', name: 'Metro Quadrado (A x E)', symbol: 'm²_ae', category: 'area', formula: 'altura * espessura' },
  
  // Volume
  { id: 'm3', name: 'Metro Cúbico', symbol: 'm³', category: 'volume' },
  { id: 'litro', name: 'Litro', symbol: 'L', category: 'volume', baseUnit: 'm3', factor: 0.001 },
  { id: 'ml_volume', name: 'Mililitro', symbol: 'mL', category: 'volume', baseUnit: 'm3', factor: 0.000001 },
  
  // Peso
  { id: 'kg', name: 'Quilograma', symbol: 'kg', category: 'weight' },
  { id: 'g', name: 'Grama', symbol: 'g', category: 'weight', baseUnit: 'kg', factor: 0.001 },
  { id: 'ton', name: 'Tonelada', symbol: 't', category: 'weight', baseUnit: 'kg', factor: 1000 },
  
  // Quantidade
  { id: 'un', name: 'Unidade', symbol: 'un', category: 'quantity' },
  { id: 'par', name: 'Par', symbol: 'par', category: 'quantity', baseUnit: 'un', factor: 2 },
  { id: 'duzia', name: 'Dúzia', symbol: 'dz', category: 'quantity', baseUnit: 'un', factor: 12 },
  { id: 'centena', name: 'Centena', symbol: 'cen', category: 'quantity', baseUnit: 'un', factor: 100 },
  
  // Tempo
  { id: 'hora', name: 'Hora', symbol: 'h', category: 'time' },
  { id: 'minuto', name: 'Minuto', symbol: 'min', category: 'time', baseUnit: 'hora', factor: 1/60 },
  { id: 'segundo', name: 'Segundo', symbol: 's', category: 'time', baseUnit: 'hora', factor: 1/3600 }
]

export class UnitsService {
  static getUnitById(id: string): Unit | undefined {
    return defaultUnits.find(unit => unit.id === id)
  }

  static getUnitsByCategory(category: string): Unit[] {
    return defaultUnits.filter(unit => unit.category === category)
  }

  static convertToBaseUnit(value: number, fromUnit: string): number {
    const unit = this.getUnitById(fromUnit)
    if (!unit || !unit.baseUnit || !unit.factor) {
      return value
    }
    return value * unit.factor
  }

  static convertBetweenUnits(value: number, fromUnit: string, toUnit: string): number {
    const from = this.getUnitById(fromUnit)
    const to = this.getUnitById(toUnit)
    
    if (!from || !to) return value
    
    // Se são da mesma categoria, fazer conversão
    if (from.category === to.category) {
      const baseValue = this.convertToBaseUnit(value, fromUnit)
      const toFactor = to.factor || 1
      return baseValue / toFactor
    }
    
    return value
  }

  static validateUnit(unitId: string): boolean {
    return defaultUnits.some(unit => unit.id === unitId)
  }

  static getFormulaSuggestions(): string[] {
    return [
      'quantidade',
      'largura',
      'altura', 
      'espessura',
      'perimetro',
      'area',
      'volume',
      'largura * altura',
      'largura * espessura',
      'altura * espessura',
      '2 * (largura + altura)',
      '2 * largura + 2 * altura',
      'quantidade * largura',
      'quantidade * altura',
      'quantidade * (largura * altura)',
      'ceil(altura / espacamento_travas)',
      'ceil(largura / largura_material)',
      'area / rendimento_tinta'
    ]
  }
}