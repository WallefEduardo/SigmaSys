export interface User {
	id: string;
	name: string;
	email: string;
	role: "SUPERADMIN" | "ADMIN" | "MANAGER" | "USER";
	department?: string;
	position?: string;
	phone?: string;
	avatar?: string;
	active: boolean;
	lastLoginAt?: Date;
	createdAt: Date;
	createdBy?: string;
	permissions?: string[];
}

export const mockUsers: User[] = [
	{
		id: "1",
		name: "João Silva",
		email: "joao@empresateste.com",
		role: "ADMIN",
		department: "Administração",
		position: "CEO",
		phone: "(11) 99999-0001",
		active: true,
		lastLoginAt: new Date("2024-01-15T09:30:00"),
		createdAt: new Date("2023-12-01"),
		permissions: [],
	},
	{
		id: "2",
		name: "Maria Santos",
		email: "maria@empresateste.com",
		role: "MANAGER",
		department: "Comercial",
		position: "Gerente Comercial",
		phone: "(11) 99999-0002",
		active: true,
		lastLoginAt: new Date("2024-01-14T14:20:00"),
		createdAt: new Date("2023-12-05"),
		createdBy: "1",
	},
	{
		id: "3",
		name: "Pedro Oliveira",
		email: "pedro@empresateste.com",
		role: "MANAGER",
		department: "Produção",
		position: "Coordenador de Produção",
		phone: "(11) 99999-0003",
		active: true,
		lastLoginAt: new Date("2024-01-14T16:45:00"),
		createdAt: new Date("2023-12-10"),
		createdBy: "1",
	},
	{
		id: "4",
		name: "Ana Costa",
		email: "ana@empresateste.com",
		role: "USER",
		department: "Atendimento",
		position: "Atendente",
		phone: "(11) 99999-0004",
		active: true,
		lastLoginAt: new Date("2024-01-13T10:15:00"),
		createdAt: new Date("2024-01-02"),
		createdBy: "2",
	},
	{
		id: "5",
		name: "Carlos Ferreira",
		email: "carlos@empresateste.com",
		role: "USER",
		department: "Produção",
		position: "Operador",
		phone: "(11) 99999-0005",
		active: false,
		lastLoginAt: new Date("2023-12-20T08:30:00"),
		createdAt: new Date("2023-11-15"),
		createdBy: "3",
	},
];

export const roleLabels = {
	SUPERADMIN: "Super Admin",
	ADMIN: "Administrador",
	MANAGER: "Gerente",
	USER: "Usuário",
};

export const roleColors = {
	SUPERADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
	ADMIN:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
	MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
	USER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export const mockPermissions = [
	{ id: "dashboard.read", name: "Visualizar Dashboard", module: "dashboard" },
	{ id: "users.create", name: "Criar Usuários", module: "users" },
	{ id: "users.read", name: "Visualizar Usuários", module: "users" },
	{ id: "users.update", name: "Editar Usuários", module: "users" },
	{ id: "users.delete", name: "Excluir Usuários", module: "users" },
	{ id: "clients.create", name: "Criar Clientes", module: "clients" },
	{ id: "clients.read", name: "Visualizar Clientes", module: "clients" },
	{ id: "clients.update", name: "Editar Clientes", module: "clients" },
	{ id: "clients.delete", name: "Excluir Clientes", module: "clients" },
	{ id: "products.create", name: "Criar Produtos", module: "products" },
	{ id: "products.read", name: "Visualizar Produtos", module: "products" },
	{ id: "products.update", name: "Editar Produtos", module: "products" },
	{ id: "products.delete", name: "Excluir Produtos", module: "products" },
	{ id: "financial.read", name: "Visualizar Financeiro", module: "financial" },
	{ id: "financial.create", name: "Criar Lançamentos", module: "financial" },
	{ id: "reports.read", name: "Visualizar Relatórios", module: "reports" },
	{ id: "settings.update", name: "Alterar Configurações", module: "settings" },
];
