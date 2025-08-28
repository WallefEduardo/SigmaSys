import type { MathNode } from "mathjs";
import { evaluate, parse } from "mathjs";
import { CacheKeys, CacheService, CacheTTL } from "./cache";
import { logger } from "./logger";
import { TelemetryService } from "./telemetry-mock";
import { UnitsService } from "./units";

export interface FormulaVariable {
	name: string;
	type: "number" | "dimension" | "constant";
	description: string;
	unit?: string;
	defaultValue?: number;
	required: boolean;
}

export interface FormulaContext {
	quantidade?: number;
	largura?: number;
	altura?: number;
	espessura?: number;
	area?: number;
	perimetro?: number;
	volume?: number;
	espacamento_travas?: number;
	largura_material?: number;
	rendimento_tinta?: number;
	densidade?: number;
	peso_especifico?: number;
	[key: string]: number | undefined;
}

export interface FormulaResult {
	value: number;
	unit: string;
	variables: Record<string, number>;
	formula: string;
	steps?: string[];
}

export class FormulaEngine {
	private static readonly AVAILABLE_VARIABLES: FormulaVariable[] = [
		{
			name: "quantidade",
			type: "number",
			description: "Quantidade de itens",
			unit: "un",
			required: true,
		},
		{
			name: "largura",
			type: "dimension",
			description: "Largura em metros",
			unit: "ml",
			required: false,
		},
		{
			name: "altura",
			type: "dimension",
			description: "Altura em metros",
			unit: "ml",
			required: false,
		},
		{
			name: "espessura",
			type: "dimension",
			description: "Espessura em metros",
			unit: "ml",
			required: false,
		},
		{
			name: "area",
			type: "dimension",
			description: "Área em metros quadrados",
			unit: "m2",
			required: false,
		},
		{
			name: "perimetro",
			type: "dimension",
			description: "Perímetro em metros",
			unit: "ml",
			required: false,
		},
		{
			name: "volume",
			type: "dimension",
			description: "Volume em metros cúbicos",
			unit: "m3",
			required: false,
		},
		{
			name: "espacamento_travas",
			type: "constant",
			description: "Espaçamento entre travas",
			unit: "ml",
			defaultValue: 1.0,
			required: false,
		},
		{
			name: "largura_material",
			type: "constant",
			description: "Largura padrão do material",
			unit: "ml",
			required: false,
		},
		{
			name: "rendimento_tinta",
			type: "constant",
			description: "Rendimento da tinta por m²",
			unit: "m2",
			required: false,
		},
		{
			name: "densidade",
			type: "constant",
			description: "Densidade do material",
			unit: "kg",
			required: false,
		},
		{
			name: "peso_especifico",
			type: "constant",
			description: "Peso específico",
			unit: "kg",
			required: false,
		},
	];

	private static readonly MATHEMATICAL_FUNCTIONS = [
		"abs",
		"ceil",
		"floor",
		"round",
		"sqrt",
		"pow",
		"min",
		"max",
		"sin",
		"cos",
		"tan",
		"log",
		"exp",
	];

