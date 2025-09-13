console.log("🚀 Server script starting...");

import "dotenv/config";
import fastifyCors from "@fastify/cors";
import {
	type FastifyTRPCPluginOptions,
	fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { createContext } from "./lib/context";
import { apiLogger, errorLogger, logger } from "./lib/logger";
// import { telemetryPlugin } from "./middleware/telemetry";
import { type AppRouter, appRouter } from "./routers/index";
import { initializeAI, createDefaultAIConfig } from "./services/ai";

const isDevelopment = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test";

const baseCorsConfig = {
	origin: process.env.CORS_ORIGIN || "",
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
	maxAge: 86400,
};

// Configuração de logs para o Fastify
const loggerConfig = {
	level: isTest ? "silent" : isDevelopment ? "debug" : "info",
	...(isDevelopment && {
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				ignore: "pid,hostname",
				translateTime: "HH:MM:ss",
				singleLine: false,
			},
		},
	}),
};

const fastify = Fastify({
	logger: loggerConfig,
	disableRequestLogging: !isDevelopment,
});

fastify.register(fastifyCors, baseCorsConfig);

// Registrar plugin de telemetria
// fastify.register(telemetryPlugin);

fastify.register(fastifyTRPCPlugin, {
	prefix: "/trpc",
	trpcOptions: {
		router: appRouter,
		createContext,
		onError({ path, error }) {
			errorLogger.error(
				{ path, error: error.message, stack: error.stack },
				`tRPC Error on ${path}`,
			);
		},
	} satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

fastify.get("/", async () => {
	return "OK";
});

// Health check endpoint
fastify.get("/health", async () => {
	return {
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		version: process.env.APP_VERSION || "1.0.0",
	};
});

const port = Number(process.env.PORT);

// Inicializar serviço de IA
try {
	const aiConfig = createDefaultAIConfig();
	if (aiConfig.openaiApiKey || aiConfig.claudeApiKey) {
		initializeAI(aiConfig);
		console.log("🤖 AI Service initialized with providers:", {
			openai: !!aiConfig.openaiApiKey,
			claude: !!aiConfig.claudeApiKey,
			default: aiConfig.defaultProvider
		});
	} else {
		console.log("⚠️  AI Service not initialized - no API keys provided");
	}
} catch (error) {
	console.warn("⚠️  Failed to initialize AI Service:", error);
}

console.log("🔧 Starting server on port:", port);
console.log("🔧 Environment:", process.env.NODE_ENV);
console.log("🔧 CORS Origin:", process.env.CORS_ORIGIN);

fastify.listen({ port, host: "0.0.0.0" }, (err) => {
	if (err) {
		console.error("❌ Failed to start server:", err);
		errorLogger.fatal(err, "Failed to start server");
		process.exit(1);
	}

	console.log(`✅ Server is running at http://localhost:${port}`);

	// Log estruturado de inicialização
	logger.info(
		{
			port,
			host: "0.0.0.0",
			environment: process.env.NODE_ENV || "development",
			cors: process.env.CORS_ORIGIN || "not-configured",
		},
		"🚀 Server started successfully",
	);
});
