import { CacheKeys, CacheService, CacheTTL } from "./cache";

export interface Unit {
	id: string;
	name: string;
	symbol: string;
	category: "area" | "length" | "volume" | "weight" | "quantity" | "time";
	baseUnit?: string;
	factor?: number;
	formula?: string;
}

// Unidades simplificadas para comunicação visual
export const visualCommunicationUnits: Unit[] = [
	// Área - Para materiais em chapas/bobinas (vinil, lona, acrílico)
	{
		id: "m2",
		name: "Metro Quadrado",
		symbol: "m²",
		category: "area",
	},

	// Comprimento/Linear - Para materiais lineares (perfis, molduras, cabos)
	{
		id: "m",
		name: "Metro Linear",
		symbol: "m",
		category: "length",
	},

	// Volume - Para líquidos (tintas, solventes, vernizes)
	{
		id: "L",
		name: "Litro",
		symbol: "L",
		category: "volume",
	},

	// Peso - Para materiais pesados quando necessário
	{
		id: "kg",
		name: "Quilograma",
		symbol: "kg",
		category: "weight",
	},

	// Quantidade - Para componentes discretos (parafusos, LEDs, conectores)
	{
		id: "un",
		name: "Unidade",
		symbol: "un",
		category: "quantity",
	},
];

// Manter todas as unidades para compatibilidade com dados existentes
export const defaultUnits: Unit[] = [
	...visualCommunicationUnits,

	// Unidades legadas para migração (marcadas como depreciadas)
	{
		id: "cm2",
		name: "Centímetro Quadrado (depreciado)",
		symbol: "cm²",
		category: "area",
		baseUnit: "m2",
		factor: 0.0001,
	},
	{
		id: "ml",
		name: "Metro Linear (legado)",
		symbol: "ml",
		category: "length",
		baseUnit: "m",
		factor: 1,
	},
	{
		id: "cm",
		name: "Centímetro (depreciado)",
		symbol: "cm",
		category: "length",
		baseUnit: "m",
		factor: 0.01,
	},
	{
		id: "mm",
		name: "Milímetro (depreciado)",
		symbol: "mm",
		category: "length",
		baseUnit: "m",
		factor: 0.001,
	},
	{
		id: "litro",
		name: "Litro (legado)",
		symbol: "L",
		category: "volume",
		baseUnit: "L",
		factor: 1,
	},
	{
		id: "g",
		name: "Grama (depreciado)",
		symbol: "g",
		category: "weight",
		baseUnit: "kg",
		factor: 0.001,
	},
];

export class UnitsService {
	static getUnitById(id: string): Unit | undefined {
		return defaultUnits.find((unit) => unit.id === id);
	}

	// Método principal - retorna apenas unidades de comunicação visual
	static async getVisualCommunicationUnits(): Promise<Unit[]> {
		const cacheKey = CacheKeys.UNITS_VISUAL_COMMUNICATION();

		return await CacheService.getOrSet(
			cacheKey,
			async () => [...visualCommunicationUnits],
			CacheTTL.UNITS,
		);
	}

	static async getUnitsByCategory(category: string): Promise<Unit[]> {
		const cacheKey = CacheKeys.UNITS_BY_CATEGORY(category);

		return await CacheService.getOrSet(
			cacheKey,
			async () =>
				visualCommunicationUnits.filter((unit) => unit.category === category),
			CacheTTL.UNITS,
		);
	}

	static getUnitsByCategorySync(category: string): Unit[] {
		return visualCommunicationUnits.filter(
			(unit) => unit.category === category,
		);
	}

	static async getAllUnits(): Promise<Unit[]> {
		const cacheKey = CacheKeys.UNITS_ALL();

		return await CacheService.getOrSet(
			cacheKey,
			async () => [...visualCommunicationUnits],
			CacheTTL.UNITS,
		);
	}

	// Método para compatibilidade - inclui todas as unidades para migração
	static async getAllUnitsWithLegacy(): Promise<Unit[]> {
		const cacheKey = CacheKeys.UNITS_ALL_LEGACY();

		return await CacheService.getOrSet(
			cacheKey,
			async () => [...defaultUnits],
			CacheTTL.UNITS,
		);
	}

	static convertToBaseUnit(value: number, fromUnit: string): number {
		const unit = UnitsService.getUnitById(fromUnit);
		if (!unit || !unit.baseUnit || !unit.factor) {
			return value;
		}
		return value * unit.factor;
	}

	static convertBetweenUnits(
		value: number,
		fromUnit: string,
		toUnit: string,
	): number {
		const from = UnitsService.getUnitById(fromUnit);
		const to = UnitsService.getUnitById(toUnit);

		if (!from || !to) return value;

		// Se são da mesma categoria, fazer conversão
		if (from.category === to.category) {
			const baseValue = UnitsService.convertToBaseUnit(value, fromUnit);
			const toFactor = to.factor || 1;
			return baseValue / toFactor;
		}

		return value;
	}

	static validateUnit(unitId: string): boolean {
		return defaultUnits.some((unit) => unit.id === unitId);
	}

	static getFormulaSuggestions(): string[] {
		return [
			"quantidade",
			"largura",
			"altura",
			"espessura",
			"perimetro",
			"area",
			"volume",
			"largura * altura",
			"largura * espessura",
			"altura * espessura",
			"2 * (largura + altura)",
			"2 * largura + 2 * altura",
			"quantidade * largura",
			"quantidade * altura",
			"quantidade * (largura * altura)",
			"ceil(altura / espacamento_travas)",
			"ceil(largura / largura_material)",
			"area / rendimento_tinta",
		];
	}
}
