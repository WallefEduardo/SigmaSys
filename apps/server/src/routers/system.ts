import { z } from "zod";
import { CacheService } from "../lib/cache";
import { CircuitBreakerManager } from "../lib/circuit-breaker";
import { logger } from "../lib/logger";
import { PerformanceMonitor } from "../lib/performance-monitor";
import { QueueManager } from "../lib/queue";
import { TelemetryService } from "../lib/telemetry-mock";
import { TransactionManager } from "../lib/transactions";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

export const systemRouter = router({
	// Health check geral do sistema
	health: publicProcedure.query(async () => {
		const startTime = Date.now();

		try {
			// Verificar todos os componentes
			const [
				queueHealth,
				circuitHealth,
				cacheHealth,
				telemetryHealth,
				performanceHealth,
			] = await Promise.all([
				QueueManager.healthCheck(),
				CircuitBreakerManager.healthCheck(),
				CacheService.healthCheck(),
				TelemetryService.healthCheck(),
				PerformanceMonitor.healthCheck(),
			]);

			const overallHealthy =
				queueHealth.healthy &&
				circuitHealth.healthy &&
				cacheHealth &&
				telemetryHealth &&
				performanceHealth.healthy;

			const result = {
				status: overallHealthy ? "healthy" : "degraded",
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
				version: process.env.APP_VERSION || "1.0.0",
				environment: process.env.NODE_ENV || "development",
				responseTime: Date.now() - startTime,
				components: {
					queues: queueHealth,
					circuitBreakers: circuitHealth,
					cache: cacheHealth,
					telemetry: telemetryHealth,
					performance: performanceHealth,
				},
				system: {
					memory: process.memoryUsage(),
					cpu: process.cpuUsage(),
					pid: process.pid,
				},
			};

			if (!overallHealthy) {
				logger.warn("System health check detected issues", result);
			}

			return result;
		} catch (error) {
			logger.error("System health check failed", { error });

			return {
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : "Unknown error",
				responseTime: Date.now() - startTime,
			};
		}
	}),

	// Estatísticas das queues
	queueStats: protectedProcedure.query(async () => {
		try {
			const stats = await QueueManager.getAllQueueStats();
			return {
				success: true,
				stats,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.error("Failed to get queue stats", { error });
			throw new Error("Failed to retrieve queue statistics");
		}
	}),

	// Controle de queues
	queueControl: protectedProcedure
		.input(
			z.object({
				queueName: z.string(),
				action: z.enum(["pause", "resume", "clear"]),
				status: z.enum(["completed", "failed", "active", "waiting"]).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { queueName, action, status } = input;

			try {
				switch (action) {
					case "pause":
						await QueueManager.pauseQueue(queueName);
						break;
					case "resume":
						await QueueManager.resumeQueue(queueName);
						break;
					case "clear":
						await QueueManager.clearQueue(queueName, status || "completed");
						break;
				}

				logger.info("Queue action executed", { queueName, action, status });

				return {
					success: true,
					message: `Queue ${queueName} ${action} completed`,
					timestamp: new Date().toISOString(),
				};
			} catch (error) {
				logger.error("Queue control action failed", {
					queueName,
					action,
					error,
				});
				throw new Error(`Failed to ${action} queue ${queueName}`);
			}
		}),

	// Estatísticas dos circuit breakers
	circuitBreakerStats: protectedProcedure.query(() => {
		try {
			const stats = CircuitBreakerManager.getAllStats();
			const health = CircuitBreakerManager.healthCheck();

			return {
				success: true,
				stats,
				health,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.error("Failed to get circuit breaker stats", { error });
			throw new Error("Failed to retrieve circuit breaker statistics");
		}
	}),

	// Controle de circuit breakers
	circuitBreakerControl: protectedProcedure
		.input(
			z.object({
				circuitName: z.string(),
				action: z.enum(["reset", "open", "close"]),
			}),
		)
		.mutation(async ({ input }) => {
			const { circuitName, action } = input;

			try {
				const circuits = CircuitBreakerManager.getAllCircuits();
				const circuit = circuits.get(circuitName);

				if (!circuit) {
					throw new Error(`Circuit breaker "${circuitName}" not found`);
				}

				switch (action) {
					case "reset":
						circuit.reset();
						break;
					case "open":
						circuit.forceState("OPEN" as any);
						break;
					case "close":
						circuit.forceState("CLOSED" as any);
						break;
				}

				logger.warn("Circuit breaker manual control", { circuitName, action });

				return {
					success: true,
					message: `Circuit breaker ${circuitName} ${action} completed`,
					newState: circuit.getStats().state,
					timestamp: new Date().toISOString(),
				};
			} catch (error) {
				logger.error("Circuit breaker control failed", {
					circuitName,
					action,
					error,
				});
				throw new Error(`Failed to ${action} circuit breaker ${circuitName}`);
			}
		}),

	// Estatísticas de performance
	performanceStats: protectedProcedure
		.input(
			z.object({
				category: z
					.enum(["database", "api", "formula", "cache", "file", "external"])
					.optional(),
				timeWindow: z.number().optional(), // em milissegundos
			}),
		)
		.query(({ input }) => {
			try {
				const { category, timeWindow } = input;

				const metrics = PerformanceMonitor.getMetrics(category, timeWindow);
				const stats = PerformanceMonitor.getStats(category);
				const health = PerformanceMonitor.healthCheck();

				return {
					success: true,
					metrics: metrics.slice(-100), // Últimas 100 métricas
					stats,
					health,
					timestamp: new Date().toISOString(),
				};
			} catch (error) {
				logger.error("Failed to get performance stats", { error });
				throw new Error("Failed to retrieve performance statistics");
			}
		}),

	// Executar teste de carga
	runLoadTest: protectedProcedure
		.input(
			z.object({
				testName: z.string(),
				endpoint: z.string(),
				concurrency: z.number().min(1).max(50).default(10),
				duration: z.number().min(1000).max(300000).default(30000), // 30 segundos max
				maxRequests: z.number().min(1).max(10000).default(1000),
			}),
		)
		.mutation(async ({ input }) => {
			const { testName, endpoint, concurrency, duration, maxRequests } = input;

			try {
				logger.info(`Starting load test: ${testName}`, input);

				// Simular operação de teste (em produção, seria uma chamada real)
				const testOperation = async () => {
					// Simular latência variável
					const delay = Math.random() * 100 + 50; // 50-150ms
					await new Promise((resolve) => setTimeout(resolve, delay));

					// Simular falhas ocasionais
					if (Math.random() < 0.05) {
						// 5% de falha
						throw new Error("Simulated failure");
					}

					return { success: true };
				};

				const result = await PerformanceMonitor.runLoadTest(
					testName,
					testOperation,
					{
						concurrency,
						duration,
						maxRequests,
					},
				);

				logger.info(`Load test completed: ${testName}`, {
					throughput: result.throughput,
					errorRate: result.errorRate,
					averageResponseTime: result.averageResponseTime,
				});

				return {
					success: true,
					result,
					timestamp: new Date().toISOString(),
				};
			} catch (error) {
				logger.error("Load test failed", { testName, error });
				throw new Error(
					`Load test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}),

	// Estatísticas do cache
	cacheStats: protectedProcedure.query(async () => {
		try {
			const stats = await CacheService.getStats();
			const health = await CacheService.healthCheck();

			return {
				success: true,
				stats,
				healthy: health,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.error("Failed to get cache stats", { error });
			throw new Error("Failed to retrieve cache statistics");
		}
	}),

	// Limpar cache
	clearCache: protectedProcedure
		.input(
			z.object({
				pattern: z.string().optional(),
				companyId: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { pattern, companyId } = input;

			try {
				let clearedCount = 0;

				if (companyId) {
					await CacheService.invalidateCompanyCache(companyId);
					clearedCount = 1; // Aproximado
					logger.info(`Cache cleared for company ${companyId}`);
				} else if (pattern) {
					clearedCount = await CacheService.invalidatePattern(pattern);
					logger.info(`Cache cleared with pattern: ${pattern}`, {
						clearedCount,
					});
				} else {
					// Limpar cache geral (padrões comuns)
					const patterns = [
						"formula:*",
						"materials:*",
						"products:*",
						"units:*",
					];
					for (const p of patterns) {
						clearedCount += await CacheService.invalidatePattern(p);
					}
					logger.info("General cache cleared", { clearedCount });
				}

				return {
					success: true,
					clearedCount,
					message: "Cache cleared successfully",
					timestamp: new Date().toISOString(),
				};
			} catch (error) {
				logger.error("Failed to clear cache", { pattern, companyId, error });
				throw new Error("Failed to clear cache");
			}
		}),

	// Métricas de telemetria
	telemetryMetrics: protectedProcedure.query(async () => {
		try {
			const metrics = await TelemetryService.getMetrics();
			const health = await TelemetryService.healthCheck();

			return {
				success: true,
				metrics,
				healthy: health,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.error("Failed to get telemetry metrics", { error });
			throw new Error("Failed to retrieve telemetry metrics");
		}
	}),

	// Informações do sistema
	systemInfo: protectedProcedure.query(() => {
		try {
			const memUsage = process.memoryUsage();
			const cpuUsage = process.cpuUsage();

			return {
				success: true,
				info: {
					node: {
						version: process.version,
						platform: process.platform,
						arch: process.arch,
						uptime: process.uptime(),
						pid: process.pid,
					},
					memory: {
						rss: Math.round(memUsage.rss / 1024 / 1024), // MB
						heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
						heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
						external: Math.round(memUsage.external / 1024 / 1024),
						arrayBuffers: Math.round(
							(memUsage as any).arrayBuffers / 1024 / 1024,
						),
					},
					cpu: {
						user: cpuUsage.user,
						system: cpuUsage.system,
					},
					environment: {
						nodeEnv: process.env.NODE_ENV,
						appVersion: process.env.APP_VERSION || "1.0.0",
					},
				},
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.error("Failed to get system info", { error });
			throw new Error("Failed to retrieve system information");
		}
	}),

	// Restart de componentes (com cuidado)
	restartComponent: protectedProcedure
		.input(
			z.object({
				component: z.enum(["cache", "queues", "telemetry"]),
				confirm: z.boolean(),
			}),
		)
		.mutation(async ({ input }) => {
			const { component, confirm } = input;

			if (!confirm) {
				throw new Error("Restart must be confirmed");
			}

			try {
				logger.warn(`Restarting component: ${component}`);

				switch (component) {
					case "cache":
						// Não há restart real para cache, apenas limpar
						await CacheService.invalidatePattern("*");
						break;
					case "queues":
						await QueueManager.shutdown();
						await QueueManager.initialize();
						break;
					case "telemetry":
						await TelemetryService.shutdown();
						TelemetryService.initialize();
						break;
				}

				logger.info(`Component restarted successfully: ${component}`);

				return {
					success: true,
					message: `Component ${component} restarted successfully`,
					timestamp: new Date().toISOString(),
				};
			} catch (error) {
				logger.error("Component restart failed", { component, error });
				throw new Error(`Failed to restart component ${component}`);
			}
		}),
});
