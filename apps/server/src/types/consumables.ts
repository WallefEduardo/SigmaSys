/**
 * Tipos e enums para insumos/consumíveis
 */

export enum ConsumableUnit {
  // Unidades por área (tintas)
  ML_M2 = "ML_M2",      // ml/m² - mililitros por metro quadrado (PRINCIPAL para tintas)
  L_M2 = "L_M2",        // L/m² - litros por metro quadrado
  G_M2 = "G_M2",        // g/m² - gramas por metro quadrado (tintas sólidas)
  
  // Unidades volumétricas 
  ML = "ML",            // ml - mililitros
  L = "L",              // L - litros
  
  // Unidades de peso
  G = "G",              // g - gramas
  KG = "KG",            // kg - quilogramas
  
  // Unidades de quantidade
  PCS = "PCS",          // pcs - peças/unidades
  
  // Unidades por passada (específicas)
  ML_PASS = "ML_PASS",  // ml/passada - para configurações específicas
  
  // Unidades para cabeças de impressão
  SHOTS = "SHOTS",      // disparos - vida útil em disparos totais
  SHOTS_M2 = "SHOTS_M2", // disparos/m² - desgaste por área
}

export type ConsumableType = "ink" | "printHead" | "tool" | "material" | "other";

export interface CreateConsumableInput {
  name: string;
  description?: string;
  code?: string;
  type: ConsumableType;
  cost: number;
  unit: ConsumableUnit;
  supplier?: string;
  color?: string;
  volumeMl?: number;
  lifespan?: number;
  currentUse?: number;
  material?: string;
  diameter?: number;
  // Campos específicos para cabeças de impressão
  model?: string;
  installationDate?: Date;
  optimalSpeedRange?: string;
  shotsPerM2?: number;
  minStock?: number;
  maxStock?: number;
  currentStock?: number;
  alertThreshold?: number;
  autoReorder?: boolean;
  active?: boolean;
  tags?: string[];
  notes?: string;
}

export interface UpdateConsumableInput extends Partial<CreateConsumableInput> {
  id: string;
}

/**
 * Converte unidades para valor base (ml/m² para tintas)
 */
export function convertToBaseUnit(value: number, fromUnit: ConsumableUnit): number {
  switch (fromUnit) {
    case ConsumableUnit.ML_M2:
      return value; // Unidade base para tintas
    case ConsumableUnit.L_M2:
      return value * 1000; // 1 L = 1000 ml
    case ConsumableUnit.G_M2:
      return value; // Mantém g/m² (conversão específica por densidade)
    case ConsumableUnit.ML:
      return value; // Para conversões específicas
    case ConsumableUnit.L:
      return value * 1000;
    case ConsumableUnit.G:
      return value;
    case ConsumableUnit.KG:
      return value * 1000;
    case ConsumableUnit.PCS:
      return value;
    case ConsumableUnit.ML_PASS:
      return value;
    default:
      return value;
  }
}

/**
 * Calcula o custo de tinta para uma área específica
 */
export function calculateInkCost(
  areaM2: number,
  passMultiplier: number,
  costPerUnit: number,
  unit: ConsumableUnit
): number {
  const areaBasedUnits = [ConsumableUnit.ML_M2, ConsumableUnit.L_M2, ConsumableUnit.G_M2, ConsumableUnit.ML_PASS];
  
  if (!areaBasedUnits.includes(unit)) {
    throw new Error(`Unidade ${unit} não é baseada em área`);
  }

  // Converte para ml/m² como base
  const baseConsumption = convertToBaseUnit(1, unit);
  
  // Cálculo: Área × Multiplicador_Passada × Custo_por_Unidade
  return areaM2 * passMultiplier * costPerUnit * (baseConsumption / 1000);
}