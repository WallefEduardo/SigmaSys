// Mock do TelemetryService para desenvolvimento sem dependências OpenTelemetry
export class TelemetryService {
	static async initialize() {
		console.log("📊 TelemetryService (mock) initialized");
	}

	static async shutdown() {
		console.log("📊 TelemetryService (mock) shutdown");
	}

	static trackHTTPRequest(
		method: string,
		route: string,
		statusCode: number,
		duration: number,
	) {
		// Mock - não faz nada
	}

	static trackDatabaseQuery(
		operation: string,
		table: string,
		duration: number,
	) {
		// Mock - não faz nada
	}

	static trackFormulaCalculation(formulaName: string, duration: number) {
		// Mock - não faz nada
	}

	static trackError(error: Error, context?: any) {
		console.error("🚨 Error tracked:", error.message, context);
	}

	static trackCacheHit(key: string) {
		// Mock - não faz nada
	}

	static recordCacheOperation(operation: string, key: string) {
		// Mock - não faz nada
	}

	static trackCacheMiss(key: string) {
		// Mock - não faz nada
	}

	static updateGauge(metric: string, value: number) {
		// Mock - não faz nada
	}

	static incrementCounter(metric: string, tags?: Record<string, string>) {
		// Mock - não faz nada
	}

	static recordHistogram(
		metric: string,
		value: number,
		tags?: Record<string, string>,
	) {
		// Mock - não faz nada
	}

	static createSpan(name: string, callback?: Function) {
		// Mock - executa callback diretamente
		if (callback) {
			return callback();
		}
		return {
			setAttribute: () => {},
			setStatus: () => {},
			end: () => {},
		};
	}

	static getCurrentSpan() {
		return {
			setAttribute: () => {},
			setStatus: () => {},
			end: () => {},
		};
	}

	static getMetrics() {
		return {
			system: {
				memoryUsage: process.memoryUsage(),
				cpuUsage: 0,
				uptime: process.uptime(),
			},
			http: {
				totalRequests: 0,
				averageResponseTime: 0,
				errorRate: 0,
			},
			database: {
				totalQueries: 0,
				averageQueryTime: 0,
				connectionPoolSize: 0,
			},
			business: {
				formulaCalculations: 0,
				averageCalculationTime: 0,
			},
		};
	}
}

export default TelemetryService;
