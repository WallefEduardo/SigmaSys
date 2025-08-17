import {
  publicProcedure,
  router,
} from "../lib/trpc";
import { authRouter } from "./auth";
import { companiesRouter } from "./companies";
import { usersRouter } from "./users";
import { clientsRouter } from "./clients";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  
  // Autenticação
  auth: authRouter,
  
  // FASE 2 - Cadastros Fundamentais
  companies: companiesRouter,
  users: usersRouter,
  clients: clientsRouter,
});

export type AppRouter = typeof appRouter;
