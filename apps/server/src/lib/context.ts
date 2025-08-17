import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { AuthService } from "./auth";
import { db } from "./db";

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  let user = null;

  try {
    const authorization = req.headers.authorization;
    const token = AuthService.extractTokenFromHeader(authorization);
    
    if (token) {
      const payload = AuthService.verifyToken(token);
      user = payload;
    }
  } catch (error) {
    // Token inválido - continua sem usuário
    user = null;
  }

  return {
    req,
    res,
    user,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