	static async validateFormula(
		formula: string,
	): Promise<{ valid: boolean; error?: string; variables: string[] }> {
		// Verificar cache primeiro
		const cacheKey = CacheKeys.FORMULA_VALIDATION(formula);
		const cached = await CacheService.get<{
			valid: boolean;
			error?: string;
			variables: string[];
		}>(cacheKey);

		if (cached) {
			logger.debug("Formula validation cache hit", {
				formula: formula.substring(0, 50),
			});
			return cached;
		}

		try {
			// Parse da fórmula
			const parsed = parse(formula);

			// Extrair variáveis usadas
			const variables = FormulaEngine.extractVariables(parsed);

			// Validar se todas as variáveis são conhecidas
			const unknownVariables = variables.filter(
				(variable) =>
					!FormulaEngine.AVAILABLE_VARIABLES.some((v) => v.name === variable) &&
					!FormulaEngine.MATHEMATICAL_FUNCTIONS.includes(variable),
			);

			if (unknownVariables.length > 0) {
				const result = {
					valid: false,
					error: `Variáveis desconhecidas: ${unknownVariables.join(", ")}`,
					variables,
				};

				// Cache resultado de erro também (TTL menor)
				await CacheService.set(cacheKey, result, CacheTTL.FORMULAS / 4);
				return result;
			}

			// Teste com valores dummy
			const testContext: FormulaContext = {};
			variables.forEach((variable) => {
				const varDef = FormulaEngine.AVAILABLE_VARIABLES.find(
					(v) => v.name === variable,
				);
				if (varDef) {
					testContext[variable] = varDef.defaultValue || 1;
				}
			});

			const testResult = evaluate(formula, testContext);

			if (
				typeof testResult !== "number" ||
				isNaN(testResult) ||
				!isFinite(testResult)
			) {
				const result = {
					valid: false,
					error: "Fórmula não retorna um número válido",
					variables,
				};

				// Cache resultado de erro também (TTL menor)
				await CacheService.set(cacheKey, result, CacheTTL.FORMULAS / 4);
				return result;
			}

			const result = { valid: true, variables };

			// Cache resultado válido
			await CacheService.set(cacheKey, result, CacheTTL.FORMULAS);
			logger.debug("Formula validation cached", {
				formula: formula.substring(0, 50),
				valid: true,
			});

			return result;
		} catch (error) {
			const result = {
				valid: false,
				error: `Erro de sintaxe: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
				variables: [],
			};

			// Cache erro de sintaxe (TTL menor)
			await CacheService.set(cacheKey, result, CacheTTL.FORMULAS / 4);
			return result;
		}
	}

	static async calculateFormula(
		formula: string,
		context: FormulaContext,
		targetUnit = "un",
	): Promise<FormulaResult> {
		const startTime = Date.now();

		try {
			// Criar chave de cache baseada na fórmula e contexto
			const contextStr = JSON.stringify(context) + targetUnit;
			const cacheKey = CacheKeys.FORMULA_RESULT(formula, contextStr);

			// Verificar cache primeiro
			const cached = await CacheService.get<FormulaResult>(cacheKey);
			if (cached) {
				const duration = Date.now() - startTime;
				TelemetryService.recordCacheOperation("hit", cacheKey, duration);
				logger.debug("Formula calculation cache hit", {
					formula: formula.substring(0, 50),
					executionTime: duration,
				});
				return cached;
			}

			TelemetryService.recordCacheOperation("miss", cacheKey);

			// Validar fórmula (com cache próprio)
			const validation = await FormulaEngine.validateFormula(formula);
			if (!validation.valid) {
				throw new Error(validation.error);
			}

			// Pré-processar contexto (calcular valores derivados)
			const processedContext = FormulaEngine.preprocessContext(context);

			// Executar cálculo
			const rawResult = evaluate(formula, processedContext);

			if (
				typeof rawResult !== "number" ||
				isNaN(rawResult) ||
				!isFinite(rawResult)
			) {
				throw new Error("Resultado do cálculo é inválido");
			}

			// Arredondar para 4 casas decimais
			const value = Math.round(rawResult * 10000) / 10000;

			const result: FormulaResult = {
				value,
				unit: targetUnit,
				variables: processedContext,
				formula,
				steps: FormulaEngine.generateCalculationSteps(
					formula,
					processedContext,
					value,
				),
			};

			// Cache o resultado
			await CacheService.set(cacheKey, result, CacheTTL.CALCULATIONS);

			const executionTime = Date.now() - startTime;

			// Registrar métricas de telemetria
			TelemetryService.recordFormulaCalculation(
				formula,
				executionTime,
				true,
				Object.keys(processedContext).length,
			);

			logger.debug("Formula calculation completed and cached", {
				formula: formula.substring(0, 50),
				value,
				executionTime,
			});

			return result;
		} catch (error) {
			const executionTime = Date.now() - startTime;

			// Registrar erro na telemetria
			TelemetryService.recordFormulaCalculation(
				formula,
				executionTime,
				false,
				Object.keys(context).length,
			);

			TelemetryService.recordError(
				"formula_calculation",
				"medium",
				"formula_engine",
			);

			logger.error("Formula calculation error", {
				formula: formula.substring(0, 50),
				context,
				error: error instanceof Error ? error.message : "Unknown error",
				executionTime,
			});

			throw new Error(
				`Erro no cálculo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
			);
		}
	}

