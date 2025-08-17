import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";

import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import { createContext } from "./lib/context";
import { appRouter, type AppRouter } from "./routers/index";




const baseCorsConfig = {
  origin: process.env.CORS_ORIGIN || "",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With"
  ],
  credentials: true,
  maxAge: 86400,
};

const fastify = Fastify({
  logger: true,
});

fastify.register(fastifyCors, baseCorsConfig);


fastify.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});


fastify.get('/', async () => {
  return 'OK';
});

const port = Number(process.env.PORT) || 3005;

fastify.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server running on http://localhost:${port}`);
});