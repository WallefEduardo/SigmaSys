import { CacheService } from "./cache";
import { logger } from "./logger";
import { TelemetryService } from "./telemetry-mock";

export enum CircuitState {
	CLOSED = "CLOSED", // Normal operation
	OPEN = "OPEN", // Circuit is open, failing fast
	HALF_OPEN = "HALF_OPEN", // Testing if service is back
}

export interface CircuitBreakerOptions {
	failureThreshold?: number; // Number of failures before opening circuit
	successThreshold?: number; // Number of successes to close circuit in HALF_OPEN
	timeout?: number; // Time in ms before transitioning from OPEN to HALF_OPEN
	monitor?: boolean; // Enable monitoring and metrics
	fallback?: () => Promise<any>; // Fallback function when circuit is open
	name?: string; // Circuit breaker name for logging
}

export interface CircuitBreakerStats {
	state: CircuitState;
	failureCount: number;
	successCount: number;
	lastFailureTime?: number;
	lastSuccessTime?: number;
	totalRequests: number;
	totalFailures: number;
	totalSuccesses: number;
	uptime: number;
}

// Classe para implementar Circuit Breaker pattern
export class CircuitBreaker {
	private state: CircuitState = CircuitState.CLOSED;
	private failureCount = 0;
	private successCount = 0;
	private lastFailureTime?: number;
	private lastSuccessTime?: number;
	private totalRequests = 0;
	private totalFailures = 0;
	private totalSuccesses = 0;
	private createdAt = Date.now();

	private readonly failureThreshold: number;
	private readonly successThreshold: number;
	private readonly timeout: number;
	private readonly monitor: boolean;
	private readonly fallback?: () => Promise<any>;
	private readonly name: string;

	constructor(options: CircuitBreakerOptions = {}) {
		this.failureThreshold = options.failureThreshold || 5;
		this.successThreshold = options.successThreshold || 2;
		this.timeout = options.timeout || 30000; // 30 seconds
		this.monitor = options.monitor !== false;
		this.fallback = options.fallback;
		this.name = options.name || "unnamed-circuit";

		if (this.monitor) {
			logger.info(`Circuit breaker "${this.name}" initialized`, {
				failureThreshold: this.failureThreshold,
				successThreshold: this.successThreshold,
				timeout: this.timeout,
			});
		}
	}

	/**
	 * Execute function with circuit breaker protection
	 */
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		this.totalRequests++;

		// Check if circuit should transition from OPEN to HALF_OPEN
		if (this.state === CircuitState.OPEN) {
			if (this.shouldAttemptReset()) {
				this.state = CircuitState.HALF_OPEN;
				this.successCount = 0;

				if (this.monitor) {
					logger.info(
						`Circuit breaker "${this.name}" transitioning to HALF_OPEN`,
					);
					TelemetryService.recordError(
						"circuit_breaker_half_open",
						"low",
						this.name,
					);
				}
			} else {
				// Circuit is open, fail fast
				if (this.monitor) {
					TelemetryService.recordError(
						"circuit_breaker_open",
						"medium",
						this.name,
					);
				}

				if (this.fallback) {
					return await this.fallback();
				}

				throw new Error(`Circuit breaker "${this.name}" is OPEN`);
			}
		}

