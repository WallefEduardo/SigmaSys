import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

// Procedure protegido que requer autenticação
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Procedure para master (dono da empresa) ou superadmin
export const masterProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }
  
  if (!['master', 'superadmin'].includes(ctx.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Master or superadmin access required'
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

