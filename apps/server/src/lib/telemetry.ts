import { metrics, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { logger } from "./logger";

const isDevelopment = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test";

// Configuração do OpenTelemetry
export class TelemetryService {
	private static sdk: NodeSDK | null = null;
	private static meterProvider: any = null;
	private static tracerProvider: any = null;

	// Métricas customizadas
	private static meters = {
		http: null as any,
		database: null as any,
		business: null as any,
		system: null as any,
	};

	private static counters = {
		httpRequests: null as any,
		dbQueries: null as any,
		formulaCalculations: null as any,
		errors: null as any,
		cacheHits: null as any,
		cacheMisses: null as any,
	};

	private static histograms = {
		httpDuration: null as any,
		dbQueryDuration: null as any,
		formulaDuration: null as any,
		transactionDuration: null as any,
	};

	private static gauges = {
		activeConnections: null as any,
		memoryUsage: null as any,
		cpuUsage: null as any,
		queueSize: null as any,
	};

	/**
	 * Inicializar OpenTelemetry
	 */
	static initialize() {
		if (isTest) {
			logger.debug("Skipping telemetry initialization in test environment");
			return;
		}

		try {
			// Configurar resource
			const resource = new Resource({
				[SemanticResourceAttributes.SERVICE_NAME]: "erp-server",
				[SemanticResourceAttributes.SERVICE_VERSION]:
					process.env.APP_VERSION || "1.0.0",
				[SemanticResourceAttributes.SERVICE_NAMESPACE]: "erp-system",
				[SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
					process.env.NODE_ENV || "development",
			});

			// Configurar exportadores
			const prometheusExporter = new PrometheusExporter(
				{
					port: 9090,
					endpoint: "/metrics",
				},
				() => {
					logger.info("Prometheus metrics server started on port 9090");
				},
			);

			// Configurar SDK
			TelemetryService.sdk = new NodeSDK({
				resource,
				instrumentations: [
					getNodeAutoInstrumentations({
						// Configurar instrumentações específicas
						"@opentelemetry/instrumentation-fs": {
							enabled: false, // Desabilitar FS para reduzir ruído
						},
						"@opentelemetry/instrumentation-dns": {
							enabled: false,
						},
					}),
				],
				metricReader: prometheusExporter,
			});

			// Inicializar SDK
			TelemetryService.sdk.start();

			// Configurar métricas customizadas
			TelemetryService.setupCustomMetrics();

			// Configurar coleta de métricas do sistema
			TelemetryService.startSystemMetricsCollection();

			logger.info("OpenTelemetry initialized successfully", {
				service: "erp-server",
				environment: process.env.NODE_ENV,
				metricsEndpoint: "http://localhost:9090/metrics",
			});
		} catch (error) {
			logger.error("Failed to initialize OpenTelemetry", { error });
		}
	}

	/**
	 * Configurar métricas customizadas
	 */
	private static setupCustomMetrics() {
		try {
			// Obter meter provider
			TelemetryService.meterProvider = metrics.getMeter("erp-server", "1.0.0");

			// Configurar meters por contexto
			TelemetryService.meters.http = TelemetryService.meterProvider;
			TelemetryService.meters.database = TelemetryService.meterProvider;
			TelemetryService.meters.business = TelemetryService.meterProvider;
			TelemetryService.meters.system = TelemetryService.meterProvider;

			// Contadores
			TelemetryService.counters.httpRequests =
				TelemetryService.meters.http.createCounter("http_requests_total", {
					description: "Total number of HTTP requests",
				});

			TelemetryService.counters.dbQueries =
				TelemetryService.meters.database.createCounter("db_queries_total", {
					description: "Total number of database queries",
				});

			TelemetryService.counters.formulaCalculations =
				TelemetryService.meters.business.createCounter(
					"formula_calculations_total",
					{
						description: "Total number of formula calculations",
					},
				);

			TelemetryService.counters.errors =
				TelemetryService.meters.system.createCounter("errors_total", {
					description: "Total number of errors",
				});

			TelemetryService.counters.cacheHits =
				TelemetryService.meters.system.createCounter("cache_hits_total", {
					description: "Total number of cache hits",
				});

			TelemetryService.counters.cacheMisses =
				TelemetryService.meters.system.createCounter("cache_misses_total", {
					description: "Total number of cache misses",
				});

			// Histogramas para latência
			TelemetryService.histograms.httpDuration =
				TelemetryService.meters.http.createHistogram(
					"http_request_duration_ms",
					{
						description: "HTTP request duration in milliseconds",
					},
				);

			TelemetryService.histograms.dbQueryDuration =
				TelemetryService.meters.database.createHistogram(
					"db_query_duration_ms",
					{
						description: "Database query duration in milliseconds",
					},
				);

			TelemetryService.histograms.formulaDuration =
				TelemetryService.meters.business.createHistogram(
					"formula_calculation_duration_ms",
					{
						description: "Formula calculation duration in milliseconds",
					},
				);

			TelemetryService.histograms.transactionDuration =
				TelemetryService.meters.database.createHistogram(
					"transaction_duration_ms",
					{
						description: "Database transaction duration in milliseconds",
					},
				);

			// Gauges para métricas do sistema
			TelemetryService.gauges.activeConnections =
				TelemetryService.meters.system.createUpDownCounter(
					"active_connections",
					{
						description: "Number of active connections",
					},
				);

			TelemetryService.gauges.memoryUsage =
				TelemetryService.meters.system.createObservableGauge(
					"memory_usage_bytes",
					{
						description: "Memory usage in bytes",
					},
				);

			TelemetryService.gauges.cpuUsage =
				TelemetryService.meters.system.createObservableGauge(
					"cpu_usage_percent",
					{
						description: "CPU usage percentage",
					},
				);

			TelemetryService.gauges.queueSize =
				TelemetryService.meters.system.createObservableGauge("queue_size", {
					description: "Number of items in queue",
				});

			logger.debug("Custom metrics configured successfully");
		} catch (error) {
			logger.error("Failed to setup custom metrics", { error });
		}
	}

	/**
	 * Iniciar coleta de métricas do sistema
	 */
	private static startSystemMetricsCollection() {
		if (isTest) return;

		// Coletar métricas de memória
		TelemetryService.gauges.memoryUsage?.addCallback((result: any) => {
			const memUsage = process.memoryUsage();
			result.observe(memUsage.heapUsed, { type: "heap_used" });
			result.observe(memUsage.heapTotal, { type: "heap_total" });
			result.observe(memUsage.rss, { type: "rss" });
			result.observe(memUsage.external, { type: "external" });
		});

		// Coletar métricas de CPU (com intervalo)
		let lastCpuUsage = process.cpuUsage();
		setInterval(() => {
			const currentCpuUsage = process.cpuUsage(lastCpuUsage);
			const totalUsage = currentCpuUsage.user + currentCpuUsage.system;
			const percentage = totalUsage / 1000000; // Converter para segundos

			if (TelemetryService.gauges.cpuUsage) {
				// Usar uma abordagem diferente para observar CPU
				TelemetryService.gauges.cpuUsage.addCallback((result: any) => {
					result.observe(percentage, { type: "total" });
				});
			}

			lastCpuUsage = process.cpuUsage();
		}, 5000); // A cada 5 segundos
	}

	/**
	 * Registrar requisição HTTP
	 */
	static recordHttpRequest(
		method: string,
		route: string,
		statusCode: number,
		duration: number,
	) {
		if (isTest) return;

		try {
			TelemetryService.counters.httpRequests?.add(1, {
				method,
				route,
				status_code: statusCode.toString(),
				status_class: `${Math.floor(statusCode / 100)}xx`,
			});

			TelemetryService.histograms.httpDuration?.record(duration, {
				method,
				route,
				status_code: statusCode.toString(),
			});
		} catch (error) {
			logger.error("Failed to record HTTP metrics", {
				error,
				method,
				route,
				statusCode,
			});
		}
	}

	/**
	 * Registrar query de banco
	 */
	static recordDatabaseQuery(
		operation: string,
		table: string,
		duration: number,
		success = true,
	) {
		if (isTest) return;

		try {
			TelemetryService.counters.dbQueries?.add(1, {
				operation,
				table,
				success: success.toString(),
			});

			TelemetryService.histograms.dbQueryDuration?.record(duration, {
				operation,
				table,
				success: success.toString(),
			});
		} catch (error) {
			logger.error("Failed to record database metrics", {
				error,
				operation,
				table,
			});
		}
	}

	/**
	 * Registrar cálculo de fórmula
	 */
	static recordFormulaCalculation(
		formula: string,
		duration: number,
		success = true,
		variables = 0,
	) {
		if (isTest) return;

		try {
			TelemetryService.counters.formulaCalculations?.add(1, {
				success: success.toString(),
				complexity: variables > 5 ? "high" : variables > 2 ? "medium" : "low",
			});

			TelemetryService.histograms.formulaDuration?.record(duration, {
				success: success.toString(),
				complexity: variables > 5 ? "high" : variables > 2 ? "medium" : "low",
			});
		} catch (error) {
			logger.error("Failed to record formula metrics", {
				error,
				formula: formula.substring(0, 50),
			});
		}
	}

	/**
	 * Registrar transação
	 */
	static recordTransaction(
		operation: string,
		duration: number,
		success = true,
		retries = 0,
	) {
		if (isTest) return;

		try {
			TelemetryService.histograms.transactionDuration?.record(duration, {
				operation,
				success: success.toString(),
				retries: retries.toString(),
			});
		} catch (error) {
			logger.error("Failed to record transaction metrics", {
				error,
				operation,
			});
		}
	}

	/**
	 * Registrar erro
	 */
	static recordError(
		type: string,
		severity: "low" | "medium" | "high" | "critical",
		context?: string,
	) {
		if (isTest) return;

		try {
			TelemetryService.counters.errors?.add(1, {
				type,
				severity,
				context: context || "unknown",
			});
		} catch (error) {
			logger.error("Failed to record error metrics", { error, type, severity });
		}
	}

	/**
	 * Registrar cache hit/miss
	 */
	static recordCacheOperation(
		operation: "hit" | "miss",
		key: string,
		duration?: number,
	) {
		if (isTest) return;

		try {
			const keyPrefix = key.split(":")[0] || "unknown";

			if (operation === "hit") {
				TelemetryService.counters.cacheHits?.add(1, { key_prefix: keyPrefix });
			} else {
				TelemetryService.counters.cacheMisses?.add(1, {
					key_prefix: keyPrefix,
				});
			}
		} catch (error) {
			logger.error("Failed to record cache metrics", { error, operation, key });
		}
	}

	/**
	 * Registrar conexão ativa
	 */
	static recordActiveConnection(change: 1 | -1) {
		if (isTest) return;

		try {
			TelemetryService.gauges.activeConnections?.add(change);
		} catch (error) {
			logger.error("Failed to record connection metrics", { error, change });
		}
	}

	/**
	 * Criar span customizado
	 */
	static createSpan(name: string, kind: SpanKind = SpanKind.INTERNAL) {
		if (isTest)
			return {
				end: () => {},
				setStatus: () => {},
				addEvent: () => {},
				setAttributes: () => {},
			};

		try {
			const tracer = trace.getTracer("erp-server", "1.0.0");
			return tracer.startSpan(name, { kind });
		} catch (error) {
			logger.error("Failed to create span", { error, name });
			return {
				end: () => {},
				setStatus: () => {},
				addEvent: () => {},
				setAttributes: () => {},
			};
		}
	}

	/**
	 * Wrapper para instrumentar função
	 */
	static instrumentFunction<T extends (...args: any[]) => any>(
		name: string,
		fn: T,
		attributes?: Record<string, string | number | boolean>,
	): T {
		if (isTest) return fn;

		return ((...args: any[]) => {
			const span = TelemetryService.createSpan(name);
			const startTime = Date.now();

			try {
				if (attributes) {
					span.setAttributes(attributes);
				}

				const result = fn(...args);

				// Se é uma Promise, aguardar para marcar como completo
				if (result && typeof result.then === "function") {
					return result
						.then((value: any) => {
							span.setStatus({ code: SpanStatusCode.OK });
							span.end();
							return value;
						})
						.catch((error: any) => {
							span.setStatus({
								code: SpanStatusCode.ERROR,
								message: error.message,
							});
							span.end();
							throw error;
						});
				}

				// Função síncrona
				span.setStatus({ code: SpanStatusCode.OK });
				span.end();
				return result;
			} catch (error) {
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: (error as Error).message,
				});
				span.end();
				throw error;
			}
		}) as T;
	}

	/**
	 * Obter métricas atuais
	 */
	static async getMetrics(): Promise<{
		httpRequests: number;
		dbQueries: number;
		formulaCalculations: number;
		errors: number;
		cacheHitRate: number;
		avgResponseTime: number;
	}> {
		// Em produção, isso viria do Prometheus
		// Por enquanto, retornamos valores mock
		return {
			httpRequests: 0,
			dbQueries: 0,
			formulaCalculations: 0,
			errors: 0,
			cacheHitRate: 0,
			avgResponseTime: 0,
		};
	}

	/**
	 * Health check do sistema de telemetria
	 */
	static async healthCheck(): Promise<boolean> {
		try {
			if (isTest) return true;

			// Verificar se SDK está funcionando
			const span = TelemetryService.createSpan("telemetry-health-check");
			span.addEvent("Health check started");
			span.end();

			return true;
		} catch (error) {
			logger.error("Telemetry health check failed", { error });
			return false;
		}
	}

	/**
	 * Shutdown graceful
	 */
	static async shutdown(): Promise<void> {
		try {
			if (TelemetryService.sdk) {
				await TelemetryService.sdk.shutdown();
				logger.info("OpenTelemetry SDK shutdown completed");
			}
		} catch (error) {
			logger.error("Failed to shutdown OpenTelemetry SDK", { error });
		}
	}
}

// Instrumentação automática de funções comuns
export const instrumentAsync = <T extends (...args: any[]) => Promise<any>>(
	name: string,
	fn: T,
	attributes?: Record<string, string | number | boolean>,
): T => {
	return TelemetryService.instrumentFunction(name, fn, attributes);
};

export const instrumentSync = <T extends (...args: any[]) => any>(
	name: string,
	fn: T,
	attributes?: Record<string, string | number | boolean>,
): T => {
	return TelemetryService.instrumentFunction(name, fn, attributes);
};

// Decorador para instrumentação automática
export function instrument(
	name?: string,
	attributes?: Record<string, string | number | boolean>,
) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		const spanName = name || `${target.constructor.name}.${propertyKey}`;

		descriptor.value = TelemetryService.instrumentFunction(
			spanName,
			originalMethod,
			attributes,
		);
		return descriptor;
	};
}

// Inicializar automaticamente se não estiver em teste
if (!isTest) {
	TelemetryService.initialize();
}

// Shutdown graceful no processo
process.on("SIGTERM", async () => {
	await TelemetryService.shutdown();
});

process.on("SIGINT", async () => {
	await TelemetryService.shutdown();
});

export { TelemetryService };
export default TelemetryService;
