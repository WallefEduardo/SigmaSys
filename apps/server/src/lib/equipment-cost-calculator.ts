import type { Prisma, PrismaClient } from "../generated/client";

export interface EquipmentCostBreakdown {
	// Componentes do custo
	depreciationPerUnit: number;
	energyPerUnit: number;
	maintenancePerUnit: number;
	consumablesPerUnit: number;
	
	// Total
	totalCostPerUnit: number;
	unit: "PER_HOUR" | "PER_M2";
	
	// Metadados
	calculatedAt: Date;
	passQuality?: string;
}

export interface EquipmentForCostCalculation {
	id: string;
	type: string;
	costUnit: string;
	
	// Depreciação
	acquisitionValue?: number;
	residualValue?: number;
	usefulLifeHours?: number;
	usefulLifeYears?: number;
	accumulatedHours?: number;
	
	// Custos base
	energyCostPerHour?: number;
	maintenanceCostPerHour?: number;
	
	// Configurações de passes (para impressoras)
	passes?: any;
	
	// Consumíveis instalados
	equipmentConsumables?: Array<{
		consumable: {
			id: string;
			cost: number;
			unit: string;
			lifespan?: number;
		};
		currentUse?: number;
	}>;
}

export class EquipmentCostCalculator {
	constructor(private db: PrismaClient) {}

	/**
	 * Calcula o custo automático de um equipamento
	 */
	async calculateEquipmentCost(
		equipmentId: string, 
		passQuality?: string
	): Promise<EquipmentCostBreakdown> {
		
		// Buscar dados completos do equipamento
		const equipment = await this.getEquipmentWithRelations(equipmentId);
		
		if (!equipment) {
			throw new Error(`Equipment ${equipmentId} not found`);
		}

		const unit = equipment.costUnit as "PER_HOUR" | "PER_M2";
		const isPerM2 = unit === "PER_M2";

		// Obter velocidade da passada (para conversão hora -> m²)
		const passSpeed = this.getPassSpeed(equipment, passQuality);

		// Calcular cada componente
		const depreciationPerUnit = this.calculateDepreciation(equipment, isPerM2, passSpeed);
		const energyPerUnit = this.calculateEnergyCost(equipment, isPerM2, passSpeed);
		const maintenancePerUnit = this.calculateMaintenanceCost(equipment, isPerM2, passSpeed);
		const consumablesPerUnit = this.calculateConsumablesCost(equipment, passQuality, isPerM2, passSpeed);

		const totalCostPerUnit = 
			depreciationPerUnit + 
			energyPerUnit + 
			maintenancePerUnit + 
			consumablesPerUnit;

		return {
			depreciationPerUnit,
			energyPerUnit,
			maintenancePerUnit,
			consumablesPerUnit,
			totalCostPerUnit,
			unit,
			calculatedAt: new Date(),
			passQuality
		};
	}

	/**
	 * Recalcular e salvar custos de um equipamento
	 */
	async recalculateAndSaveEquipmentCost(
		equipmentId: string,
		passQuality?: string
	): Promise<void> {
		const breakdown = await this.calculateEquipmentCost(equipmentId, passQuality);
		
		const updateData: any = {
			lastCostCalculation: breakdown.calculatedAt
		};

		if (breakdown.unit === "PER_M2") {
			updateData.calculatedCostPerM2 = breakdown.totalCostPerUnit;
		} else {
			updateData.calculatedCostPerHour = breakdown.totalCostPerUnit;
		}

		await this.db.equipment.update({
			where: { id: equipmentId },
			data: updateData
		});
	}

	/**
	 * Buscar equipamento com todas as relações necessárias
	 */
	private async getEquipmentWithRelations(equipmentId: string): Promise<EquipmentForCostCalculation | null> {
		return await this.db.equipment.findUnique({
			where: { id: equipmentId },
			include: {
				equipmentConsumables: {
					where: { active: true },
					include: {
						consumable: true
					}
				}
			}
		}) as EquipmentForCostCalculation | null;
	}

	/**
	 * Obter velocidade da passada específica (m²/hora)
	 */
	private getPassSpeed(equipment: EquipmentForCostCalculation, passQuality?: string): number {
		if (!passQuality || !equipment.passes) {
			return 60; // Velocidade padrão
		}

		const passes = equipment.passes as any;
		const pass = passes[passQuality];
		
		return pass?.speed || 60;
	}

