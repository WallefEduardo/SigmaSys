/**
 * Calculadora de custos integrada para equipamentos e insumos
 * Sistema que combina custo de equipamento, consumo de tinta e passadas
 */

import {
	ConsumableUnit,
	convertToBaseUnit,
	isAreaBasedUnit,
} from "./consumable-units";

export interface PassConfiguration {
	name: string;
	quality: string;
	speed: number;
	inkConsumption: number;
	powerConsumption: number;
	printHeadWear: number;
	selectedInks?: string[]; // IDs dos insumos de tinta selecionados
}

export interface Equipment {
	id: string;
	name: string;
	costPerHour: number;
	energyCost?: number;
	passes: Record<string, PassConfiguration>;
}

export interface Consumable {
	id: string;
	name: string;
	type: string;
	cost: number;
	unit: ConsumableUnit;
	color?: string;
}

export interface PrintJob {
	width: number; // em mm
	height: number; // em mm
	quantity: number;
	selectedPass: string;
}

export interface CostCalculationResult {
	area: number; // m²
	totalArea: number; // área total com quantidade
	equipmentCost: number; // custo do equipamento
	inkCost: number; // custo das tintas
	energyCost: number; // custo de energia
	totalCost: number; // custo total
	costPerUnit: number; // custo por unidade
	timeRequired: number; // tempo necessário em horas
	breakdown: {
		equipment: number;
		inks: Array<{
			name: string;
			color?: string;
			consumption: number;
			cost: number;
			unit: string;
		}>;
		energy: number;
	};
}

/**
 * Calcula o custo total de um job de impressão
 */
export function calculatePrintJobCost(
	job: PrintJob,
	equipment: Equipment,
	availableInks: Consumable[],
): CostCalculationResult {
	// Converter dimensões para m²
	const area = (job.width * job.height) / 1_000_000;
	const totalArea = area * job.quantity;

	// Obter configuração da passada
	const passConfig = equipment.passes[job.selectedPass];
	if (!passConfig) {
		throw new Error(
			`Passada "${job.selectedPass}" não encontrada no equipamento`,
		);
	}

	// Calcular tempo necessário baseado na velocidade da passada
	const timeRequired = totalArea / passConfig.speed;

	// Custo do equipamento (tempo × custo por hora)
	const equipmentCost = timeRequired * equipment.costPerHour;

	// Custo de energia (se disponível)
	const energyCost = equipment.energyCost
		? timeRequired * equipment.energyCost * passConfig.powerConsumption
		: 0;

	// Calcular custo das tintas
	const inkBreakdown: CostCalculationResult["breakdown"]["inks"] = [];
	let totalInkCost = 0;

	if (passConfig.selectedInks) {
		for (const inkId of passConfig.selectedInks) {
			const ink = availableInks.find((i) => i.id === inkId && i.type === "ink");
			if (ink && isAreaBasedUnit(ink.unit)) {
				// Calcular consumo para a área total com multiplicador da passada
				const consumption = calculateInkConsumption(
					totalArea,
					ink.unit,
					passConfig.inkConsumption,
				);
				const inkCost = consumption * Number(ink.cost);

				inkBreakdown.push({
					name: ink.name,
					color: ink.color,
					consumption,
					cost: inkCost,
					unit: formatConsumptionUnit(ink.unit),
				});

				totalInkCost += inkCost;
			}
		}
	}

	const totalCost = equipmentCost + totalInkCost + energyCost;
	const costPerUnit = totalCost / job.quantity;

	return {
		area,
		totalArea,
		equipmentCost,
		inkCost: totalInkCost,
		energyCost,
		totalCost,
		costPerUnit,
		timeRequired,
		breakdown: {
			equipment: equipmentCost,
			inks: inkBreakdown,
			energy: energyCost,
		},
	};
}

/**
 * Calcula o consumo de tinta para uma área específica
 */
function calculateInkConsumption(
	areaM2: number,
	unit: ConsumableUnit,
	passMultiplier: number,
): number {
	if (!isAreaBasedUnit(unit)) {
		throw new Error(`Unidade ${unit} não é baseada em área`);
	}

	// Para unidades baseadas em área, o consumo é direto
	// Exemplo: 15 ml/m² × 2 m² × 1.5 (passada foto) = 45 ml
	return areaM2 * passMultiplier;
}

/**
 * Formata a unidade para exibição no breakdown
 */
function formatConsumptionUnit(unit: ConsumableUnit): string {
	switch (unit) {
		case ConsumableUnit.ML_M2:
			return "ml";
		case ConsumableUnit.L_M2:
			return "L";
		case ConsumableUnit.G_M2:
			return "g";
		case ConsumableUnit.ML_PASS:
			return "ml";
		default:
			return unit.toLowerCase();
	}
}

/**
 * Calcula o custo estimado em tempo real para cotações
 */
export function calculateQuickEstimate(
	widthMm: number,
	heightMm: number,
	quantity: number,
	equipmentCostPerHour: number,
	averageSpeed = 60, // m²/h
	averageInkCost = 50, // R$ por m²
): number {
	const area = (widthMm * heightMm) / 1_000_000;
	const totalArea = area * quantity;
	const timeRequired = totalArea / averageSpeed;
	const equipmentCost = timeRequired * equipmentCostPerHour;
	const inkCost = totalArea * averageInkCost;

	return equipmentCost + inkCost;
}

/**
 * Valida se um job pode ser executado com as configurações atuais
 */
export function validatePrintJob(
	job: PrintJob,
	equipment: Equipment,
	availableInks: Consumable[],
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Validar dimensões
	if (job.width <= 0 || job.height <= 0) {
		errors.push("Dimensões devem ser maiores que zero");
	}

	// Validar quantidade
	if (job.quantity <= 0) {
		errors.push("Quantidade deve ser maior que zero");
	}

	// Validar passada
	const passConfig = equipment.passes[job.selectedPass];
	if (!passConfig) {
		errors.push(`Passada "${job.selectedPass}" não encontrada`);
	} else {
		// Validar tintas selecionadas
		if (passConfig.selectedInks) {
			for (const inkId of passConfig.selectedInks) {
				const ink = availableInks.find((i) => i.id === inkId);
				if (!ink) {
					errors.push(`Tinta com ID "${inkId}" não encontrada`);
				} else if (ink.type !== "ink") {
					errors.push(`Insumo "${ink.name}" não é uma tinta`);
				} else if (!isAreaBasedUnit(ink.unit)) {
					errors.push(`Tinta "${ink.name}" não tem unidade baseada em área`);
				}
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
