import { evaluate } from "mathjs";

/**
 * 🧮 FORMULA ENGINE - Sistema de Cálculos Inteligentes
 *
 * Engine responsável por avaliar fórmulas matemáticas dinâmicas
 * com variáveis de entrada para cálculo de materiais.
 */

export interface FormulaVariables {
	L?: number; // Largura
	A?: number; // Altura
	E?: number; // Espessura
	P?: number; // Perímetro
	M?: number; // Margem
	D?: number; // Densidade
	F?: number; // Fator/Faces
	[key: string]: number | undefined;
}

export interface CalculationResult {
	result: number;
	formula: string;
	variables: FormulaVariables;
	unit: string;
	error?: string;
}

export class FormulaEngine {
	/**
	 * Avalia uma fórmula matemática com as variáveis fornecidas
	 */
	static evaluate(formula: string, variables: FormulaVariables): number {
		try {
			// Sanitizar fórmula - remover caracteres perigosos
			const sanitizedFormula = FormulaEngine.sanitizeFormula(formula);

			// Substituir variáveis na fórmula
			const processedFormula = FormulaEngine.processFormula(
				sanitizedFormula,
				variables,
			);

			// Avaliar usando mathjs
			const result = evaluate(processedFormula);

			// Garantir que o resultado é um número válido
			if (typeof result !== "number" || !isFinite(result)) {
				throw new Error("Resultado da fórmula inválido");
			}

			return Number(result.toFixed(6)); // Precisão de 6 casas decimais
		} catch (error) {
			throw new Error(`Erro ao avaliar fórmula: ${(error as Error).message}`);
		}
	}

	/**
	 * Calcula usando regra específica
	 */
	static calculateWithRule(
		formula: string,
		variables: FormulaVariables,
		resultUnit: string,
	): CalculationResult {
		try {
			const result = FormulaEngine.evaluate(formula, variables);

			return {
				result,
				formula,
				variables,
				unit: resultUnit,
			};
		} catch (error) {
			return {
				result: 0,
				formula,
				variables,
				unit: resultUnit,
				error: (error as Error).message,
			};
		}
	}

