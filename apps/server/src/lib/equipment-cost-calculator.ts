import type { Prisma, PrismaClient } from "../generated/client";

export interface EquipmentCostBreakdown {
	// === CUSTOS FIXOS (sem passada específica) ===
	fixedCosts: {
		depreciationPerM2: number;
		energyPerM2: number;
		maintenancePerM2: number;
		totalFixedPerM2: number;
	};
	
	// === CUSTOS VARIÁVEIS POR PASSADA ===
	passCosts: Array<{
		passKey: string;
		passName: string;
		speedM2PerHour: number;
		
		// Custos de tintas
		inkCosts: Array<{
			consumableId: string;
			consumableName: string;
			consumptionMlPerM2: number;
			costPerLiter: number;
			costPerM2: number;
		}>;
		totalInkCostPerM2: number;
		
		// Custos de cabeças
		printHeadCosts: Array<{
			consumableId: string;
			consumableName: string;
			costPerShot: number;
			shotsPerM2: number;
			costPerM2: number;
		}>;
		totalPrintHeadCostPerM2: number;
		
		// Total desta passada
		totalPassCostPerM2: number;
	}>;
	
	// Metadados
	calculatedAt: Date;
	equipmentType: string;
	unit: "m²"; // Sempre m² para impressoras
}

export interface EquipmentForCostCalculation {
	id: string;
	type: string;
	
	// Custos base por hora (inputs do usuário)
	energyCostPerHour?: number;
	maintenanceCostPerHour?: number;
	
	// Depreciação
	acquisitionValue?: number;
	residualValue?: number;
	usefulLifeHours?: number;
	usefulLifeYears?: number;
	
	// Nova estrutura de passadas integradas com insumos
	passes?: {
		[passKey: string]: {
			name: string;
			description?: string;
			speedM2PerHour: number; // velocidade para conversão
			inkConsumables: Array<{
				consumableId: string;
				consumptionMlPerM2: number;
			}>;
			printHeadConsumables: Array<{
				consumableId: string;
			}>;
		};
	};
}

export class EquipmentCostCalculator {
	constructor(private db: PrismaClient) {}

	/**
	 * NOVA LÓGICA: Calcula custos separados - fixos + variáveis por passada
	 */
	async calculateEquipmentCost(equipmentId: string): Promise<EquipmentCostBreakdown> {
		// Buscar equipamento com dados completos
		const equipment = await this.getEquipmentWithRelations(equipmentId);
		
		if (!equipment) {
			throw new Error(`Equipment ${equipmentId} not found`);
		}

		// APENAS IMPRESSORAS por enquanto (sempre m²)
		if (equipment.type !== "printing") {
			throw new Error("Only printing equipment supported with new logic");
		}

		// === CALCULAR CUSTOS FIXOS ===
		const fixedCosts = await this.calculateFixedCosts(equipment);

		// === CALCULAR CUSTOS VARIÁVEIS POR PASSADA ===
		const passCosts = await this.calculatePassCosts(equipment);

		return {
			fixedCosts,
			passCosts,
			calculatedAt: new Date(),
			equipmentType: equipment.type,
			unit: "m²",
		};
	}

	/**
	 * Recalcular e salvar custos (apenas custos fixos no banco)
	 */
	async recalculateAndSaveEquipmentCost(equipmentId: string): Promise<void> {
		const breakdown = await this.calculateEquipmentCost(equipmentId);
		
		// Salvar apenas custos fixos no banco (passadas são calculadas dinamicamente)
		await this.db.equipment.update({
			where: { id: equipmentId },
			data: {
				calculatedCostPerM2: breakdown.fixedCosts.totalFixedPerM2,
				calculatedCostPerHour: null, // não usado mais para impressoras
				lastCostCalculation: breakdown.calculatedAt,
			}
		});
	}

	/**
	 * Buscar equipamento com todas as relações necessárias
	 */
	private async getEquipmentWithRelations(equipmentId: string): Promise<EquipmentForCostCalculation | null> {
		return await this.db.equipment.findUnique({
			where: { id: equipmentId },
		}) as EquipmentForCostCalculation | null;
	}

	/**
	 * Calcular custos fixos que não dependem da passada
	 */
	private async calculateFixedCosts(equipment: EquipmentForCostCalculation) {
		// Para custos fixos, usamos uma velocidade média de 60 m²/h para conversão
		const averageSpeed = this.getAveragePassSpeed(equipment) || 60;

		// Depreciação por m²
		const depreciationPerM2 = this.calculateDepreciationPerM2(equipment, averageSpeed);

		// Energia por m²
		const energyPerM2 = (equipment.energyCostPerHour || 0) / averageSpeed;

		// Manutenção por m²
		const maintenancePerM2 = (equipment.maintenanceCostPerHour || 0) / averageSpeed;

		const totalFixedPerM2 = depreciationPerM2 + energyPerM2 + maintenancePerM2;

		return {
			depreciationPerM2,
			energyPerM2,
			maintenancePerM2,
			totalFixedPerM2,
		};
	}