	private static preprocessContext(context: FormulaContext): FormulaContext {
		const processed = { ...context };

		// Calcular valores derivados se não fornecidos
		if (processed.largura && processed.altura && !processed.area) {
			processed.area = processed.largura * processed.altura;
		}

		if (processed.largura && processed.altura && !processed.perimetro) {
			processed.perimetro = 2 * (processed.largura + processed.altura);
		}

		if (
			processed.largura &&
			processed.altura &&
			processed.espessura &&
			!processed.volume
		) {
			processed.volume =
				processed.largura * processed.altura * processed.espessura;
		}

		// Definir valores padrão
		if (!processed.espacamento_travas) {
			processed.espacamento_travas = 1.0;
		}

		return processed;
	}

	private static extractVariables(node: MathNode): string[] {
		const variables: Set<string> = new Set();

		node.traverse((childNode: any) => {
			if (childNode.type === "SymbolNode") {
				variables.add(childNode.name);
			}
		});

		return Array.from(variables).filter(
			(name) =>
				!FormulaEngine.MATHEMATICAL_FUNCTIONS.includes(name) &&
				name !== "pi" &&
				name !== "e",
		);
	}

	private static generateCalculationSteps(
		formula: string,
		context: FormulaContext,
		result: number,
	): string[] {
		const steps: string[] = [];

		steps.push(`Fórmula: ${formula}`);

		const variables = Object.entries(context)
			.filter(([_, value]) => value !== undefined)
			.map(([key, value]) => `${key} = ${value}`);

		if (variables.length > 0) {
			steps.push(`Variáveis: ${variables.join(", ")}`);
		}

		steps.push(`Resultado: ${result}`);

		return steps;
	}

	static getAvailableVariables(): FormulaVariable[] {
		return FormulaEngine.AVAILABLE_VARIABLES;
	}

	static previewFormula(
		formula: string,
		sampleContext?: Partial<FormulaContext>,
	): {
		preview: string;
		result?: number;
		error?: string;
	} {
		try {
			const defaultContext: FormulaContext = {
				quantidade: 1,
				largura: 2,
				altura: 1.5,
				espessura: 0.1,
				espacamento_travas: 1.0,
				largura_material: 1.2,
				rendimento_tinta: 8,
				densidade: 1.5,
				peso_especifico: 2.5,
				...sampleContext,
			};

			const result = FormulaEngine.calculateFormula(formula, defaultContext);

			return {
				preview: `Com valores exemplo: ${formula} = ${result.value}`,
				result: result.value,
			};
		} catch (error) {
			return {
				preview: `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
				error: error instanceof Error ? error.message : "Erro desconhecido",
			};
		}
	}

	static suggestFormulas(
		category: "area" | "length" | "volume" | "weight" | "quantity",
	): string[] {
		const suggestions: Record<string, string[]> = {
			area: [
				"largura * altura",
				"quantidade * (largura * altura)",
				"area",
				"perimetro * espessura",
			],
			length: [
				"largura",
				"altura",
				"perimetro",
				"2 * (largura + altura)",
				"quantidade * largura",
				"ceil(altura / espacamento_travas)",
				"ceil(largura / largura_material)",
			],
			volume: [
				"largura * altura * espessura",
				"area * espessura",
				"volume",
				"quantidade * volume",
			],
			weight: [
				"volume * densidade",
				"area * peso_especifico",
				"quantidade * peso_especifico",
			],
			quantity: [
				"quantidade",
				"ceil(area / rendimento_tinta)",
				"ceil(largura / largura_material)",
				"ceil(altura / espacamento_travas)",
			],
		};

		return suggestions[category] || [];
	}
}
