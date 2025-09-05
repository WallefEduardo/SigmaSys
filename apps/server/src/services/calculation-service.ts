import { prisma } from "@repo/database/client";
import {
	type CalculationResult,
	FormulaEngine,
	type FormulaVariables,
} from "../lib/formula-engine";
import { logger } from "../lib/logger";

/**
 * 🧮 CALCULATION SERVICE - Serviço de Cálculos Inteligentes
 *
 * Responsável por calcular custos de materiais usando regras dinâmicas
 * e fórmulas matemáticas configuradas no sistema.
 */

export interface MaterialCostCalculation {
	materialId: string;
	materialName: string;
	ruleId: string;
	ruleName: string;
	formula: string;
	variables: FormulaVariables;
	calculatedQuantity: number;
	unitCost: number;
	totalCost: number;
	unit: string;
}

export interface ProductCostResult {
	productId: string;
	productName: string;
	totalMaterialCost: number;
	totalEquipmentCost: number;
	totalProcessCost: number;
	totalCost: number;
	calculations: MaterialCostCalculation[];
	errors: string[];
}

export class CalculationService {
	constructor(private db = prisma) {}

	/**
	 * Calcula custo de um material específico usando regra de cálculo
	 */
	async calculateMaterialCost(
		materialId: string,
		ruleId: string,
		variables: FormulaVariables,
		companyId: string,
	): Promise<MaterialCostCalculation> {
		const startTime = Date.now();

		try {
			// Buscar material e regra
			const [material, rule] = await Promise.all([
				this.db.material.findFirst({
					where: { id: materialId, companyId },
					select: { id: true, name: true, cost: true, unit: true },
				}),
				this.db.calculationRule.findUnique({
					where: { id: ruleId },
					select: { id: true, name: true, formula: true, resultUnit: true },
				}),
			]);

			if (!material) {
				throw new Error(`Material ${materialId} não encontrado`);
			}

			if (!rule) {
				throw new Error(`Regra de cálculo ${ruleId} não encontrada`);
			}

			// Calcular quantidade usando a fórmula
			const calculationResult = FormulaEngine.calculateWithRule(
				rule.formula,
				variables,
				rule.resultUnit,
			);

			if (calculationResult.error) {
				throw new Error(calculationResult.error);
			}

			const calculatedQuantity = calculationResult.result;
			const unitCost = Number(material.cost);
			const totalCost = calculatedQuantity * unitCost;

			const calculation: MaterialCostCalculation = {
				materialId: material.id,
				materialName: material.name,
				ruleId: rule.id,
				ruleName: rule.name,
				formula: rule.formula,
				variables,
				calculatedQuantity,
				unitCost,
				totalCost,
				unit: rule.resultUnit,
			};

			// Log da operação
			const duration = Date.now() - startTime;
			logger.info("Material cost calculated", {
				materialId,
				ruleId,
				calculatedQuantity,
				totalCost,
				duration,
			});

			return calculation;
		} catch (error) {
			const duration = Date.now() - startTime;
			logger.error("Failed to calculate material cost", {
				materialId,
				ruleId,
				error: (error as Error).message,
				duration,
			});
			throw error;
		}
	}

	/**
	 * Calcula custo total de um produto com base nas respostas do checklist
	 */
	async calculateProductCost(
		productId: string,
		answers: Record<string, string>, // questionId -> answerOption
		measurements: FormulaVariables,
		companyId: string,
	): Promise<ProductCostResult> {
		const startTime = Date.now();

		try {
			// Buscar produto
			const product = await this.db.product.findFirst({
				where: { id: productId, companyId },
				select: { id: true, name: true },
			});

			if (!product) {
				throw new Error(`Produto ${productId} não encontrado`);
			}

			// Buscar regras de material do produto baseadas nas respostas
			const materialRules = await this.db.productMaterialRule.findMany({
				where: {
					productId,
					AND: Object.entries(answers).map(([questionId, answerOption]) => ({
						questionId,
						answerOption,
					})),
				},
				include: {
					material: {
						select: { id: true, name: true, cost: true, unit: true },
					},
					calculationRule: {
						select: { id: true, name: true, formula: true, resultUnit: true },
					},
					equipment: { select: { id: true, name: true } },
				},
			});

			const calculations: MaterialCostCalculation[] = [];
			const errors: string[] = [];
			let totalMaterialCost = 0;

			// Calcular custo de cada material
			for (const rule of materialRules) {
				try {
					const calculation = await this.calculateMaterialCost(
						rule.materialId,
						rule.calculationRuleId,
						measurements,
						companyId,
					);

					// Aplicar multiplicador e fator de desperdício
					const adjustedQuantity =
						calculation.calculatedQuantity *
						Number(rule.multiplier) *
						(1 + Number(rule.wasteFactor));
					const adjustedTotalCost = adjustedQuantity * calculation.unitCost;

					calculations.push({
						...calculation,
						calculatedQuantity: adjustedQuantity,
						totalCost: adjustedTotalCost,
					});

					totalMaterialCost += adjustedTotalCost;
				} catch (error) {
					errors.push(
						`Erro no material ${rule.material.name}: ${(error as Error).message}`,
					);
				}
			}

			const result: ProductCostResult = {
				productId: product.id,
				productName: product.name,
				totalMaterialCost,
				totalEquipmentCost: 0, // TODO: Implementar cálculo de equipamentos
				totalProcessCost: 0, // TODO: Implementar cálculo de processos
				totalCost: totalMaterialCost,
				calculations,
				errors,
			};

			// Log da operação
			const duration = Date.now() - startTime;
			logger.info("Product cost calculated", {
				productId,
				totalCost: result.totalCost,
				calculationsCount: calculations.length,
				errorsCount: errors.length,
				duration,
			});

			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			logger.error("Failed to calculate product cost", {
				productId,
				error: (error as Error).message,
				duration,
			});
			throw error;
		}
	}

	/**
	 * Salva cálculo no log para auditoria
	 */
	async logCalculation(
		quoteId: string,
		ruleId: string,
		inputVariables: FormulaVariables,
		calculatedValue: number,
		unitCost: number,
		totalCost: number,
	): Promise<void> {
		try {
			await this.db.quoteCalculation.create({
				data: {
					quoteId,
					ruleId,
					inputVariables,
					calculatedValue,
					unitCost,
					totalCost,
				},
			});

			logger.debug("Calculation logged", {
				quoteId,
				ruleId,
				calculatedValue,
				totalCost,
			});
		} catch (error) {
			logger.error("Failed to log calculation", {
				quoteId,
				ruleId,
				error: (error as Error).message,
			});
			// Não propagar erro - log é opcional
		}
	}

	/**
	 * Busca histórico de cálculos
	 */
	async getCalculationHistory(quoteId: string): Promise<
		Array<{
			id: string;
			ruleName: string;
			formula: string;
			inputVariables: FormulaVariables;
			calculatedValue: number;
			totalCost: number;
			createdAt: Date;
		}>
	> {
		const calculations = await this.db.quoteCalculation.findMany({
			where: { quoteId },
			include: {
				rule: { select: { name: true, formula: true } },
			},
			orderBy: { createdAt: "desc" },
		});

		return calculations.map((calc) => ({
			id: calc.id,
			ruleName: calc.rule.name,
			formula: calc.rule.formula,
			inputVariables: calc.inputVariables as FormulaVariables,
			calculatedValue: Number(calc.calculatedValue),
			totalCost: Number(calc.totalCost),
			createdAt: calc.createdAt,
		}));
	}
}
