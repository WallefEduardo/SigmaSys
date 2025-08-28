// Mock data para acabamentos
export interface Finish {
	id: string;
	name: string;
	description?: string;
	type: "simple" | "composed";
	composition?: {
		materials: Array<{
			materialId: string;
			materialName: string;
			quantity: number;
			unit: string;
			cost: number;
		}>;
		processes: Array<{
			processId: string;
			processName: string;
			timePerUnit: number;
			costPerHour: number;
			totalCost: number;
		}>;
	};
	baseCost: number;
	unit: string;
	margin: number;
	finalPrice: number;
	active: boolean;
	tags: string[];
}

export const mockFinishes: Finish[] = [
	{
		id: "1",
		name: "Laminação Brilhante",
		description: "Laminação com filme brilhante para proteção e acabamento",
		type: "composed",
		composition: {
			materials: [
				{
					materialId: "1",
					materialName: "Filme de Laminação Brilhante",
					quantity: 1.1,
					unit: "m2",
					cost: 8.5,
				},
			],
			processes: [
				{
					processId: "9",
					processName: "Laminação",
					timePerUnit: 0.17,
					costPerHour: 55.0,
					totalCost: 9.35,
				},
			],
		},
		baseCost: 17.85,
		unit: "m2",
		margin: 2.2,
		finalPrice: 39.27,
		active: true,
		tags: ["laminação", "brilhante", "proteção"],
	},
	{
		id: "2",
		name: "Corte a Laser com Gravação",
		description: "Corte preciso com gravação personalizada",
		type: "composed",
		composition: {
			materials: [],
			processes: [
				{
					processId: "6",
					processName: "Corte Laser",
					timePerUnit: 0.083,
					costPerHour: 95.0,
					totalCost: 7.89,
				},
			],
		},
		baseCost: 7.89,
		unit: "ml",
		margin: 3.5,
		finalPrice: 27.62,
		active: true,
		tags: ["laser", "corte", "gravação", "precisão"],
	},
	{
		id: "3",
		name: "Aplicação de Vinil com Rebite",
		description: "Aplicação de vinil adesivo com fixação por rebites",
		type: "composed",
		composition: {
			materials: [
				{
					materialId: "4",
					materialName: "Rebite Inox 4mm",
					quantity: 4,
					unit: "un",
					cost: 0.85,
				},
			],
			processes: [
				{
					processId: "5",
					processName: "Aplicação de Vinil",
					timePerUnit: 0.5,
					costPerHour: 45.0,
					totalCost: 22.5,
				},
			],
		},
		baseCost: 25.9,
		unit: "m2",
		margin: 2.8,
		finalPrice: 72.52,
		active: true,
		tags: ["vinil", "aplicação", "rebite", "fixação"],
	},
	{
		id: "4",
		name: "Soldagem de Estrutura",
		description: "Soldagem TIG para estruturas metálicas",
		type: "simple",
		baseCost: 32.5,
		unit: "ml",
		margin: 2.5,
		finalPrice: 81.25,
		active: true,
		tags: ["soldagem", "tig", "estrutura", "metal"],
	},
	{
		id: "5",
		name: "Pintura Automotiva Premium",
		description: "Pintura com tinta automotiva e verniz UV",
		type: "composed",
		composition: {
			materials: [
				{
					materialId: "3",
					materialName: "Tinta Automotiva Base",
					quantity: 0.2,
					unit: "litro",
					cost: 85.0,
				},
				{
					materialId: "3",
					materialName: "Verniz UV",
					quantity: 0.1,
					unit: "litro",
					cost: 120.0,
				},
			],
			processes: [
				{
					processId: "8",
					processName: "Pintura Automotiva",
					timePerUnit: 1.0,
					costPerHour: 85.0,
					totalCost: 85.0,
				},
			],
		},
		baseCost: 188.0,
		unit: "m2",
		margin: 2.0,
		finalPrice: 376.0,
		active: true,
		tags: ["pintura", "automotiva", "verniz", "premium"],
	},
	{
		id: "6",
		name: "Montagem com Parafusos",
		description: "Montagem manual com parafusos e arruelas",
		type: "composed",
		composition: {
			materials: [
				{
					materialId: "4",
					materialName: "Parafuso Inox M6x20",
					quantity: 8,
					unit: "un",
					cost: 0.85,
				},
				{
					materialId: "4",
					materialName: "Arruela Inox M6",
					quantity: 8,
					unit: "un",
					cost: 0.25,
				},
			],
			processes: [
				{
					processId: "4",
					processName: "Montagem Manual",
					timePerUnit: 0.33,
					costPerHour: 35.0,
					totalCost: 11.55,
				},
			],
		},
		baseCost: 20.35,
		unit: "un",
		margin: 2.2,
		finalPrice: 44.77,
		active: true,
		tags: ["montagem", "parafusos", "manual", "fixação"],
	},
];

export const getFinishesByType = (type: Finish["type"] | "all") => {
	if (type === "all") return mockFinishes.filter((f) => f.active);
	return mockFinishes.filter((f) => f.type === type && f.active);
};

export const getFinishById = (id: string) => {
	return mockFinishes.find((f) => f.id === id);
};

export const calculateFinishCost = (finish: Finish, quantity = 1) => {
	const baseCost = finish.baseCost * quantity;
	const finalPrice = finish.finalPrice * quantity;
	return { baseCost, finalPrice, margin: finish.margin };
};

// Função para buscar acabamentos
export function searchFinishes(searchTerm: string): Finish[] {
	const term = searchTerm.toLowerCase();
	return mockFinishes.filter(
		(finish) =>
			finish.name.toLowerCase().includes(term) ||
			finish.description?.toLowerCase().includes(term) ||
			finish.tags.some((tag) => tag.toLowerCase().includes(term)),
	);
}

// Obter tipos únicos
export function getFinishTypes(): string[] {
	return [...new Set(mockFinishes.map((finish) => finish.type))];
}

// Cores para tipos
export const finishTypeColors = {
	simple: "default",
	composed: "secondary",
} as const;

// Labels para tipos
export const finishTypeLabels = {
	simple: "Simples",
	composed: "Composto",
} as const;
