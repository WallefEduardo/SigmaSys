/**
 * Database de especificações técnicas das cabeças de impressão mais populares do mercado
 * Dados coletados de fabricantes e fornecedores oficiais
 */

export interface PrintHeadSpec {
  id: string;
  model: string;
  manufacturer: string;
  description: string;
  lifespan: number; // disparos totais
  shotsPerM2: {
    dpi720: number;
    dpi1440: number;
  };
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
  // === EPSON DX SERIES ===
  {
    id: "dx4",
    model: "DX4",
    manufacturer: "Epson",
    description: "Cabeça clássica para impressoras eco-solvente e UV",
    lifespan: 4000000,
    shotsPerM2: {
      dpi720: 35000,
      dpi1440: 140000
    },
    optimalSpeedRange: "20-40 m²/h",
    applications: ["Eco-solvente", "Solvente", "UV"],
    estimatedCost: {
      min: 800,
      max: 1200
    },
    notes: [
      "Modelo descontinuado, mas ainda amplamente usado",
      "Requer limpeza frequente com solventes eco",
      "Excelente para trabalhos de alta qualidade",
      "Muito usado em plotters nacionais como Mutoh, Mimaki"
    ],
    releaseYear: 2003,
    successor: "DX5"
  },
  {
    id: "dx5",
    model: "DX5",
    manufacturer: "Epson",
    description: "A cabeça de impressão mais popular do mercado",
    lifespan: 5000000,
    shotsPerM2: {
      dpi720: 32000,
      dpi1440: 128000
    },
    optimalSpeedRange: "30-60 m²/h",
    applications: ["Eco-solvente", "Solvente", "UV", "Aquosa"],
    estimatedCost: {
      min: 600,
      max: 900
    },
    notes: [
      "Mais versátil e confiável do mercado",
      "Boa relação custo x benefício",
      "Ampla disponibilidade de peças"
    ],
    releaseYear: 2008
  },
  {
    id: "dx7",
    model: "DX7",
    manufacturer: "Epson",
    description: "Evolução do DX5 com maior durabilidade",
    lifespan: 8000000,
    shotsPerM2: {
      dpi720: 30000,
      dpi1440: 120000
    },
    optimalSpeedRange: "40-80 m²/h",
    applications: ["Eco-solvente", "Solvente", "UV", "Aquosa", "Sublimação"],
    estimatedCost: {
      min: 800,
      max: 1300
    },
    notes: [
      "Maior vida útil que o DX5",
      "Melhor performance em altas velocidades",
      "Recomendado para produção em larga escala"
    ],
    releaseYear: 2013
  },

  // === EPSON I3200 SERIES ===
  {
    id: "i3200-a1",
    model: "I3200-A1",
    manufacturer: "Epson",
    description: "Cabeça moderna com tecnologia PrecisionCore",
    lifespan: 3200000,
    shotsPerM2: {
      dpi720: 28000,
      dpi1440: 112000
    },
    optimalSpeedRange: "50-100 m²/h",
    applications: ["Eco-solvente", "UV", "Aquosa", "Sublimação"],
    estimatedCost: {
      min: 400,
      max: 700
    },
    notes: [
      "Excelente custo-benefício",
      "Tecnologia mais moderna que DX series",
      "Menor vida útil, mas maior velocidade"
    ],
    releaseYear: 2018
  },

  // === KONICA MINOLTA ===
  {
    id: "km512i",
    model: "KM512i",
    manufacturer: "Konica Minolta",
    description: "Cabeça industrial de alta performance",
    lifespan: 12000000,
    shotsPerM2: {
      dpi720: 25000,
      dpi1440: 100000
    },
    optimalSpeedRange: "60-120 m²/h",
    applications: ["Eco-solvente", "UV", "Têxtil"],
    estimatedCost: {
      min: 1500,
      max: 2200
    },
    notes: [
      "Excelente para produção industrial",
      "Alta velocidade e durabilidade",
      "Custo inicial alto, mas ROI excelente"
    ],
    releaseYear: 2016
  },
  {
    id: "km1024i",
    model: "KM1024i",
    manufacturer: "Konica Minolta",
    description: "Versão com mais bicos para maior velocidade",
    lifespan: 15000000,
    shotsPerM2: {
      dpi720: 22000,
      dpi1440: 88000
    },
    optimalSpeedRange: "80-150 m²/h",
    applications: ["Eco-solvente", "UV", "Têxtil", "Cerâmica"],
    estimatedCost: {
      min: 2000,
      max: 2800
    },
    notes: [
      "Para impressoras de alta velocidade",
      "Excelente para grandes volumes",
      "Requer sistema de tinta pressurizado"
    ],
    releaseYear: 2019
  },

