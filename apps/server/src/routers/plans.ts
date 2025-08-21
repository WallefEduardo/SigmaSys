import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { logger } from "../lib/logger";
import { protectedProcedure, router } from "../lib/trpc";

// Schema de validação para planos
const planCreateSchema = z.object({
	name: z
		.string()
		.min(2, "Nome deve ter pelo menos 2 caracteres")
		.max(50, "Nome muito longo"),
	description: z.string().optional(),
	price: z.number().min(0, "Preço deve ser positivo"),
	yearlyPrice: z.number().min(0, "Preço anual deve ser positivo").optional(),
	currency: z.string().default("BRL"),

	// Limites
	maxUsers: z
		.number()
		.min(1, "Mínimo 1 usuário")
		.max(1000, "Máximo 1000 usuários"),
	maxCompanies: z.number().min(1).max(100).default(1),
	maxClients: z.number().min(1).max(100000),
	maxProducts: z.number().min(1).max(50000),
	maxOrders: z.number().min(1).max(10000),
	maxQuotes: z.number().min(1).max(10000),
	maxStorage: z.number().min(100).max(100000), // MB

	// Configurações
	features: z.array(z.string()).default([]),
	modules: z.array(z.string()).default([]),
	trialDays: z.number().min(0).max(365).default(15),
	popular: z.boolean().default(false),
	active: z.boolean().default(true),
});

const planUpdateSchema = planCreateSchema.partial().extend({
	id: z.string(),
});

