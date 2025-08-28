/**
 * Database de especificações técnicas das cabeças de impressão mais populares do mercado
 * Dados baseados em pesquisa real dos fabricantes e experiência de mercado
 * Atualizado: Dezembro 2024
 */

export interface PrintHeadSpec {
  id: string;
  model: string;
  manufacturer: string;
  description: string;
  lifespanM2: number; // vida útil total em m²
  optimalSpeedRange: string;
  applications: string[];
  estimatedCost: {
    min: number;
    max: number;
  };
  notes: string[];
  releaseYear?: number;
  successor?: string; // modelo que substituiu
}

export const POPULAR_PRINT_HEADS: PrintHeadSpec[] = [
  // === EPSON DX SERIES (Descontinuadas mas muito usadas) ===
  {
    id: "dx5",
    model: "DX5",
    manufacturer: "Epson",
    description: "Cabeça mais estável e confiável, referência no mercado",
    lifespanM2: 150000, // 150.000 m² de vida útil
    optimalSpeedRange: "13-16 m²/h",
    applications: ["Eco-solvente", "Solvente", "UV", "Aquosa"],
    estimatedCost: {
      min: 600,
      max: 900
    },
    notes: [
      "Mais versátil e confiável do mercado",
      "Boa relação custo x benefício",
      "Custo por m²: R$ 0,004 - R$ 0,006",
      "Ampla disponibilidade de peças",
      "Produção descontinuada desde 2015"
    ],
    releaseYear: 2008
  },
  {
    id: "dx7",
    model: "DX7",
    manufacturer: "Epson",
    description: "Evolução do DX5 com maior durabilidade",
    lifespanM2: 300000, // 300.000 m² de vida útil
    optimalSpeedRange: "13-16 m²/h",
    applications: ["Eco-solvente", "Solvente", "UV", "Aquosa", "Sublimação"],
    estimatedCost: {
      min: 800,
      max: 1300
    },
    notes: [
      "Maior vida útil que o DX5",
      "Melhor performance e durabilidade",
      "Custo por m²: R$ 0,003 - R$ 0,004",
      "Recomendado para produção em larga escala",
      "Produção descontinuada desde 2015"
    ],
    releaseYear: 2013
  },

  // === EPSON I3200 SERIES (Modernas) ===
  {
    id: "i3200-a1",
    model: "I3200-A1",
    manufacturer: "Epson",
    description: "Cabeça moderna com tecnologia TFP (Thin Film Piezo)",
    lifespanM2: 400000, // 400.000 m² de vida útil
    optimalSpeedRange: "26-33 m²/h",
    applications: ["Eco-solvente", "UV", "Aquosa", "Sublimação"],
    estimatedCost: {
      min: 1800,
      max: 2500
    },
    notes: [
      "Tecnologia mais moderna e rápida",
      "Vida útil 20-30% maior que 4720",
      "Custo por m²: R$ 0,005 - R$ 0,006",
      "3200 bicos (8x400) vs 1440 do DX7",
      "Velocidade quase 2x maior que DX series"
    ],
    releaseYear: 2019
  },

  // === EPSON 4720 SERIES ===
  {
    id: "4720",
    model: "4720",
    manufacturer: "Epson",
    description: "Cabeça econômica com tecnologia TFP",
    lifespanM2: 320000, // 320.000 m² de vida útil
    optimalSpeedRange: "10-20 m²/h",
    applications: ["Eco-solvente", "UV", "Aquosa"],
    estimatedCost: {
      min: 1200,
      max: 1800
    },
    notes: [
      "Boa opção custo-benefício",
      "3200 bicos como I3200",
      "Custo por m²: R$ 0,004 - R$ 0,006",
      "Menor velocidade que I3200",
      "Ideal para volumes médios"
    ],
    releaseYear: 2018
  },

  // === RICOH SERIES ===
  {
    id: "ricoh-gen5",
    model: "Gen5",
    manufacturer: "Ricoh",
    description: "Cabeça industrial com alta durabilidade",
    lifespanM2: 500000, // 500.000 m² de vida útil
    optimalSpeedRange: "Até 60 m²/h (12 cabeças)",
    applications: ["UV", "Eco-solvente", "Aquosa"],
    estimatedCost: {
      min: 2000,
      max: 3000
    },
    notes: [
      "Vida útil de 3-5 anos",
      "100 bilhões de ciclos por bico",
      "Custo por m²: R$ 0,004 - R$ 0,006",
      "Excelente para produção industrial",
      "1280 bicos, 7-35 pl variável"
    ],
    releaseYear: 2015
  },
  {
    id: "ricoh-gen6",
    model: "Gen6",
    manufacturer: "Ricoh",
    description: "Evolução do Gen5 com maior velocidade",
    lifespanM2: 600000, // 600.000 m² de vida útil
    optimalSpeedRange: "50% mais rápido que Gen5",
    applications: ["UV", "Eco-solvente", "Aquosa"],
    estimatedCost: {
      min: 2500,
      max: 4000
    },
    notes: [
      "Vida útil 2x maior que Gen5",
      "Velocidade 1/3 maior que Gen5",
      "Custo por m²: R$ 0,004 - R$ 0,007",
      "Melhor compatibilidade com tintas",
      "1280 bicos, gota mínima 5pl"
    ],
    releaseYear: 2019
  },

  // === KONICA MINOLTA SERIES ===
  {
    id: "km1024i",
    model: "KM1024i",
    manufacturer: "Konica Minolta",
    description: "Cabeça de alta velocidade para single-pass",
    lifespanM2: 450000, // 450.000 m² de vida útil
    optimalSpeedRange: "Até 80 m/min",
    applications: ["UV", "Aquosa", "Eco-solvente"],
    estimatedCost: {
      min: 1800,
      max: 2800
    },
    notes: [
      "Tecnologia independent firing",
      "1024 bicos simultâneos",
      "Custo por m²: R$ 0,004 - R$ 0,006",
      "Ideal para single-pass systems",
      "45kHz de frequência"
    ],
    releaseYear: 2016
  },

  // === KYOCERA SERIES ===
  {
    id: "kyocera-kj4b",
    model: "KJ4B",
    manufacturer: "Kyocera",
    description: "Cabeça cerâmica de alta durabilidade",
    lifespanM2: 400000, // 400.000 m² de vida útil
    optimalSpeedRange: "Variável",
    applications: ["Aquosa", "UV"],
    estimatedCost: {
      min: 1500,
      max: 2500
    },
    notes: [
      "Tecnologia cerâmica exclusiva",
      "Alta resistência e durabilidade",
      "Custo por m²: R$ 0,004 - R$ 0,006",
      "Ideal para aplicações industriais",
      "Excelente para texteis"
    ],
    releaseYear: 2017
  },

  // === SEIKO SERIES ===
  {
    id: "seiko-1020",
    model: "1020",
    manufacturer: "Seiko",
    description: "Cabeça compacta para impressoras de pequeno formato",
    lifespanM2: 250000, // 250.000 m² de vida útil
    optimalSpeedRange: "20-40 m²/h",
    applications: ["UV", "Solvente", "Eco-solvente"],
    estimatedCost: {
      min: 1000,
      max: 1800
    },
    notes: [
      "Boa opção para small format",
      "Design compacto",
      "Custo por m²: R$ 0,004 - R$ 0,007",
      "Ideal para impressoras nacionais",
      "Manutenção simples"
    ],
    releaseYear: 2014
  }
];