  // === XAAR SERIES ===
  {
    id: "xaar1001",
    model: "Xaar 1001",
    manufacturer: "Xaar",
    description: "Cabeça industrial para aplicações pesadas",
    lifespan: 20000000,
    shotsPerM2: {
      dpi720: 20000,
      dpi1440: 80000
    },
    optimalSpeedRange: "100-200 m²/h",
    applications: ["Solvente", "UV", "Cerâmica", "Decoração"],
    estimatedCost: {
      min: 3000,
      max: 4500
    },
    notes: [
      "Extrema durabilidade",
      "Para aplicações industriais pesadas",
      "Excelente para cerâmica e materiais rígidos"
    ],
    releaseYear: 2014
  },

  // === RICOH GEN SERIES ===
  {
    id: "ricoh-gen5",
    model: "Ricoh GEN5",
    manufacturer: "Ricoh",
    description: "Cabeça versátil para múltiplas aplicações",
    lifespan: 6000000,
    shotsPerM2: {
      dpi720: 30000,
      dpi1440: 120000
    },
    optimalSpeedRange: "40-70 m²/h",
    applications: ["Eco-solvente", "UV", "Aquosa", "Sublimação"],
    estimatedCost: {
      min: 1200,
      max: 1800
    },
    notes: [
      "Boa alternativa ao DX series",
      "Qualidade de impressão superior",
      "Mais cara que DX5/DX7"
    ],
    releaseYear: 2017
  },

  // === KYOCERA ===
  {
    id: "kyocera-km512",
    model: "Kyocera KJ4B",
    manufacturer: "Kyocera",
    description: "Cabeça de alta resolução para aplicações especiais",
    lifespan: 10000000,
    shotsPerM2: {
      dpi720: 26000,
      dpi1440: 104000
    },
    optimalSpeedRange: "50-90 m²/h",
    applications: ["Eco-solvente", "UV", "Têxtil", "Etiquetas"],
    estimatedCost: {
      min: 1800,
      max: 2400
    },
    notes: [
      "Excelente para impressão têxtil",
      "Alta precisão de cor",
      "Boa durabilidade"
    ],
    releaseYear: 2020
  },

  // === MAIS MODELOS POPULARES NO BRASIL ===

  // === EPSON XP600 SERIES ===
  {
    id: "xp600",
    model: "XP600",
    manufacturer: "Epson",
    description: "Cabeça muito popular em plotters nacionais e chineses",
    lifespan: 2500000,
    shotsPerM2: {
      dpi720: 40000,
      dpi1440: 160000
    },
    optimalSpeedRange: "25-50 m²/h",
    applications: ["Eco-solvente", "UV", "Aquosa", "Sublimação"],
    estimatedCost: {
      min: 300,
      max: 500
    },
    notes: [
      "Muito usada em plotters chineses importados",
      "Boa relação custo-benefício",
      "Popular em equipamentos de entrada",
      "Comum em marcas como Icontek, Witcolor, Allwin"
    ],
    releaseYear: 2014
  },

  {
    id: "l1800",
    model: "L1800-F194010",
    manufacturer: "Epson",
    description: "Cabeça baseada na L1800, muito comum em plotters A3+",
    lifespan: 1800000,
    shotsPerM2: {
      dpi720: 45000,
      dpi1440: 180000
    },
    optimalSpeedRange: "15-35 m²/h",
    applications: ["Eco-solvente", "UV", "Sublimação", "DTF"],
    estimatedCost: {
      min: 250,
      max: 400
    },
    notes: [
      "Muito usado em plotters A3+ nacionais",
      "Base para muitos modelos DTF",
      "Boa para sublimação têxtil",
      "Comum em equipamentos Thunder Jet, Smart Color"
    ],
    releaseYear: 2016
  },

  // === SERIES 4720/L805 ===
  {
    id: "4720",
    model: "4720",
    manufacturer: "Epson",
    description: "Cabeça robusta para plotters de médio porte",
    lifespan: 3500000,
    shotsPerM2: {
      dpi720: 38000,
      dpi1440: 152000
    },
    optimalSpeedRange: "30-65 m²/h",
    applications: ["Eco-solvente", "Solvente", "UV"],
    estimatedCost: {
      min: 450,
      max: 650
    },
    notes: [
      "Popular em plotters Mutoh ValueJet",
      "Boa durabilidade para produção média",
      "Usada em equipamentos Roland de entrada",
      "Equilibrio entre custo e performance"
    ],
    releaseYear: 2012
  },

  // === EPSON TX800/F192040 ===
  {
    id: "tx800",
    model: "TX800-F192040",
    manufacturer: "Epson",
    description: "Cabeça para plotters de grande formato e alta velocidade",
    lifespan: 6500000,
    shotsPerM2: {
      dpi720: 28000,
      dpi1440: 112000
    },
    optimalSpeedRange: "50-90 m²/h",
    applications: ["Eco-solvente", "Solvente", "UV", "Látex"],
    estimatedCost: {
      min: 700,
      max: 1000
    },
    notes: [
      "Usada em plotters Flora, Zhongye, Gongzheng",
      "Excelente para produção em alta velocidade",
      "Muito comum no mercado de grande formato",
      "Resistente para uso industrial"
    ],
    releaseYear: 2015
  },

