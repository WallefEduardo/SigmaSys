import rateLimit from "express-rate-limit";
import type { FastifyReply, FastifyRequest } from "fastify";
import { redis } from "./cache";
import { logger } from "./logger";

// Store personalizado usando Redis
class RedisStore {
	constructor(
		public prefix = "rl:",
		public resetTime?: Date,
	) {}

	async increment(
		key: string,
	): Promise<{ totalHits: number; timeToExpire?: number }> {
		const redisKey = `${this.prefix}${key}`;

		try {
			const pipeline = redis.pipeline();
			pipeline.incr(redisKey);
			pipeline.expire(redisKey, 60); // TTL de 60 segundos por padrão

			const results = await pipeline.exec();
			const totalHits = (results?.[0]?.[1] as number) || 1;

			return { totalHits };
		} catch (error) {
			logger.error("Redis rate limiter error", { key, error });
			// Fallback: permitir requisição em caso de erro no Redis
			return { totalHits: 1 };
		}
	}

	async decrement(key: string): Promise<void> {
		const redisKey = `${this.prefix}${key}`;

		try {
			await redis.decr(redisKey);
		} catch (error) {
			logger.error("Redis rate limiter decrement error", { key, error });
		}
	}

	async resetKey(key: string): Promise<void> {
		const redisKey = `${this.prefix}${key}`;

		try {
			await redis.del(redisKey);
		} catch (error) {
			logger.error("Redis rate limiter reset error", { key, error });
		}
	}
}

// Configurações de rate limiting por contexto
export const RateLimitConfig = {
	// Rate limiting geral (por IP)
	GLOBAL: {
		windowMs: 15 * 60 * 1000, // 15 minutos
		max: 1000, // 1000 requests por IP
		message: "Too many requests from this IP",
		standardHeaders: true,
		legacyHeaders: false,
	},

	// Rate limiting para APIs de autenticação
	AUTH: {
		windowMs: 15 * 60 * 1000, // 15 minutos
		max: 5, // 5 tentativas de login por IP
		message: "Too many authentication attempts",
		skipSuccessfulRequests: true, // Não contar logins bem sucedidos
	},

	// Rate limiting para cálculos de fórmulas (computacionalmente intensivo)
	FORMULAS: {
		windowMs: 60 * 1000, // 1 minuto
		max: 100, // 100 cálculos por minuto
		message: "Too many formula calculations",
	},

	// Rate limiting para criação de recursos
	CREATE: {
		windowMs: 60 * 1000, // 1 minuto
		max: 60, // 60 criações por minuto
		message: "Too many creation requests",
	},

	// Rate limiting para uploads
	UPLOAD: {
		windowMs: 60 * 1000, // 1 minuto
		max: 10, // 10 uploads por minuto
		message: "Too many upload requests",
	},

	// Rate limiting para exports/relatórios
	EXPORT: {
		windowMs: 60 * 1000, // 1 minuto
		max: 5, // 5 exports por minuto
		message: "Too many export requests",
	},
} as const;

// Rate limiter customizável
export class RateLimiter {
	private static instances = new Map<string, any>();

	static create(name: string, config: any = {}) {
		// TEMPORARY: Disabled rate limiting for debugging
		return (req: any, res: any, next: any) => next();
	}

	// Rate limiter específico para empresas (baseado no plano)
	static createCompanyLimiter(companyId: string, planLimits: any) {
		return RateLimiter.create(`company:${companyId}`, {
			windowMs: 60 * 1000, // 1 minuto
			max: planLimits.requestsPerMinute || 100,
			keyGenerator: () => companyId,
			message:
				"Company rate limit exceeded. Upgrade your plan for higher limits.",
		});
	}

	// Rate limiter para operações custosas por usuário
	static createUserLimiter(operation: string, maxRequests = 10) {
		return RateLimiter.create(`user:${operation}`, {
			windowMs: 60 * 1000, // 1 minuto
			max: maxRequests,
			keyGenerator: (req: any) => req.user?.id || req.ip,
			message: `Too many ${operation} requests. Please wait before trying again.`,
		});
	}

	// Rate limiter adaptativo baseado na carga do sistema
	static createAdaptiveLimiter(baseName: string, getSystemLoad: () => number) {
		return RateLimiter.create(`adaptive:${baseName}`, {
			windowMs: 60 * 1000,
			max: (req: any) => {
				const systemLoad = getSystemLoad();
				const baseLimit = 100;

				// Reduzir limite quando sistema está sobrecarregado
				if (systemLoad > 0.9) return Math.floor(baseLimit * 0.3); // 30% do limite
				if (systemLoad > 0.7) return Math.floor(baseLimit * 0.6); // 60% do limite
				if (systemLoad > 0.5) return Math.floor(baseLimit * 0.8); // 80% do limite

				return baseLimit; // 100% do limite
			},
			message: "Server is currently under high load. Please try again later.",
		});
	}

