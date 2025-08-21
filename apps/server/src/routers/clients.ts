import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ensureCompanyAccess } from "../lib/tenancy";
import { protectedProcedure, router } from "../lib/trpc";

const addressSchema = z
	.object({
		street: z.string().optional(),
		number: z.string().optional(),
		complement: z.string().optional(),
		neighborhood: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		zipCode: z.string().optional(),
		country: z.string().default("Brasil"),
	})
	.optional();

const socialMediaSchema = z
	.object({
		facebook: z.string().url().optional(),
		instagram: z.string().url().optional(),
		linkedin: z.string().url().optional(),
		twitter: z.string().url().optional(),
		website: z.string().url().optional(),
	})
	.optional();

export const clientsRouter = router({
	// Listar clientes
	list: protectedProcedure

		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(10),
				search: z.string().optional(),
				type: z.enum(["person", "company"]).optional(),
				status: z.enum(["active", "inactive", "prospect", "lead"]).optional(),
				segment: z.string().optional(),
				tags: z.array(z.string()).optional(),
				rating: z.number().min(1).max(5).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const { page, limit, search, type, status, segment, tags, rating } =
				input;
			const offset = (page - 1) * limit;

			const where = {
				companyId,
				...(search && {
					OR: [
						{ name: { contains: search, mode: "insensitive" as const } },
						{ email: { contains: search, mode: "insensitive" as const } },
						{ document: { contains: search, mode: "insensitive" as const } },
						{ phone: { contains: search, mode: "insensitive" as const } },
					],
				}),
				...(type && { type }),
				...(status && { status }),
				...(segment && { segment }),
				...(tags && { tags: { hasSome: tags } }),
				...(rating && { rating }),
			};

			const [clients, total] = await Promise.all([
				ctx.db.client.findMany({
					where,
					skip: offset,
					take: limit,
					include: {
						creator: {
							select: { name: true },
						},
						_count: {
							select: {
								quotes: true,
								orders: true,
								interactions: true,
							},
						},
					},
					orderBy: { createdAt: "desc" },
				}),
				ctx.db.client.count({ where }),
			]);

			return {
				clients,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			};
		}),

	// Obter cliente por ID
	getById: protectedProcedure

		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			const client = await ctx.db.client.findFirst({
				where: {
					id: input.id,
					companyId,
				},
				include: {
					creator: {
						select: { name: true, email: true },
					},
					quotes: {
						take: 5,
						orderBy: { createdAt: "desc" },
						select: {
							id: true,
							number: true,
							title: true,
							status: true,
							totalPrice: true,
							createdAt: true,
						},
					},
					orders: {
						take: 5,
						orderBy: { createdAt: "desc" },
						select: {
							id: true,
							number: true,
							title: true,
							status: true,
							totalPrice: true,
							createdAt: true,
						},
					},
					interactions: {
						take: 10,
						orderBy: { createdAt: "desc" },
						include: {
							user: {
								select: { name: true },
							},
						},
					},
					_count: {
						select: {
							quotes: true,
							orders: true,
							interactions: true,
						},
					},
				},
			});

			if (!client) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			return client;
		}),

	// Criar cliente
	create: protectedProcedure

		.input(
			z.object({
				name: z.string().min(2).max(100),
				email: z.string().email().optional(),
				phone: z.string().optional(),
				document: z.string().optional(),
				type: z.enum(["person", "company"]).default("person"),
				address: addressSchema,
				birthday: z.string().datetime().optional(),
				segment: z.string().optional(),
				tags: z.array(z.string()).default([]),
				notes: z.string().optional(),
				status: z
					.enum(["active", "inactive", "prospect", "lead"])
					.default("active"),
				source: z.string().optional(),
				rating: z.number().min(1).max(5).optional(),
				socialMedia: socialMediaSchema,
				creditLimit: z.number().optional(),
				paymentTerm: z.number().optional(),
				discount: z.number().min(0).max(100).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			// Verificar se documento já existe (se fornecido)
			if (input.document) {
				const existingClient = await ctx.db.client.findFirst({
					where: {
						document: input.document,
						companyId,
					},
				});

				if (existingClient) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Document already exists",
					});
				}
			}

			const { birthday, creditLimit, discount, ...data } = input;

			const client = await ctx.db.client.create({
				data: {
					...data,
					...(birthday && { birthday: new Date(birthday) }),
					...(creditLimit && { creditLimit }),
					...(discount && { discount }),
					companyId,
					createdBy: ctx.user!.userId,
				},
				include: {
					creator: {
						select: { name: true },
					},
					_count: {
						select: {
							quotes: true,
							orders: true,
							interactions: true,
						},
					},
				},
			});

			return client;
		}),

	// Atualizar cliente
	update: protectedProcedure

		.input(
			z.object({
				id: z.string(),
				name: z.string().min(2).max(100).optional(),
				email: z.string().email().optional(),
				phone: z.string().optional(),
				document: z.string().optional(),
				type: z.enum(["person", "company"]).optional(),
				address: addressSchema,
				birthday: z.string().datetime().optional(),
				segment: z.string().optional(),
				tags: z.array(z.string()).optional(),
				notes: z.string().optional(),
				status: z.enum(["active", "inactive", "prospect", "lead"]).optional(),
				source: z.string().optional(),
				rating: z.number().min(1).max(5).optional(),
				socialMedia: socialMediaSchema,
				creditLimit: z.number().optional(),
				paymentTerm: z.number().optional(),
				discount: z.number().min(0).max(100).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const { id, birthday, creditLimit, discount, document, ...data } = input;

			// Verificar se cliente existe
			const existingClient = await ctx.db.client.findFirst({
				where: { id, companyId },
			});

			if (!existingClient) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			// Verificar se documento já existe em outro cliente
			if (document && document !== existingClient.document) {
				const documentExists = await ctx.db.client.findFirst({
					where: {
						document,
						companyId,
						id: { not: id },
					},
				});

				if (documentExists) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Document already exists",
					});
				}
			}

			const client = await ctx.db.client.update({
				where: { id },
				data: {
					...data,
					...(document && { document }),
					...(birthday && { birthday: new Date(birthday) }),
					...(creditLimit !== undefined && { creditLimit }),
					...(discount !== undefined && { discount }),
				},
				include: {
					creator: {
						select: { name: true },
					},
					_count: {
						select: {
							quotes: true,
							orders: true,
							interactions: true,
						},
					},
				},
			});

			return client;
		}),

	// Desativar cliente
	deactivate: protectedProcedure

		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			const client = await ctx.db.client.update({
				where: {
					id: input.id,
					companyId,
				},
				data: { active: false },
			});

			return client;
		}),

	// Adicionar interação
	addInteraction: protectedProcedure

		.input(
			z.object({
				clientId: z.string(),
				type: z.enum([
					"call",
					"email",
					"meeting",
					"whatsapp",
					"visit",
					"other",
				]),
				subject: z.string().min(2).max(200),
				description: z.string().optional(),
				status: z
					.enum(["scheduled", "completed", "cancelled"])
					.default("completed"),
				scheduledAt: z.string().datetime().optional(),
				completedAt: z.string().datetime().optional(),
				duration: z.number().optional(),
				outcome: z.string().optional(),
				nextAction: z.string().optional(),
				nextDate: z.string().datetime().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const { clientId, scheduledAt, completedAt, nextDate, ...data } = input;

			// Verificar se cliente existe na empresa
			const client = await ctx.db.client.findFirst({
				where: { id: clientId, companyId },
			});

			if (!client) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			const interaction = await ctx.db.clientInteraction.create({
				data: {
					...data,
					...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
					...(completedAt && { completedAt: new Date(completedAt) }),
					...(nextDate && { nextDate: new Date(nextDate) }),
					clientId,
					userId: ctx.user!.userId,
				},
				include: {
					user: {
						select: { name: true },
					},
				},
			});

			return interaction;
		}),

	// Listar interações do cliente
	getInteractions: protectedProcedure

		.input(
			z.object({
				clientId: z.string(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(50).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const { clientId, page, limit } = input;
			const offset = (page - 1) * limit;

			// Verificar se cliente existe na empresa
			const client = await ctx.db.client.findFirst({
				where: { id: clientId, companyId },
			});

			if (!client) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client not found",
				});
			}

			const [interactions, total] = await Promise.all([
				ctx.db.clientInteraction.findMany({
					where: { clientId },
					skip: offset,
					take: limit,
					include: {
						user: {
							select: { name: true },
						},
					},
					orderBy: { createdAt: "desc" },
				}),
				ctx.db.clientInteraction.count({ where: { clientId } }),
			]);

			return {
				interactions,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			};
		}),

	// Estatísticas dos clientes
	stats: protectedProcedure.query(async ({ ctx }) => {
		const companyId = ensureCompanyAccess()(ctx);

		const [
			totalClients,
			activeClients,
			prospects,
			leads,
			topSegments,
			recentClients,
			birthdays,
		] = await Promise.all([
			ctx.db.client.count({ where: { companyId } }),
			ctx.db.client.count({ where: { companyId, status: "active" } }),
			ctx.db.client.count({ where: { companyId, status: "prospect" } }),
			ctx.db.client.count({ where: { companyId, status: "lead" } }),
			ctx.db.client.groupBy({
				by: ["segment"],
				where: { companyId, segment: { not: null } },
				_count: true,
				take: 5,
				orderBy: { _count: { segment: "desc" } },
			}),
			ctx.db.client.findMany({
				where: { companyId },
				take: 5,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					type: true,
					status: true,
					createdAt: true,
				},
			}),
			ctx.db.client.findMany({
				where: {
					companyId,
					birthday: {
						gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
						lt: new Date(
							new Date().getFullYear(),
							new Date().getMonth() + 1,
							1,
						),
					},
				},
				select: {
					id: true,
					name: true,
					birthday: true,
				},
				orderBy: { birthday: "asc" },
			}),
		]);

		return {
			totalClients,
			activeClients,
			prospects,
			leads,
			topSegments,
			recentClients,
			birthdays,
		};
	}),
});
