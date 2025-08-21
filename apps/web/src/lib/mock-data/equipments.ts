// Mock data para equipamentos
export interface Equipment {
	id: string;
	name: string;
	description?: string;
	code?: string;
	type: "printing" | "machining";
	costPerHour: number;
	maintenanceCost?: number;
	energyCost?: number;
	maxWidth?: number;
	maxHeight?: number;
	maxThickness?: number;
	printingConfig?: {
		resolution: number;
		colorChannels: string[];
		inkTypes: string[];
		mediaTypes: string[];
	};
	machiningConfig?: {
		toolTypes: string[];
		materials: string[];
		precision: number;
		feedRate: number;
	};
	status: "available" | "maintenance" | "in_use" | "broken";
	location?: string;
	serialNumber?: string;
	manufacturer?: string;
	model?: string;
	year?: number;
	maintenanceInterval?: number;
	lastMaintenance?: string;
	nextMaintenance?: string;
	tags: string[];
	active: boolean;
}

export const mockEquipments: Equipment[] = [
	{
		id: "1",
		name: "Impressora UV Roland VersaUV LEC2-330",
		description: "Impressora UV de grande formato para diversos materiais",
		code: "IMP-UV-001",
		type: "printing",
		costPerHour: 45.0,
		maintenanceCost: 150.0,
		energyCost: 12.5,
		maxWidth: 762,
		maxHeight: 500,
		maxThickness: 100,
		printingConfig: {
			resolution: 1440,
			colorChannels: ["C", "M", "Y", "K", "W", "Vr"],
			inkTypes: ["UV Curable"],
			mediaTypes: ["Vinil", "Acrílico", "Canvas", "Madeira", "Metal"],
		},
		status: "available",
		location: "Setor Impressão - Box 1",
		serialNumber: "ROL2024UV001",
		manufacturer: "Roland",
		model: "VersaUV LEC2-330",
		year: 2024,
		maintenanceInterval: 30,
		lastMaintenance: "2024-03-01",
		nextMaintenance: "2024-03-31",
		tags: ["uv", "grande formato", "multicolor", "versátil"],
		active: true,
	},
	{
		id: "2",
		name: "Router CNC Mach3 1325",
		description: "Router CNC para corte e gravação em diversos materiais",
		code: "CNC-001",
		type: "machining",
		costPerHour: 35.0,
		maintenanceCost: 200.0,
		energyCost: 18.0,
		maxWidth: 1300,
		maxHeight: 2500,
		maxThickness: 80,
		machiningConfig: {
			toolTypes: ["Fresa 6mm", "Fresa 3mm", "Broca 8mm", "V-Bit 90°"],
			materials: ["Acrílico", "MDF", "Madeira", "Alumínio", "PVC"],
			precision: 0.05,
			feedRate: 3000,
		},
		status: "available",
		location: "Setor Usinagem - Box 2",
		serialNumber: "MACH1325001",
		manufacturer: "Mach CNC",
		model: "1325 Standard",
		year: 2023,
		maintenanceInterval: 45,
		lastMaintenance: "2024-02-15",
		nextMaintenance: "2024-04-01",
		tags: ["cnc", "corte", "gravação", "precisão"],
		active: true,
	},
	{
		id: "3",
		name: "Plotter de Recorte Silhouette Cameo 5",
		description: "Plotter de recorte para vinil e materiais finos",
		code: "PLT-001",
		type: "machining",
		costPerHour: 15.0,
		maintenanceCost: 50.0,
		energyCost: 2.5,
		maxWidth: 310,
		maxHeight: 3000,
		maxThickness: 3,
		machiningConfig: {
			toolTypes: ["Lâmina 45°", "Lâmina 60°", "Caneta"],
			materials: ["Vinil", "Papel", "Cardstock", "Heat Transfer"],
			precision: 0.01,
			feedRate: 100,
		},
		status: "available",
		location: "Setor Acabamento - Mesa 3",
		serialNumber: "SIL2024CAM5",
		manufacturer: "Silhouette",
		model: "Cameo 5",
		year: 2024,
		maintenanceInterval: 60,
		lastMaintenance: "2024-01-20",
		nextMaintenance: "2024-03-20",
		tags: ["recorte", "vinil", "pequeno formato"],
		active: true,
	},
	{
		id: "4",
		name: "Prensa Sublimática 40x60cm",
		description: "Prensa térmica para sublimação e transfer",
		code: "PRN-001",
		type: "printing",
		costPerHour: 25.0,
		maintenanceCost: 80.0,
		energyCost: 8.0,
		maxWidth: 400,
		maxHeight: 600,
		maxThickness: 20,
		printingConfig: {
			resolution: 300,
			colorChannels: ["C", "M", "Y", "K"],
			inkTypes: ["Sublimática"],
			mediaTypes: ["Tecido", "Cerâmica", "Metal sublimático"],
		},
		status: "maintenance",
		location: "Setor Transfer - Box 1",
		serialNumber: "PRN4060001",
		manufacturer: "CompacPrint",
		model: "Compact 4060",
		year: 2022,
		maintenanceInterval: 30,
		lastMaintenance: "2024-03-10",
		nextMaintenance: "2024-04-10",
		tags: ["sublimação", "transfer", "prensa"],
		active: true,
	},
	{
		id: "5",
		name: "Laser CO2 100W 1390",
		description: "Cortadora e gravadora laser CO2 de 100W",
		code: "LAS-001",
		type: "machining",
		costPerHour: 55.0,
		maintenanceCost: 300.0,
		energyCost: 25.0,
		maxWidth: 1300,
		maxHeight: 900,
		maxThickness: 25,
		machiningConfig: {
			toolTypes: ["Laser CO2 100W"],
			materials: ["Acrílico", "MDF", "Madeira", "Couro", "Tecido", "Papel"],
			precision: 0.02,
			feedRate: 2000,
		},
		status: "in_use",
		location: "Setor Laser - Box Isolado",
		serialNumber: "CO2100W1390",
		manufacturer: "LaserCut Pro",
		model: "LC-1390-100W",
		year: 2023,
		maintenanceInterval: 20,
		lastMaintenance: "2024-03-05",
		nextMaintenance: "2024-03-25",
		tags: ["laser", "co2", "corte", "gravação"],
		active: true,
	},
];

