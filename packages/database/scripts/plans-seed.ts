import { prisma } from "../src/client";

export async function seedPlans() {
	console.log("🚀 Criando planos padrão...");

	// Plano Trial/Gratuito
	const trialPlan = await prisma.plan.upsert({
		where: { name: "Trial" },
		update: {},
		create: {
			name: "Trial",
			description: "Plano gratuito para teste por 15 dias",
			price: 0,
			yearlyPrice: 0,
			currency: "BRL",

			// Limites restritivos para trial
			maxUsers: 2,
			maxCompanies: 1,
			maxClients: 10,
			maxProducts: 5,
			maxOrders: 10,
			maxQuotes: 10,
			maxStorage: 100, // 100MB

			// Features básicas
			features: [
				"dashboard_basico",
				"cadastro_clientes",
				"cadastro_produtos",
				"orcamentos_simples",
			],
			modules: ["dashboard", "cadastros", "comercial_basico"],

			trialDays: 15,
			popular: false,
			active: true,
		},
	});

	// Plano Básico
	const basicPlan = await prisma.plan.upsert({
		where: { name: "Básico" },
		update: {},
		create: {
			name: "Básico",
			description: "Ideal para pequenas empresas que estão começando",
			price: 49.9,
			yearlyPrice: 539.9, // 10.8 meses
			currency: "BRL",

			// Limites para pequenas empresas
			maxUsers: 5,
			maxCompanies: 1,
			maxClients: 100,
			maxProducts: 50,
			maxOrders: 100,
			maxQuotes: 100,
			maxStorage: 1024, // 1GB

			// Features essenciais
			features: [
				"dashboard_completo",
				"cadastro_clientes",
				"cadastro_produtos",
				"orcamentos_completos",
				"gestao_pedidos",
				"relatorios_basicos",
				"backup_automatico",
			],
			modules: ["dashboard", "cadastros", "comercial", "relatorios_basicos"],

			trialDays: 15,
			popular: false,
			active: true,
		},
	});

	// Plano Profissional
	const proPlan = await prisma.plan.upsert({
		where: { name: "Profissional" },
		update: {},
		create: {
			name: "Profissional",
			description: "Para empresas em crescimento que precisam de mais recursos",
			price: 99.9,
			yearlyPrice: 999.0, // 10 meses
			currency: "BRL",

			// Limites para empresas médias
			maxUsers: 15,
			maxCompanies: 1,
			maxClients: 500,
			maxProducts: 200,
			maxOrders: 500,
			maxQuotes: 500,
			maxStorage: 5120, // 5GB

			// Features avançadas
			features: [
				"dashboard_avancado",
				"cadastro_clientes",
				"cadastro_produtos",
				"orcamentos_completos",
				"gestao_pedidos",
				"controle_estoque",
				"financeiro_basico",
				"pcp_kanban",
				"relatorios_avancados",
				"integracao_whatsapp",
				"backup_automatico",
				"suporte_prioritario",
			],
			modules: [
				"dashboard",
				"cadastros",
				"comercial",
				"estoque",
				"financeiro",
				"producao",
				"chat",
				"relatorios",
			],

			trialDays: 15,
			popular: true, // Plano mais popular
			active: true,
		},
	});

	// Plano Enterprise
	const enterprisePlan = await prisma.plan.upsert({
		where: { name: "Enterprise" },
		update: {},
		create: {
			name: "Enterprise",
			description:
				"Solução completa para grandes empresas com todos os recursos",
			price: 199.9,
			yearlyPrice: 1999.0, // 10 meses
			currency: "BRL",

			// Limites altos para grandes empresas
			maxUsers: 50,
			maxCompanies: 1,
			maxClients: 2000,
			maxProducts: 1000,
			maxOrders: 2000,
			maxQuotes: 2000,
			maxStorage: 20480, // 20GB

			// Todas as features
			features: [
				"dashboard_executivo",
				"cadastro_clientes",
				"cadastro_produtos",
				"orcamentos_completos",
				"gestao_pedidos",
				"controle_estoque_avancado",
				"financeiro_completo",
				"pcp_avancado",
				"formula_engine",
				"relatorios_personalizados",
				"integracao_whatsapp",
				"api_completa",
				"backup_automatico",
				"suporte_dedicado",
				"treinamento_incluso",
				"customizacoes",
			],
			modules: [
				"dashboard",
				"cadastros",
				"comercial",
				"estoque",
				"financeiro",
				"producao",
				"chat",
				"relatorios",
				"api",
				"integracao",
			],

			trialDays: 30, // Trial estendido
			popular: false,
			active: true,
		},
	});

	// Plano SuperAdmin (para gerenciar múltiplas empresas)
	const superAdminPlan = await prisma.plan.upsert({
		where: { name: "Super Admin" },
		update: {},
		create: {
			name: "Super Admin",
			description:
				"Plano especial para superadmins gerenciarem múltiplas empresas",
			price: 0, // Grátis para superadmins
			yearlyPrice: 0,
			currency: "BRL",

			// Limites altos para superadmin
			maxUsers: 1000,
			maxCompanies: 100, // Pode gerenciar até 100 empresas
			maxClients: 10000,
			maxProducts: 5000,
			maxOrders: 10000,
			maxQuotes: 10000,
			maxStorage: 102400, // 100GB

			// Todas as features + administrativas
			features: [
				"gestao_planos",
				"gestao_empresas",
				"dashboard_global",
				"relatorios_sistema",
				"auditoria_completa",
				"configuracao_sistema",
				"backup_empresas",
				"suporte_nivel3",
			],
			modules: ["admin", "dashboard_global", "relatorios_sistema", "auditoria"],

			trialDays: 0, // Sem trial
			popular: false,
			active: true,
		},
	});

	console.log("✅ Planos criados:");
	console.log(`- ${trialPlan.name}: R$ ${trialPlan.price}`);
	console.log(`- ${basicPlan.name}: R$ ${basicPlan.price}`);
	console.log(`- ${proPlan.name}: R$ ${proPlan.price} (Popular)`);
	console.log(`- ${enterprisePlan.name}: R$ ${enterprisePlan.price}`);
	console.log(`- ${superAdminPlan.name}: Gratuito (Administrativo)`);

	return {
		trialPlan,
		basicPlan,
		proPlan,
		enterprisePlan,
		superAdminPlan,
	};
}
