import { performance } from "perf_hooks";
import { CacheService } from "./cache";
import { logger } from "./logger";
import { TelemetryService } from "./telemetry";

export interface PerformanceMetric {
	name: string;
	duration: number;
	timestamp: number;
	category: "database" | "api" | "formula" | "cache" | "file" | "external";
	metadata?: Record<string, any>;
}

export interface PerformanceProfile {
	name: string;
	measurements: PerformanceMetric[];
	totalDuration: number;
	startTime: number;
	endTime?: number;
}

export interface PerformanceBenchmark {
	name: string;
	expectedDuration: number;
	warningThreshold: number;
	criticalThreshold: number;
	category: string;
}

export interface LoadTestResult {
	testName: string;
	concurrency: number;
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	averageResponseTime: number;
	minResponseTime: number;
	maxResponseTime: number;
	throughput: number; // requests per second
	errorRate: number;
	percentiles: {
		p50: number;
		p90: number;
		p95: number;
		p99: number;
	};
	duration: number;
	timestamp: number;
}

// Classe para monitoramento de performance
export class PerformanceMonitor {
	private static profiles = new Map<string, PerformanceProfile>();
	private static metrics: PerformanceMetric[] = [];
	private static benchmarks = new Map<string, PerformanceBenchmark>();
	private static enabled = process.env.NODE_ENV !== "test";

	/**
	 * Inicializar monitor de performance
	 */
	static initialize(): void {
		if (!PerformanceMonitor.enabled) return;

		// Configurar benchmarks padrões
		PerformanceMonitor.setupDefaultBenchmarks();

		// Configurar coleta automática de métricas do sistema
		PerformanceMonitor.startSystemMetricsCollection();

		logger.info("🔍 Performance monitor initialized");
	}

	/**
	 * Configurar benchmarks padrões
	 */
	private static setupDefaultBenchmarks(): void {
		const defaultBenchmarks: PerformanceBenchmark[] = [
			{
				name: "database-query",
				expectedDuration: 100,
				warningThreshold: 500,
				criticalThreshold: 1000,
				category: "database",
			},
			{
				name: "api-request",
				expectedDuration: 200,
				warningThreshold: 1000,
				criticalThreshold: 3000,
				category: "api",
			},
			{
				name: "formula-calculation",
				expectedDuration: 50,
				warningThreshold: 200,
				criticalThreshold: 500,
				category: "formula",
			},
			{
				name: "cache-operation",
				expectedDuration: 10,
				warningThreshold: 50,
				criticalThreshold: 100,
				category: "cache",
			},
			{
				name: "file-operation",
				expectedDuration: 100,
				warningThreshold: 500,
				criticalThreshold: 2000,
				category: "file",
			},
			{
				name: "external-api",
				expectedDuration: 1000,
				warningThreshold: 3000,
				criticalThreshold: 10000,
				category: "external",
			},
		];

		for (const benchmark of defaultBenchmarks) {
			PerformanceMonitor.benchmarks.set(benchmark.name, benchmark);
		}

		logger.debug("Default performance benchmarks configured", {
			count: defaultBenchmarks.length,
		});
	}

	/**
	 * Iniciar coleta de métricas do sistema
	 */
	private static startSystemMetricsCollection(): void {
		// Coletar métricas a cada 30 segundos
		setInterval(() => {
			PerformanceMonitor.collectSystemMetrics();
		}, 30000);
	}

	/**
	 * Coletar métricas do sistema
	 */
	private static collectSystemMetrics(): void {
		try {
			const memUsage = process.memoryUsage();
			const cpuUsage = process.cpuUsage();

			// Registrar métricas no telemetry
			TelemetryService.recordDatabaseQuery(
				"system",
				"memory_usage",
				memUsage.heapUsed,
			);

			// Log se uso de memória estiver alto
			const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
			if (heapUsedMB > 500) {
				// > 500MB
				logger.warn("High memory usage detected", {
					heapUsedMB: Math.round(heapUsedMB),
					heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
					rssMB: Math.round(memUsage.rss / 1024 / 1024),
				});
			}
		} catch (error) {
			logger.error("Failed to collect system metrics", { error });
		}
	}

