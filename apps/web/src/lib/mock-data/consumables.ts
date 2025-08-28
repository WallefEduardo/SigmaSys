// Mock data for consumables - temporary for development
export const mockPrintHeads = [
  {
    id: 'head_dx5_1',
    name: 'Cabeça DX5',
    description: 'Cabeça de impressão Epson DX5',
    code: 'HD-DX5-001',
    type: 'printHead' as const,
    cost: 800,
    unit: 'PCS' as const,
    model: 'DX5',
    lifespanM2: 150000, // 150.000 m² de vida útil
    costPerM2: 800 / 150000, // R$ 0.005333 por m²
    active: true,
    tags: ['dx5', 'epson', 'printhead'],
  },
  {
    id: 'head_dx7_1',
    name: 'Cabeça DX7',
    description: 'Cabeça de impressão Epson DX7',
    code: 'HD-DX7-001',
    type: 'printHead' as const,
    cost: 1200,
    unit: 'PCS' as const,
    model: 'DX7',
    lifespanM2: 300000, // 300.000 m² de vida útil
    costPerM2: 1200 / 300000, // R$ 0.004000 por m²
    active: true,
    tags: ['dx7', 'epson', 'printhead'],
  },
  {
    id: 'head_i3200_1',
    name: 'Cabeça I3200',
    description: 'Cabeça de impressão Epson I3200',
    code: 'HD-I3200-001',
    type: 'printHead' as const,
    cost: 2500,
    unit: 'PCS' as const,
    model: 'I3200',
    lifespanM2: 500000, // 500.000 m² de vida útil
    costPerM2: 2500 / 500000, // R$ 0.005000 por m²
    active: true,
    tags: ['i3200', 'epson', 'printhead', 'premium'],
  },
];

export const mockInks = [
  {
    id: 'ink_cyan_1',
    name: 'Tinta Ciano',
    description: 'Tinta eco-solvente ciano',
    code: 'INK-C-001',
    type: 'ink' as const,
    cost: 45, // R$ 45 por litro
    unit: 'L' as const,
    color: 'cyan',
    volumeMl: 1000,
    active: true,
    tags: ['ink', 'cyan', 'eco-solvent'],
  },
  {
    id: 'ink_magenta_1',
    name: 'Tinta Magenta',
    description: 'Tinta eco-solvente magenta',
    code: 'INK-M-001',
    type: 'ink' as const,
    cost: 45,
    unit: 'L' as const,
    color: 'magenta',
    volumeMl: 1000,
    active: true,
    tags: ['ink', 'magenta', 'eco-solvent'],
  },
  {
    id: 'ink_yellow_1',
    name: 'Tinta Amarelo',
    description: 'Tinta eco-solvente amarelo',
    code: 'INK-Y-001',
    type: 'ink' as const,
    cost: 45,
    unit: 'L' as const,
    color: 'yellow',
    volumeMl: 1000,
    active: true,
    tags: ['ink', 'yellow', 'eco-solvent'],
  },
  {
    id: 'ink_black_1',
    name: 'Tinta Preto',
    description: 'Tinta eco-solvente preto',
    code: 'INK-K-001',
    type: 'ink' as const,
    cost: 40,
    unit: 'L' as const,
    color: 'black',
    volumeMl: 1000,
    active: true,
    tags: ['ink', 'black', 'eco-solvent'],
  },
];