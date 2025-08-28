import type { PrismaClient } from "../../../prisma/generated/client";
import { logger } from "./logger";
import { TelemetryService } from "./telemetry-mock";

export interface TransactionOptions {
	maxRetries?: number;
	retryDelay?: number;
	timeout?: number;
	isolationLevel?:
		| "ReadUncommitted"
		| "ReadCommitted"
		| "RepeatableRead"
		| "Serializable";
}

export interface TransactionResult<T> {
	success: boolean;
	data?: T;
	error?: Error;
	attempts: number;
	executionTime: number;
}

export class TransactionManager {
	private static readonly DEFAULT_OPTIONS: Required<TransactionOptions> = {
		maxRetries: 3,
		retryDelay: 100, // ms
		timeout: 30000, // 30 segundos
		isolationLevel: "ReadCommitted",
	};

	/**
	 * Executa uma transação com retry automático em caso de deadlock
	 */
	static async executeWithRetry<T>(
		db: PrismaClient,
		operation: (tx: any) => Promise<T>,
		options: TransactionOptions = {},
	): Promise<TransactionResult<T>> {
		const config = { ...TransactionManager.DEFAULT_OPTIONS, ...options };
		const startTime = Date.now();
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
			try {
				logger.debug("Starting transaction attempt", {
					attempt,
					maxRetries: config.maxRetries,
					isolationLevel: config.isolationLevel,
				});

				const result = await db.$transaction(operation, {
					timeout: config.timeout,
					isolationLevel: config.isolationLevel as any,
				});

				const executionTime = Date.now() - startTime;

				// Registrar métricas na telemetria
				TelemetryService.recordTransaction(
					"generic",
					executionTime,
					true,
					attempt - 1,
				);

				logger.debug("Transaction completed successfully", {
					attempt,
					executionTime,
					isolationLevel: config.isolationLevel,
				});

				return {
					success: true,
					data: result,
					attempts: attempt,
					executionTime,
				};
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				const executionTime = Date.now() - startTime;

				logger.warn("Transaction attempt failed", {
					attempt,
					error: lastError.message,
					executionTime,
					willRetry: attempt < config.maxRetries,
				});

				// Verificar se é um erro que vale a pena tentar novamente
				if (
					!TransactionManager.isRetryableError(lastError) ||
					attempt === config.maxRetries
				) {
					// Registrar transação falhada na telemetria
					TelemetryService.recordTransaction(
						"generic",
						executionTime,
						false,
						attempt - 1,
					);
					TelemetryService.recordError(
						"transaction_failure",
						"high",
						"transaction_manager",
					);

					logger.error("Transaction failed permanently", {
						attempt,
						maxRetries: config.maxRetries,
						error: lastError.message,
						executionTime,
					});

					return {
						success: false,
						error: lastError,
						attempts: attempt,
						executionTime,
					};
				}

				// Aguardar antes do próximo retry com backoff exponencial
				const delay = config.retryDelay * 2 ** (attempt - 1);
				await TransactionManager.sleep(delay);
			}
		}

