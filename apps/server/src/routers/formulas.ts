import { z } from "zod";
import { type FormulaContext, FormulaEngine } from "../lib/formulas";
import { RateLimitConfig, withRateLimit } from "../lib/rate-limiter";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { UnitsService } from "../lib/units";

export const formulasRouter = router({
	// Validar fórmula (público para testes e preview)
	validate: publicProcedure
		.input(
			z.object({
				formula: z.string().min(1, "Fórmula é obrigatória"),
			}),
		)
		.query(async ({ input }) => {
			return await FormulaEngine.validateFormula(input.formula);
		}),

	// Calcular fórmula com contexto (público para testes) - COM RATE LIMITING
	calculate: publicProcedure
		.input(
			z.object({
				formula: z.string().min(1, "Fórmula é obrigatória"),
				context: z
					.object({
						quantidade: z.number().optional(),
						largura: z.number().optional(),
						altura: z.number().optional(),
						espessura: z.number().optional(),
						area: z.number().optional(),
						perimetro: z.number().optional(),
						volume: z.number().optional(),
						espacamento_travas: z.number().optional(),
						largura_material: z.number().optional(),
						rendimento_tinta: z.number().optional(),
						densidade: z.number().optional(),
						peso_especifico: z.number().optional(),
					})
					.passthrough(),
				targetUnit: z.string().default("un"),
			}),
		)
		.query(
			withRateLimit(
				"formulas",
				RateLimitConfig.FORMULAS,
			)(async ({ input }) => {
				return await FormulaEngine.calculateFormula(
					input.formula,
					input.context as FormulaContext,
					input.targetUnit,
				);
			}),
		),

	// Preview de fórmula (público para testes)
	preview: publicProcedure
		.input(
			z.object({
				formula: z.string().min(1, "Fórmula é obrigatória"),
				sampleContext: z
					.object({
						quantidade: z.number().optional(),
						largura: z.number().optional(),
						altura: z.number().optional(),
						espessura: z.number().optional(),
						area: z.number().optional(),
						perimetro: z.number().optional(),
						volume: z.number().optional(),
						espacamento_travas: z.number().optional(),
						largura_material: z.number().optional(),
						rendimento_tinta: z.number().optional(),
						densidade: z.number().optional(),
						peso_especifico: z.number().optional(),
					})
					.optional(),
			}),
		)
		.query(({ input }) => {
			return FormulaEngine.previewFormula(input.formula, input.sampleContext);
		}),

	// Obter variáveis disponíveis (público)
	variables: publicProcedure.query(() => {
		return FormulaEngine.getAvailableVariables();
	}),

	// Obter sugestões de fórmulas (público)
	suggestions: publicProcedure
		.input(
			z.object({
				category: z.enum(["area", "length", "volume", "weight", "quantity"]),
			}),
		)
		.query(({ input }) => {
			return FormulaEngine.suggestFormulas(input.category);
		}),

	// Obter unidades disponíveis (público)
	units: publicProcedure
		.input(
			z.object({
				category: z
					.enum(["area", "length", "volume", "weight", "quantity", "time"])
					.optional(),
			}),
		)
		.query(async ({ input }) => {
			if (input.category) {
				return await UnitsService.getUnitsByCategory(input.category);
			}

			// Retornar todas as unidades organizadas por categoria
			const [area, length, volume, weight, quantity, time] = await Promise.all([
				UnitsService.getUnitsByCategory("area"),
				UnitsService.getUnitsByCategory("length"),
				UnitsService.getUnitsByCategory("volume"),
				UnitsService.getUnitsByCategory("weight"),
				UnitsService.getUnitsByCategory("quantity"),
				UnitsService.getUnitsByCategory("time"),
			]);

			return { area, length, volume, weight, quantity, time };
		}),

	// Converter entre unidades (público)
	convertUnits: publicProcedure
		.input(
			z.object({
				value: z.number(),
				fromUnit: z.string(),
				toUnit: z.string(),
			}),
		)
		.query(({ input }) => {
			const convertedValue = UnitsService.convertBetweenUnits(
				input.value,
				input.fromUnit,
				input.toUnit,
			);

			return {
				originalValue: input.value,
				originalUnit: input.fromUnit,
				convertedValue,
				convertedUnit: input.toUnit,
				conversionPossible:
					convertedValue !== input.value || input.fromUnit === input.toUnit,
			};
		}),

	// Obter sugestões de fórmulas baseadas em texto (público)
	formulaSuggestions: publicProcedure.query(() => {
		return UnitsService.getFormulaSuggestions();
	}),
});
