import { publicProcedure, router } from "../lib/trpc";
import { adminRouter } from "./admin";
import { authRouter } from "./auth";
import { calculationRulesRouter } from "./calculation-rules";
import { calculationsRouter } from "./calculations";
import { clientsRouter } from "./clients";
import { companiesRouter } from "./companies";
import { consumablesRouter } from "./consumables";
import { equipmentsRouter } from "./equipments";
import { finishesRouter } from "./finishes";
import { financialRouter } from "./financial";
import { formulasRouter } from "./formulas";
import { materialsRouter } from "./materials";
import { ordersRouter } from "./orders";
import { plansRouter } from "./plans";
import { processesRouter } from "./processes";
import { productsRouter } from "./products";
import { quotesRouter } from "./quotes";
import { systemRouter } from "./system";
import { usersRouter } from "./users";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),

	// Autenticação
	auth: authRouter,

	// FASE 2 - Cadastros Fundamentais
	plans: plansRouter,
	companies: companiesRouter,
	users: usersRouter,
	clients: clientsRouter,

	// FASE 3 - Sistema de Produtos e Fórmulas
	formulas: formulasRouter,
	materials: materialsRouter,
	equipments: equipmentsRouter,
	consumables: consumablesRouter,
	processes: processesRouter,
	finishes: finishesRouter,
	products: productsRouter,
	calculationRules: calculationRulesRouter,
	calculations: calculationsRouter,

	// FASE 6 - Comercial e CRM
	quotes: quotesRouter,
	orders: ordersRouter,

	// FASE 7 - Sistema Financeiro Inteligente
	financial: financialRouter,

	// Sistema de administração
	admin: adminRouter,
	system: systemRouter,
});

export type AppRouter = typeof appRouter;
