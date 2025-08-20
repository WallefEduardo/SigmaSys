import {
  publicProcedure,
  router,
} from "../lib/trpc";
import { authRouter } from "./auth";
import { plansRouter } from "./plans";
import { companiesRouter } from "./companies";
import { usersRouter } from "./users";
import { clientsRouter } from "./clients";
import { materialsRouter } from "./materials";
import { equipmentsRouter } from "./equipments";
import { processesRouter } from "./processes";
import { finishesRouter } from "./finishes";
import { productsRouter } from "./products";

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
  materials: materialsRouter,
  equipments: equipmentsRouter,
  processes: processesRouter,
  finishes: finishesRouter,
  products: productsRouter,
});

export type AppRouter = typeof appRouter;