	// Limpar cache de rate limiting para um usuário/IP
	static async clearLimits(identifier: string, limiterName?: string) {
		try {
			const pattern = limiterName
				? `rl:${limiterName}:*${identifier}*`
				: `rl:*${identifier}*`;

			const keys = await redis.keys(pattern);
			if (keys.length > 0) {
				await redis.del(...keys);
				logger.info("Rate limits cleared", {
					identifier,
					limiterName,
					keysCleared: keys.length,
				});
			}
		} catch (error) {
			logger.error("Failed to clear rate limits", {
				identifier,
				limiterName,
				error,
			});
		}
	}

	// Estatísticas de rate limiting
	static async getStats(limiterName?: string): Promise<{
		totalRequests: number;
		blockedRequests: number;
		uniqueClients: number;
	}> {
		try {
			const pattern = limiterName ? `rl:${limiterName}:*` : "rl:*";
			const keys = await redis.keys(pattern);

			const values = keys.length > 0 ? await redis.mget(...keys) : [];
			const totalRequests = values.reduce(
				(sum, val) => sum + Number.parseInt(val || "0"),
				0,
			);

			// Contadores de bloqueios seriam mantidos separadamente em produção
			return {
				totalRequests,
				blockedRequests: 0, // Mock - seria implementado com contadores específicos
				uniqueClients: keys.length,
			};
		} catch (error) {
			logger.error("Failed to get rate limiter stats", { limiterName, error });
			return { totalRequests: 0, blockedRequests: 0, uniqueClients: 0 };
		}
	}

	// Health check do sistema de rate limiting
	static async healthCheck(): Promise<boolean> {
		try {
			const testKey = "health:check:ratelimit";
			await redis.set(testKey, "1", "EX", 10);
			await redis.del(testKey);
			return true;
		} catch (error) {
			logger.error("Rate limiter health check failed", { error });
			return false;
		}
	}

	// Middleware para Fastify
	static fastifyMiddleware(limiterName: string, config: any = {}) {
		const limiter = RateLimiter.create(limiterName, config);

		return async (request: FastifyRequest, reply: FastifyReply) => {
			return new Promise((resolve, reject) => {
				// Converter request/reply do Fastify para formato Express-like
				const expressLikeReq = {
					...request,
					ip: request.ip,
					user: (request as any).user,
					headers: request.headers,
					url: request.url,
					socket: request.socket,
				};

				const expressLikeRes = {
					status: (code: number) => ({
						send: (data: any) => {
							reply.status(code).send(data);
							resolve(undefined);
						},
					}),
				};

				limiter(expressLikeReq, expressLikeRes, (err?: any) => {
					if (err) reject(err);
					else resolve(undefined);
				});
			});
		};
	}
}

// Instâncias pré-configuradas
export const globalLimiter = RateLimiter.create(
	"global",
	RateLimitConfig.GLOBAL,
);
export const authLimiter = RateLimiter.create("auth", RateLimitConfig.AUTH);
export const formulaLimiter = RateLimiter.create(
	"formulas",
	RateLimitConfig.FORMULAS,
);
export const createLimiter = RateLimiter.create(
	"create",
	RateLimitConfig.CREATE,
);
export const uploadLimiter = RateLimiter.create(
	"upload",
	RateLimitConfig.UPLOAD,
);
export const exportLimiter = RateLimiter.create(
	"export",
	RateLimitConfig.EXPORT,
);

// Helper para aplicar rate limiting em routers tRPC
export function withRateLimit(limiterName: string, config?: any) {
	return (handler: any) => {
		return async (opts: any) => {
			const { ctx } = opts;

			// Simular request para rate limiter
			const mockReq = {
				ip: ctx.req?.ip || "unknown",
				user: ctx.user,
				headers: ctx.req?.headers || {},
				url: ctx.req?.url || "",
				socket: ctx.req?.socket,
			};

			const limiter = RateLimiter.create(limiterName, config);

			return new Promise((resolve, reject) => {
				limiter(
					mockReq,
					{
						status: (code: number) => ({
							send: (data: any) => {
								reject(new Error(`Rate limit exceeded: ${data.message}`));
							},
						}),
					},
					(err?: any) => {
						if (err) {
							reject(err);
						} else {
							// Continuar com handler original
							resolve(handler(opts));
						}
					},
				);
			});
		};
	};
}