		try {
			const result = await fn();
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure();
			throw error;
		}
	}

	/**
	 * Handle successful execution
	 */
	private onSuccess(): void {
		this.lastSuccessTime = Date.now();
		this.totalSuccesses++;

		if (this.state === CircuitState.HALF_OPEN) {
			this.successCount++;

			if (this.successCount >= this.successThreshold) {
				this.state = CircuitState.CLOSED;
				this.failureCount = 0;
				this.successCount = 0;

				if (this.monitor) {
					logger.info(
						`Circuit breaker "${this.name}" CLOSED after successful recovery`,
					);
					TelemetryService.recordError(
						"circuit_breaker_closed",
						"low",
						this.name,
					);
				}
			}
		} else if (this.state === CircuitState.CLOSED) {
			// Reset failure count on success
			this.failureCount = 0;
		}
	}

	/**
	 * Handle failed execution
	 */
	private onFailure(): void {
		this.lastFailureTime = Date.now();
		this.failureCount++;
		this.totalFailures++;

		if (this.state === CircuitState.HALF_OPEN) {
			// Go back to OPEN on any failure in HALF_OPEN
			this.state = CircuitState.OPEN;
			this.successCount = 0;

			if (this.monitor) {
				logger.warn(
					`Circuit breaker "${this.name}" back to OPEN after failure in HALF_OPEN`,
				);
				TelemetryService.recordError(
					"circuit_breaker_open_from_half",
					"high",
					this.name,
				);
			}
		} else if (
			this.state === CircuitState.CLOSED &&
			this.failureCount >= this.failureThreshold
		) {
			// Open circuit if failure threshold reached
			this.state = CircuitState.OPEN;

			if (this.monitor) {
				logger.error(
					`Circuit breaker "${this.name}" OPENED due to ${this.failureCount} failures`,
					{
						failureThreshold: this.failureThreshold,
						lastFailures: this.getRecentFailures(),
					},
				);
				TelemetryService.recordError(
					"circuit_breaker_opened",
					"critical",
					this.name,
				);
			}
		}
	}

	/**
	 * Check if circuit should attempt reset
	 */
	private shouldAttemptReset(): boolean {
		return (
			this.lastFailureTime !== undefined &&
			Date.now() - this.lastFailureTime >= this.timeout
		);
	}

	/**
	 * Get recent failures for debugging
	 */
	private getRecentFailures(): any {
		// In a real implementation, you might want to track recent failures
		// For now, return basic info
		return {
			count: this.failureCount,
			lastFailureTime: this.lastFailureTime,
			timeWindow: this.timeout,
		};
	}

	/**
	 * Get current circuit breaker statistics
	 */
	getStats(): CircuitBreakerStats {
		return {
			state: this.state,
			failureCount: this.failureCount,
			successCount: this.successCount,
			lastFailureTime: this.lastFailureTime,
			lastSuccessTime: this.lastSuccessTime,
			totalRequests: this.totalRequests,
			totalFailures: this.totalFailures,
			totalSuccesses: this.totalSuccesses,
			uptime: Date.now() - this.createdAt,
		};
	}

	/**
	 * Force circuit state (for testing or manual intervention)
	 */
	forceState(state: CircuitState): void {
		const oldState = this.state;
		this.state = state;

		if (state === CircuitState.CLOSED) {
			this.failureCount = 0;
			this.successCount = 0;
		}

		if (this.monitor) {
			logger.warn(
				`Circuit breaker "${this.name}" state forced from ${oldState} to ${state}`,
			);
		}
	}

	/**
	 * Reset circuit breaker to initial state
	 */
	reset(): void {
		this.state = CircuitState.CLOSED;
		this.failureCount = 0;
		this.successCount = 0;
		this.lastFailureTime = undefined;
		this.lastSuccessTime = undefined;

		if (this.monitor) {
			logger.info(`Circuit breaker "${this.name}" reset to initial state`);
		}
	}

	/**
	 * Check if circuit is open
	 */
	isOpen(): boolean {
		return this.state === CircuitState.OPEN;
	}

	/**
	 * Check if circuit is closed
	 */
	isClosed(): boolean {
		return this.state === CircuitState.CLOSED;
	}

	/**
	 * Check if circuit is half-open
	 */
	isHalfOpen(): boolean {
		return this.state === CircuitState.HALF_OPEN;
	}
}

// Circuit Breaker Manager para gerenciar múltiplos circuit breakers
export class CircuitBreakerManager {
	private static circuits = new Map<string, CircuitBreaker>();

	/**
	 * Create or get circuit breaker
	 */
	static getCircuit(
		name: string,
		options?: CircuitBreakerOptions,
	): CircuitBreaker {
		if (!CircuitBreakerManager.circuits.has(name)) {
			const circuit = new CircuitBreaker({
				...options,
				name,
				monitor: true,
			});
			CircuitBreakerManager.circuits.set(name, circuit);

			logger.info(`Circuit breaker "${name}" created and registered`);
		}

		return CircuitBreakerManager.circuits.get(name)!;
	}

	/**
	 * Get all circuit breakers
	 */
	static getAllCircuits(): Map<string, CircuitBreaker> {
		return new Map(CircuitBreakerManager.circuits);
	}

	/**
	 * Get circuit breaker statistics for all circuits
	 */
	static getAllStats(): Record<string, CircuitBreakerStats> {
		const stats: Record<string, CircuitBreakerStats> = {};

		for (const [name, circuit] of CircuitBreakerManager.circuits) {
			stats[name] = circuit.getStats();
		}

		return stats;
	}

	/**
	 * Reset all circuit breakers
	 */
	static resetAll(): void {
		for (const [name, circuit] of CircuitBreakerManager.circuits) {
			circuit.reset();
			logger.info(`Circuit breaker "${name}" reset`);
		}
	}

	/**
	 * Remove circuit breaker
	 */
	static removeCircuit(name: string): boolean {
		const removed = CircuitBreakerManager.circuits.delete(name);
		if (removed) {
			logger.info(`Circuit breaker "${name}" removed`);
		}
		return removed;
	}

