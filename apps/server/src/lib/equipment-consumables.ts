import { apiLogger } from "./logger";

export interface Consumable {
	id: string;
	name: string;
	type: "ink" | "printHead" | "tool" | "material" | "other";
	cost: number;
	unit: string; // ml, pcs, g, etc
	supplier?: string;

	// Para tintas
	color?: string;
	volumeMl?: number;

	// Para cabeças e ferramentas
	lifespan?: number; // vida útil em unidades de uso
	currentUse?: number; // uso atual

	// Para ferramentas de usinagem
	material?: string; // material que a ferramenta trabalha
	diameter?: number;

	// Configurações
	minStock: number;
	maxStock: number;
	currentStock: number;
	alertThreshold: number;
	autoReorder: boolean;
}

export interface ConsumptionRate {
	passQuality: string;
	consumableId: string;
	rate: number; // quantidade consumida por unidade de trabalho (m², hora, etc)
	unit: string;
}

export interface StockAlert {
	consumableId: string;
	consumableName: string;
	currentStock: number;
	minStock: number;
	severity: "low" | "medium" | "high" | "critical";
	estimatedDaysRemaining: number;
	suggestedOrderQuantity: number;
}

export class EquipmentConsumablesService {
	/**
	 * Calcula o consumo de insumos para uma operação específica
	 */
	static calculateConsumption(
		area: number, // m² ou quantidade a processar
		passQuality: string,
		consumables: Consumable[],
		consumptionRates: ConsumptionRate[],
	): Array<{
		consumable: Consumable;
		quantityUsed: number;
		cost: number;
		remainingStock: number;
		needsReorder: boolean;
	}> {
		const results = consumables.map((consumable) => {
			const rate = consumptionRates.find(
				(r) =>
					r.consumableId === consumable.id && r.passQuality === passQuality,
			);

			const quantityUsed = rate ? area * rate.rate : 0;
			const cost = quantityUsed * consumable.cost;
			const remainingStock = consumable.currentStock - quantityUsed;
			const needsReorder = remainingStock <= consumable.alertThreshold;

			return {
				consumable,
				quantityUsed,
				cost,
				remainingStock: Math.max(0, remainingStock),
				needsReorder,
			};
		});

		apiLogger.info("Consumables consumption calculated", {
			area,
			passQuality,
			totalCost: results.reduce((sum, r) => sum + r.cost, 0),
			reorderNeeded: results.filter((r) => r.needsReorder).length,
		});

		return results;
	}

	/**
	 * Monitora o estoque de consumíveis e gera alertas
	 */
	static monitorStock(
		consumables: Consumable[],
		usageHistory: Array<{
			consumableId: string;
			quantityUsed: number;
			date: Date;
		}>,
	): StockAlert[] {
		return consumables
			.map((consumable) => {
				// Calcular uso médio nos últimos 30 dias
				const recentUsage = usageHistory.filter((usage) => {
					const daysDiff =
						(Date.now() - usage.date.getTime()) / (1000 * 60 * 60 * 24);
					return daysDiff <= 30 && usage.consumableId === consumable.id;
				});

				const totalUsed = recentUsage.reduce(
					(sum, usage) => sum + usage.quantityUsed,
					0,
				);
				const dailyUsageRate = totalUsed / 30;

				const estimatedDaysRemaining =
					dailyUsageRate > 0
						? Math.round(consumable.currentStock / dailyUsageRate)
						: Number.POSITIVE_INFINITY;

				let severity: StockAlert["severity"] = "low";
				if (consumable.currentStock <= 0) severity = "critical";
				else if (consumable.currentStock <= consumable.minStock * 0.5)
					severity = "high";
				else if (consumable.currentStock <= consumable.minStock)
					severity = "medium";

				// Quantidade sugerida para pedido (baseada no consumo médio e estoque máximo)
				const avgMonthlyUsage = totalUsed || consumable.minStock;
				const suggestedOrderQuantity = Math.max(
					consumable.maxStock - consumable.currentStock,
					avgMonthlyUsage * 2, // 2 meses de estoque
				);

				return {
					consumableId: consumable.id,
					consumableName: consumable.name,
					currentStock: consumable.currentStock,
					minStock: consumable.minStock,
					severity,
					estimatedDaysRemaining:
						estimatedDaysRemaining === Number.POSITIVE_INFINITY
							? 999
							: estimatedDaysRemaining,
					suggestedOrderQuantity: Math.round(suggestedOrderQuantity),
				};
			})
			.filter(
				(alert) =>
					alert.severity !== "low" || alert.estimatedDaysRemaining <= 30,
			);
	}