	/**
	 * Calcular custos variáveis por passada (tintas + cabeças)
	 */
	private async calculatePassCosts(equipment: EquipmentForCostCalculation) {
		const passCosts = [];

		if (!equipment.passes) {
			return passCosts;
		}

		for (const [passKey, passConfig] of Object.entries(equipment.passes)) {
			// Calcular custos de tintas desta passada
			const inkCosts = await this.calculateInkCostsForPass(passConfig);

			// Calcular custos de cabeças desta passada  
			const printHeadCosts = await this.calculatePrintHeadCostsForPass(passConfig);

			const totalInkCostPerM2 = inkCosts.reduce((sum, ink) => sum + ink.costPerM2, 0);
			const totalPrintHeadCostPerM2 = printHeadCosts.reduce((sum, head) => sum + head.costPerM2, 0);
			const totalPassCostPerM2 = totalInkCostPerM2 + totalPrintHeadCostPerM2;

			passCosts.push({
				passKey,
				passName: passConfig.name,
				speedM2PerHour: passConfig.speedM2PerHour,
				inkCosts,
				totalInkCostPerM2,
				printHeadCosts,
				totalPrintHeadCostPerM2,
				totalPassCostPerM2,
			});
		}

		return passCosts;
	}

	// === NOVAS FUNÇÕES AUXILIARES ===

	/**
	 * Calcular velocidade média das passadas para custos fixos
	 */
	private getAveragePassSpeed(equipment: EquipmentForCostCalculation): number | null {
		if (!equipment.passes) return null;

		const speeds = Object.values(equipment.passes).map(pass => pass.speedM2PerHour);
		if (speeds.length === 0) return null;

		return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
	}

	/**
	 * Calcular depreciação por m²
	 */
	private calculateDepreciationPerM2(equipment: EquipmentForCostCalculation, averageSpeed: number): number {
		if (!equipment.acquisitionValue || !equipment.usefulLifeHours) {
			return 0;
		}

		const residualValue = equipment.residualValue || 0;
		const depreciableValue = equipment.acquisitionValue - residualValue;
		const depreciationPerHour = depreciableValue / equipment.usefulLifeHours;
		
		return depreciationPerHour / averageSpeed;
	}

	/**
	 * Calcular custos de tintas para uma passada específica
	 */
	private async calculateInkCostsForPass(passConfig: any) {
		const inkCosts = [];

		for (const inkConsumable of passConfig.inkConsumables || []) {
			// Buscar dados do insumo cadastrado
			const consumable = await this.db.consumable.findUnique({
				where: { id: inkConsumable.consumableId },
			});

			if (!consumable || consumable.type !== 'ink') {
				continue; // Pula se insumo não existe ou não é tinta
			}

			// Calcular custo: ml/m² * (custo_por_litro / 1000ml)
			const costPerLiter = Number(consumable.cost);
			const consumptionMlPerM2 = inkConsumable.consumptionMlPerM2;
			const costPerM2 = (consumptionMlPerM2 / 1000) * costPerLiter;

			inkCosts.push({
				consumableId: consumable.id,
				consumableName: consumable.name,
				consumptionMlPerM2,
				costPerLiter,
				costPerM2,
			});
		}

		return inkCosts;
	}

	/**
	 * Calcular custos de cabeças de impressão para uma passada específica
	 */
	private async calculatePrintHeadCostsForPass(passConfig: any) {
		const printHeadCosts = [];

		for (const headConsumable of passConfig.printHeadConsumables || []) {
			// Buscar dados do insumo cadastrado
			const consumable = await this.db.consumable.findUnique({
				where: { id: headConsumable.consumableId },
			});

			if (!consumable || consumable.type !== 'printHead') {
				continue; // Pula se insumo não existe ou não é cabeça
			}

			// Calcular custo: (custo_cabeça / lifespan_disparos) * disparos_por_m²
			const lifespan = consumable.lifespan || 10000000; // disparos totais padrão
			const shotsPerM2 = consumable.shotsPerM2 || 1000; // disparos por m² padrão
			const costPerShot = Number(consumable.cost) / lifespan;
			const costPerM2 = costPerShot * shotsPerM2;

			printHeadCosts.push({
				consumableId: consumable.id,
				consumableName: consumable.name,
				costPerShot,
				shotsPerM2,
				costPerM2,
			});
		}

		return printHeadCosts;
	}
}

export default EquipmentCostCalculator;