	/**
	 * Health check for all circuits
	 */
	static healthCheck(): {
		healthy: boolean;
		circuits: Record<
			string,
			{
				state: CircuitState;
				healthy: boolean;
				failureRate: number;
			}
		>;
	} {
		const result: any = {
			healthy: true,
			circuits: {},
		};

		for (const [name, circuit] of CircuitBreakerManager.circuits) {
			const stats = circuit.getStats();
			const failureRate =
				stats.totalRequests > 0 ? stats.totalFailures / stats.totalRequests : 0;

			const circuitHealthy =
				stats.state === CircuitState.CLOSED && failureRate < 0.1;

			result.circuits[name] = {
				state: stats.state,
				healthy: circuitHealthy,
				failureRate: Math.round(failureRate * 100) / 100,
			};

			if (!circuitHealthy) {
				result.healthy = false;
			}
		}

		return result;
	}
}

// Decorator para aplicar circuit breaker em métodos
export function circuitBreaker(name: string, options?: CircuitBreakerOptions) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		const circuit = CircuitBreakerManager.getCircuit(name, options);

		descriptor.value = async function (...args: any[]) {
			return circuit.execute(() => originalMethod.apply(this, args));
		};

		return descriptor;
	};
}

// Função helper para criar circuit breaker para operações específicas
export function withCircuitBreaker<T>(
	name: string,
	operation: () => Promise<T>,
	options?: CircuitBreakerOptions,
): Promise<T> {
	const circuit = CircuitBreakerManager.getCircuit(name, options);
	return circuit.execute(operation);
}

// Circuit breakers predefinidos para serviços comuns
export const CommonCircuits = {
	// Database operations
	database: CircuitBreakerManager.getCircuit("database", {
		failureThreshold: 5,
		timeout: 30000,
		fallback: async () => {
			logger.warn(
				"Database circuit breaker open, returning cached data if available",
			);
			// Try to return cached data or simplified response
			throw new Error("Database temporarily unavailable");
		},
	}),

	// External API calls
	externalApi: CircuitBreakerManager.getCircuit("external-api", {
		failureThreshold: 3,
		timeout: 60000,
		fallback: async () => {
			logger.warn("External API circuit breaker open, using fallback");
			return { status: "fallback", message: "Service temporarily unavailable" };
		},
	}),

	// Email service
	emailService: CircuitBreakerManager.getCircuit("email-service", {
		failureThreshold: 3,
		timeout: 120000,
		fallback: async () => {
			logger.warn(
				"Email service circuit breaker open, queuing email for later",
			);
			// Queue email for retry later
			return { queued: true, message: "Email queued for delivery" };
		},
	}),

	// File storage
	fileStorage: CircuitBreakerManager.getCircuit("file-storage", {
		failureThreshold: 3,
		timeout: 45000,
		fallback: async () => {
			logger.warn("File storage circuit breaker open");
			throw new Error("File storage temporarily unavailable");
		},
	}),

	// Cache service
	cache: CircuitBreakerManager.getCircuit("cache", {
		failureThreshold: 5,
		timeout: 15000,
		fallback: async () => {
			logger.warn("Cache circuit breaker open, operating without cache");
			return null; // Return null to indicate cache miss
		},
	}),

	// Formula calculation
	formulaEngine: CircuitBreakerManager.getCircuit("formula-engine", {
		failureThreshold: 10,
		timeout: 30000,
		fallback: async () => {
			logger.warn(
				"Formula engine circuit breaker open, using simplified calculation",
			);
			return { value: 0, unit: "un", fallback: true };
		},
	}),
};

// Integração com cache para persistir estado dos circuit breakers
export class PersistentCircuitBreaker extends CircuitBreaker {
	private cacheKey: string;

	constructor(name: string, options: CircuitBreakerOptions = {}) {
		super({ ...options, name });
		this.cacheKey = `circuit-breaker:${name}`;

		// Load state from cache on initialization
		this.loadState();
	}

	private async loadState(): Promise<void> {
		try {
			const cachedState = await CacheService.get<{
				state: CircuitState;
				failureCount: number;
				lastFailureTime?: number;
			}>(this.cacheKey);

			if (cachedState) {
				this.forceState(cachedState.state);
				// Restore some state if needed
				logger.debug("Circuit breaker state loaded from cache", {
					name: this.name,
					state: cachedState.state,
				});
			}
		} catch (error) {
			logger.warn("Failed to load circuit breaker state from cache", {
				name: this.name,
				error,
			});
		}
	}

	private async saveState(): Promise<void> {
		try {
			const state = {
				state: this.state,
				failureCount: this.failureCount,
				lastFailureTime: this.lastFailureTime,
				timestamp: Date.now(),
			};

			await CacheService.set(this.cacheKey, state, 3600); // 1 hour TTL
		} catch (error) {
			logger.warn("Failed to save circuit breaker state to cache", {
				name: this.name,
				error,
			});
		}
	}

	// Override methods to persist state changes
	forceState(state: CircuitState): void {
		super.forceState(state);
		this.saveState();
	}

	reset(): void {
		super.reset();
		this.saveState();
	}
}

export default CircuitBreaker;