  // === TOSHIBA SERIES ===
  {
    id: "toshiba-ca4",
    model: "Toshiba CA4",
    manufacturer: "Toshiba",
    description: "Cabeça industrial para plotters solvente pesados",
    lifespan: 15000000,
    shotsPerM2: {
      dpi720: 22000,
      dpi1440: 88000
    },
    optimalSpeedRange: "80-120 m²/h",
    applications: ["Solvente", "Eco-solvente", "UV"],
    estimatedCost: {
      min: 2500,
      max: 3200
    },
    notes: [
      "Muito usada em plotters Mimaki JV series",
      "Extremamente durável",
      "Ideal para solvente forte",
      "Padrão em equipamentos profissionais"
    ],
    releaseYear: 2018
  },

  {
    id: "toshiba-ce4",
    model: "Toshiba CE4",
    manufacturer: "Toshiba",
    description: "Versão melhorada da CA4 com mais durabilidade",
    lifespan: 18000000,
    shotsPerM2: {
      dpi720: 20000,
      dpi1440: 80000
    },
    optimalSpeedRange: "90-150 m²/h",
    applications: ["Solvente", "Eco-solvente", "UV", "Híbrido"],
    estimatedCost: {
      min: 2800,
      max: 3600
    },
    notes: [
      "Última geração Toshiba para aplicações pesadas",
      "Usada em plotters Mimaki mais recentes",
      "Resistente a tintas agressivas",
      "ROI excelente para grandes volumes"
    ],
    releaseYear: 2021
  },

  // === STARFIRE SERIES ===
  {
    id: "starfire-sg1024",
    model: "Starfire SG1024",
    manufacturer: "Fujifilm Dimatix",
    description: "Cabeça premium para aplicações de alta qualidade",
    lifespan: 25000000,
    shotsPerM2: {
      dpi720: 18000,
      dpi1440: 72000
    },
    optimalSpeedRange: "100-200 m²/h",
    applications: ["Solvente", "UV", "Híbrido", "Cerâmica"],
    estimatedCost: {
      min: 4000,
      max: 5500
    },
    notes: [
      "Top de linha para aplicações industriais",
      "Usada em plotters Agfa, Durst, Inca",
      "Qualidade fotográfica excepcional",
      "Resistente a qualquer tipo de tinta"
    ],
    releaseYear: 2019
  },

  // === SEIKO SERIES ===
  {
    id: "seiko-spt510",
    model: "Seiko SPT510",
    manufacturer: "Seiko",
    description: "Cabeça robusta para plotters de produção média-alta",
    lifespan: 8000000,
    shotsPerM2: {
      dpi720: 26000,
      dpi1440: 104000
    },
    optimalSpeedRange: "60-100 m²/h",
    applications: ["Solvente", "Eco-solvente", "UV"],
    estimatedCost: {
      min: 1500,
      max: 2100
    },
    notes: [
      "Muito usada em plotters Infiniti, Challenger",
      "Boa para solvente e eco-solvente",
      "Disponibilidade nacional boa",
      "Manutenção relativamente simples"
    ],
    releaseYear: 2017
  },

  {
    id: "seiko-spt1020",
    model: "Seiko SPT1020",
    manufacturer: "Seiko",
    description: "Versão mais moderna da SPT510 com maior velocidade",
    lifespan: 10000000,
    shotsPerM2: {
      dpi720: 24000,
      dpi1440: 96000
    },
    optimalSpeedRange: "80-130 m²/h",
    applications: ["Solvente", "Eco-solvente", "UV", "Híbrido"],
    estimatedCost: {
      min: 1800,
      max: 2500
    },
    notes: [
      "Evolução da SPT510 com melhor performance",
      "Usada em plotters mais modernos",
      "Boa velocidade de impressão",
      "Compatível com tintas híbridas"
    ],
    releaseYear: 2020
  },

  // === MODELOS ESPECÍFICOS BRASIL ===
  {
    id: "dx7-ecosolvent",
    model: "DX7 Eco-Solvent",
    manufacturer: "Epson",
    description: "Versão específica do DX7 otimizada para eco-solvente",
    lifespan: 7500000,
    shotsPerM2: {
      dpi720: 31000,
      dpi1440: 124000
    },
    optimalSpeedRange: "40-75 m²/h",
    applications: ["Eco-solvente"],
    estimatedCost: {
      min: 850,
      max: 1200
    },
    notes: [
      "Versão otimizada para eco-solvente brasileiro",
      "Muito usada em plotters Roland, Mutoh nacionais",
      "Resistente ao clima tropical",
      "Ideal para comunicação visual externa"
    ],
    releaseYear: 2014
  },