export const getEquipmentsByType = (type: Equipment["type"] | "all") => {
	if (type === "all") return mockEquipments.filter((e) => e.active);
	return mockEquipments.filter((e) => e.type === type && e.active);
};

export const getEquipmentById = (id: string) => {
	return mockEquipments.find((e) => e.id === id);
};

export const getEquipmentTypes = () => {
	return ["printing", "machining"] as const;
};

// Função para buscar equipamentos
export function searchEquipments(searchTerm: string): Equipment[] {
	const term = searchTerm.toLowerCase();
	return mockEquipments.filter(equipment => 
		equipment.name.toLowerCase().includes(term) ||
		equipment.code?.toLowerCase().includes(term) ||
		equipment.manufacturer?.toLowerCase().includes(term) ||
		equipment.model?.toLowerCase().includes(term) ||
		equipment.tags.some(tag => tag.toLowerCase().includes(term))
	);
}

// Status de manutenção
export function getMaintenanceStatus(equipment: Equipment): 'overdue' | 'due_soon' | 'ok' {
	if (!equipment.nextMaintenance) return 'ok';
	
	const nextMaintenance = new Date(equipment.nextMaintenance);
	const today = new Date();
	const diffDays = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 3600 * 24));
	
	if (diffDays < 0) return 'overdue';
	if (diffDays <= 7) return 'due_soon';
	return 'ok';
}

// Cores para status de equipamento
export const equipmentStatusColors = {
	available: 'default',
	maintenance: 'warning',
	in_use: 'secondary',
	broken: 'destructive'
} as const;

// Labels para status de equipamento
export const equipmentStatusLabels = {
	available: 'Disponível',
	maintenance: 'Em Manutenção',
	in_use: 'Em Uso',
	broken: 'Quebrado'
} as const;

// Cores para status de manutenção
export const maintenanceStatusColors = {
	overdue: 'destructive',
	due_soon: 'warning',
	ok: 'default'
} as const;

// Labels para status de manutenção
export const maintenanceStatusLabels = {
	overdue: 'Manutenção Atrasada',
	due_soon: 'Manutenção Próxima',
	ok: 'Em Dia'
} as const;
