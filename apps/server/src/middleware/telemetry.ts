import type { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../lib/logger";
import { TelemetryService } from "../lib/telemetry-mock";

/**
 * Middleware para instrumentar requisições HTTP com telemetria
 */
export async function telemetryMiddleware(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const startTime = Date.now();
	const span = TelemetryService.createSpan(
		`HTTP ${request.method} ${request.url}`,
	);

	// Adicionar atributos ao span
	span.setAttributes({
		"http.method": request.method,
		"http.url": request.url,
		"http.user_agent": request.headers["user-agent"] || "unknown",
		"http.remote_addr": request.ip,
	});

	// Incrementar contador de conexões ativas
	TelemetryService.recordActiveConnection(1);

	// Hook para capturar a resposta
	reply.addHook("onSend", async (request, reply, payload) => {
		const duration = Date.now() - startTime;
		const statusCode = reply.statusCode;

		// Registrar métricas
		TelemetryService.recordHttpRequest(
			request.method,
			extractRoute(request.url),
			statusCode,
			duration,
		);

		// Atualizar span
		span.setAttributes({
			"http.status_code": statusCode,
			"http.response_size": payload ? Buffer.byteLength(payload.toString()) : 0,
		});

		// Marcar como erro se status >= 400
		if (statusCode >= 400) {
			span.setStatus({
				code: 2, // ERROR
				message: `HTTP ${statusCode}`,
			});

			TelemetryService.recordError(
				"http_error",
				statusCode >= 500 ? "high" : "medium",
				"http_middleware",
			);
		} else {
			span.setStatus({ code: 1 }); // OK
		}

		// Finalizar span
		span.end();

		// Decrementar contador de conexões ativas
		TelemetryService.recordActiveConnection(-1);

		logger.debug("HTTP request completed", {
			method: request.method,
			url: request.url,
			statusCode,
			duration,
			userAgent: request.headers["user-agent"],
		});

		return payload;
	});
}

/**
 * Extrair rota da URL removendo query parameters e IDs
 */
function extractRoute(url: string): string {
	// Remove query parameters
	const basePath = url.split("?")[0];

	// Substituir IDs por placeholder
	return basePath
		.replace(/\/\d+/g, "/:id")
		.replace(/\/[a-f0-9-]{36}/g, "/:uuid") // UUIDs
		.replace(/\/[a-zA-Z0-9_-]{20,}/g, "/:token"); // Tokens longos
}

/**
 * Middleware para instrumentar operações de banco de dados
 */
export function instrumentDatabase<T extends (...args: any[]) => any>(
	operation: string,
	table: string,
	fn: T,
): T {
	return ((...args: any[]) => {
		const startTime = Date.now();
		const span = TelemetryService.createSpan(`DB ${operation} ${table}`);

		span.setAttributes({
			"db.operation": operation,
			"db.table": table,
			"db.system": "postgresql",
		});

		try {
			const result = fn(...args);

			// Se é uma Promise, aguardar para registrar métricas
			if (result && typeof result.then === "function") {
				return result
					.then((value: any) => {
						const duration = Date.now() - startTime;
						TelemetryService.recordDatabaseQuery(
							operation,
							table,
							duration,
							true,
						);
						span.setStatus({ code: 1 }); // OK
						span.end();
						return value;
					})
					.catch((error: any) => {
						const duration = Date.now() - startTime;
						TelemetryService.recordDatabaseQuery(
							operation,
							table,
							duration,
							false,
						);
						TelemetryService.recordError("database_error", "high", "database");
						span.setStatus({ code: 2, message: error.message }); // ERROR
						span.end();
						throw error;
					});
			}

			// Operação síncrona
			const duration = Date.now() - startTime;
			TelemetryService.recordDatabaseQuery(operation, table, duration, true);
			span.setStatus({ code: 1 }); // OK
			span.end();
			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			TelemetryService.recordDatabaseQuery(operation, table, duration, false);
			TelemetryService.recordError("database_error", "high", "database");
			span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
			span.end();
			throw error;
		}
	}) as T;
}

/**
 * Plugin Fastify para telemetria
 */
export async function telemetryPlugin(fastify: any) {
	// Registrar middleware em todas as rotas
	fastify.addHook("onRequest", telemetryMiddleware);

	// Registrar rota de métricas
	fastify.get(
		"/metrics",
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const metrics = await TelemetryService.getMetrics();

				reply.type("application/json");
				return {
					timestamp: new Date().toISOString(),
					service: "erp-server",
					metrics,
				};
			} catch (error) {
				logger.error("Failed to get metrics", { error });
				reply.status(500);
				return { error: "Failed to get metrics" };
			}
		},
	);

	// Registrar rota de health check da telemetria
	fastify.get(
		"/health/telemetry",
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const isHealthy = await TelemetryService.healthCheck();

				if (isHealthy) {
					return { status: "healthy", service: "telemetry" };
				}
				reply.status(503);
				return { status: "unhealthy", service: "telemetry" };
			} catch (error) {
				logger.error("Telemetry health check failed", { error });
				reply.status(503);
				return {
					status: "error",
					service: "telemetry",
					error: (error as Error).message,
				};
			}
		},
	);
}

export default telemetryPlugin;