	/**
	 * Atualiza o estoque após uma operação
	 */
	static updateStock(
		consumables: Consumable[],
		consumption: Array<{
			consumableId: string;
			quantityUsed: number;
		}>,
	): Consumable[] {
		return consumables.map((consumable) => {
			const used = consumption.find((c) => c.consumableId === consumable.id);
			if (used) {
				return {
					...consumable,
					currentStock: Math.max(
						0,
						consumable.currentStock - used.quantityUsed,
					),
				};
			}
			return consumable;
		});
	}

	/**
	 * Calcula o custo total de insumos por m² para uma configuração
	 */
	static calculateCostPerSquareMeter(
		passQuality: string,
		consumables: Consumable[],
		consumptionRates: ConsumptionRate[],
	): {
		costPerM2: number;
		breakdown: Array<{
			consumableName: string;
			costPerM2: number;
			percentage: number;
		}>;
	} {
		const consumption = EquipmentConsumablesService.calculateConsumption(
			1,
			passQuality,
			consumables,
			consumptionRates,
		);
		const totalCost = consumption.reduce((sum, c) => sum + c.cost, 0);

		const breakdown = consumption.map((c) => ({
			consumableName: c.consumable.name,
			costPerM2: c.cost,
			percentage: totalCost > 0 ? (c.cost / totalCost) * 100 : 0,
		}));

		return {
			costPerM2: totalCost,
			breakdown,
		};
	}

	/**
	 * Configurações padrão de consumíveis para impressoras
	 */
	static getDefaultPrintingConsumables(): Consumable[] {
		return [
			{
				id: "ink-cyan",
				name: "Tinta Ciano",
				type: "ink",
				cost: 0.05, // R$ por ml
				unit: "ml",
				color: "cyan",
				volumeMl: 1000,
				minStock: 500,
				maxStock: 2000,
				currentStock: 1000,
				alertThreshold: 200,
				autoReorder: true,
			},
			{
				id: "ink-magenta",
				name: "Tinta Magenta",
				type: "ink",
				cost: 0.05,
				unit: "ml",
				color: "magenta",
				volumeMl: 1000,
				minStock: 500,
				maxStock: 2000,
				currentStock: 1000,
				alertThreshold: 200,
				autoReorder: true,
			},
			{
				id: "ink-yellow",
				name: "Tinta Amarela",
				type: "ink",
				cost: 0.05,
				unit: "ml",
				color: "yellow",
				volumeMl: 1000,
				minStock: 500,
				maxStock: 2000,
				currentStock: 1000,
				alertThreshold: 200,
				autoReorder: true,
			},
			{
				id: "ink-black",
				name: "Tinta Preta",
				type: "ink",
				cost: 0.04,
				unit: "ml",
				color: "black",
				volumeMl: 1000,
				minStock: 500,
				maxStock: 2000,
				currentStock: 1000,
				alertThreshold: 200,
				autoReorder: true,
			},
			{
				id: "printhead-dx5",
				name: "Cabeça DX5",
				type: "printHead",
				cost: 500,
				unit: "pcs",
				lifespan: 10000, // m² que suporta
				currentUse: 2500,
				minStock: 1,
				maxStock: 3,
				currentStock: 2,
				alertThreshold: 1,
				autoReorder: false,
			},
		];
	}