	/**
	 * Calcular custo de depreciação por unidade
	 */
	private calculateDepreciation(
		equipment: EquipmentForCostCalculation, 
		isPerM2: boolean, 
		speedM2PerHour: number
	): number {
		if (!equipment.acquisitionValue || !equipment.residualValue || !equipment.usefulLifeHours) {
			return 0;
		}

		const depreciableValue = equipment.acquisitionValue - equipment.residualValue;
		const depreciationPerHour = depreciableValue / equipment.usefulLifeHours;

		if (isPerM2) {
			// Converter depreciação/hora para depreciação/m²
			return depreciationPerHour / speedM2PerHour;
		}

		return depreciationPerHour;
	}

	/**
	 * Calcular custo de energia por unidade
	 */
	private calculateEnergyCost(
		equipment: EquipmentForCostCalculation, 
		isPerM2: boolean, 
		speedM2PerHour: number
	): number {
		const energyCostPerHour = equipment.energyCostPerHour || 0;

		if (isPerM2) {
			// Converter energia/hora para energia/m²
			return energyCostPerHour / speedM2PerHour;
		}

		return energyCostPerHour;
	}

	/**
	 * Calcular custo de manutenção por unidade
	 */
	private calculateMaintenanceCost(
		equipment: EquipmentForCostCalculation, 
		isPerM2: boolean, 
		speedM2PerHour: number
	): number {
		const maintenanceCostPerHour = equipment.maintenanceCostPerHour || 0;

		if (isPerM2) {
			// Converter manutenção/hora para manutenção/m²
			return maintenanceCostPerHour / speedM2PerHour;
		}

		return maintenanceCostPerHour;
	}

	/**
	 * Calcular custo de consumíveis por unidade
	 */
	private calculateConsumablesCost(
		equipment: EquipmentForCostCalculation, 
		passQuality: string | undefined,
		isPerM2: boolean, 
		speedM2PerHour: number
	): number {
		if (!equipment.equipmentConsumables || equipment.equipmentConsumables.length === 0) {
			return 0;
		}

		let totalConsumablesCost = 0;

		for (const equipConsumable of equipment.equipmentConsumables) {
			const consumable = equipConsumable.consumable;
			
			if (consumable.unit === "ML_M2" && isPerM2) {
				// Tinta: custo baseado no consumo específico da passada
				const consumptionRate = this.getInkConsumptionRate(equipment, passQuality, consumable.id);
				totalConsumablesCost += consumptionRate * consumable.cost;
				
			} else if (consumable.lifespan && consumable.unit === "PCS") {
				// Cabeças/ferramentas: custo baseado na vida útil
				const wearRate = this.getConsumableWearRate(equipment, passQuality, consumable.id);
				const costPerUse = consumable.cost / consumable.lifespan;
				
				if (isPerM2) {
					totalConsumablesCost += costPerUse * wearRate;
				} else {
					// Para custo/hora, assumir desgaste constante
					totalConsumablesCost += costPerUse * wearRate;
				}
			}
		}

		return totalConsumablesCost;
	}

	/**
	 * Obter taxa de consumo de tinta para uma passada específica
	 */
	private getInkConsumptionRate(
		equipment: EquipmentForCostCalculation,
		passQuality: string | undefined,
		inkId: string
	): number {
		if (!passQuality || !equipment.passes) {
			return 1.0; // Consumo padrão
		}

		const passes = equipment.passes as any;
		const pass = passes[passQuality];
		
		if (!pass || !pass.inkConfiguration) {
			return pass?.inkConsumption || 1.0; // Multiplicador base
		}

		// Consumo específico: Multiplicador Base × Consumo Específico
		const baseMultiplier = pass.inkConsumption || 1.0;
		const specificConsumption = pass.inkConfiguration[inkId]?.consumptionRate || 0;
		
		return baseMultiplier * specificConsumption;
	}

	/**
	 * Obter taxa de desgaste de consumível para uma passada específica
	 */
	private getConsumableWearRate(
		equipment: EquipmentForCostCalculation,
		passQuality: string | undefined,
		consumableId: string
	): number {
		if (!passQuality || !equipment.passes) {
			return 1.0; // Desgaste padrão
		}

		const passes = equipment.passes as any;
		const pass = passes[passQuality];
		
		// Para cabeças de impressão, usar printHeadWear
		return pass?.printHeadWear || 1.0;
	}

	/**
	 * Obter sugestão automática da unidade baseada no tipo
	 */
	static getDefaultCostUnit(equipmentType: string): "PER_HOUR" | "PER_M2" {
		switch (equipmentType) {
			case "printing":
				return "PER_M2"; // Impressão sempre em m²
			case "machining":
				return "PER_HOUR"; // Usinagem padrão em hora
			default:
				return "PER_HOUR";
		}
	}
}

export default EquipmentCostCalculator;