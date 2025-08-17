export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  document?: string
  type: 'PERSON' | 'COMPANY'
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  }
  birthday?: Date
  segment?: string
  tags: string[]
  notes?: string
  status: 'active' | 'inactive' | 'prospect' | 'lead'
  source?: string
  rating?: number
  socialMedia?: {
    facebook?: string
    instagram?: string
    linkedin?: string
    website?: string
  }
  creditLimit?: number
  paymentTerm?: number
  discount?: number
  active: boolean
  createdAt: Date
  stats: {
    quotes: number
    orders: number
    totalSpent: number
    lastOrder?: Date
  }
}

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'João da Silva Transportes',
    email: 'joao@transportes.com',
    phone: '(11) 98765-4321',
    document: '12.345.678/0001-90',
    type: 'COMPANY',
    address: {
      street: 'Rua dos Transportes',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000'
    },
    segment: 'Transporte e Logística',
    tags: ['vip', 'recorrente'],
    status: 'active',
    source: 'Indicação',
    rating: 5,
    socialMedia: {
      website: 'https://transportes.com'
    },
    creditLimit: 50000,
    paymentTerm: 30,
    discount: 5,
    active: true,
    createdAt: new Date('2023-06-15'),
    stats: {
      quotes: 15,
      orders: 12,
      totalSpent: 125000,
      lastOrder: new Date('2024-01-10')
    }
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(11) 91234-5678',
    document: '123.456.789-00',
    type: 'PERSON',
    birthday: new Date('1985-03-20'),
    segment: 'Pessoa Física',
    tags: ['novo'],
    status: 'prospect',
    source: 'Site',
    rating: 3,
    active: true,
    createdAt: new Date('2024-01-05'),
    stats: {
      quotes: 2,
      orders: 0,
      totalSpent: 0
    }
  },
  {
    id: '3',
    name: 'Restaurante Bella Vista',
    email: 'contato@bellavista.com',
    phone: '(11) 95555-1234',
    document: '98.765.432/0001-10',
    type: 'COMPANY',
    address: {
      street: 'Avenida Principal',
      number: '456',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05433-000'
    },
    segment: 'Alimentação',
    tags: ['sazonal'],
    status: 'active',
    source: 'Google Ads',
    rating: 4,
    socialMedia: {
      instagram: '@bellavista',
      facebook: 'Restaurante Bella Vista'
    },
    creditLimit: 20000,
    paymentTerm: 15,
    active: true,
    createdAt: new Date('2023-09-10'),
    stats: {
      quotes: 8,
      orders: 6,
      totalSpent: 35000,
      lastOrder: new Date('2023-12-20')
    }
  },
  {
    id: '4',
    name: 'TechStart Inovações',
    email: 'vendas@techstart.com',
    phone: '(11) 94444-5678',
    document: '55.444.333/0001-22',
    type: 'COMPANY',
    segment: 'Tecnologia',
    tags: ['startup', 'potencial'],
    status: 'lead',
    source: 'LinkedIn',
    rating: 4,
    socialMedia: {
      linkedin: 'TechStart Inovações',
      website: 'https://techstart.com'
    },
    active: true,
    createdAt: new Date('2024-01-12'),
    stats: {
      quotes: 1,
      orders: 0,
      totalSpent: 0
    }
  },
  {
    id: '5',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@email.com',
    phone: '(11) 93333-2222',
    document: '987.654.321-00',
    type: 'PERSON',
    birthday: new Date('1978-11-15'),
    segment: 'Pessoa Física',
    tags: ['inativo'],
    notes: 'Cliente solicitou pausa no atendimento',
    status: 'inactive',
    source: 'Indicação',
    rating: 2,
    active: false,
    createdAt: new Date('2023-03-20'),
    stats: {
      quotes: 3,
      orders: 1,
      totalSpent: 2500,
      lastOrder: new Date('2023-04-10')
    }
  }
]

export const statusLabels = {
  active: 'Ativo',
  inactive: 'Inativo',
  prospect: 'Prospect',
  lead: 'Lead'
}

export const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  prospect: 'bg-blue-100 text-blue-800',
  lead: 'bg-yellow-100 text-yellow-800'
}

export const typeLabels = {
  PERSON: 'Pessoa Física',
  COMPANY: 'Pessoa Jurídica'
}

export const mockInteractions = [
  {
    id: '1',
    clientId: '1',
    type: 'call',
    subject: 'Negociação de desconto',
    description: 'Cliente solicitou desconto para pedido grande',
    status: 'completed',
    completedAt: new Date('2024-01-14T10:30:00'),
    duration: 25,
    outcome: 'Aprovado desconto de 8%',
    nextAction: 'Enviar proposta atualizada',
    nextDate: new Date('2024-01-15T09:00:00'),
    userName: 'Maria Santos'
  },
  {
    id: '2',
    clientId: '1',
    type: 'email',
    subject: 'Proposta comercial enviada',
    status: 'completed',
    completedAt: new Date('2024-01-13T14:15:00'),
    userName: 'Maria Santos'
  },
  {
    id: '3',
    clientId: '3',
    type: 'visit',
    subject: 'Visita técnica no restaurante',
    description: 'Medição para nova sinalização',
    status: 'completed',
    completedAt: new Date('2024-01-12T15:00:00'),
    duration: 90,
    outcome: 'Medições realizadas',
    nextAction: 'Elaborar projeto',
    userName: 'Pedro Oliveira'
  }
]