/**
 * Função para buscar especificações por modelo
 */
export function getPrintHeadSpec(model: string): PrintHeadSpec | undefined {
  return POPULAR_PRINT_HEADS.find(head => 
    head.model.toLowerCase().includes(model.toLowerCase())
  );
}

/**
 * Função para calcular custo por m²
 */
export function calculateCostPerM2(cost: number, lifespanM2: number): number {
  return cost / lifespanM2;
}

/**
 * Função para obter todas as cabeças por fabricante
 */
export function getPrintHeadsByManufacturer(manufacturer: string): PrintHeadSpec[] {
  return POPULAR_PRINT_HEADS.filter(head => 
    head.manufacturer.toLowerCase() === manufacturer.toLowerCase()
  );
}

/**
 * Função para obter todos os fabricantes únicos
 */
export function getManufacturers(): string[] {
  const manufacturers = POPULAR_PRINT_HEADS.map(head => head.manufacturer);
  return [...new Set(manufacturers)].sort();
}

/**
 * Função para obter todas as aplicações únicas
 */
export function getApplications(): string[] {
  const applications = POPULAR_PRINT_HEADS.flatMap(head => head.applications);
  return [...new Set(applications)].sort();
}

/**
 * Função para buscar cabeças por aplicação
 */
export function getPrintHeadsByApplication(application: string): PrintHeadSpec[] {
  return POPULAR_PRINT_HEADS.filter(head => 
    head.applications.some(app => 
      app.toLowerCase().includes(application.toLowerCase())
    )
  );
}

/**
 * Função para buscar cabeças por texto
 */
export function searchPrintHeads(query: string): PrintHeadSpec[] {
  const searchTerm = query.toLowerCase();
  return POPULAR_PRINT_HEADS.filter(head => 
    head.model.toLowerCase().includes(searchTerm) ||
    head.manufacturer.toLowerCase().includes(searchTerm) ||
    head.description.toLowerCase().includes(searchTerm) ||
    head.applications.some(app => app.toLowerCase().includes(searchTerm))
  );
}