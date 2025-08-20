console.log('🚀 Server script starting...');

import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";

import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import { createContext } from "./lib/context";
import { appRouter, type AppRouter } from "./routers/index";
import { logger, apiLogger, errorLogger } from "./lib/logger";

const isDevelopment = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

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

// Configuração de logs para o Fastify
const loggerConfig = {
  level: isTest ? 'silent' : isDevelopment ? 'debug' : 'info',
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss',
        singleLine: false,
      },
    },
  }),
}

const fastify = Fastify({
  logger: loggerConfig,
  disableRequestLogging: !isDevelopment,
});

fastify.register(fastifyCors, baseCorsConfig);


fastify.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      errorLogger.error({ path, error: error.message, stack: error.stack }, `tRPC Error on ${path}`)
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});


fastify.get('/', async () => {
  return 'OK';
});

const port = Number(process.env.PORT) || 3005;

console.log('🔧 Starting server on port:', port);
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔧 CORS Origin:', process.env.CORS_ORIGIN);

fastify.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    errorLogger.fatal(err, 'Failed to start server')
    process.exit(1);
  }
  
  console.log(`✅ Server is running at http://localhost:${port}`);
  
  // Log estruturado de inicialização
  logger.info({
    port,
    host: '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors: process.env.CORS_ORIGIN || 'not-configured'
  }, '🚀 Server started successfully')
});