	/**
	 * Iniciar um perfil de performance
	 */
	static startProfile(name: string): void {
		if (!PerformanceMonitor.enabled) return;

		const profile: PerformanceProfile = {
			name,
			measurements: [],
			totalDuration: 0,
			startTime: performance.now(),
		};

		PerformanceMonitor.profiles.set(name, profile);

		logger.debug(`Performance profile "${name}" started`);
	}

	/**
	 * Adicionar medição a um perfil
	 */
	static addMeasurement(
		profileName: string,
		measurementName: string,
		category: PerformanceMetric["category"],
		duration: number,
		metadata?: Record<string, any>,
	): void {
		if (!PerformanceMonitor.enabled) return;

		const profile = PerformanceMonitor.profiles.get(profileName);
		if (!profile) {
			logger.warn(`Performance profile "${profileName}" not found`);
			return;
		}

		const metric: PerformanceMetric = {
			name: measurementName,
			duration,
			timestamp: Date.now(),
			category,
			metadata,
		};

		profile.measurements.push(metric);
		PerformanceMonitor.metrics.push(metric);

		// Verificar benchmark
		PerformanceMonitor.checkBenchmark(measurementName, duration, category);

		logger.debug(`Measurement added to profile "${profileName}"`, {
			measurement: measurementName,
			duration,
			category,
		});
	}

	/**
	 * Finalizar um perfil de performance
	 */
	static endProfile(name: string): PerformanceProfile | null {
		if (!PerformanceMonitor.enabled) return null;

		const profile = PerformanceMonitor.profiles.get(name);
		if (!profile) {
			logger.warn(`Performance profile "${name}" not found`);
			return null;
		}

		profile.endTime = performance.now();
		profile.totalDuration = profile.endTime - profile.startTime;

		// Remover do map ativo
		PerformanceMonitor.profiles.delete(name);

		// Analisar performance
		PerformanceMonitor.analyzeProfile(profile);

		logger.debug(`Performance profile "${name}" completed`, {
			totalDuration: profile.totalDuration,
			measurementCount: profile.measurements.length,
		});

		return profile;
	}

	/**
	 * Analisar um perfil de performance
	 */
	private static analyzeProfile(profile: PerformanceProfile): void {
		const { name, measurements, totalDuration } = profile;

		// Calcular estatísticas
		const stats = {
			totalMeasurements: measurements.length,
			totalDuration,
			averageDuration:
				measurements.length > 0
					? measurements.reduce((sum, m) => sum + m.duration, 0) /
						measurements.length
					: 0,
			slowestMeasurement: measurements.reduce(
				(slowest, current) =>
					current.duration > slowest.duration ? current : slowest,
				{ duration: 0, name: "", timestamp: 0, category: "api" as const },
			),
		};

		// Log se performance está degradada
		if (totalDuration > 5000) {
			// > 5 segundos
			logger.warn(`Slow performance profile detected: "${name}"`, stats);
			TelemetryService.recordError(
				"slow_performance_profile",
				"medium",
				"performance_monitor",
			);
		}

		// Agrupar por categoria
		const byCategory = measurements.reduce(
			(acc, m) => {
				if (!acc[m.category]) acc[m.category] = [];
				acc[m.category].push(m.duration);
				return acc;
			},
			{} as Record<string, number[]>,
		);

		// Log estatísticas por categoria
		for (const [category, durations] of Object.entries(byCategory)) {
			const avgDuration =
				durations.reduce((sum, d) => sum + d, 0) / durations.length;
			logger.debug(`Profile "${name}" - ${category} category`, {
				count: durations.length,
				averageDuration: Math.round(avgDuration * 100) / 100,
				totalDuration: durations.reduce((sum, d) => sum + d, 0),
			});
		}
	}

	/**
	 * Verificar benchmark de performance
	 */
	private static checkBenchmark(
		name: string,
		duration: number,
		category: PerformanceMetric["category"],
	): void {
		const benchmark =
			PerformanceMonitor.benchmarks.get(name) ||
			PerformanceMonitor.benchmarks.get(category);
		if (!benchmark) return;

		if (duration > benchmark.criticalThreshold) {
			logger.error(`Critical performance issue detected: ${name}`, {
				duration,
				threshold: benchmark.criticalThreshold,
				category,
			});
			TelemetryService.recordError(
				"critical_performance_issue",
				"critical",
				"performance_monitor",
			);
		} else if (duration > benchmark.warningThreshold) {
			logger.warn(`Performance warning: ${name}`, {
				duration,
				threshold: benchmark.warningThreshold,
				category,
			});
			TelemetryService.recordError(
				"performance_warning",
				"medium",
				"performance_monitor",
			);
		}
	}

