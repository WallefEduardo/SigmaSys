export interface Company {
	id: string;
	name: string;
	cnpj?: string;
	email?: string;
	phone?: string;
	address?: string;
	plan: "trial" | "basic" | "premium" | "enterprise";
	active: boolean;
	createdAt: Date;
	stats: {
		users: number;
		clients: number;
		products: number;
		orders: number;
	};
}

export const mockCompanies: Company[] = [
	{
		id: "1",
		name: "Visual Graphics Ltda",
		cnpj: "12.345.678/0001-90",
		email: "contato@visualgraphics.com",
		phone: "(11) 98765-4321",
		address: "Rua das Empresas, 123 - São Paulo/SP",
		plan: "premium",
		active: true,
		createdAt: new Date("2024-01-15"),
		stats: {
			users: 12,
			clients: 245,
			products: 89,
			orders: 156,
		},
	},
	{
		id: "2",
		name: "Impressões Digitais Rápidas",
		cnpj: "98.765.432/0001-10",
		email: "admin@impressoesdigitais.com",
		phone: "(21) 91234-5678",
		address: "Av. Principal, 456 - Rio de Janeiro/RJ",
		plan: "basic",
		active: true,
		createdAt: new Date("2024-02-20"),
		stats: {
			users: 5,
			clients: 87,
			products: 34,
			orders: 45,
		},
	},
	{
		id: "3",
		name: "Design & Comunicação Visual",
		cnpj: "55.444.333/0001-22",
		email: "contato@designcv.com",
		phone: "(31) 95555-1234",
		address: "Rua do Design, 789 - Belo Horizonte/MG",
		plan: "enterprise",
		active: true,
		createdAt: new Date("2023-11-10"),
		stats: {
			users: 25,
			clients: 890,
			products: 234,
			orders: 567,
		},
	},
	{
		id: "4",
		name: "Comunicação Visual Express",
		cnpj: "11.222.333/0001-44",
		email: "vendas@cvexpress.com",
		phone: "(41) 94444-5678",
		address: "Av. Comercial, 321 - Curitiba/PR",
		plan: "trial",
		active: false,
		createdAt: new Date("2024-03-05"),
		stats: {
			users: 2,
			clients: 15,
			products: 8,
			orders: 3,
		},
	},
];

export const planLabels = {
	trial: "Trial",
	basic: "Básico",
	premium: "Premium",
	enterprise: "Enterprise",
};

export const planColors = {
	trial: "bg-gray-100 text-gray-800",
	basic: "bg-blue-100 text-blue-800",
	premium: "bg-green-100 text-green-800",
	enterprise: "bg-purple-100 text-purple-800",
};
