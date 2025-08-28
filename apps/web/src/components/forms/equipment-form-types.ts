import { z } from "zod";

export const equipmentFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200, "Nome muito longo"),
  description: z.string().optional(),
  code: z.string().max(50, "Código muito longo").optional(),
  type: z.enum(["printing", "machining"], {
    required_error: "Tipo é obrigatório",
  }),
  // === NOVA LÓGICA DE CUSTOS ===
  energyCostPerHour: z.number().min(0, "Custo de energia deve ser positivo").max(999999, "Custo muito alto (máx: R$ 999.999)").optional(),
  maintenanceCostPerHour: z.number().min(0, "Custo de manutenção deve ser positivo").max(999999, "Custo muito alto (máx: R$ 999.999)").optional(),
  costUnit: z.enum(["PER_HOUR", "PER_M2"], {
    required_error: "Unidade de cobrança é obrigatória",
  }),
  
  // Campos de depreciação
  acquisitionValue: z.number().min(0, "Valor de aquisição deve ser positivo").max(9999999, "Valor muito alto (máx: R$ 9.999.999)").optional(),
  residualValue: z.number().min(0, "Valor residual deve ser positivo").max(9999999, "Valor muito alto (máx: R$ 9.999.999)").optional(),
  depreciationMethod: z.enum(["linear", "accelerated"]).optional(),
  usefulLifeHours: z.number().min(1, "Vida útil deve ser pelo menos 1 hora").optional(),
  usefulLifeYears: z.number().min(1, "Vida útil deve ser pelo menos 1 ano").optional(),
  
  // Capacidades físicas
  maxWidth: z.number().min(0, "Largura deve ser positiva"),
  maxHeight: z.number().min(0, "Altura deve ser positiva").optional(),
  maxThickness: z.number().min(0, "Espessura deve ser positiva").optional(),
  
  // Sistema de passadas (impressoras)
  passes: z.record(
    z.object({
      name: z.string().min(1, "Nome da passada é obrigatório"),
      quality: z.string(),
      speed: z.number().min(0, "Velocidade deve ser positiva"),
      inkConsumption: z.number().min(0, "Consumo de tinta deve ser positivo"),
      powerConsumption: z.number().min(0, "Consumo de energia deve ser positivo"),
      printHeadWear: z.number().min(0, "Desgaste da cabeça deve ser positivo"),
      description: z.string().optional(),
      inkConfiguration: z.record(
        z.object({
          consumptionRate: z.number().min(0, "Taxa de consumo deve ser positiva"),
          required: z.boolean().default(true)
        })
      ).optional(),
    })
  ).optional(),

  // Sistema de cabeças de impressão
  printHeads: z.record(
    z.object({
      id: z.string(),
      consumableId: z.string(),
      position: z.string(),
      installationDate: z.string(),
      notes: z.string().optional(),
    })
  ).optional(),
  
  // Configurações específicas
  printingConfig: z.record(z.any()).optional(),
  machiningConfig: z.record(z.any()).optional(),
  
  // Consumíveis
  consumables: z.record(z.any()).optional(),
  
  // Dados gerais
  location: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  
  // Manutenção
  maintenanceInterval: z.number().min(1, "Intervalo deve ser pelo menos 1 dia").max(3650, "Intervalo máximo de 10 anos").optional(),
  maintenanceNotes: z.string().optional(),
  manualUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  
  // Documentação
  images: z.array(z.string().url()).default([]),
  documents: z.array(z.string().url()).default([]),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

// Tipos para configurações de passadas
export interface PassConfiguration {
  name: string; // Nome personalizado da passada
  quality: 'draft' | 'normal' | 'high' | 'photo' | 'custom'; // Incluindo custom
  speed: number; // m²/hora
  inkConsumption: number; // multiplicador base
  powerConsumption: number; // multiplicador
  printHeadWear: number; // multiplicador de desgaste
  description?: string;
  // Tintas específicas consumidas por esta passada
  inkConfiguration?: {
    [inkId: string]: {
      consumptionRate: number; // ml/m² ou multiplicador específico para esta tinta
      required: boolean; // se é obrigatória para esta passada
    };
  };
}

// Tipos para consumíveis
export interface Consumable {
  id: string;
  name: string;
  type: 'ink' | 'printHead' | 'tool' | 'material' | 'other';
  cost: number;
  unit: string;
  
  // Para tintas
  color?: string;
  volumeMl?: number;
  
  // Para cabeças e ferramentas
  lifespan?: number;
  currentUse?: number;
  
  // Para ferramentas
  material?: string;
  diameter?: number;
  
