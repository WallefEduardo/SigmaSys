/**
 * Utilitários para unidades de medida de insumos
 * Sistema padronizado para cálculos de custeio
 */

export enum ConsumableUnit {
	// Unidades por área (tintas)
	ML_M2 = "ML_M2", // ml/m² - mililitros por metro quadrado (PRINCIPAL para tintas)
	L_M2 = "L_M2", // L/m² - litros por metro quadrado
	G_M2 = "G_M2", // g/m² - gramas por metro quadrado (tintas sólidas)

	// Unidades volumétricas
	ML = "ML", // ml - mililitros
	L = "L", // L - litros

	// Unidades de peso
	G = "G", // g - gramas
	KG = "KG", // kg - quilogramas

	// Unidades de quantidade
	PCS = "PCS", // pcs - peças/unidades

	// Unidades por passada (específicas)
	ML_PASS = "ML_PASS", // ml/passada - para configurações específicas

	// Unidades para cabeças de impressão
	SHOTS = "SHOTS", // disparos - vida útil em disparos totais
	SHOTS_M2 = "SHOTS_M2", // disparos/m² - desgaste por área
}

export interface UnitInfo {
	value: ConsumableUnit;
	label: string;
	description: string;
	category: "area" | "volume" | "weight" | "quantity" | "specific";
	isAreaBased: boolean;
}

export const UNIT_INFO: Record<ConsumableUnit, UnitInfo> = {
	[ConsumableUnit.ML_M2]: {
		value: ConsumableUnit.ML_M2,
		label: "ml/m²",
		description: "Mililitros por metro quadrado",
		category: "area",
		isAreaBased: true,
	},
	[ConsumableUnit.L_M2]: {
		value: ConsumableUnit.L_M2,
		label: "L/m²",
		description: "Litros por metro quadrado",
		category: "area",
		isAreaBased: true,
	},
	[ConsumableUnit.G_M2]: {
		value: ConsumableUnit.G_M2,
		label: "g/m²",
		description: "Gramas por metro quadrado",
		category: "area",
		isAreaBased: true,
	},
	[ConsumableUnit.ML]: {
		value: ConsumableUnit.ML,
		label: "ml",
		description: "Mililitros",
		category: "volume",
		isAreaBased: false,
	},
	[ConsumableUnit.L]: {
		value: ConsumableUnit.L,
		label: "L",
		description: "Litros",
		category: "volume",
		isAreaBased: false,
	},
	[ConsumableUnit.G]: {
		value: ConsumableUnit.G,
		label: "g",
		description: "Gramas",
		category: "weight",
		isAreaBased: false,
	},
	[ConsumableUnit.KG]: {
		value: ConsumableUnit.KG,
		label: "kg",
		description: "Quilogramas",
		category: "weight",
		isAreaBased: false,
	},
	[ConsumableUnit.PCS]: {
		value: ConsumableUnit.PCS,
		label: "pcs",
		description: "Peças/Unidades",
		category: "quantity",
		isAreaBased: false,
	},
	[ConsumableUnit.ML_PASS]: {
		value: ConsumableUnit.ML_PASS,
		label: "ml/passada",
		description: "Mililitros por passada",
		category: "specific",
		isAreaBased: true,
	},
	[ConsumableUnit.SHOTS]: {
		value: ConsumableUnit.SHOTS,
		label: "disparos",
		description: "Disparos totais (vida útil da cabeça)",
		category: "quantity",
		isAreaBased: false,
	},
	[ConsumableUnit.SHOTS_M2]: {
		value: ConsumableUnit.SHOTS_M2,
		label: "disparos/m²",
		description: "Disparos por metro quadrado",
		category: "area",
		isAreaBased: true,
	},
};

/**
 * Obtém unidades recomendadas por tipo de insumo
 */
export function getRecommendedUnitsForType(type: string): ConsumableUnit[] {
	switch (type) {
		case "ink":
			return [
				ConsumableUnit.ML_M2, // Principal para tintas
				ConsumableUnit.L_M2,
				ConsumableUnit.G_M2,
				ConsumableUnit.ML_PASS,
			];
		case "printHead":
			return [
				ConsumableUnit.PCS,
				ConsumableUnit.SHOTS,
				ConsumableUnit.SHOTS_M2,
			];
		case "tool":
			return [ConsumableUnit.PCS];
		case "material":
			return [
				ConsumableUnit.KG,
				ConsumableUnit.G,
				ConsumableUnit.PCS,
				ConsumableUnit.ML,
				ConsumableUnit.L,
			];
		default:
			return Object.values(ConsumableUnit);
	}
}

/**
 * Converte unidades para a unidade base (ml/m² para tintas)
 */
export function convertToBaseUnit(
	value: number,
	fromUnit: ConsumableUnit,
): number {
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
	unit: ConsumableUnit,
): number {
	if (!UNIT_INFO[unit].isAreaBased) {
		throw new Error(`Unidade ${unit} não é baseada em área`);
	}

	// Converte para ml/m² como base
	const baseConsumption = convertToBaseUnit(1, unit);

	// Cálculo: Área × Multiplicador_Passada × Custo_por_Unidade
	return areaM2 * passMultiplier * costPerUnit * (baseConsumption / 1000);
}

/**
 * Formata a exibição da unidade
 */
export function formatUnit(unit: ConsumableUnit): string {
	return UNIT_INFO[unit].label;
}

/**
 * Obtém a descrição completa da unidade
 */
export function getUnitDescription(unit: ConsumableUnit): string {
	return UNIT_INFO[unit].description;
}

/**
 * Verifica se a unidade é baseada em área
 */
export function isAreaBasedUnit(unit: ConsumableUnit): boolean {
	return UNIT_INFO[unit].isAreaBased;
}
