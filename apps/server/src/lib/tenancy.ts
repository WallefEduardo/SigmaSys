import { TRPCError } from "@trpc/server";
import type { Context } from "./context";

export function ensureCompanyAccess(companyId?: string) {
	return (ctx: Context) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		// Superadmin pode acessar qualquer empresa
		if (ctx.user.role === "superadmin") {
			return companyId || ctx.user.companyId;
		}

		// Usuários normais só acessam sua própria empresa
		if (companyId && companyId !== ctx.user.companyId) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Access denied to this company",
			});
		}

		return ctx.user.companyId;
	};
}

export function withCompanyFilter<T extends Record<string, any>>(
	where: T,
	companyId: string,
): T & { companyId: string } {
	return {
		...where,
		companyId,
	};
}

export class TenancyService {
	static async validateCompanyAccess(
		db: any,
		userId: string,
		targetCompanyId: string,
	): Promise<boolean> {
		const user = await db.user.findUnique({
			where: { id: userId },
			include: { company: true },
		});

		if (!user) return false;

		// Superadmin pode acessar qualquer empresa
		if (user.role === "superadmin") return true;

		// Usuário só pode acessar sua própria empresa
		return user.companyId === targetCompanyId;
	}

	static async getCompanyLimits(db: any, companyId: string) {
		const company = await db.company.findUnique({
			where: { id: companyId },
		});

		if (!company) return null;

		// Limites por plano
		const limits = {
			trial: {
				users: 3,
				clients: 50,
				products: 100,
				orders: 20,
				storage: 1024 * 1024 * 100, // 100MB
			},
			basic: {
				users: 10,
				clients: 500,
				products: 1000,
				orders: 200,
				storage: 1024 * 1024 * 1024, // 1GB
			},
			premium: {
				users: 50,
				clients: 5000,
				products: 10000,
				orders: 2000,
				storage: 1024 * 1024 * 1024 * 10, // 10GB
			},
			enterprise: {
				users: -1, // ilimitado
				clients: -1,
				products: -1,
				orders: -1,
				storage: -1,
			},
		};

		return limits[company.plan as keyof typeof limits] || limits.trial;
	}

	static async checkLimit(
		db: any,
		companyId: string,
		resource: string,
		currentCount?: number,
	): Promise<boolean> {
		const limits = await TenancyService.getCompanyLimits(db, companyId);
		if (!limits) return false;

		const limit = limits[resource as keyof typeof limits];
		if (limit === -1) return true; // ilimitado

		if (currentCount === undefined) {
			// Contar automaticamente
			const counts = await TenancyService.getResourceCounts(db, companyId);
			currentCount = counts[resource as keyof typeof counts] || 0;
		}

		return (currentCount || 0) < limit;
	}

	static async getResourceCounts(db: any, companyId: string) {
		const [users, clients, products, orders] = await Promise.all([
			db.user.count({ where: { companyId } }),
			db.client.count({ where: { companyId } }),
			db.product.count({ where: { companyId } }),
			db.order.count({ where: { companyId } }),
		]);

		return { users, clients, products, orders };
	}
}