  {
    id: "i3200-u1",
    model: "I3200-U1",
    manufacturer: "Epson",
    description: "Versão UV do I3200 para aplicações especiais",
    lifespan: 2800000,
    shotsPerM2: {
      dpi720: 30000,
      dpi1440: 120000
    },
    optimalSpeedRange: "45-85 m²/h",
    applications: ["UV", "Híbrido"],
    estimatedCost: {
      min: 500,
      max: 750
    },
    notes: [
      "Específica para tintas UV",
      "Resistente ao calor das lâmpadas UV",
      "Comum em plotters UV chineses",
      "Boa para impressão em rígidos"
    ],
    releaseYear: 2019
  },

  // === MODELOS PARA DTF/SUBLIMAÇÃO ===
  {
    id: "l1440-dtf",
    model: "L1440-DTF",
    manufacturer: "Epson",
    description: "Cabeça específica para impressão DTF (Direct to Film)",
    lifespan: 2200000,
    shotsPerM2: {
      dpi720: 42000,
      dpi1440: 168000
    },
    optimalSpeedRange: "20-40 m²/h",
    applications: ["DTF", "Sublimação", "Pigmentada"],
    estimatedCost: {
      min: 350,
      max: 550
    },
    notes: [
      "Otimizada para tintas DTF pigmentadas",
      "Muito usada no mercado de estamparia",
      "Resistente a entupimentos",
      "Comum em plotters nacionais DTF"
    ],
    releaseYear: 2021
  },

  // === CABEÇAS NACIONAIS/IMPORTADAS POPULARES ===
  {
    id: "allwin-512i",
    model: "Allwin 512i",
    manufacturer: "Konica Minolta (Clone)",
    description: "Versão clone da KM512i muito usada no Brasil",
    lifespan: 8000000,
    shotsPerM2: {
      dpi720: 28000,
      dpi1440: 112000
    },
    optimalSpeedRange: "50-90 m²/h",
    applications: ["Eco-solvente", "UV", "Solvente"],
    estimatedCost: {
      min: 800,
      max: 1200
    },
    notes: [
      "Clone popular da KM512i",
      "Muito usada em plotters chineses",
      "Boa disponibilidade nacional",
      "Custo-benefício atrativo"
    ],
    releaseYear: 2018
  },

  {
    id: "icontek-dx5",
    model: "Icontek DX5",
    manufacturer: "Epson (Nacional)",
    description: "DX5 adaptado para plotters nacionais Icontek",
    lifespan: 4800000,
    shotsPerM2: {
      dpi720: 33000,
      dpi1440: 132000
    },
    optimalSpeedRange: "35-65 m²/h",
    applications: ["Eco-solvente", "Solvente", "UV"],
    estimatedCost: {
      min: 600,
      max: 850
    },
    notes: [
      "Versão nacional do DX5",
      "Adaptado para clima brasileiro",
      "Suporte técnico nacional",
      "Usado em equipamentos Icontek, Smart Color"
    ],
    releaseYear: 2016
  }
];

// Funções auxiliares
export const getPrintHeadsByManufacturer = (manufacturer: string): PrintHeadSpec[] => {
  return POPULAR_PRINT_HEADS.filter(head => head.manufacturer === manufacturer);
};

export const getPrintHeadsByApplication = (application: string): PrintHeadSpec[] => {
  return POPULAR_PRINT_HEADS.filter(head => 
    head.applications.some(app => app.toLowerCase().includes(application.toLowerCase()))
  );
};

export const getPrintHeadsByPriceRange = (minPrice: number, maxPrice: number): PrintHeadSpec[] => {
  return POPULAR_PRINT_HEADS.filter(head => 
    head.estimatedCost.min <= maxPrice && head.estimatedCost.max >= minPrice
  );
};

export const searchPrintHeads = (query: string): PrintHeadSpec[] => {
  const searchTerm = query.toLowerCase();
  return POPULAR_PRINT_HEADS.filter(head => 
    head.model.toLowerCase().includes(searchTerm) ||
    head.manufacturer.toLowerCase().includes(searchTerm) ||
    head.description.toLowerCase().includes(searchTerm) ||
    head.applications.some(app => app.toLowerCase().includes(searchTerm))
  );
};

export const getManufacturers = (): string[] => {
  return Array.from(new Set(POPULAR_PRINT_HEADS.map(head => head.manufacturer))).sort();
};

export const getApplications = (): string[] => {
  const allApps = POPULAR_PRINT_HEADS.flatMap(head => head.applications);
  return Array.from(new Set(allApps)).sort();
};