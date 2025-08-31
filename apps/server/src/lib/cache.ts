import Redis from "ioredis";
import { logger } from "./logger";
import { TelemetryService } from "./telemetry-mock";

// Configuração do Redis
const redis = new Redis({
	host: process.env.REDIS_HOST || "localhost",
	port: Number(process.env.REDIS_PORT) || 6379,
	password: process.env.REDIS_PASSWORD,
	db: Number(process.env.REDIS_DB) || 0,
	maxRetriesPerRequest: 3,
	connectTimeout: 10000,
	lazyConnect: true,
});

// Event handlers
redis.on("connect", () => {
	logger.info("📡 Redis connected successfully");
});

redis.on("error", (error) => {
	logger.error("❌ Redis connection error: " + String(error));
});

redis.on("ready", () => {
	logger.info("🚀 Redis is ready for operations");
});

// TTL padrões por tipo de cache (em segundos)
export const CacheTTL = {
	FORMULAS: 60 * 60, // 1 hora
	UNITS: 60 * 60 * 24, // 24 horas
	MATERIALS: 60 * 15, // 15 minutos
	EQUIPMENTS: 60 * 15, // 15 minutos
	PROCESSES: 60 * 30, // 30 minutos
	STATS: 60 * 5, // 5 minutos
	CALCULATIONS: 60 * 60, // 1 hora
	LISTS: 60 * 10, // 10 minutos
} as const;

// Prefixos para organizar as chaves
export const CacheKeys = {
	FORMULA_RESULT: (formula: string, context: string) =>
		`formula:result:${Buffer.from(formula + context).toString("base64")}`,
	FORMULA_VALIDATION: (formula: string) =>
		`formula:validation:${Buffer.from(formula).toString("base64")}`,
	UNITS_BY_CATEGORY: (category: string) => `units:category:${category}`,
	UNITS_ALL: () => "units:all",
	MATERIAL_LIST: (companyId: string, filters: string) =>
		`materials:list:${companyId}:${Buffer.from(filters).toString("base64")}`,
	MATERIAL_STATS: (companyId: string) => `materials:stats:${companyId}`,
	EQUIPMENT_LIST: (companyId: string, filters: string) =>
		`equipments:list:${companyId}:${Buffer.from(filters).toString("base64")}`,
	PROCESS_LIST: (companyId: string) => `processes:list:${companyId}`,
	PRODUCT_CALCULATION: (productId: string, context: string) =>
		`product:calc:${productId}:${Buffer.from(context).toString("base64")}`,
	USER_PERMISSIONS: (userId: string) => `user:permissions:${userId}`,
} as const;

export class CacheService {
	// Operações básicas de cache
	static async get<T>(key: string): Promise<T | null> {
		try {
			const value = await redis.get(key);
			if (!value) {
				TelemetryService.recordCacheOperation("miss", key);
				return null;
			}

			TelemetryService.recordCacheOperation("hit", key);
			return JSON.parse(value) as T;
		} catch (error) {
			logger.error(`Cache get error for key ${key}: ${String(error)}`);
			TelemetryService.recordCacheOperation("miss", key);
			return null;
		}
	}

