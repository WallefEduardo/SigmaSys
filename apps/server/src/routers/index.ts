import { publicProcedure, router } from "../lib/trpc";
import { authRouter } from "./auth";
import { calculationRulesRouter } from "./calculation-rules";
import { calculationsRouter } from "./calculations";
import { clientsRouter } from "./clients";
import { companiesRouter } from "./companies";
import { consumablesRouter } from "./consumables";
import { equipmentsRouter } from "./equipments";
import { finishesRouter } from "./finishes";
import { formulasRouter } from "./formulas";
import { materialsRouter } from "./materials";
import { plansRouter } from "./plans";
import { processesRouter } from "./processes";
import { productsRouter } from "./products";
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

	// Sistema de monitoramento e administração
	system: systemRouter,
});

export type AppRouter = typeof appRouter;
