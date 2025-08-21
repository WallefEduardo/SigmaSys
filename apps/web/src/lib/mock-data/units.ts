// Mock data para unidades de medida
export interface Unit {
	id: string;
	name: string;
	symbol: string;
	category: "area" | "length" | "volume" | "weight" | "quantity" | "time";
	description?: string;
	conversionFactor?: number; // Em relação à unidade base da categoria
}

export const mockUnits: Unit[] = [
	// Área
	{ 
		id: "m2", 
		name: "Metro Quadrado", 
		symbol: "m²", 
		category: "area", 
		description: "Unidade padrão para medição de área",
		conversionFactor: 1 
	},
	{ 
		id: "cm2", 
		name: "Centímetro Quadrado", 
		symbol: "cm²", 
		category: "area", 
		description: "Centímetro quadrado",
		conversionFactor: 0.0001 
	},
	{ 
		id: "mm2", 
		name: "Milímetro Quadrado", 
		symbol: "mm²", 
		category: "area", 
		description: "Milímetro quadrado",
		conversionFactor: 0.000001 
	},

	// Comprimento
	{ 
		id: "ml", 
		name: "Metro Linear", 
		symbol: "ml", 
		category: "length", 
		description: "Metro linear para medição de comprimento",
		conversionFactor: 1 
	},
	{ 
		id: "cm", 
		name: "Centímetro", 
		symbol: "cm", 
		category: "length", 
		description: "Centímetro",
		conversionFactor: 0.01 
	},
	{ 
		id: "mm", 
		name: "Milímetro", 
		symbol: "mm", 
		category: "length", 
		description: "Milímetro",
		conversionFactor: 0.001 
	},
	{ 
		id: "perimetro", 
		name: "Perímetro", 
		symbol: "per", 
		category: "length", 
		description: "Medição de perímetro",
		conversionFactor: 1 
	},

	// Volume
	{ 
		id: "litro", 
		name: "Litro", 
		symbol: "L", 
		category: "volume", 
		description: "Litro para medição de volume",
		conversionFactor: 1 
	},
	{ 
		id: "ml_vol", 
		name: "Mililitro", 
		symbol: "ml", 
		category: "volume", 
		description: "Mililitro",
		conversionFactor: 0.001 
	},
	{ 
		id: "m3", 
		name: "Metro Cúbico", 
		symbol: "m³", 
		category: "volume", 
		description: "Metro cúbico",
		conversionFactor: 1000 
	},

	// Peso
	{ 
		id: "kg", 
		name: "Quilograma", 
		symbol: "kg", 
		category: "weight", 
		description: "Quilograma",
		conversionFactor: 1 
	},
	{ 
		id: "g", 
		name: "Grama", 
		symbol: "g", 
		category: "weight", 
		description: "Grama",
		conversionFactor: 0.001 
	},
	{ 
		id: "t", 
		name: "Tonelada", 
		symbol: "t", 
		category: "weight", 
		description: "Tonelada",
		conversionFactor: 1000 
	},

	// Quantidade
	{ 
		id: "un", 
		name: "Unidade", 
		symbol: "un", 
		category: "quantity", 
		description: "Unidade",
		conversionFactor: 1 
	},
	{ 
		id: "par", 
		name: "Par", 
		symbol: "par", 
		category: "quantity", 
		description: "Par (2 unidades)",
		conversionFactor: 2 
	},
	{ 
		id: "duzia", 
		name: "Dúzia", 
		symbol: "dz", 
		category: "quantity", 
		description: "Dúzia (12 unidades)",
		conversionFactor: 12 
	},
	{ 
		id: "peca", 
		name: "Peça", 
		symbol: "pç", 
		category: "quantity", 
		description: "Peça individual",
		conversionFactor: 1 
	},
	{ 
		id: "centena", 
		name: "Centena", 
		symbol: "ct", 
		category: "quantity", 
		description: "Centena (100 unidades)",
		conversionFactor: 100 
	},

	// Tempo
	{ 
		id: "hora", 
		name: "Hora", 
		symbol: "h", 
		category: "time", 
		description: "Hora",
		conversionFactor: 1 
	},
	{ 
		id: "minuto", 
		name: "Minuto", 
		symbol: "min", 
		category: "time", 
		description: "Minuto",
		conversionFactor: 1/60 
	},
	{ 
		id: "segundo", 
		name: "Segundo", 
		symbol: "s", 
		category: "time", 
		description: "Segundo",
		conversionFactor: 1/3600 
	},
	{ 
		id: "dia", 
		name: "Dia", 
		symbol: "d", 
		category: "time", 
		description: "Dia (24 horas)",
		conversionFactor: 24 
	}
];

export const getUnitsByCategory = (category: Unit["category"]) => {
	return mockUnits.filter((unit) => unit.category === category);
};

export const getUnitById = (id: string) => {
	return mockUnits.find((unit) => unit.id === id);
};

// Categorias disponíveis
export const unitCategories = [
	{ id: 'area', name: 'Área', description: 'Unidades de medição de área' },
	{ id: 'length', name: 'Comprimento', description: 'Unidades de medição de comprimento' },
	{ id: 'volume', name: 'Volume', description: 'Unidades de medição de volume' },
	{ id: 'weight', name: 'Peso', description: 'Unidades de medição de peso' },
	{ id: 'quantity', name: 'Quantidade', description: 'Unidades de quantidade' },
	{ id: 'time', name: 'Tempo', description: 'Unidades de tempo' }
] as const;