	/**
	 * Taxas de consumo padrão para impressão
	 */
	static getDefaultConsumptionRates(): ConsumptionRate[] {
		return [
			// Tinta Ciano
			{
				passQuality: "draft",
				consumableId: "ink-cyan",
				rate: 2.5,
				unit: "ml/m²",
			},
			{
				passQuality: "normal",
				consumableId: "ink-cyan",
				rate: 4.0,
				unit: "ml/m²",
			},
			{
				passQuality: "high",
				consumableId: "ink-cyan",
				rate: 6.0,
				unit: "ml/m²",
			},
			{
				passQuality: "photo",
				consumableId: "ink-cyan",
				rate: 8.5,
				unit: "ml/m²",
			},

			// Tinta Magenta
			{
				passQuality: "draft",
				consumableId: "ink-magenta",
				rate: 2.5,
				unit: "ml/m²",
			},
			{
				passQuality: "normal",
				consumableId: "ink-magenta",
				rate: 4.0,
				unit: "ml/m²",
			},
			{
				passQuality: "high",
				consumableId: "ink-magenta",
				rate: 6.0,
				unit: "ml/m²",
			},
			{
				passQuality: "photo",
				consumableId: "ink-magenta",
				rate: 8.5,
				unit: "ml/m²",
			},

			// Tinta Amarela
			{
				passQuality: "draft",
				consumableId: "ink-yellow",
				rate: 2.0,
				unit: "ml/m²",
			},
			{
				passQuality: "normal",
				consumableId: "ink-yellow",
				rate: 3.2,
				unit: "ml/m²",
			},
			{
				passQuality: "high",
				consumableId: "ink-yellow",
				rate: 4.8,
				unit: "ml/m²",
			},
			{
				passQuality: "photo",
				consumableId: "ink-yellow",
				rate: 7.0,
				unit: "ml/m²",
			},

			// Tinta Preta
			{
				passQuality: "draft",
				consumableId: "ink-black",
				rate: 3.0,
				unit: "ml/m²",
			},
			{
				passQuality: "normal",
				consumableId: "ink-black",
				rate: 4.8,
				unit: "ml/m²",
			},
			{
				passQuality: "high",
				consumableId: "ink-black",
				rate: 7.2,
				unit: "ml/m²",
			},
			{
				passQuality: "photo",
				consumableId: "ink-black",
				rate: 10.0,
				unit: "ml/m²",
			},

			// Cabeça de impressão (desgaste por m²)
			{
				passQuality: "draft",
				consumableId: "printhead-dx5",
				rate: 0.0005,
				unit: "wear/m²",
			},
			{
				passQuality: "normal",
				consumableId: "printhead-dx5",
				rate: 0.001,
				unit: "wear/m²",
			},
			{
				passQuality: "high",
				consumableId: "printhead-dx5",
				rate: 0.0018,
				unit: "wear/m²",
			},
			{
				passQuality: "photo",
				consumableId: "printhead-dx5",
				rate: 0.0025,
				unit: "wear/m²",
			},
		];
	}

	/**
	 * Gera relatório de custos de insumos
	 */
	static generateConsumablesReport(
		equipmentId: string,
		period: { start: Date; end: Date },
		usageHistory: Array<{
			date: Date;
			area: number;
			passQuality: string;
			consumables: Array<{ id: string; quantityUsed: number; cost: number }>;
		}>,
	) {
		const periodUsage = usageHistory.filter(
			(usage) => usage.date >= period.start && usage.date <= period.end,
		);

		const totalArea = periodUsage.reduce((sum, usage) => sum + usage.area, 0);
		const totalCost = periodUsage.reduce(
			(sum, usage) =>
				sum +
				usage.consumables.reduce(
					(consumableSum, c) => consumableSum + c.cost,
					0,
				),
			0,
		);

		// Agrupar por consumível
		const consumableUsage: Record<string, { quantity: number; cost: number }> =
			{};
		periodUsage.forEach((usage) => {
			usage.consumables.forEach((consumable) => {
				if (!consumableUsage[consumable.id]) {
					consumableUsage[consumable.id] = { quantity: 0, cost: 0 };
				}
				consumableUsage[consumable.id].quantity += consumable.quantityUsed;
				consumableUsage[consumable.id].cost += consumable.cost;
			});
		});

		// Agrupar por qualidade de passada
		const qualityUsage: Record<
			string,
			{ area: number; cost: number; count: number }
		> = {};
		periodUsage.forEach((usage) => {
			if (!qualityUsage[usage.passQuality]) {
				qualityUsage[usage.passQuality] = { area: 0, cost: 0, count: 0 };
			}
			qualityUsage[usage.passQuality].area += usage.area;
			qualityUsage[usage.passQuality].cost += usage.consumables.reduce(
				(sum, c) => sum + c.cost,
				0,
			);
			qualityUsage[usage.passQuality].count += 1;
		});

		return {
			period: {
				start: period.start,
				end: period.end,
				days: Math.ceil(
					(period.end.getTime() - period.start.getTime()) /
						(1000 * 60 * 60 * 24),
				),
			},
			summary: {
				totalJobs: periodUsage.length,
				totalArea,
				totalCost,
				averageCostPerM2: totalArea > 0 ? totalCost / totalArea : 0,
			},
			consumables: consumableUsage,
			qualityBreakdown: qualityUsage,
		};
	}
}