	/**
	 * Obter métricas de performance
	 */
	static getMetrics(
		category?: PerformanceMetric["category"],
		timeWindow?: number,
	): PerformanceMetric[] {
		if (!PerformanceMonitor.enabled) return [];

		let filtered = PerformanceMonitor.metrics;

		if (category) {
			filtered = filtered.filter((m) => m.category === category);
		}

		if (timeWindow) {
			const cutoff = Date.now() - timeWindow;
			filtered = filtered.filter((m) => m.timestamp > cutoff);
		}

		return filtered.slice(-1000); // Últimas 1000 métricas
	}

	/**
	 * Obter estatísticas de performance
	 */
	static getStats(category?: PerformanceMetric["category"]): {
		totalMetrics: number;
		averageDuration: number;
		minDuration: number;
		maxDuration: number;
		categoryCounts: Record<string, number>;
		recentSlowOperations: PerformanceMetric[];
	} {
		const metrics = PerformanceMonitor.getMetrics(category, 60000); // Última hora

		if (metrics.length === 0) {
			return {
				totalMetrics: 0,
				averageDuration: 0,
				minDuration: 0,
				maxDuration: 0,
				categoryCounts: {},
				recentSlowOperations: [],
			};
		}

		const durations = metrics.map((m) => m.duration);
		const categoryCounts = metrics.reduce(
			(acc, m) => {
				acc[m.category] = (acc[m.category] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		// Operações lentas recentes (últimos 10 minutos)
		const recentCutoff = Date.now() - 600000; // 10 minutos
		const recentSlowOperations = metrics
			.filter((m) => m.timestamp > recentCutoff && m.duration > 1000)
			.sort((a, b) => b.duration - a.duration)
			.slice(0, 10);

		return {
			totalMetrics: metrics.length,
			averageDuration:
				durations.reduce((sum, d) => sum + d, 0) / durations.length,
			minDuration: Math.min(...durations),
			maxDuration: Math.max(...durations),
			categoryCounts,
			recentSlowOperations,
		};
	}

	/**
	 * Executar teste de carga simples
	 */
	static async runLoadTest(
		testName: string,
		operation: () => Promise<any>,
		options: {
			concurrency?: number;
			duration?: number;
			maxRequests?: number;
		} = {},
	): Promise<LoadTestResult> {
		const {
			concurrency = 10,
			duration = 30000, // 30 segundos
			maxRequests = 1000,
		} = options;

		logger.info(`Starting load test: ${testName}`, {
			concurrency,
			duration,
			maxRequests,
		});

		const startTime = Date.now();
		const results: { duration: number; success: boolean }[] = [];
		const workers: Promise<void>[] = [];

		// Criar workers concorrentes
		for (let i = 0; i < concurrency; i++) {
			const worker = async () => {
				while (
					Date.now() - startTime < duration &&
					results.length < maxRequests
				) {
					const requestStart = performance.now();

					try {
						await operation();
						results.push({
							duration: performance.now() - requestStart,
							success: true,
						});
					} catch (error) {
						results.push({
							duration: performance.now() - requestStart,
							success: false,
						});
					}
				}
			};

			workers.push(worker());
		}

		// Aguardar todos os workers
		await Promise.all(workers);

		const totalDuration = Date.now() - startTime;
		const successfulRequests = results.filter((r) => r.success).length;
		const failedRequests = results.length - successfulRequests;
		const durations = results.map((r) => r.duration).sort((a, b) => a - b);

		// Calcular percentis
		const percentiles = {
			p50: durations[Math.floor(durations.length * 0.5)] || 0,
			p90: durations[Math.floor(durations.length * 0.9)] || 0,
			p95: durations[Math.floor(durations.length * 0.95)] || 0,
			p99: durations[Math.floor(durations.length * 0.99)] || 0,
		};

		const result: LoadTestResult = {
			testName,
			concurrency,
			totalRequests: results.length,
			successfulRequests,
			failedRequests,
			averageResponseTime:
				durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
			minResponseTime: Math.min(...durations) || 0,
			maxResponseTime: Math.max(...durations) || 0,
			throughput: (results.length / totalDuration) * 1000, // req/sec
			errorRate: failedRequests / results.length || 0,
			percentiles,
			duration: totalDuration,
			timestamp: Date.now(),
		};

		logger.info(`Load test completed: ${testName}`, result);

		// Salvar resultado no cache para análise posterior
		await CacheService.set(
			`load-test:${testName}:${Date.now()}`,
			result,
			86400,
		); // 24h

		return result;
	}

	/**
	 * Limpar métricas antigas
	 */
	static cleanup(olderThan = 3600000): void {
		// 1 hora por padrão
		const cutoff = Date.now() - olderThan;
		const initialCount = PerformanceMonitor.metrics.length;

		PerformanceMonitor.metrics = PerformanceMonitor.metrics.filter(
			(m) => m.timestamp > cutoff,
		);

		const cleaned = initialCount - PerformanceMonitor.metrics.length;
		if (cleaned > 0) {
			logger.debug(`Cleaned up ${cleaned} old performance metrics`);
		}
	}

	/**
	 * Definir benchmark customizado
	 */
	static setBenchmark(benchmark: PerformanceBenchmark): void {
		PerformanceMonitor.benchmarks.set(benchmark.name, benchmark);
		logger.debug(`Performance benchmark set: ${benchmark.name}`, benchmark);
	}

	/**
	 * Health check do monitor de performance
	 */
	static healthCheck(): {
		healthy: boolean;
		activeProfiles: number;
		recentMetrics: number;
		systemPerformance: {
			memoryUsage: number;
			recentSlowOperations: number;
		};
	} {
		const recentMetrics = PerformanceMonitor.getMetrics(undefined, 300000); // Últimos 5 minutos
		const slowOperations = recentMetrics.filter(
			(m) => m.duration > 1000,
		).length;

		return {
			healthy: slowOperations < 10, // Menos que 10 operações lentas nos últimos 5 min
			activeProfiles: PerformanceMonitor.profiles.size,
			recentMetrics: recentMetrics.length,
			systemPerformance: {
				memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
				recentSlowOperations: slowOperations,
			},
		};
	}
}

// Decorator para monitorar performance de métodos
export function monitor(
	category: PerformanceMetric["category"],
	benchmarkName?: string,
) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		const methodName = `${target.constructor.name}.${propertyKey}`;

		descriptor.value = async function (...args: any[]) {
			const startTime = performance.now();

			try {
				const result = await originalMethod.apply(this, args);
				const duration = performance.now() - startTime;

				PerformanceMonitor.addMeasurement(
					"global",
					benchmarkName || methodName,
					category,
					duration,
					{ methodName, args: args.length },
				);

				return result;
			} catch (error) {
				const duration = performance.now() - startTime;

				PerformanceMonitor.addMeasurement(
					"global",
					`${benchmarkName || methodName}-error`,
					category,
					duration,
					{ methodName, error: true },
				);

				throw error;
			}
		};

		return descriptor;
	};
}

// Função helper para medir performance de operações
export async function measurePerformance<T>(
	name: string,
	category: PerformanceMetric["category"],
	operation: () => Promise<T>,
	metadata?: Record<string, any>,
): Promise<T> {
	const startTime = performance.now();

	try {
		const result = await operation();
		const duration = performance.now() - startTime;

		PerformanceMonitor.addMeasurement(
			"global",
			name,
			category,
			duration,
			metadata,
		);

		return result;
	} catch (error) {
		const duration = performance.now() - startTime;

		PerformanceMonitor.addMeasurement(
			"global",
			`${name}-error`,
			category,
			duration,
			{
				...metadata,
				error: true,
			},
		);

		throw error;
	}
}

// Inicializar automaticamente se não estiver em teste
if (process.env.NODE_ENV !== "test") {
	PerformanceMonitor.initialize();
}

export { PerformanceMonitor };
export default PerformanceMonitor;
