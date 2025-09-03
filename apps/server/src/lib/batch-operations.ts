import type { PrismaClient } from "../../prisma/generated/client";
import { CacheService } from "./cache";
import { logger } from "./logger";
import { QueueHelpers } from "./queue";
import { TelemetryService } from "./telemetry-mock";
import { TransactionManager, withTransaction } from "./transactions";

interface BatchResult<T> {
	success: boolean;
	processed: number;
	errors: BatchError[];
	results: T[];
	duration: number;
	summary: {
		created: number;
		updated: number;
		deleted: number;
		skipped: number;
	};
}

interface BatchError {
	index: number;
	data: any;
	error: string;
	retryable: boolean;
}

interface BatchOptions {
	batchSize?: number;
	maxConcurrency?: number;
	validateOnly?: boolean;
	skipErrors?: boolean;
	enableCache?: boolean;
	queueLargeOperations?: boolean;
	queueThreshold?: number;
}

// Classe para operações em lote otimizadas
export class BatchOperations {
	private static readonly DEFAULT_BATCH_SIZE = 100;
	private static readonly DEFAULT_MAX_CONCURRENCY = 5;
	private static readonly QUEUE_THRESHOLD = 1000;

	/**
	 * Criar registros em lote com otimizações
	 */
	static async batchCreate<T extends Record<string, any>>(
		db: PrismaClient,
		table: string,
		data: T[],
		options: BatchOptions = {},
	): Promise<BatchResult<T>> {
		const startTime = Date.now();
		const {
			batchSize = BatchOperations.DEFAULT_BATCH_SIZE,
			maxConcurrency = BatchOperations.DEFAULT_MAX_CONCURRENCY,
			validateOnly = false,
			skipErrors = true,
			enableCache = false,
			queueLargeOperations = true,
			queueThreshold = BatchOperations.QUEUE_THRESHOLD,
		} = options;

		// Se a operação é muito grande, usar queue
		if (queueLargeOperations && data.length > queueThreshold) {
			logger.info(
				`Large batch operation detected (${data.length} items), queuing for background processing`,
			);

			await QueueHelpers.bulkCalculate({
				companyId: "batch-operation",
				productIds: data.map((_, index) => index.toString()),
				context: { operation: "batchCreate", table, data },
				userId: "system",
			});

			return {
				success: true,
				processed: 0,
				errors: [],
				results: [],
				duration: Date.now() - startTime,
				summary: { created: 0, updated: 0, deleted: 0, skipped: data.length },
			};
		}

		logger.info("Starting batch create operation", {
			table,
			totalItems: data.length,
			batchSize,
			validateOnly,
		});

		const results: T[] = [];
		const errors: BatchError[] = [];
		const summary = { created: 0, updated: 0, deleted: 0, skipped: 0 };

		try {
			// Dividir em lotes
			const batches = BatchOperations.chunkArray(data, batchSize);

			// Validação prévia se solicitada
			if (validateOnly) {
				const validationErrors = await BatchOperations.validateBatchData(
					data,
					table,
				);
				if (validationErrors.length > 0) {
					return {
						success: false,
						processed: 0,
						errors: validationErrors,
						results: [],
						duration: Date.now() - startTime,
						summary,
					};
				}
			}

			// Processar lotes com controle de concorrência
			const concurrencyLimit = Math.min(maxConcurrency, batches.length);
			const batchPromises: Promise<void>[] = [];

			for (let i = 0; i < batches.length; i += concurrencyLimit) {
				const concurrentBatches = batches.slice(i, i + concurrencyLimit);

				const batchResults = await Promise.allSettled(
					concurrentBatches.map(async (batch, batchIndex) => {
						const actualBatchIndex = i + batchIndex;
						return BatchOperations.processBatchCreate(
							db,
							table,
							batch,
							actualBatchIndex,
							skipErrors,
							enableCache,
						);
					}),
				);

				for (const result of batchResults) {
					if (result.status === "fulfilled") {
						results.push(...result.value.results);
						summary.created += result.value.created;
						errors.push(...result.value.errors);
					} else {
						logger.error("Batch processing failed", { error: result.reason });
						errors.push({
							index: -1,
							data: null,
							error: result.reason?.message || "Unknown batch error",
							retryable: true,
						});
					}
				}
			}

			const duration = Date.now() - startTime;
			const success = errors.length === 0 || (skipErrors && results.length > 0);

			// Registrar métricas
			TelemetryService.trackDatabaseQuery(
				"batch_create",
				table,
				duration,
				success,
			);

			logger.info("Batch create operation completed", {
				table,
				success,
				processed: results.length,
				errors: errors.length,
				duration,
				summary,
			});

			return {
				success,
				processed: results.length,
				errors,
				results,
				duration,
				summary,
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			TelemetryService.recordError(
				"batch_operation_failed",
				"high",
				"batch_operations",
			);

			logger.error("Batch create operation failed", {
				table,
				error: error instanceof Error ? error.message : "Unknown error",
				duration,
			});

			throw error;
		}
	}

	/**
	 * Atualizar registros em lote
	 */
	static async batchUpdate<T extends Record<string, any>>(
		db: PrismaClient,
		table: string,
		updates: Array<{ where: any; data: Partial<T> }>,
		options: BatchOptions = {},
	): Promise<BatchResult<T>> {
		const startTime = Date.now();
		const {
			batchSize = BatchOperations.DEFAULT_BATCH_SIZE,
			maxConcurrency = BatchOperations.DEFAULT_MAX_CONCURRENCY,
			skipErrors = true,
			enableCache = false,
		} = options;

		logger.info("Starting batch update operation", {
			table,
			totalItems: updates.length,
			batchSize,
		});

		const results: T[] = [];
		const errors: BatchError[] = [];
		const summary = { created: 0, updated: 0, deleted: 0, skipped: 0 };

		try {
			const batches = BatchOperations.chunkArray(updates, batchSize);

			for (const batch of batches) {
				const transactionResult = await withTransaction(
					db,
					async (tx) => {
						const batchResults: T[] = [];

						for (let i = 0; i < batch.length; i++) {
							const { where, data } = batch[i];

							try {
								const updated = await (tx as any)[table].update({
									where,
									data,
								});

								batchResults.push(updated);
								summary.updated++;

								// Invalidar cache se habilitado
								if (enableCache) {
									await BatchOperations.invalidateRelatedCache(table, updated);
								}
							} catch (error) {
								const errorMsg =
									error instanceof Error ? error.message : "Unknown error";

								errors.push({
									index: results.length + i,
									data: { where, data },
									error: errorMsg,
									retryable: BatchOperations.isRetryableError(error),
								});

								if (!skipErrors) {
									throw error;
								}

								summary.skipped++;
							}
						}

						return batchResults;
					},
					{
						maxRetries: 2,
						timeout: 30000,
					},
				);

				if (transactionResult.success) {
					results.push(...transactionResult.data!);
				} else {
					throw transactionResult.error;
				}
			}

			const duration = Date.now() - startTime;
			const success = errors.length === 0 || (skipErrors && results.length > 0);

			TelemetryService.recordDatabaseQuery(
				"batch_update",
				table,
				duration,
				success,
			);

			logger.info("Batch update operation completed", {
				table,
				success,
				processed: results.length,
				errors: errors.length,
				duration,
				summary,
			});

			return {
				success,
				processed: results.length,
				errors,
				results,
				duration,
				summary,
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			TelemetryService.recordError(
				"batch_update_failed",
				"high",
				"batch_operations",
			);

			logger.error("Batch update operation failed", {
				table,
				error: error instanceof Error ? error.message : "Unknown error",
				duration,
			});

			throw error;
		}
	}

	/**
	 * Deletar registros em lote
	 */
	static async batchDelete(
		db: PrismaClient,
		table: string,
		whereConditions: any[],
		options: BatchOptions = {},
	): Promise<BatchResult<{ id: string }>> {
		const startTime = Date.now();
		const {
			batchSize = BatchOperations.DEFAULT_BATCH_SIZE,
			skipErrors = true,
			enableCache = false,
		} = options;

		logger.info("Starting batch delete operation", {
			table,
			totalItems: whereConditions.length,
			batchSize,
		});

		const results: { id: string }[] = [];
		const errors: BatchError[] = [];
		const summary = { created: 0, updated: 0, deleted: 0, skipped: 0 };

		try {
			const batches = BatchOperations.chunkArray(whereConditions, batchSize);

			for (const batch of batches) {
				const transactionResult = await withTransaction(
					db,
					async (tx) => {
						const batchResults: { id: string }[] = [];

						for (let i = 0; i < batch.length; i++) {
							const where = batch[i];

							try {
								const deleted = await (tx as any)[table].delete({ where });

								batchResults.push({ id: deleted.id });
								summary.deleted++;

								// Invalidar cache se habilitado
								if (enableCache) {
									await BatchOperations.invalidateRelatedCache(table, deleted);
								}
							} catch (error) {
								const errorMsg =
									error instanceof Error ? error.message : "Unknown error";

								errors.push({
									index: results.length + i,
									data: where,
									error: errorMsg,
									retryable: BatchOperations.isRetryableError(error),
								});

								if (!skipErrors) {
									throw error;
								}

								summary.skipped++;
							}
						}

						return batchResults;
					},
					{
						maxRetries: 1, // Menos retries para deletes
						timeout: 20000,
					},
				);

				if (transactionResult.success) {
					results.push(...transactionResult.data!);
				} else {
					throw transactionResult.error;
				}
			}

			const duration = Date.now() - startTime;
			const success = errors.length === 0 || (skipErrors && results.length > 0);

			TelemetryService.recordDatabaseQuery(
				"batch_delete",
				table,
				duration,
				success,
			);

			logger.info("Batch delete operation completed", {
				table,
				success,
				processed: results.length,
				errors: errors.length,
				duration,
				summary,
			});

			return {
				success,
				processed: results.length,
				errors,
				results,
				duration,
				summary,
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			TelemetryService.recordError(
				"batch_delete_failed",
				"high",
				"batch_operations",
			);

			logger.error("Batch delete operation failed", {
				table,
				error: error instanceof Error ? error.message : "Unknown error",
				duration,
			});

			throw error;
		}
	}

	/**
	 * Upsert em lote (create ou update)
	 */
	static async batchUpsert<T extends Record<string, any>>(
		db: PrismaClient,
		table: string,
		data: Array<{ where: any; create: T; update: Partial<T> }>,
		options: BatchOptions = {},
	): Promise<BatchResult<T>> {
		const startTime = Date.now();
		const {
			batchSize = BatchOperations.DEFAULT_BATCH_SIZE,
			skipErrors = true,
			enableCache = false,
		} = options;

		logger.info("Starting batch upsert operation", {
			table,
			totalItems: data.length,
			batchSize,
		});

		const results: T[] = [];
		const errors: BatchError[] = [];
		const summary = { created: 0, updated: 0, deleted: 0, skipped: 0 };

		try {
			const batches = BatchOperations.chunkArray(data, batchSize);

			for (const batch of batches) {
				const transactionResult = await withTransaction(
					db,
					async (tx) => {
						const batchResults: T[] = [];

						for (let i = 0; i < batch.length; i++) {
							const { where, create, update } = batch[i];

							try {
								const upserted = await (tx as any)[table].upsert({
									where,
									create,
									update,
								});

								batchResults.push(upserted);

								// Verificar se foi criado ou atualizado
								const existing = await (tx as any)[table].findUnique({ where });
								if (!existing) {
									summary.created++;
								} else {
									summary.updated++;
								}

								// Invalidar cache se habilitado
								if (enableCache) {
									await BatchOperations.invalidateRelatedCache(table, upserted);
								}
							} catch (error) {
								const errorMsg =
									error instanceof Error ? error.message : "Unknown error";

								errors.push({
									index: results.length + i,
									data: { where, create, update },
									error: errorMsg,
									retryable: BatchOperations.isRetryableError(error),
								});

								if (!skipErrors) {
									throw error;
								}

								summary.skipped++;
							}
						}

						return batchResults;
					},
					{
						maxRetries: 2,
						timeout: 45000,
					},
				);

				if (transactionResult.success) {
					results.push(...transactionResult.data!);
				} else {
					throw transactionResult.error;
				}
			}

			const duration = Date.now() - startTime;
			const success = errors.length === 0 || (skipErrors && results.length > 0);

			TelemetryService.recordDatabaseQuery(
				"batch_upsert",
				table,
				duration,
				success,
			);

			logger.info("Batch upsert operation completed", {
				table,
				success,
				processed: results.length,
				errors: errors.length,
				duration,
				summary,
			});

			return {
				success,
				processed: results.length,
				errors,
				results,
				duration,
				summary,
			};
		} catch (error) {
			const duration = Date.now() - startTime;

			TelemetryService.recordError(
				"batch_upsert_failed",
				"high",
				"batch_operations",
			);

			logger.error("Batch upsert operation failed", {
				table,
				error: error instanceof Error ? error.message : "Unknown error",
				duration,
			});

			throw error;
		}
	}

	/**
	 * Processar um lote de criação
	 */
	private static async processBatchCreate<T>(
		db: PrismaClient,
		table: string,
		batch: T[],
		batchIndex: number,
		skipErrors: boolean,
		enableCache: boolean,
	): Promise<{ results: T[]; created: number; errors: BatchError[] }> {
		const results: T[] = [];
		const errors: BatchError[] = [];
		let created = 0;

		const transactionResult = await withTransaction(
			db,
			async (tx) => {
				// Usar createMany quando possível para melhor performance
				try {
					const createResult = await (tx as any)[table].createMany({
						data: batch,
						skipDuplicates: skipErrors,
					});

					created = createResult.count;

					// Se precisarmos dos objetos criados, fazer uma consulta adicional
					const createdItems = await (tx as any)[table].findMany({
						orderBy: { createdAt: "desc" },
						take: batch.length,
					});

					results.push(...createdItems);

					// Invalidar cache se habilitado
					if (enableCache) {
						for (const item of createdItems) {
							await BatchOperations.invalidateRelatedCache(table, item);
						}
					}

					return { results, created, errors };
				} catch (error) {
					// Se createMany falhou, tentar item por item
					if (skipErrors) {
						for (let i = 0; i < batch.length; i++) {
							try {
								const createdItem = await (tx as any)[table].create({ data: batch[i] });
								results.push(createdItem);
								created++;

								if (enableCache) {
									await BatchOperations.invalidateRelatedCache(table, createdItem);
								}
							} catch (itemError) {
								errors.push({
									index: batchIndex * batch.length + i,
									data: batch[i],
									error:
										itemError instanceof Error
											? itemError.message
											: "Unknown error",
									retryable: BatchOperations.isRetryableError(itemError),
								});
							}
						}
					} else {
						throw error;
					}
				}

				return { results, created, errors };
			},
			{
				maxRetries: 2,
				timeout: 30000,
			},
		);

		if (!transactionResult.success) {
			throw transactionResult.error;
		}

		return transactionResult.data!;
	}

	/**
	 * Validar dados do lote
	 */
	private static async validateBatchData(
		data: any[],
		table: string,
	): Promise<BatchError[]> {
		const errors: BatchError[] = [];

		// Implementar validações específicas por tabela
		const validators = BatchOperations.getTableValidators(table);

		for (let i = 0; i < data.length; i++) {
			const item = data[i];

			for (const validator of validators) {
				const validationResult = await validator(item);
				if (!validationResult.valid) {
					errors.push({
						index: i,
						data: item,
						error: validationResult.error || "Validation failed",
						retryable: false,
					});
				}
			}
		}

		return errors;
	}

	/**
	 * Obter validadores para uma tabela
	 */
	private static getTableValidators(
		table: string,
	): Array<(data: any) => Promise<{ valid: boolean; error?: string }>> {
		const validators: Record<
			string,
			Array<(data: any) => Promise<{ valid: boolean; error?: string }>>
		> = {
			materials: [
				async (data) => {
					if (!data.name || data.name.trim().length === 0) {
						return { valid: false, error: "Nome é obrigatório" };
					}
					return { valid: true };
				},
				async (data) => {
					if (data.cost && data.cost < 0) {
						return { valid: false, error: "Custo não pode ser negativo" };
					}
					return { valid: true };
				},
			],
			products: [
				async (data) => {
					if (!data.name || data.name.trim().length === 0) {
						return { valid: false, error: "Nome é obrigatório" };
					}
					return { valid: true };
				},
			],
		};

		return validators[table] || [];
	}

	/**
	 * Invalidar cache relacionado
	 */
	private static async invalidateRelatedCache(
		table: string,
		data: any,
	): Promise<void> {
		try {
			// Invalidar patterns de cache relacionados à tabela
			await CacheService.invalidatePattern(`${table}:*`);

			// Invalidar cache da empresa se o registro tem companyId
			if (data.companyId) {
				await CacheService.invalidateCompanyCache(data.companyId);
			}
		} catch (error) {
			logger.warn("Failed to invalidate cache", { table, error });
		}
	}

	/**
	 * Verificar se um erro é recuperável
	 */
	private static isRetryableError(error: any): boolean {
		if (!error) return false;

		const message = error.message?.toLowerCase() || "";

		// Erros de rede/conexão - recuperáveis
		if (message.includes("connection") || message.includes("timeout")) {
			return true;
		}

		// Deadlocks - recuperáveis
		if (message.includes("deadlock")) {
			return true;
		}

		// Violações de constraint - não recuperáveis
		if (
			message.includes("unique") ||
			message.includes("foreign key") ||
			message.includes("check constraint")
		) {
			return false;
		}

		// Erros de validação - não recuperáveis
		if (message.includes("validation") || message.includes("required")) {
			return false;
		}

		// Por padrão, considerar recuperável
		return true;
	}

	/**
	 * Dividir array em chunks
	 */
	private static chunkArray<T>(array: T[], size: number): T[][] {
		const chunks: T[][] = [];
		for (let i = 0; i < array.length; i += size) {
			chunks.push(array.slice(i, i + size));
		}
		return chunks;
	}

	/**
	 * Retry de operações falhadas
	 */
	static async retryFailedOperations<T>(
		db: PrismaClient,
		table: string,
		operation: "create" | "update" | "delete" | "upsert",
		failedItems: BatchError[],
		options: BatchOptions = {},
	): Promise<BatchResult<T>> {
		const retryableItems = failedItems.filter((item) => item.retryable);

		if (retryableItems.length === 0) {
			return {
				success: true,
				processed: 0,
				errors: [],
				results: [],
				duration: 0,
				summary: {
					created: 0,
					updated: 0,
					deleted: 0,
					skipped: failedItems.length,
				},
			};
		}

		logger.info(`Retrying ${retryableItems.length} failed operations`, {
			table,
			operation,
		});

		const retryData = retryableItems.map((item) => item.data);

		switch (operation) {
			case "create":
				return BatchOperations.batchCreate(db, table, retryData, {
					...options,
					skipErrors: true,
				});
			case "update":
				return BatchOperations.batchUpdate(db, table, retryData, {
					...options,
					skipErrors: true,
				});
			case "delete":
				return BatchOperations.batchDelete(db, table, retryData, {
					...options,
					skipErrors: true,
				}) as Promise<BatchResult<T>>;
			case "upsert":
				return BatchOperations.batchUpsert(db, table, retryData, {
					...options,
					skipErrors: true,
				});
			default:
				throw new Error(`Unsupported operation: ${operation}`);
		}
	}
}

// Helpers para operações batch específicas
export const BatchHelpers = {
	// Materiais
	async batchCreateMaterials(
		db: PrismaClient,
		materials: any[],
		options?: BatchOptions,
	) {
		return BatchOperations.batchCreate(db, "material", materials, {
			...options,
			enableCache: true,
			validateOnly: true,
		});
	},

	async batchUpdateMaterials(
		db: PrismaClient,
		updates: any[],
		options?: BatchOptions,
	) {
		return BatchOperations.batchUpdate(db, "material", updates, {
			...options,
			enableCache: true,
		});
	},

	// Produtos
	async batchCreateProducts(
		db: PrismaClient,
		products: any[],
		options?: BatchOptions,
	) {
		return BatchOperations.batchCreate(db, "product", products, {
			...options,
			enableCache: true,
			validateOnly: true,
			batchSize: 50, // Produtos são mais complexos, lotes menores
		});
	},

	// Clientes
	async batchCreateClients(
		db: PrismaClient,
		clients: any[],
		options?: BatchOptions,
	) {
		return BatchOperations.batchCreate(db, "client", clients, {
			...options,
			enableCache: true,
			validateOnly: true,
		});
	},

	// Equipamentos
	async batchCreateEquipments(
		db: PrismaClient,
		equipments: any[],
		options?: BatchOptions,
	) {
		return BatchOperations.batchCreate(db, "equipment", equipments, {
			...options,
			enableCache: true,
		});
	},
};

export default BatchOperations;
