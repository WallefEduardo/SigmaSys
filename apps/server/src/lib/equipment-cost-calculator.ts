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
		
		// Custos de cabeças (usando nova lógica simplificada)
		printHeadCosts: Array<{
			consumableId: string;
			consumableName: string;
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
	 * Recalcular e salvar custos ORGANIZADOS na nova tabela
	 */
	async recalculateAndSaveEquipmentCost(equipmentId: string): Promise<void> {
		const breakdown = await this.calculateEquipmentCost(equipmentId);
		
		// 1. Desativar breakdown anterior
		await this.db.equipmentCostBreakdown.updateMany({
			where: { equipmentId, isActive: true },
			data: { isActive: false }
		});
		
		// 2. Calcular próxima versão
		const lastBreakdown = await this.db.equipmentCostBreakdown.findFirst({
			where: { equipmentId },
			orderBy: { version: 'desc' }
		});
		const nextVersion = (lastBreakdown?.version || 0) + 1;
		
		// 3. Salvar breakdown COMPLETO na nova tabela organizada
		await this.db.equipmentCostBreakdown.create({
			data: {
				equipmentId,
				calculatedAt: breakdown.calculatedAt,
				
				// Custos fixos detalhados
				depreciationPerM2: breakdown.fixedCosts.depreciationPerM2,
				energyPerM2: breakdown.fixedCosts.energyPerM2,
				maintenancePerM2: breakdown.fixedCosts.maintenancePerM2,
				totalFixedPerM2: breakdown.fixedCosts.totalFixedPerM2,
				
				// Custos variáveis por passada (JSON estruturado)
				passBreakdowns: breakdown.passCosts.map(passData => ({
					passKey: passData.passKey,
					passName: passData.passName,
					speedM2PerHour: passData.speedM2PerHour,
					
					// Detalhes das tintas
					inkDetails: passData.inkCosts.map(ink => ({
						consumableId: ink.consumableId,
						consumableName: ink.consumableName,
						consumptionMlPerM2: ink.consumptionMlPerM2,
						costPerLiter: ink.costPerLiter,
						costPerM2: ink.costPerM2
					})),
					totalInkCostPerM2: passData.totalInkCostPerM2,
					
					// Detalhes das cabeças
					headDetails: passData.printHeadCosts.map(head => ({
						consumableId: head.consumableId,
						consumableName: head.consumableName,
						costPerM2: head.costPerM2
					})),
					totalHeadCostPerM2: passData.totalPrintHeadCostPerM2,
					
					// Total da passada
					totalPassCostPerM2: passData.totalPassCostPerM2
				})),
				
				// Metadados
				equipmentType: breakdown.equipmentType,
				averageSpeed: this.getAveragePassSpeed(await this.getEquipmentWithRelations(equipmentId)) || 60,
				totalPasses: breakdown.passCosts.length,
				
				// Performance
				isActive: true,
				version: nextVersion
			}
		});
		
		// 4. Atualizar campos básicos do equipamento (compatibilidade)
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
	 * NOVA LÓGICA: Usar costPerM2 diretamente do consumível cadastrado
	 */
	private async calculatePrintHeadCostsForPass(passConfig: any) {
		const printHeadCosts = [];

		// Calculate print head costs for this pass

		for (const headConsumable of passConfig.printHeadConsumables || []) {

			// Buscar dados do insumo cadastrado
			const consumable = await this.db.consumable.findUnique({
				where: { id: headConsumable.consumableId },
			});

			console.log('📋 Dados do consumível encontrado:', {
				found: !!consumable,
				name: consumable?.name,
				type: consumable?.type,
				costPerM2: consumable?.costPerM2,
				cost: consumable?.cost,
				lifespanM2: consumable?.lifespanM2
			});

			if (!consumable || consumable.type !== 'printHead') {
				console.log('❌ Pulando consumível (não é cabeça ou não existe)');
				continue; // Pula se insumo não existe ou não é cabeça
			}

			// NOVA LÓGICA: Usar costPerM2 diretamente se disponível
			let costPerM2 = Number(consumable.costPerM2) || 0;
			
			// Se não tem costPerM2 calculado, calcular baseado na lifespanM2
			if (costPerM2 === 0 && consumable.lifespanM2) {
				costPerM2 = Number(consumable.cost) / Number(consumable.lifespanM2);
				console.log('💰 Custo calculado da lifespan:', {
					cost: consumable.cost,
					lifespanM2: consumable.lifespanM2,
					calculated: costPerM2
				});
			}

			console.log('✅ Cabeça processada:', {
				consumableId: consumable.id,
				consumableName: consumable.name,
				finalCostPerM2: costPerM2
			});

			printHeadCosts.push({
				consumableId: consumable.id,
				consumableName: consumable.name,
				costPerM2,
			});
		}

		return printHeadCosts;
	}

	// ===== NOVOS MÉTODOS PARA CONSULTAS OTIMIZADAS =====

	/**
	 * Buscar custos organizados (OTIMIZADO para cálculo de produtos)
	 */
	async getOrganizedCosts(equipmentId: string) {
		const breakdown = await this.db.equipmentCostBreakdown.findFirst({
			where: { 
				equipmentId, 
				isActive: true 
			},
			select: {
				id: true,
				calculatedAt: true,
				
				// Custos fixos (sempre os mesmos)
				depreciationPerM2: true,
				energyPerM2: true,
				maintenancePerM2: true,
				totalFixedPerM2: true,
				
				// Custos por passada (JSON)
				passBreakdowns: true,
				
				// Metadados úteis
				equipmentType: true,
				averageSpeed: true,
				totalPasses: true
			}
		});

		if (!breakdown) {
			console.log('🔄 Breakdown não existe, forçando recálculo...');
			// Se não tem breakdown, calcular e salvar
			await this.recalculateAndSaveEquipmentCost(equipmentId);
			return await this.getOrganizedCosts(equipmentId);
		}

		console.log('📊 Breakdown encontrado:', {
			id: breakdown.id,
			calculatedAt: breakdown.calculatedAt,
			hasPassBreakdowns: !!breakdown.passBreakdowns,
			passCount: Array.isArray(breakdown.passBreakdowns) ? breakdown.passBreakdowns.length : 0
		});

		// Return existing breakdown if found and valid

		return breakdown;
	}

	/**
	 * Buscar custos APENAS para cálculo de produtos (super otimizado)
	 */
	async getCostForProductCalculation(equipmentId: string, passKey?: string) {
		const breakdown = await this.getOrganizedCosts(equipmentId);
		
		const result = {
			equipmentId,
			calculatedAt: breakdown.calculatedAt,
			
			// Custos fixos (sempre aplicados)
			fixedCostPerM2: Number(breakdown.totalFixedPerM2),
			
			// Se especificou passada, retornar custo específico
			passCost: null as any
		};

		if (passKey && breakdown.passBreakdowns) {
			const passData = (breakdown.passBreakdowns as any[]).find(p => p.passKey === passKey);
			if (passData) {
				result.passCost = {
					passKey: passData.passKey,
					passName: passData.passName,
					speedM2PerHour: passData.speedM2PerHour,
					inkCostPerM2: passData.totalInkCostPerM2,
					headCostPerM2: passData.totalHeadCostPerM2,
					totalVariableCostPerM2: passData.totalPassCostPerM2,
					
					// CUSTO TOTAL = Fixo + Variável
					totalCostPerM2: result.fixedCostPerM2 + passData.totalPassCostPerM2
				};
			}
		}

		return result;
	}

	/**
	 * Listar todos os equipamentos com custos básicos (para seleção de produtos)
	 */
	async listEquipmentCosts(companyId: string, equipmentType?: string) {
		const equipments = await this.db.equipment.findMany({
			where: {
				companyId,
				active: true,
				...(equipmentType ? { type: equipmentType } : {})
			},
			select: {
				id: true,
				name: true,
				type: true,
				calculatedCostPerM2: true,
				lastCostCalculation: true,
				costBreakdowns: {
					where: { isActive: true },
					select: {
						totalFixedPerM2: true,
						totalPasses: true,
						averageSpeed: true
					},
					take: 1
				}
			}
		});

		return equipments.map(equipment => ({
			id: equipment.id,
			name: equipment.name,
			type: equipment.type,
			fixedCostPerM2: equipment.costBreakdowns[0] 
				? Number(equipment.costBreakdowns[0].totalFixedPerM2)
				: Number(equipment.calculatedCostPerM2 || 0),
			totalPasses: equipment.costBreakdowns[0]?.totalPasses || 0,
			averageSpeed: equipment.costBreakdowns[0] 
				? Number(equipment.costBreakdowns[0].averageSpeed)
				: 60,
			lastCalculated: equipment.lastCostCalculation,
			hasDetailedBreakdown: !!equipment.costBreakdowns[0]
		}));
	}
}

export default EquipmentCostCalculator;