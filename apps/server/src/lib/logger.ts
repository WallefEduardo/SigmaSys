import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test";

// Configuração de logs estruturada
const loggerConfig = {
	level: isTest ? "silent" : isDevelopment ? "debug" : "info",

	// Em desenvolvimento: logs bonitos e coloridos
	// Em produção: logs estruturados JSON
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

	// Em produção: adicionar informações do sistema
	...(!isDevelopment && {
		formatters: {
			level: (label: string) => ({ level: label }),
		},
		timestamp: pino.stdTimeFunctions.isoTime,
		base: {
			pid: process.pid,
			hostname: process.env.HOSTNAME || "unknown",
			service: "erp-server",
			version: process.env.APP_VERSION || "1.0.0",
		},
	}),
};

export const logger = pino(loggerConfig);

// Logger customizado para diferentes contextos
export const createContextLogger = (context: string) => {
	return logger.child({ context });
};

// Logs específicos para diferentes módulos
export const authLogger = createContextLogger("auth");
export const dbLogger = createContextLogger("database");
export const apiLogger = createContextLogger("api");
export const errorLogger = createContextLogger("error");

// Helper para logs de performance
export const performanceLogger = {
	start: (operation: string) => {
		const start = Date.now();
		return {
			end: () => {
				const duration = Date.now() - start;
				logger.info(
					{ operation, duration },
					`Operation completed in ${duration}ms`,
				);
			},
		};
	},
};

// Interceptador de logs para métricas
export class LogInterceptor {
	private static logCounts = {
		error: 0,
		warn: 0,
		info: 0,
		debug: 0,
	};

	static intercept(originalLogger: any) {
		const originalMethods = {
			error: originalLogger.error.bind(originalLogger),
			warn: originalLogger.warn.bind(originalLogger),
			info: originalLogger.info.bind(originalLogger),
			debug: originalLogger.debug.bind(originalLogger),
		};

		// Interceptar cada método para contabilizar
		Object.keys(originalMethods).forEach((level) => {
			originalLogger[level] = (...args: any[]) => {
				LogInterceptor.logCounts[level as keyof typeof this.logCounts]++;
				return originalMethods[level as keyof typeof originalMethods](...args);
			};
		});

		return originalLogger;
	}

	static getStats() {
		return { ...LogInterceptor.logCounts };
	}

	static reset() {
		Object.keys(LogInterceptor.logCounts).forEach((key) => {
			LogInterceptor.logCounts[key as keyof typeof this.logCounts] = 0;
		});
	}
}

// Logger para auditoria
export const auditLogger = logger.child({
	type: "audit",
	component: "audit-trail",
});

// Logger para segurança
export const securityLogger = logger.child({
	type: "security",
	component: "security-events",
});

// Logger para business events
export const businessLogger = logger.child({
	type: "business",
	component: "business-events",
});

// Helpers para diferentes tipos de log
export const LogHelpers = {
	// Log de operação com usuário
	userOperation: (userId: string, operation: string, details: any = {}) => {
		auditLogger.info(
			{
				userId,
				operation,
				timestamp: new Date().toISOString(),
				...details,
			},
			`User ${userId} performed ${operation}`,
		);
	},

	// Log de evento de segurança
	securityEvent: (
		type: string,
		severity: "low" | "medium" | "high" | "critical",
		details: any = {},
	) => {
		securityLogger.warn(
			{
				securityEventType: type,
				severity,
				timestamp: new Date().toISOString(),
				...details,
			},
			`Security event: ${type}`,
		);
	},

	// Log de evento de negócio
	businessEvent: (
		eventType: string,
		entityType: string,
		entityId: string,
		details: any = {},
	) => {
		businessLogger.info(
			{
				eventType,
				entityType,
				entityId,
				timestamp: new Date().toISOString(),
				...details,
			},
			`Business event: ${eventType} on ${entityType} ${entityId}`,
		);
	},

	// Log de performance crítica
	criticalPerformance: (
		operation: string,
		duration: number,
		threshold = 1000,
	) => {
		if (duration > threshold) {
			logger.warn(
				{
					operation,
					duration,
					threshold,
					severity: duration > threshold * 2 ? "critical" : "warning",
				},
				`Slow operation detected: ${operation} took ${duration}ms`,
			);
		}
	},

	// Log de erro com contexto
	errorWithContext: (error: Error, context: any = {}) => {
		errorLogger.error(
			{
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack,
				},
				context,
				timestamp: new Date().toISOString(),
			},
			`Error occurred: ${error.message}`,
		);
	},

	// Log de métricas de sistema
	systemMetrics: (metrics: {
		memoryUsage?: NodeJS.MemoryUsage;
		cpuUsage?: NodeJS.CpuUsage;
		activeConnections?: number;
		customMetrics?: Record<string, any>;
	}) => {
		logger.debug(
			{
				type: "system-metrics",
				timestamp: new Date().toISOString(),
				...metrics,
			},
			"System metrics snapshot",
		);
	},
};

// Aplicar interceptador
LogInterceptor.intercept(logger);

export default logger;