  // Estoque
  minStock: number;
  maxStock: number;
  currentStock: number;
  alertThreshold: number;
  autoReorder: boolean;
}

// Tipos para validação de formulário
export const validateDepreciation = (data: Partial<EquipmentFormData>) => {
  const errors: string[] = [];
  
  if (data.acquisitionValue && data.residualValue) {
    if (data.residualValue >= data.acquisitionValue) {
      errors.push("Valor residual deve ser menor que o valor de aquisição");
    }
  }
  
  if (data.usefulLifeHours && data.usefulLifeYears) {
    // Validar se os valores são consistentes (aproximadamente 2000 horas por ano)
    const expectedHours = data.usefulLifeYears * 2000;
    const diff = Math.abs(data.usefulLifeHours - expectedHours) / expectedHours;
    if (diff > 0.5) {
      errors.push("Vida útil em horas e anos deve ser consistente (aprox. 2000h/ano)");
    }
  }
  
  return errors;
};

// Configurações padrão para diferentes tipos de equipamento
export const getDefaultPassConfigurations = (): Record<string, PassConfiguration> => ({
  draft: {
    name: 'Rascunho',
    quality: 'draft',
    speed: 100,
    inkConsumption: 0.6,
    powerConsumption: 0.8,
    printHeadWear: 0.5,
    description: 'Qualidade rascunho - alta velocidade, menor qualidade'
  },
  normal: {
    name: 'Normal',
    quality: 'normal', 
    speed: 60,
    inkConsumption: 1.0,
    powerConsumption: 1.0,
    printHeadWear: 1.0,
    description: 'Qualidade normal - equilíbrio entre velocidade e qualidade'
  },
  high: {
    name: 'Alta Qualidade',
    quality: 'high',
    speed: 30,
    inkConsumption: 1.4,
    powerConsumption: 1.2,
    printHeadWear: 1.8,
    description: 'Alta qualidade - menor velocidade, maior precisão'
  },
  photo: {
    name: 'Fotográfica',
    quality: 'photo',
    speed: 15,
    inkConsumption: 2.0,
    powerConsumption: 1.5,
    printHeadWear: 2.5,
    description: 'Qualidade fotográfica - máxima qualidade, menor velocidade'
  }
});

// Função para sugerir unidade baseada no tipo de equipamento
export const getDefaultCostUnit = (equipmentType: string): "PER_HOUR" | "PER_M2" => {
  switch (equipmentType) {
    case "printing":
      return "PER_M2"; // Impressão sempre em m²
    case "machining":
      return "PER_HOUR"; // Usinagem padrão em hora
    default:
      return "PER_HOUR";
  }
};

export const getCostUnitLabel = (unit: "PER_HOUR" | "PER_M2"): string => {
  return unit === "PER_HOUR" ? "Por Hora" : "Por m²";
};

export const getCostUnitDescription = (unit: "PER_HOUR" | "PER_M2"): string => {
  return unit === "PER_HOUR" 
    ? "Custo calculado por hora de operação - ideal para usinagem" 
    : "Custo calculado por metro quadrado processado - ideal para impressão";
};

export const getDefaultConsumables = (type: string): Consumable[] => {
  if (type === 'printing') {
    return [
      {
        id: 'ink-cyan',
        name: 'Tinta Ciano',
        type: 'ink',
        cost: 0.05,
        unit: 'ml',
        color: 'cyan',
        volumeMl: 1000,
        minStock: 500,
        maxStock: 2000,
        currentStock: 1000,
        alertThreshold: 200,
        autoReorder: true
      },
      {
        id: 'ink-magenta',
        name: 'Tinta Magenta',
        type: 'ink',
        cost: 0.05,
        unit: 'ml',
        color: 'magenta',
        volumeMl: 1000,
        minStock: 500,
        maxStock: 2000,
        currentStock: 1000,
        alertThreshold: 200,
        autoReorder: true
      },
      {
        id: 'printhead-dx5',
        name: 'Cabeça DX5',
        type: 'printHead',
        cost: 500,
        unit: 'pcs',
        lifespan: 10000,
        currentUse: 0,
        minStock: 1,
        maxStock: 3,
        currentStock: 2,
        alertThreshold: 1,
        autoReorder: false
      }
    ];
  }
  
  if (type === 'machining') {
    return [
      {
        id: 'tool-6mm',
        name: 'Fresa 6mm',
        type: 'tool',
        cost: 25,
        unit: 'pcs',
        diameter: 6,
        material: 'aluminum',
        lifespan: 50,
        currentUse: 0,
        minStock: 5,
        maxStock: 20,
        currentStock: 10,
        alertThreshold: 3,
        autoReorder: true
      }
    ];
  }
  
  return [];
};