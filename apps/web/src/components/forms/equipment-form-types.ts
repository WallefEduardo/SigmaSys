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
  // Removido costUnit - impressoras sempre usam m², usinagem sempre usa hora
  
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
  
  // Sistema de passadas integrado com insumos cadastrados
  passes: z.record(
    z.object({
      name: z.string().min(1, "Nome da passada é obrigatório"),
      description: z.string().optional(),
      speedM2PerHour: z.number().min(0, "Velocidade deve ser positiva"), // m²/h para conversão
      
      // Tintas: insumos cadastrados com consumo específico por m²
      inkConsumables: z.array(z.object({
        consumableId: z.string().min(1, "ID do insumo é obrigatório"),
        consumptionMlPerM2: z.number().min(0, "Consumo deve ser positivo"), // ml por m²
      })).default([]),
      
      // Cabeças: insumos cadastrados (desgaste vem da configuração do próprio insumo)
      printHeadConsumables: z.array(z.object({
        consumableId: z.string().min(1, "ID do insumo é obrigatório"),
      })).default([]),
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

// NOVA INTERFACE: Configurações de passadas integradas com insumos
export interface PassConfiguration {
  name: string; // Nome personalizado da passada
  description?: string; // Descrição opcional
  speedM2PerHour: number; // Velocidade em m²/h para conversões
  
  // Tintas: insumos cadastrados com consumo específico
  inkConsumables: Array<{
    consumableId: string; // ID do insumo cadastrado tipo "ink"
    consumptionMlPerM2: number; // Quantos ml por m² desta tinta
  }>;
  
  // Cabeças: insumos cadastrados (desgaste vem da configuração do insumo)
  printHeadConsumables: Array<{
    consumableId: string; // ID do insumo cadastrado tipo "printHead"
  }>;
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
  
  // Para cabeças de impressão - NOVA LÓGICA SIMPLIFICADA
  lifespanM2?: number; // vida útil total em m²
  costPerM2?: number; // custo por m² calculado automaticamente
  model?: string; // modelo da cabeça (DX5, DX7, I3200, etc)
  
  // Para ferramentas de usinagem
  lifespan?: number; // mantido apenas para ferramentas
  currentUse?: number; // mantido apenas para ferramentas
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

// Configurações padrão para equipamentos (sem insumos específicos - apenas templates)
export const getDefaultPassConfigurations = (): Record<string, PassConfiguration> => ({
  draft: {
    name: 'Rascunho',
    description: 'Qualidade rascunho - alta velocidade, menor qualidade',
    speedM2PerHour: 100, // m²/h
    inkConsumables: [], // Serão preenchidos após selecionar insumos cadastrados
    printHeadConsumables: [],
  },
  normal: {
    name: 'Normal',
    description: 'Qualidade normal - equilíbrio entre velocidade e qualidade',
    speedM2PerHour: 60, // m²/h
    inkConsumables: [], // Usuário deve adicionar insumos específicos
    printHeadConsumables: [],
  },
  high: {
    name: 'Alta Qualidade',
    description: 'Alta qualidade - menor velocidade, maior precisão',
    speedM2PerHour: 30, // m²/h
    inkConsumables: [], // Consumo maior será definido pelo usuário
    printHeadConsumables: [],
  },
  photo: {
    name: 'Fotográfica',
    description: 'Qualidade fotográfica - máxima qualidade, menor velocidade',
    speedM2PerHour: 15, // m²/h
    inkConsumables: [], // Máximo consumo será definido pelo usuário
    printHeadConsumables: [],
  }
});

// Função para obter unidade baseada no tipo de equipamento (automática)
export const getCostUnit = (equipmentType: string): "PER_HOUR" | "PER_M2" => {
  return equipmentType === "printing" ? "PER_M2" : "PER_HOUR";
};

export const getCostUnitLabel = (equipmentType: string): string => {
  return equipmentType === "printing" ? "Por m²" : "Por Hora";
};

export const getCostUnitDescription = (equipmentType: string): string => {
  return equipmentType === "printing"
    ? "Custo calculado por metro quadrado processado - ideal para impressão"
    : "Custo calculado por hora de operação - ideal para usinagem";
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
        cost: 800,
        unit: 'pcs',
        lifespanM2: 150000, // 150.000 m² de vida útil
        costPerM2: 800 / 150000, // R$ 0,00533 por m² calculado automaticamente
        model: 'DX5',
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