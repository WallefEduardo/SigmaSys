// Tipos mockados para desenvolvimento
export interface User {
  id: string
  name: string
  email: string
  role: string
  companyId: string
  permissions?: any
}

export interface Company {
  id: string
  name: string
  cnpj?: string
  email?: string
  phone?: string
  plan: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  document?: string
  type: 'person' | 'company'
  address?: string
  birthday?: Date
  segment?: string
  tags: string[]
  notes?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description?: string
  category?: string
  formula?: any
  checklist?: any
  margin: any
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  id: string
  name: string
  description?: string
  unit: string
  cost: number
  supplier?: string
  supplierCode?: string
  minStock?: number
  category?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Mais tipos serão adicionados conforme necessário