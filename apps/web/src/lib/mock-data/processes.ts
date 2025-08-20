// Mock data para processos
export interface Process {
  id: string
  name: string
  description?: string
  costPerHour: number
  sector?: string
  timeUnit: string
  defaultTime?: number
  active: boolean
}

export const mockProcesses: Process[] = [
  {
    id: '1',
    name: 'Impressão Digital UV',
    description: 'Processo de impressão UV em materiais diversos',
    costPerHour: 80.00,
    sector: 'Impressão',
    timeUnit: 'm2',
    defaultTime: 0.25, // 15 minutos por m²
    active: true
  },
  {
    id: '2',
    name: 'Corte CNC',
    description: 'Corte preciso com router CNC',
    costPerHour: 120.00,
    sector: 'Usinagem',
    timeUnit: 'ml',
    defaultTime: 0.1, // 6 minutos por metro linear
    active: true
  },
  {
    id: '3',
    name: 'Solda TIG',
    description: 'Soldagem TIG para estruturas metálicas',
    costPerHour: 65.00,
    sector: 'Metalurgia',
    timeUnit: 'ml',
    defaultTime: 0.5, // 30 minutos por metro linear
    active: true
  },
  {
    id: '4',
    name: 'Montagem Manual',
    description: 'Montagem e acabamento manual',
    costPerHour: 35.00,
    sector: 'Montagem',
    timeUnit: 'un',
    defaultTime: 0.33, // 20 minutos por unidade
    active: true
  },
  {
    id: '5',
    name: 'Aplicação de Vinil',
    description: 'Aplicação cuidadosa de vinil adesivo',
    costPerHour: 45.00,
    sector: 'Acabamento',
    timeUnit: 'm2',
    defaultTime: 0.5, // 30 minutos por m²
    active: true
  },
  {
    id: '6',
    name: 'Corte Laser',
    description: 'Corte e gravação a laser CO2',
    costPerHour: 95.00,
    sector: 'Usinagem',
    timeUnit: 'ml',
    defaultTime: 0.083, // 5 minutos por metro linear
    active: true
  },
  {
    id: '7',
    name: 'Dobra e Vinco',
    description: 'Dobra e vinco em materiais flexíveis',
    costPerHour: 40.00,
    sector: 'Acabamento',
    timeUnit: 'ml',
    defaultTime: 0.17, // 10 minutos por metro linear
    active: true
  },
  {
    id: '8',
    name: 'Pintura Automotiva',
    description: 'Pintura com acabamento automotivo',
    costPerHour: 85.00,
    sector: 'Pintura',
    timeUnit: 'm2',
    defaultTime: 1.0, // 1 hora por m²
    active: true
  },
  {
    id: '9',
    name: 'Laminação',
    description: 'Laminação para proteção e acabamento',
    costPerHour: 55.00,
    sector: 'Acabamento',
    timeUnit: 'm2',
    defaultTime: 0.17, // 10 minutos por m²
    active: true
  },
  {
    id: '10',
    name: 'Instalação',
    description: 'Instalação no local final',
    costPerHour: 75.00,
    sector: 'Instalação',
    timeUnit: 'hora',
    defaultTime: 1.0, // 1 hora por hora
    active: true
  }
]

export const getProcessesBySector = (sector: string | 'all') => {
  if (sector === 'all') return mockProcesses.filter(p => p.active)
  return mockProcesses.filter(p => p.sector === sector && p.active)
}

export const getProcessById = (id: string) => {
  return mockProcesses.find(p => p.id === id)
}

export const getProcessSectors = () => {
  const sectors = [...new Set(mockProcesses.map(p => p.sector).filter(Boolean))]
  return sectors
}