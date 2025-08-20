// Mock data para materiais
export interface Material {
  id: string
  name: string
  description?: string
  code?: string
  unit: string
  cost: number
  category?: string
  brand?: string
  color?: string
  dimensions?: {
    width?: number
    height?: number
    thickness?: number
  }
  tags: string[]
  supplier?: string
  supplierCode?: string
  minStock?: number
  maxStock?: number
  stock?: number
  location?: string
  barcode?: string
  image?: string
  active: boolean
  priceHistory: Array<{
    date: string
    cost: number
  }>
}

export const mockMaterials: Material[] = [
  {
    id: '1',
    name: 'Vinil Adesivo Branco',
    description: 'Vinil adesivo branco para impressão digital, alta durabilidade',
    code: 'VIN-001',
    unit: 'm2',
    cost: 12.50,
    category: 'Vinil',
    brand: 'Avery Dennison',
    color: 'Branco',
    dimensions: { width: 1.37, thickness: 0.1 },
    tags: ['adesivo', 'vinil', 'impressão', 'branco'],
    supplier: 'Materiais Gráficos LTDA',
    supplierCode: 'AVE-WHT-137',
    minStock: 100,
    maxStock: 500,
    stock: 250,
    location: 'Estoque A - Prateleira 1',
    barcode: '7891234567890',
    active: true,
    priceHistory: [
      { date: '2024-01-01', cost: 11.80 },
      { date: '2024-02-01', cost: 12.10 },
      { date: '2024-03-01', cost: 12.50 }
    ]
  },
  {
    id: '2',
    name: 'Acrílico Cristal 3mm',
    description: 'Placa de acrílico cristal transparente 3mm de espessura',
    code: 'ACR-003',
    unit: 'm2',
    cost: 45.80,
    category: 'Acrílico',
    brand: 'Acrigel',
    color: 'Cristal',
    dimensions: { width: 2.0, height: 3.0, thickness: 3.0 },
    tags: ['acrílico', 'transparente', 'placa', 'cristal'],
    supplier: 'Plásticos Industriais SA',
    supplierCode: 'ACG-CRI-3MM',
    minStock: 20,
    maxStock: 100,
    stock: 45,
    location: 'Estoque B - Área 2',
    barcode: '7891234567891',
    active: true,
    priceHistory: [
      { date: '2024-01-01', cost: 42.50 },
      { date: '2024-02-01', cost: 44.20 },
      { date: '2024-03-01', cost: 45.80 }
    ]
  },
  {
    id: '3',
    name: 'Tinta UV Magenta',
    description: 'Tinta UV para impressão em alta qualidade, cor magenta',
    code: 'TIN-UV-MAG',
    unit: 'litro',
    cost: 125.00,
    category: 'Tinta',
    brand: 'Roland',
    color: 'Magenta',
    tags: ['tinta', 'uv', 'magenta', 'impressão'],
    supplier: 'Tintas Especiais Ltda',
    supplierCode: 'ROL-UV-MAG-1L',
    minStock: 5,
    maxStock: 30,
    stock: 12,
    location: 'Estoque C - Armário Tintas',
    barcode: '7891234567892',
    active: true,
    priceHistory: [
      { date: '2024-01-01', cost: 120.00 },
      { date: '2024-02-01', cost: 122.50 },
      { date: '2024-03-01', cost: 125.00 }
    ]
  },
  {
    id: '4',
    name: 'Parafuso Inox M6x20',
    description: 'Parafuso inox M6 x 20mm para fixação',
    code: 'PAR-M6-20',
    unit: 'un',
    cost: 0.85,
    category: 'Fixação',
    brand: 'Gerdau',
    color: 'Inox',
    tags: ['parafuso', 'inox', 'fixação', 'm6'],
    supplier: 'Parafusos e Fixações SA',
    supplierCode: 'GER-M6-20-INOX',
    minStock: 1000,
    maxStock: 5000,
    stock: 2500,
    location: 'Estoque D - Gaveta 15',
    barcode: '7891234567893',
    active: true,
    priceHistory: [
      { date: '2024-01-01', cost: 0.80 },
      { date: '2024-02-01', cost: 0.82 },
      { date: '2024-03-01', cost: 0.85 }
    ]
  },
  {
    id: '5',
    name: 'Lona Premium 440g',
    description: 'Lona para impressão digital 440g/m², alta resistência',
    code: 'LON-440',
    unit: 'm2',
    cost: 8.90,
    category: 'Lona',
    brand: 'Triplona',
    color: 'Branco',
    dimensions: { width: 3.2 },
    tags: ['lona', 'impressão', '440g', 'resistente'],
    supplier: 'Lonas Brasil Ltda',
    supplierCode: 'TRI-440-320',
    minStock: 200,
    maxStock: 1000,
    stock: 650,
    location: 'Estoque A - Prateleira 5',
    barcode: '7891234567894',
    active: true,
    priceHistory: [
      { date: '2024-01-01', cost: 8.50 },
      { date: '2024-02-01', cost: 8.70 },
      { date: '2024-03-01', cost: 8.90 }
    ]
  }
]

export const getMaterialsByCategory = (category: string) => {
  if (category === 'all') return mockMaterials.filter(m => m.active)
  return mockMaterials.filter(m => m.category === category && m.active)
}

export const getMaterialById = (id: string) => {
  return mockMaterials.find(m => m.id === id)
}

export const getMaterialCategories = () => {
  const categories = [...new Set(mockMaterials.map(m => m.category).filter(Boolean))]
  return categories
}