	/**
	 * Valida se uma fórmula é válida
	 */
	static validate(formula: string, requiredVars: string[]): boolean {
		try {
			// Verificar se todas as variáveis necessárias estão presentes
			const formulaVars = FormulaEngine.extractVariables(formula);
			const missingVars = requiredVars.filter((v) => !formulaVars.includes(v));

			if (missingVars.length > 0) {
				throw new Error(
					`Variáveis obrigatórias ausentes: ${missingVars.join(", ")}`,
				);
			}

			// Testar fórmula com valores de teste
			const testVars: FormulaVariables = {};
			formulaVars.forEach((v) => (testVars[v] = 1));

			FormulaEngine.evaluate(formula, testVars);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Extrai variáveis de uma fórmula
	 */
	static extractVariables(formula: string): string[] {
		const variables = new Set<string>();
		const regex = /[A-Z][A-Z0-9]*/g;
		let match;

		while ((match = regex.exec(formula)) !== null) {
			variables.add(match[0]);
		}

		return Array.from(variables);
	}

	/**
	 * Sanitiza fórmula removendo caracteres perigosos
	 */
	private static sanitizeFormula(formula: string): string {
		// Remover caracteres que não são operadores matemáticos, números ou variáveis
		return formula.replace(/[^A-Z0-9+\-*/().\s]/gi, "");
	}

	/**
	 * Processa fórmula substituindo variáveis por valores
	 */
	private static processFormula(
		formula: string,
		variables: FormulaVariables,
	): string {
		let processedFormula = formula;

		// Substituir cada variável pelo seu valor
		Object.entries(variables).forEach(([variable, value]) => {
			if (value !== undefined) {
				const regex = new RegExp(`\\b${variable}\\b`, "g");
				processedFormula = processedFormula.replace(regex, value.toString());
			}
		});

		return processedFormula;
	}
}

/**
 * 📐 REGRAS DE CÁLCULO PRÉ-DEFINIDAS
 * Fórmulas padrão do sistema organizadas por categoria
 */

export interface PredefinedRule {
	id: string;
	name: string;
	category: "AREA" | "LENGTH" | "UNIT";
	formula: string;
	variables: string[];
	resultUnit: string;
	description: string;
}

export const PREDEFINED_RULES: PredefinedRule[] = [
	// 📐 FÓRMULAS DE ÁREA
	{
		id: "area_frontal",
		name: "Área Frontal",
		category: "AREA",
		formula: "L * A",
		variables: ["L", "A"],
		resultUnit: "m2",
		description: "Área da face frontal (Largura × Altura)",
	},
	{
		id: "area_traseira",
		name: "Área Traseira",
		category: "AREA",
		formula: "L * A",
		variables: ["L", "A"],
		resultUnit: "m2",
		description: "Área da face traseira (Largura × Altura)",
	},
	{
		id: "area_laterais",
		name: "Área das Laterais",
		category: "AREA",
		formula: "((L + A) * 2) * E",
		variables: ["L", "A", "E"],
		resultUnit: "m2",
		description: "Área das laterais com avanço ((L+A)×2×E)",
	},
	{
		id: "area_total",
		name: "Área Total",
		category: "AREA",
		formula: "(L * A * 2) + ((L + A) * 2 * E)",
		variables: ["L", "A", "E"],
		resultUnit: "m2",
		description: "Área completa: frente + trás + laterais",
	},
	{
		id: "area_com_margem",
		name: "Área com Margem",
		category: "AREA",
		formula: "(L + M) * (A + M)",
		variables: ["L", "A", "M"],
		resultUnit: "m2",
		description: "Área com margem de segurança para corte",
	},

	// 📏 FÓRMULAS DE COMPRIMENTO
	{
		id: "perimetro_frontal",
		name: "Perímetro Frontal",
		category: "LENGTH",
		formula: "(L + A) * 2",
		variables: ["L", "A"],
		resultUnit: "ml",
		description: "Perímetro da face frontal",
	},
	{
		id: "estrutura_profundidade",
		name: "Estrutura de Profundidade",
		category: "LENGTH",
		formula: "E * 4",
		variables: ["E"],
		resultUnit: "ml",
		description: "Travessas de profundidade (4 lados)",
	},
	{
		id: "comprimento_largura",
		name: "Comprimento da Largura",
		category: "LENGTH",
		formula: "L",
		variables: ["L"],
		resultUnit: "ml",
		description: "Apenas a largura",
	},
	{
		id: "comprimento_altura",
		name: "Comprimento da Altura",
		category: "LENGTH",
		formula: "A",
		variables: ["A"],
		resultUnit: "ml",
		description: "Apenas a altura",
	},
	{
		id: "soma_arestas",
		name: "Soma de Todas as Arestas",
		category: "LENGTH",
		formula: "(L + A + E) * 4",
		variables: ["L", "A", "E"],
		resultUnit: "ml",
		description: "Comprimento total de todas as arestas",
	},

	// 🔢 FÓRMULAS DE UNIDADE
	{
		id: "unidades_por_m2",
		name: "Unidades por Metro Quadrado",
		category: "UNIT",
		formula: "(L * A) * D",
		variables: ["L", "A", "D"],
		resultUnit: "un",
		description: "Quantidade baseada na área × densidade",
	},
	{
		id: "unidades_por_ml",
		name: "Unidades por Metro Linear",
		category: "UNIT",
		formula: "((L + A) * 2) * D",
		variables: ["L", "A", "D"],
		resultUnit: "un",
		description: "Quantidade baseada no perímetro × densidade",
	},
	{
		id: "unidades_cantos",
		name: "Unidades nos Cantos",
		category: "UNIT",
		formula: "4",
		variables: [],
		resultUnit: "un",
		description: "Quantidade fixa de 4 unidades (cantos)",
	},
	{
		id: "unidades_por_face",
		name: "Unidades por Face",
		category: "UNIT",
		formula: "F * D",
		variables: ["F", "D"],
		resultUnit: "un",
		description: "Quantidade por número de faces × densidade",
	},
];

/**
 * Helper para buscar regra pré-definida
 */
export const getPredefinedRule = (id: string): PredefinedRule | undefined => {
	return PREDEFINED_RULES.find((rule) => rule.id === id);
};

/**
 * Helper para buscar regras por categoria
 */
export const getRulesByCategory = (
	category: "AREA" | "LENGTH" | "UNIT",
): PredefinedRule[] => {
	return PREDEFINED_RULES.filter((rule) => rule.category === category);
};