		// Isso não deveria acontecer, mas é um fallback
		return {
			success: false,
			error: lastError || new Error("Unknown transaction error"),
			attempts: config.maxRetries,
			executionTime: Date.now() - startTime,
		};
	}

	/**
	 * Verifica se um erro é passível de retry
	 */
	private static isRetryableError(error: Error): boolean {
		const message = error.message.toLowerCase();

		// Deadlocks - sempre vale tentar novamente
		if (message.includes("deadlock") || message.includes("lock timeout")) {
			return true;
		}

		// Timeout de transação
		if (
			message.includes("transaction timeout") ||
			message.includes("timeout")
		) {
			return true;
		}

		// Conflitos de serialização
		if (
			message.includes("serialization failure") ||
			message.includes("could not serialize")
		) {
			return true;
		}

		// Conexão perdida temporariamente
		if (
			message.includes("connection") &&
			(message.includes("lost") ||
				message.includes("reset") ||
				message.includes("timeout"))
		) {
			return true;
		}

		// Erros de validação, constraint violations, etc. - não vale retry
		return false;
	}

	/**
	 * Helper para aguardar um tempo específico
	 */
	private static sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Transação com lock otimista
	 */
	static async executeWithOptimisticLock<T>(
		db: PrismaClient,
		operation: (tx: any) => Promise<T>,
		options: TransactionOptions = {},
	): Promise<TransactionResult<T>> {
		return TransactionManager.executeWithRetry(db, operation, {
			...options,
			isolationLevel: "ReadCommitted", // Melhor para locks otimistas
			maxRetries: 5, // Mais tentativas para conflitos otimistas
		});
	}

	/**
	 * Transação com lock pessimista (serializable)
	 */
	static async executeWithPessimisticLock<T>(
		db: PrismaClient,
		operation: (tx: any) => Promise<T>,
		options: TransactionOptions = {},
	): Promise<TransactionResult<T>> {
		return TransactionManager.executeWithRetry(db, operation, {
			...options,
			isolationLevel: "Serializable", // Máximo isolamento
			maxRetries: 2, // Menos tentativas pois já é mais restritivo
			timeout: 10000, // Timeout menor para evitar esperas longas
		});
	}

	/**
	 * Batch operation com transação
	 */
	static async executeBatch<T>(
		db: PrismaClient,
		operations: Array<(tx: any) => Promise<T>>,
		options: TransactionOptions = {},
	): Promise<TransactionResult<T[]>> {
		return TransactionManager.executeWithRetry(
			db,
			async (tx) => {
				const results: T[] = [];

				for (const operation of operations) {
					const result = await operation(tx);
					results.push(result);
				}

				return results;
			},
			{
				...options,
				timeout:
					(options.timeout || TransactionManager.DEFAULT_OPTIONS.timeout) *
					operations.length,
			},
		);
	}

	/**
	 * Transação com savepoint para rollback parcial
	 */
	static async executeWithSavepoint<T>(
		db: PrismaClient,
		operation: (
			tx: any,
			savepoint: (name: string) => Promise<void>,
		) => Promise<T>,
		options: TransactionOptions = {},
	): Promise<TransactionResult<T>> {
		return TransactionManager.executeWithRetry(
			db,
			async (tx) => {
				const savepoint = async (name: string) => {
					await tx.$executeRaw`SAVEPOINT ${name}`;
				};

				const rollbackToSavepoint = async (name: string) => {
					await tx.$executeRaw`ROLLBACK TO SAVEPOINT ${name}`;
				};

				// Adicionar helpers ao contexto
				const enhancedTx = {
					...tx,
					savepoint,
					rollbackToSavepoint,
				};

				return operation(enhancedTx, savepoint);
			},
			options,
		);
	}

	/**
	 * Métricas de performance de transações
	 */
	static getTransactionMetrics(): {
		successful: number;
		failed: number;
		averageExecutionTime: number;
		retryRate: number;
	} {
		// Em produção, isso viria de um sistema de métricas real
		// Por enquanto, retornamos valores mock
		return {
			successful: 0,
			failed: 0,
			averageExecutionTime: 0,
			retryRate: 0,
		};
	}

	/**
	 * Health check das transações
	 */
	static async healthCheck(db: PrismaClient): Promise<boolean> {
		try {
			const result = await TransactionManager.executeWithRetry(
				db,
				async (tx) => {
					// Simular uma operação simples
					await tx.$queryRaw`SELECT 1`;
					return true;
				},
				{
					maxRetries: 1,
					timeout: 5000,
				},
			);

			return result.success;
		} catch (error) {
			logger.error("Transaction health check failed", { error });
			return false;
		}
	}
}

// Utility functions para casos comuns
export const withTransaction = TransactionManager.executeWithRetry;
export const withOptimisticLock = TransactionManager.executeWithOptimisticLock;
export const withPessimisticLock =
	TransactionManager.executeWithPessimisticLock;
export const withBatch = TransactionManager.executeBatch;

// Decorador para métodos que precisam de transação
export function transactional(options: TransactionOptions = {}) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			const db =
				this.db ||
				args.find((arg: any) => arg && typeof arg.$transaction === "function");

			if (!db) {
				throw new Error(
					"No database instance found for transactional decorator",
				);
			}

			const result = await TransactionManager.executeWithRetry(
				db,
				(tx: any) => originalMethod.apply(this, [tx, ...args]),
				options,
			);

			if (!result.success) {
				throw result.error;
			}

			return result.data;
		};

		return descriptor;
	};
}