export const plansRouter = router({
	// Listar planos (apenas superadmin)
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
				search: z.string().optional(),
				active: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const startTime = Date.now();

			// Verificar se é superadmin
			if (ctx.user!.role !== "superadmin") {
				logger.warn("Unauthorized access to plans list", {
					userId: ctx.user!.userId,
					role: ctx.user!.role,
					ip: ctx.req?.ip,
				});
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Apenas superadmin pode gerenciar planos",
				});
			}

			const { page, limit, search, active } = input;
			const offset = (page - 1) * limit;

			const where = {
				...(search && {
					OR: [
						{ name: { contains: search, mode: "insensitive" as const } },
						{ description: { contains: search, mode: "insensitive" as const } },
					],
				}),
				...(active !== undefined && { active }),
			};

			try {
				const [plans, total] = await Promise.all([
					ctx.db.plan.findMany({
						where,
						skip: offset,
						take: limit,
						include: {
							_count: {
								select: { companies: true },
							},
						},
						orderBy: [{ popular: "desc" }, { price: "asc" }],
					}),
					ctx.db.plan.count({ where }),
				]);

				const duration = Date.now() - startTime;

				logger.info("Plans listed successfully", {
					userId: ctx.user!.userId,
					count: plans.length,
					total,
					page,
					duration: `${duration}ms`,
				});

				return {
					plans,
					pagination: {
						page,
						limit,
						total,
						pages: Math.ceil(total / limit),
					},
				};
			} catch (error) {
				logger.error("Error listing plans", {
					error: error instanceof Error ? error.message : "Unknown error",
					userId: ctx.user!.userId,
					input,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Erro ao listar planos",
				});
			}
		}),

	// Obter plano por ID
	getById: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Verificar se é superadmin
			if (ctx.user!.role !== "superadmin") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Apenas superadmin pode ver detalhes dos planos",
				});
			}

			try {
				const plan = await ctx.db.plan.findUnique({
					where: { id: input.id },
					include: {
						_count: {
							select: { companies: true },
						},
						companies: {
							select: {
								id: true,
								name: true,
								active: true,
								createdAt: true,
							},
							take: 10, // Últimas 10 empresas
						},
					},
				});

				if (!plan) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Plano não encontrado",
					});
				}

				logger.info("Plan retrieved successfully", {
					planId: plan.id,
					planName: plan.name,
					userId: ctx.user!.userId,
				});

				return plan;
			} catch (error) {
				if (error instanceof TRPCError) throw error;

				logger.error("Error retrieving plan", {
					error: error instanceof Error ? error.message : "Unknown error",
					planId: input.id,
					userId: ctx.user!.userId,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Erro ao buscar plano",
				});
			}
		}),

	// Criar plano
	create: protectedProcedure
		.input(planCreateSchema)
		.mutation(async ({ ctx, input }) => {
			const startTime = Date.now();

			// Verificar se é superadmin
			if (ctx.user!.role !== "superadmin") {
				logger.warn("Unauthorized attempt to create plan", {
					userId: ctx.user!.userId,
					role: ctx.user!.role,
					ip: ctx.req?.ip,
				});
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Apenas superadmin pode criar planos",
				});
			}

			try {
				// Verificar se já existe plano com o mesmo nome
				const existingPlan = await ctx.db.plan.findUnique({
					where: { name: input.name },
				});

				if (existingPlan) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Já existe um plano com este nome",
					});
				}

				// Se este plano for marcado como popular, desmarcar outros
				if (input.popular) {
					await ctx.db.plan.updateMany({
						where: { popular: true },
						data: { popular: false },
					});
				}

				const plan = await ctx.db.plan.create({
					data: input,
					include: {
						_count: {
							select: { companies: true },
						},
					},
				});

				const duration = Date.now() - startTime;

				logger.info("Plan created successfully", {
					planId: plan.id,
					planName: plan.name,
					price: plan.price,
					userId: ctx.user!.userId,
					duration: `${duration}ms`,
				});

				return plan;
			} catch (error) {
				if (error instanceof TRPCError) throw error;

				logger.error("Error creating plan", {
					error: error instanceof Error ? error.message : "Unknown error",
					userId: ctx.user!.userId,
					input: {
						...input,
						features: input.features?.length,
						modules: input.modules?.length,
					},
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Erro ao criar plano",
				});
			}
		}),

	// Atualizar plano
	update: protectedProcedure
		.input(planUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			const startTime = Date.now();

			// Verificar se é superadmin
			if (ctx.user!.role !== "superadmin") {
				logger.warn("Unauthorized attempt to update plan", {
					userId: ctx.user!.userId,
					role: ctx.user!.role,
					planId: input.id,
				});
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Apenas superadmin pode atualizar planos",
				});
			}

			try {
				const { id, ...updateData } = input;

				// Verificar se plano existe
				const existingPlan = await ctx.db.plan.findUnique({
					where: { id },
				});

				if (!existingPlan) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Plano não encontrado",
					});
				}

				// Verificar conflito de nome
				if (updateData.name && updateData.name !== existingPlan.name) {
					const nameConflict = await ctx.db.plan.findUnique({
						where: { name: updateData.name },
					});

					if (nameConflict) {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Já existe um plano com este nome",
						});
					}
				}

				// Se este plano for marcado como popular, desmarcar outros
				if (updateData.popular) {
					await ctx.db.plan.updateMany({
						where: { popular: true, id: { not: id } },
						data: { popular: false },
					});
				}

				const plan = await ctx.db.plan.update({
					where: { id },
					data: updateData,
					include: {
						_count: {
							select: { companies: true },
						},
					},
				});

				const duration = Date.now() - startTime;

				logger.info("Plan updated successfully", {
					planId: plan.id,
					planName: plan.name,
					userId: ctx.user!.userId,
					updatedFields: Object.keys(updateData),
					duration: `${duration}ms`,
				});

				return plan;
			} catch (error) {
				if (error instanceof TRPCError) throw error;

				logger.error("Error updating plan", {
					error: error instanceof Error ? error.message : "Unknown error",
					planId: input.id,
					userId: ctx.user!.userId,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Erro ao atualizar plano",
				});
			}
		}),

	// Deletar plano
	delete: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const startTime = Date.now();

			// Verificar se é superadmin
			if (ctx.user!.role !== "superadmin") {
				logger.warn("Unauthorized attempt to delete plan", {
					userId: ctx.user!.userId,
					role: ctx.user!.role,
					planId: input.id,
				});
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Apenas superadmin pode deletar planos",
				});
			}

			try {
				// Verificar se existem empresas usando este plano
				const companiesCount = await ctx.db.company.count({
					where: { planId: input.id },
				});

				if (companiesCount > 0) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Não é possível deletar o plano. ${companiesCount} empresa(s) estão usando este plano.`,
					});
				}

				const plan = await ctx.db.plan.delete({
					where: { id: input.id },
				});

				const duration = Date.now() - startTime;

				logger.info("Plan deleted successfully", {
					planId: plan.id,
					planName: plan.name,
					userId: ctx.user!.userId,
					duration: `${duration}ms`,
				});

				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) throw error;

				logger.error("Error deleting plan", {
					error: error instanceof Error ? error.message : "Unknown error",
					planId: input.id,
					userId: ctx.user!.userId,
				});
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Erro ao deletar plano",
				});
			}
		}),

	// Listar planos ativos (para seleção em outras telas)
	getActive: protectedProcedure.query(async ({ ctx }) => {
		// Verificar se é superadmin
		if (ctx.user!.role !== "superadmin") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Apenas superadmin pode acessar planos",
			});
		}

		try {
			const plans = await ctx.db.plan.findMany({
				where: { active: true },
				select: {
					id: true,
					name: true,
					description: true,
					price: true,
					yearlyPrice: true,
					popular: true,
					maxUsers: true,
					maxClients: true,
					features: true,
				},
				orderBy: [{ popular: "desc" }, { price: "asc" }],
			});

			logger.info("Active plans retrieved", {
				count: plans.length,
				userId: ctx.user!.userId,
			});

			return plans;
		} catch (error) {
			logger.error("Error retrieving active plans", {
				error: error instanceof Error ? error.message : "Unknown error",
				userId: ctx.user!.userId,
			});
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Erro ao buscar planos ativos",
			});
		}
	}),

	// Estatísticas dos planos
	getStats: protectedProcedure.query(async ({ ctx }) => {
		// Verificar se é superladmin
		if (ctx.user!.role !== "superadmin") {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Apenas superadmin pode ver estatísticas",
			});
		}

		try {
			const [totalPlans, activePlans, plansWithCompanies, popularPlan] =
				await Promise.all([
					ctx.db.plan.count(),
					ctx.db.plan.count({ where: { active: true } }),
					ctx.db.plan.count({
						where: {
							companies: {
								some: {},
							},
						},
					}),
					ctx.db.plan.findFirst({
						where: { popular: true },
						select: { name: true },
					}),
				]);

			const stats = {
				totalPlans,
				activePlans,
				inactivePlans: totalPlans - activePlans,
				plansWithCompanies,
				unusedPlans: activePlans - plansWithCompanies,
				popularPlan: popularPlan?.name || "Nenhum",
			};

			logger.info("Plan stats retrieved", {
				userId: ctx.user!.userId,
				stats,
			});

			return stats;
		} catch (error) {
			logger.error("Error retrieving plan stats", {
				error: error instanceof Error ? error.message : "Unknown error",
				userId: ctx.user!.userId,
			});
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Erro ao buscar estatísticas",
			});
		}
	}),
});
