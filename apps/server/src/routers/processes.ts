import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ensureCompanyAccess } from "../lib/tenancy";
import { protectedProcedure, router } from "../lib/trpc";

export const processesRouter = router({
	// Listar processos
	list: protectedProcedure

		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				search: z.string().optional(),
				sector: z.string().optional(),
				timeUnit: z.string().optional(),
				active: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const { page, limit, search, sector, timeUnit, active } = input;
			const offset = (page - 1) * limit;

			const where = {
				companyId,
				...(search && {
					OR: [
						{ name: { contains: search, mode: "insensitive" as const } },
						{ description: { contains: search, mode: "insensitive" as const } },
						{ sector: { contains: search, mode: "insensitive" as const } },
					],
				}),
				...(sector && { sector }),
				...(timeUnit && { timeUnit }),
				...(active !== undefined && { active }),
			};

			const [processes, total] = await Promise.all([
				ctx.db.process.findMany({
					where,
					skip: offset,
					take: limit,
					include: {
						_count: {
							select: {
								productItems: true,
							},
						},
					},
					orderBy: { name: "asc" },
				}),
				ctx.db.process.count({ where }),
			]);

			return {
				processes,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			};
		}),

	// Obter processo por ID
	getById: protectedProcedure

		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			const process = await ctx.db.process.findFirst({
				where: {
					id: input.id,
					companyId,
				},
				include: {
					productItems: {
						include: {
							product: {
								select: { id: true, name: true },
							},
						},
					},
				},
			});

			if (!process) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Process not found",
				});
			}

			return process;
		}),

	// Criar processo
	create: protectedProcedure

		.input(
			z.object({
				name: z.string().min(2).max(200),
				description: z.string().optional(),
				costPerHour: z.number().min(0),
				sector: z.string().optional(),
				timeUnit: z.string().default("hour"), // hour, m2, ml, perimeter, etc
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			const process = await ctx.db.process.create({
				data: {
					...input,
					companyId,
				},
				include: {
					_count: {
						select: { productItems: true },
					},
				},
			});

			return process;
		}),

	// Atualizar processo
	update: protectedProcedure

		.input(
			z.object({
				id: z.string(),
				name: z.string().min(2).max(200).optional(),
				description: z.string().optional(),
				costPerHour: z.number().min(0).optional(),
				sector: z.string().optional(),
				timeUnit: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const { id, ...data } = input;

			// Verificar se processo existe
			const existingProcess = await ctx.db.process.findFirst({
				where: { id, companyId },
			});

			if (!existingProcess) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Process not found",
				});
			}

			const process = await ctx.db.process.update({
				where: { id },
				data,
				include: {
					_count: {
						select: { productItems: true },
					},
				},
			});

			return process;
		}),

	// Desativar processo
	deactivate: protectedProcedure

		.input(
			z.object({
				id: z.string(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			// Verificar se processo está sendo usado em produtos
			const usage = await ctx.db.productProcess.count({
				where: {
					processId: input.id,
					product: { companyId },
				},
			});

			if (usage > 0) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `Process is being used in ${usage} products`,
				});
			}

			const process = await ctx.db.process.update({
				where: {
					id: input.id,
					companyId,
				},
				data: { active: false },
			});

			return process;
		}),

	// Estatísticas
	stats: protectedProcedure.query(async ({ ctx }) => {
		const companyId = ensureCompanyAccess()(ctx);

		const [
			totalProcesses,
			activeProcesses,
			processesBySector,
			processesByTimeUnit,
			avgCostPerHour,
			recentProcesses,
		] = await Promise.all([
			ctx.db.process.count({ where: { companyId } }),
			ctx.db.process.count({ where: { companyId, active: true } }),
			ctx.db.process.groupBy({
				by: ["sector"],
				where: { companyId, sector: { not: null } },
				_count: true,
				orderBy: { _count: { sector: "desc" } },
			}),
			ctx.db.process.groupBy({
				by: ["timeUnit"],
				where: { companyId },
				_count: true,
				orderBy: { _count: { timeUnit: "desc" } },
			}),
			ctx.db.process.aggregate({
				where: { companyId, active: true },
				_avg: { costPerHour: true },
			}),
			ctx.db.process.findMany({
				where: { companyId },
				take: 5,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					costPerHour: true,
					sector: true,
					createdAt: true,
				},
			}),
		]);

		return {
			totalProcesses,
			activeProcesses,
			inactiveProcesses: totalProcesses - activeProcesses,
			processesBySector: processesBySector.map((p) => ({
				sector: p.sector,
				count: p._count,
			})),
			processesByTimeUnit: processesByTimeUnit.map((p) => ({
				timeUnit: p.timeUnit,
				count: p._count,
			})),
			avgCostPerHour: avgCostPerHour._avg.costPerHour || 0,
			recentProcesses,
		};
	}),

	// Obter setores únicos
	getSectors: protectedProcedure.query(async ({ ctx }) => {
		const companyId = ensureCompanyAccess()(ctx);

		const sectors = await ctx.db.process.findMany({
			where: {
				companyId,
				sector: { not: null },
			},
			select: { sector: true },
			distinct: ["sector"],
			orderBy: { sector: "asc" },
		});

		return sectors.map((s) => s.sector).filter(Boolean);
	}),

	// Obter unidades de tempo disponíveis
	getTimeUnits: protectedProcedure.query(() => {
		return [
			{ id: "hour", name: "Hora", symbol: "h" },
			{ id: "m2", name: "Metro Quadrado", symbol: "m²" },
			{ id: "ml", name: "Metro Linear", symbol: "ml" },
			{ id: "perimetro", name: "Perímetro", symbol: "per" },
			{ id: "un", name: "Unidade", symbol: "un" },
			{ id: "kg", name: "Quilograma", symbol: "kg" },
		];
	}),
});