	static async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
		try {
			const serialized = JSON.stringify(value);

			if (ttl) {
				await redis.setex(key, ttl, serialized);
			} else {
				await redis.set(key, serialized);
			}

			return true;
		} catch (error) {
			logger.error(`Cache set error for key ${key}: ${String(error)}`);
			return false;
		}
	}

	static async del(key: string): Promise<boolean> {
		try {
			await redis.del(key);
			return true;
		} catch (error) {
			logger.error(`Cache delete error for key ${key}: ${String(error)}`);
			return false;
		}
	}

	static async mget<T>(keys: string[]): Promise<(T | null)[]> {
		try {
			const values = await redis.mget(...keys);
			return values.map((value) => {
				if (!value) return null;
				try {
					return JSON.parse(value) as T;
				} catch {
					return null;
				}
			});
		} catch (error) {
			logger.error(
				`Cache mget error for keys ${keys.join(",")}: ${String(error)}`,
			);
			return keys.map(() => null);
		}
	}

	static async mset<T>(
		pairs: Array<{ key: string; value: T; ttl?: number }>,
	): Promise<boolean> {
		try {
			const pipeline = redis.pipeline();

			pairs.forEach(({ key, value, ttl }) => {
				const serialized = JSON.stringify(value);
				if (ttl) {
					pipeline.setex(key, ttl, serialized);
				} else {
					pipeline.set(key, serialized);
				}
			});

			await pipeline.exec();
			return true;
		} catch (error) {
			const keys = pairs.map((p) => p.key).join(",");
			logger.error(`Cache mset error for keys ${keys}: ${String(error)}`);
			return false;
		}
	}

	// Invalidação por padrão
	static async invalidatePattern(pattern: string): Promise<number> {
		try {
			const keys = await redis.keys(pattern);
			if (keys.length === 0) return 0;

			await redis.del(...keys);
			logger.info(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
			return keys.length;
		} catch (error) {
			logger.error(
				`Cache pattern invalidation error for ${pattern}: ${String(error)}`,
			);
			return 0;
		}
	}

	// Cache com fallback
	static async getOrSet<T>(
		key: string,
		fallback: () => Promise<T>,
		ttl?: number,
	): Promise<T> {
		try {
			// Tentar buscar do cache primeiro
			const cached = await CacheService.get<T>(key);
			if (cached !== null) {
				return cached;
			}

			// Se não encontrou, executar fallback
			const value = await fallback();

			// Salvar no cache para próximas consultas
			await CacheService.set(key, value, ttl);

			return value;
		} catch (error) {
			logger.error(`Cache getOrSet error for key ${key}: ${String(error)}`);
			// Em caso de erro, executar fallback diretamente
			return await fallback();
		}
	}

	// Cache para listas com paginação
	static async getListCache<T>(
		key: string,
		page: number,
		limit: number,
	): Promise<{ items: T[]; total: number } | null> {
		try {
			const cached = await CacheService.get<{
				items: T[];
				total: number;
				timestamp: number;
			}>(key);
			if (!cached) return null;

			// Verificar se cache não expirou (extra check)
			const isExpired = Date.now() - cached.timestamp > CacheTTL.LISTS * 1000;
			if (isExpired) {
				await CacheService.del(key);
				return null;
			}

			// Paginar os resultados cachados
			const startIndex = (page - 1) * limit;
			const endIndex = startIndex + limit;
			const paginatedItems = cached.items.slice(startIndex, endIndex);

			return {
				items: paginatedItems,
				total: cached.total,
			};
		} catch (error) {
			logger.error(
				`List cache get error for key ${key} (page ${page}, limit ${limit}): ${String(error)}`,
			);
			return null;
		}
	}

	static async setListCache<T>(
		key: string,
		items: T[],
		total: number,
		ttl: number = CacheTTL.LISTS,
	): Promise<boolean> {
		try {
			const cacheData = {
				items,
				total,
				timestamp: Date.now(),
			};

			return await CacheService.set(key, cacheData, ttl);
		} catch (error) {
			logger.error(`List cache set error for key ${key}: ${String(error)}`);
			return false;
		}
	}

	// Invalidação por contexto
	static async invalidateCompanyCache(companyId: string): Promise<void> {
		const patterns = [
			`materials:*:${companyId}*`,
			`equipments:*:${companyId}*`,
			`processes:*:${companyId}*`,
			`products:*:${companyId}*`,
		];

		await Promise.all(
			patterns.map((pattern) => CacheService.invalidatePattern(pattern)),
		);
	}

	static async invalidateUserCache(userId: string): Promise<void> {
		await CacheService.invalidatePattern(`user:*:${userId}*`);
	}

	// Health check
	static async healthCheck(): Promise<boolean> {
		try {
			const testKey = "health:check";
			const testValue = { timestamp: Date.now() };

			await CacheService.set(testKey, testValue, 10); // 10 segundos
			const retrieved = await CacheService.get(testKey);
			await CacheService.del(testKey);

			return retrieved !== null;
		} catch (error) {
			logger.error(`Cache health check failed: ${String(error)}`);
			return false;
		}
	}

	// Estatísticas do cache
	static async getStats(): Promise<Record<string, any>> {
		try {
			const info = await redis.info("memory");
			const keyspace = await redis.info("keyspace");

			return {
				connected: redis.status === "ready",
				memory: info,
				keyspace: keyspace,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.error(`Cache stats error: ${String(error)}`);
			return {
				connected: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}

// Exportar instância do Redis para casos específicos
export { redis };

// Função para fechar conexão (útil para testes)
export const closeRedisConnection = async (): Promise<void> => {
	try {
		await redis.quit();
		logger.info("🔴 Redis connection closed");
	} catch (error) {
		logger.error(`Error closing Redis connection: ${String(error)}`);
	}
};
