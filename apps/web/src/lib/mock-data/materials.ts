// Mock data para materiais
export interface Material {
	id: string;
	name: string;
	description?: string;
	code?: string;
	unit: string;
	cost: number;
	category?: string;
	brand?: string;
	color?: string;
	dimensions?: {
		width?: number;
		height?: number;
		thickness?: number;
	};
	tags: string[];
	supplier?: string;
	supplierCode?: string;
	minStock?: number;
	maxStock?: number;
	currentStock?: number;
	location?: string;
	barcode?: string;
	image?: string;
	active: boolean;
	priceHistory: Array<{
		date: string;
		cost: number;
		reason?: string;
	}>;
	createdAt?: string;
	updatedAt?: string;
}

export const mockMaterials: Material[] = [
	{
		id: "1",
		name: "Vinil Adesivo Branco",
		description:
			"Vinil adesivo branco para impressão digital, alta durabilidade",
		code: "VIN-001",
		unit: "m2",
		cost: 12.5,
		category: "Vinil",
		brand: "Avery Dennison",
		color: "Branco",
		dimensions: { width: 1.37, thickness: 0.1 },
		tags: ["adesivo", "vinil", "impressão", "branco"],
		supplier: "Materiais Gráficos LTDA",
		supplierCode: "AVE-WHT-137",
		minStock: 100,
		maxStock: 500,
		currentStock: 250,
		location: "Estoque A - Prateleira 1",
		barcode: "7891234567890",
		active: true,
		priceHistory: [
			{ date: "2024-01-01", cost: 11.8, reason: "Compra inicial" },
			{ date: "2024-02-01", cost: 12.1, reason: "Reajuste fornecedor" },
			{ date: "2024-03-01", cost: 12.5, reason: "Aumento de custos" },
		],
		createdAt: "2024-01-01T10:00:00Z",
		updatedAt: "2024-03-01T15:30:00Z",
	},
	{
		id: "2",
		name: "Acrílico Cristal 3mm",
		description: "Placa de acrílico cristal transparente 3mm de espessura",
		code: "ACR-003",
		unit: "m2",
		cost: 45.8,
		category: "Acrílico",
		brand: "Acrigel",
		color: "Cristal",
		dimensions: { width: 2.0, height: 3.0, thickness: 3.0 },
		tags: ["acrílico", "transparente", "placa", "cristal"],
		supplier: "Plásticos Industriais SA",
		supplierCode: "ACG-CRI-3MM",
		minStock: 20,
		maxStock: 100,
		currentStock: 45,
		location: "Estoque B - Área 2",
		barcode: "7891234567891",
		active: true,
		priceHistory: [
			{ date: "2024-01-01", cost: 42.5 },
			{ date: "2024-02-01", cost: 44.2 },
			{ date: "2024-03-01", cost: 45.8 },
		],
	},
	{
		id: "3",
		name: "Tinta UV Magenta",
		description: "Tinta UV para impressão em alta qualidade, cor magenta",
		code: "TIN-UV-MAG",
		unit: "litro",
		cost: 125.0,
		category: "Tinta",
		brand: "Roland",
		color: "Magenta",
		tags: ["tinta", "uv", "magenta", "impressão"],
		supplier: "Tintas Especiais Ltda",
		supplierCode: "ROL-UV-MAG-1L",
		minStock: 5,
		maxStock: 30,
		currentStock: 12,
		location: "Estoque C - Armário Tintas",
		barcode: "7891234567892",
		active: true,
		priceHistory: [
			{ date: "2024-01-01", cost: 120.0 },
			{ date: "2024-02-01", cost: 122.5 },
			{ date: "2024-03-01", cost: 125.0 },
		],
	},
	{
		id: "4",
		name: "Parafuso Inox M6x20",
		description: "Parafuso inox M6 x 20mm para fixação",
		code: "PAR-M6-20",
		unit: "un",
		cost: 0.85,
		category: "Fixação",
		brand: "Gerdau",
		color: "Inox",
		tags: ["parafuso", "inox", "fixação", "m6"],
		supplier: "Parafusos e Fixações SA",
		supplierCode: "GER-M6-20-INOX",
		minStock: 1000,
		maxStock: 5000,
		currentStock: 2500,
		location: "Estoque D - Gaveta 15",
		barcode: "7891234567893",
		active: true,
		priceHistory: [
			{ date: "2024-01-01", cost: 0.8 },
			{ date: "2024-02-01", cost: 0.82 },
			{ date: "2024-03-01", cost: 0.85 },
		],
	},
	{
		id: "5",
		name: "Lona Premium 440g",
		description: "Lona para impressão digital 440g/m², alta resistência",
		code: "LON-440",
		unit: "m2",
		cost: 8.9,
		category: "Lona",
		brand: "Triplona",
		color: "Branco",
		dimensions: { width: 3.2 },
		tags: ["lona", "impressão", "440g", "resistente"],
		supplier: "Lonas Brasil Ltda",
		supplierCode: "TRI-440-320",
		minStock: 200,
		maxStock: 1000,
		currentStock: 650,
		location: "Estoque A - Prateleira 5",
		barcode: "7891234567894",
		active: true,
		priceHistory: [
			{ date: "2024-01-01", cost: 8.5 },
			{ date: "2024-02-01", cost: 8.7 },
			{ date: "2024-03-01", cost: 8.9 },
		],
	},
];

export const getMaterialsByCategory = (category: string) => {
	if (category === "all") return mockMaterials.filter((m) => m.active);
	return mockMaterials.filter((m) => m.category === category && m.active);
};

export const getMaterialById = (id: string) => {
	return mockMaterials.find((m) => m.id === id);
};

export const getMaterialCategories = () => {
	const categories = [
		...new Set(mockMaterials.map((m) => m.category).filter(Boolean)),
	];
	return categories;
};

// Função para buscar materiais
export function searchMaterials(searchTerm: string): Material[] {
	const term = searchTerm.toLowerCase();
	return mockMaterials.filter(
		(material) =>
			material.name.toLowerCase().includes(term) ||
			material.code?.toLowerCase().includes(term) ||
			material.category?.toLowerCase().includes(term) ||
			material.tags.some((tag) => tag.toLowerCase().includes(term)),
	);
}

// Status de estoque
export function getStockStatus(
	material: Material,
): "low" | "normal" | "high" | "out" {
	const current = material.currentStock || 0;
	const min = material.minStock || 0;
	const max = material.maxStock || 0;

	if (current === 0) return "out";
	if (current <= min) return "low";
	if (current >= max) return "high";
	return "normal";
}

// Cores para status de estoque
export const stockStatusColors = {
	low: "destructive",
	normal: "default",
	high: "secondary",
	out: "destructive",
} as const;

// Labels para status de estoque
export const stockStatusLabels = {
	low: "Estoque Baixo",
	normal: "Estoque Normal",
	high: "Estoque Alto",
	out: "Sem Estoque",
} as const;
