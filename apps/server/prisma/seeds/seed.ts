import { config } from "dotenv";
import { AuthService } from "../../src/lib/auth";
import { PrismaClient } from "../generated/client";
import { seedPhase3 } from "./phase3-seed";
import { seedPlans } from "./plans-seed";

// Carregar variáveis de ambiente
config();

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Iniciando seeds...");

	// 1. Criar planos primeiro
	const plans = await seedPlans();

	// 2. Criar empresa modelo
	const company = await prisma.company.upsert({
		where: { id: "company-1" },
		update: {},
		create: {
			id: "company-1",
			name: "Empresa Teste Ltda",
			cnpj: "12.345.678/0001-90",
			email: "contato@empresateste.com",
			phone: "(11) 98765-4321",
			address: "Rua das Empresas, 123 - São Paulo/SP",
			planId: plans.proPlan.id, // Usar o plano Profissional
			trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias trial
			active: true,
		},
	});

	console.log("✅ Empresa criada:", company.name);

	// 3. Criar Super Admin (acesso a todas as empresas)
	const superAdminPassword = await AuthService.hashPassword("admin123");
	const superAdmin = await prisma.user.upsert({
		where: { email: "superadmin@erpsys.com" },
		update: {},
		create: {
			id: "user-superadmin",
			name: "Super Administrador",
			email: "superadmin@erpsys.com",
			password: superAdminPassword,
			role: "superadmin",
			active: true,
			companyId: company.id,
		},
	});

	console.log("✅ Super Admin criado:", superAdmin.email);

	// 4. Criar Admin da empresa teste
	const adminPassword = await AuthService.hashPassword("123456");
	const admin = await prisma.user.upsert({
		where: { email: "admin@empresateste.com" },
		update: {},
		create: {
			id: "user-admin",
			name: "Administrador Teste",
			email: "admin@empresateste.com",
			password: adminPassword,
			role: "admin",
			department: "Administração",
			position: "Administrador",
			phone: "(11) 99999-0001",
			active: true,
			companyId: company.id,
			permissions: [
				// Dashboard
				"dashboard.read",
				// Cadastros - acesso completo
				"clients.read",
				"clients.create",
				"clients.update",
				"clients.delete",
				"products.read",
				"products.create",
				"products.update",
				"products.delete",
				"materials.read",
				"materials.create",
				"materials.update",
				"materials.delete",
				"equipments.read",
				"equipments.create",
				"equipments.update",
				"equipments.delete",
				"processes.read",
				"processes.create",
				"processes.update",
				"processes.delete",
				"finishes.read",
				"finishes.create",
				"finishes.update",
				"finishes.delete",
				// Comercial - acesso completo
				"quotes.read",
				"quotes.create",
				"quotes.update",
				"quotes.delete",
				"quotes.approve",
				"orders.read",
				"orders.create",
				"orders.update",
				"orders.delete",
				"sales.read",
				"sales.manage",
				// Financeiro - acesso completo
				"financial.read",
				"accounts-receivable.read",
				"accounts-receivable.create",
				"accounts-receivable.update",
				"accounts-payable.read",
				"accounts-payable.create",
				"accounts-payable.update",
				"chart-accounts.read",
				"chart-accounts.manage",
				"break-even.read",
				"break-even.manage",
				// Produção
				"production.read",
				"pcp.read",
				"pcp.manage",
				"tracking.read",
				"tracking.create",
				"tracking.update",
				// Estoque
				"inventory.read",
				"inventory.create",
				"inventory.update",
				"inventory.manage",
				// Chat
				"chat.read",
				"chat.send",
				"chat.manage",
				// Admin - PERMISSÕES CRÍTICAS
				"system-users.read",
				"system-users.create",
				"system-users.update",
				"system-users.delete",
				"system-users.permissions",
				// Configurações
				"users.read",
				"users.create",
				"users.update",
				"users.delete",
				"parameters.read",
				"parameters.update",
				"settings.manage",
			],
		},
	});

	console.log("✅ Admin criado:", admin.email);

	// 5. Criar usuário gerente
	const managerPassword = await AuthService.hashPassword("123456");
	const manager = await prisma.user.upsert({
		where: { email: "gerente@empresateste.com" },
		update: {},
		create: {
			id: "user-manager",
			name: "Maria Santos",
			email: "gerente@empresateste.com",
			password: managerPassword,
			role: "user",
			department: "Comercial",
			position: "Gerente Comercial",
			phone: "(11) 99999-0002",
			active: true,
			companyId: company.id,
			createdBy: admin.id,
		},
	});

	console.log("✅ Gerente criado:", manager.email);

	// 6. Criar usuário comum
	const userPassword = await AuthService.hashPassword("123456");
	const user = await prisma.user.upsert({
		where: { email: "usuario@empresateste.com" },
		update: {},
		create: {
			id: "user-common",
			name: "João Silva",
			email: "usuario@empresateste.com",
			password: userPassword,
			role: "user",
			department: "Atendimento",
			position: "Atendente",
			phone: "(11) 99999-0003",
			active: true,
			companyId: company.id,
			createdBy: admin.id,
		},
	});

	console.log("✅ Usuário criado:", user.email);

	// 7. Criar alguns clientes de exemplo
	const clients = [
		{
			id: "client-1",
			name: "João da Silva Transportes",
			email: "joao@transportes.com",
			phone: "(11) 98765-4321",
			document: "12.345.678/0001-90",
			type: "COMPANY" as const,
			address: JSON.stringify({
				street: "Rua dos Transportes, 123",
				neighborhood: "Centro",
				city: "São Paulo",
				state: "SP",
				zipCode: "01000-000",
			}),
			segment: "Transporte e Logística",
			tags: ["vip", "recorrente"],
			active: true,
			companyId: company.id,
			createdBy: admin.id,
		},
		{
			id: "client-2",
			name: "Maria Santos",
			email: "maria.santos@email.com",
			phone: "(11) 91234-5678",
			document: "123.456.789-00",
			type: "PERSON" as const,
			segment: "Pessoa Física",
			tags: ["novo"],
			active: true,
			companyId: company.id,
			createdBy: manager.id,
		},
		{
			id: "client-3",
			name: "Restaurante Bella Vista",
			email: "contato@bellavista.com",
			phone: "(11) 95555-1234",
			document: "98.765.432/0001-10",
			type: "COMPANY" as const,
			address: JSON.stringify({
				street: "Avenida Principal, 456",
				neighborhood: "Vila Madalena",
				city: "São Paulo",
				state: "SP",
				zipCode: "05433-000",
			}),
			segment: "Alimentação",
			tags: ["sazonal"],
			active: true,
			companyId: company.id,
			createdBy: manager.id,
		},
	];

	for (const clientData of clients) {
		const client = await prisma.client.upsert({
			where: { id: clientData.id },
			update: {},
			create: clientData,
		});
		console.log("✅ Cliente criado:", client.name);
	}

	// 5. Executar seed da Fase 3 (Produtos e Fórmulas)
	console.log("\n🌱 Executando seed da Fase 3...");
	await seedPhase3();

	console.log("\n🎉 Seeds executados com sucesso!");
	console.log("\n📋 Credenciais criadas:");
	console.log("Super Admin: superadmin@erpsys.com / admin123");
	console.log("Admin: admin@empresateste.com / 123456");
	console.log("Gerente: gerente@empresateste.com / 123456");
	console.log("Usuário: usuario@empresateste.com / 123456");
}

main()
	.catch((e) => {
		console.error("❌ Erro ao executar seeds:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
