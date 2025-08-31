import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { apiLogger, errorLogger } from "../lib/logger";
import { ensureCompanyAccess } from "../lib/tenancy";
import { protectedProcedure, router } from "../lib/trpc";
import { ConsumableUnit } from "../types/consumables";

const consumableSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	description: z.string().optional(),
	code: z.string().optional(),
	type: z.enum(["ink", "printHead", "tool", "material", "other"]),
	cost: z.number().min(0, "Custo deve ser positivo"),
	unit: z.nativeEnum(ConsumableUnit),
	supplier: z.string().optional(),
	color: z.string().optional(),
	volumeMl: z.number().int().positive().optional(),
	material: z.string().optional(),
	diameter: z.number().positive().optional(),
	// Campos específicos para cabeças de impressão - SIMPLIFICADO
	model: z.string().optional(),
	lifespanM2: z.number().int().positive().optional(), // vida útil total em m²
	costPerM2: z.number().optional(), // calculado automaticamente, não enviado pelo frontend
	minStock: z.number().int().min(0).default(0),
	maxStock: z.number().int().min(0).default(0),
	currentStock: z.number().int().min(0).default(0),
	alertThreshold: z.number().int().min(0).default(0),
	autoReorder: z.boolean().default(false),
	active: z.boolean().default(true),
	tags: z.array(z.string()).default([]),
	notes: z.string().optional(),
});

export const consumablesRouter = router({
	// Listar consumíveis
	list: protectedProcedure
		.input(
			z.object({
				type: z
					.enum(["ink", "printHead", "tool", "material", "other"])
					.optional(),
				active: z.boolean().optional(),
				search: z.string().optional(),
				page: z.number().int().positive().default(1),
				limit: z.number().int().positive().max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = Date.now();

			try {
				const skip = (input.page - 1) * input.limit;

				const where = {
					companyId,
					...(input.type && { type: input.type }),
					...(input.active !== undefined && { active: input.active }),
					...(input.search && {
						OR: [
							{
								name: { contains: input.search, mode: "insensitive" as const },
							},
							{
								description: {
									contains: input.search,
									mode: "insensitive" as const,
								},
							},
							{
								code: { contains: input.search, mode: "insensitive" as const },
							},
						],
					}),
				};

				const [consumables, total] = await Promise.all([
					ctx.db.consumable.findMany({
						where,
						orderBy: { name: "asc" },
						skip,
						take: input.limit,
					}),
					ctx.db.consumable.count({ where }),
				]);

				const duration = Date.now() - startTime;

				apiLogger.info("Consumables listed successfully", {
					companyId,
					count: consumables.length,
					total,
					filters: input,
					duration,
				});

				return {
					data: consumables,
					meta: {
						total,
						page: input.page,
						limit: input.limit,
						pages: Math.ceil(total / input.limit),
					},
				};
			} catch (error) {
				const duration = Date.now() - startTime;

				apiLogger.error("Failed to list consumables", {
					error: error instanceof Error ? error.message : "Unknown error",
					companyId,
					filters: input,
					duration,
				});

				throw error;
			}
		}),

	// Obter consumível por ID
	byId: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = Date.now();

			try {
				const consumable = await ctx.db.consumable.findFirst({
					where: {
						id: input.id,
						companyId,
					},
				});

				if (!consumable) {
					throw new Error("Consumível não encontrado");
				}

				const duration = Date.now() - startTime;

				apiLogger.info("Consumable retrieved successfully", {
					consumableId: input.id,
					companyId,
					duration,
				});

				return consumable;
			} catch (error) {
				const duration = Date.now() - startTime;

				apiLogger.error("Failed to retrieve consumable", {
					error: error instanceof Error ? error.message : "Unknown error",
					consumableId: input.id,
					companyId,
					duration,
				});

				throw error;
			}
		}),

	// Criar consumível
	create: protectedProcedure
		.input(consumableSchema)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = Date.now();

			try {
				// Verificar se código já existe
				if (input.code) {
					const existing = await ctx.db.consumable.findFirst({
						where: {
							companyId,
							code: input.code,
						},
					});

					if (existing) {
						throw new Error("Código já existe para outro consumível");
					}
				}

				// Preparar dados do consumível
				const consumableData = {
					...input,
					companyId,
					...(input.type === "ink" && { unit: "L" }),
					...(input.type === "printHead" && { unit: "PCS" }), // Sempre PCS para cabeças
				};

				// Para cabeças de impressão, calcular automaticamente o costPerM2
				if (input.type === "printHead" && input.lifespanM2 && input.cost) {
					const costPerM2 = Number(input.cost) / input.lifespanM2;
					consumableData.costPerM2 = costPerM2;
				}

				const consumable = await ctx.db.consumable.create({
					data: consumableData,
				});

				const duration = Date.now() - startTime;

				apiLogger.info("Consumable created successfully", {
					consumableId: consumable.id,
					name: consumable.name,
					type: consumable.type,
					companyId,
					duration,
				});

				return consumable;
			} catch (error) {
				const duration = Date.now() - startTime;

				apiLogger.error("Failed to create consumable", {
					error: error instanceof Error ? error.message : "Unknown error",
					input: { ...input, companyId },
					duration,
				});

				throw error;
			}
		}),

	// Atualizar consumível
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: consumableSchema.partial(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = Date.now();

			try {
				// Verificar se existe
				const existing = await ctx.db.consumable.findFirst({
					where: {
						id: input.id,
						companyId,
					},
				});

				if (!existing) {
					throw new Error("Consumível não encontrado");
				}

				// Verificar código único
				if (input.data.code && input.data.code !== existing.code) {
					const codeExists = await ctx.db.consumable.findFirst({
						where: {
							companyId,
							code: input.data.code,
							id: { not: input.id },
						},
					});

					if (codeExists) {
						throw new Error("Código já existe para outro consumível");
					}
				}

				// Preparar dados de atualização
				const updateData = {
					...input.data,
					...(input.data.type === "ink" && { unit: "L" }),
					...(input.data.type === "printHead" && { unit: "PCS" }),
				};

				// Para cabeças de impressão, recalcular costPerM2 se necessário
				if (
					(input.data.type === "printHead" || existing.type === "printHead") &&
					(input.data.lifespanM2 || input.data.cost)
				) {
					const newCost = input.data.cost ?? Number(existing.cost);
					const newLifespanM2 = input.data.lifespanM2 ?? existing.lifespanM2;

					if (newLifespanM2 && newCost) {
						updateData.costPerM2 = newCost / newLifespanM2;
					}
				}

				const consumable = await ctx.db.consumable.update({
					where: { id: input.id },
					data: updateData,
				});

				const duration = Date.now() - startTime;

				apiLogger.info("Consumable updated successfully", {
					consumableId: input.id,
					companyId,
					changes: Object.keys(input.data),
					duration,
				});

				return consumable;
			} catch (error) {
				const duration = Date.now() - startTime;

				apiLogger.error("Failed to update consumable", {
					error: error instanceof Error ? error.message : "Unknown error",
					consumableId: input.id,
					companyId,
					duration,
				});

				throw error;
			}
		}),

	// Deletar consumível
	delete: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = Date.now();

			try {
				const existing = await ctx.db.consumable.findFirst({
					where: {
						id: input.id,
						companyId,
					},
				});

				if (!existing) {
					throw new Error("Consumível não encontrado");
				}

				await ctx.db.consumable.delete({
					where: { id: input.id },
				});

				const duration = Date.now() - startTime;

				apiLogger.info("Consumable deleted successfully", {
					consumableId: input.id,
					name: existing.name,
					companyId,
					duration,
				});

				return { success: true };
			} catch (error) {
				const duration = Date.now() - startTime;

				apiLogger.error("Failed to delete consumable", {
					error: error instanceof Error ? error.message : "Unknown error",
					consumableId: input.id,
					companyId,
					duration,
				});

				throw error;
			}
		}),

	// Buscar cabeças de impressão para equipamento
	getPrintHeadsForEquipment: protectedProcedure
		.input(
			z.object({
				equipmentId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = Date.now();

			try {
				const printHeads = await ctx.db.consumable.findMany({
					where: {
						companyId,
						type: "printHead",
						active: true,
					},
					orderBy: { name: "asc" },
				});

				const duration = Date.now() - startTime;

				apiLogger.info("Print heads retrieved successfully", {
					companyId,
					count: printHeads.length,
					equipmentId: input.equipmentId,
					duration,
				});

				return printHeads;
			} catch (error) {
				const duration = Date.now() - startTime;

				apiLogger.error("Failed to retrieve print heads", {
					error: error instanceof Error ? error.message : "Unknown error",
					companyId,
					equipmentId: input.equipmentId,
					duration,
				});

				throw error;
			}
		}),

	// Atualizar estoque
	updateStock: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				quantity: z.number().int(),
				type: z.enum(["add", "remove", "set"]),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = Date.now();

			try {
				const existing = await ctx.db.consumable.findFirst({
					where: {
						id: input.id,
						companyId,
					},
				});

				if (!existing) {
					throw new Error("Consumível não encontrado");
				}

				let newStock: number;
				switch (input.type) {
					case "add":
						newStock = existing.currentStock + input.quantity;
						break;
					case "remove":
						newStock = existing.currentStock - input.quantity;
						break;
					case "set":
						newStock = input.quantity;
						break;
				}

				if (newStock < 0) {
					throw new Error("Estoque não pode ser negativo");
				}

				const consumable = await ctx.db.consumable.update({
					where: { id: input.id },
					data: { currentStock: newStock },
				});

				const duration = Date.now() - startTime;

				apiLogger.info("Consumable stock updated successfully", {
					consumableId: input.id,
					companyId,
					oldStock: existing.currentStock,
					newStock,
					type: input.type,
					quantity: input.quantity,
					duration,
				});

				return consumable;
			} catch (error) {
				const duration = Date.now() - startTime;

				apiLogger.error("Failed to update consumable stock", {
					error: error instanceof Error ? error.message : "Unknown error",
					consumableId: input.id,
					companyId,
					duration,
				});

				throw error;
			}
		}),

	// Buscar cabeças de impressão para equipamento
	getPrintHeadsForEquipment: protectedProcedure
		.input(
			z.object({
				equipmentId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = Date.now();
			try {
				const printHeads = await ctx.db.consumable.findMany({
					where: {
						companyId,
						type: "printHead",
						active: true,
					},
					orderBy: { name: "asc" },
				});

				// Temporariamente, se não houver cabeças no banco, retornar mock data
				if (printHeads.length === 0) {
					const mockHeads = [
						{
							id: "head_dx5_1",
							companyId,
							name: "Cabeça DX5",
							description: "Cabeça de impressão Epson DX5",
							code: "HD-DX5-001",
							type: "printHead",
							cost: 800,
							unit: "PCS",
							model: "DX5",
							lifespanM2: 150000, // 150.000 m² de vida útil
							costPerM2: 800 / 150000, // R$ 0,005333 por m²
							active: true,
							tags: ["dx5", "epson", "printhead"],
							supplier: null,
							color: null,
							volumeMl: null,
							material: null,
							diameter: null,
							minStock: 0,
							maxStock: 0,
							currentStock: 0,
							alertThreshold: 0,
							autoReorder: false,
							notes: null,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
						{
							id: "head_dx7_1",
							companyId,
							name: "Cabeça DX7",
							description: "Cabeça de impressão Epson DX7",
							code: "HD-DX7-001",
							type: "printHead",
							cost: 1200,
							unit: "PCS",
							model: "DX7",
							lifespanM2: 300000, // 300.000 m² de vida útil
							costPerM2: 1200 / 300000, // R$ 0,004000 por m²
							active: true,
							tags: ["dx7", "epson", "printhead"],
							supplier: null,
							color: null,
							volumeMl: null,
							material: null,
							diameter: null,
							minStock: 0,
							maxStock: 0,
							currentStock: 0,
							alertThreshold: 0,
							autoReorder: false,
							notes: null,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
						{
							id: "head_i3200_1",
							companyId,
							name: "Cabeça I3200",
							description: "Cabeça de impressão Epson I3200",
							code: "HD-I3200-001",
							type: "printHead",
							cost: 2500,
							unit: "PCS",
							model: "I3200",
							lifespanM2: 500000, // 500.000 m² de vida útil
							costPerM2: 2500 / 500000, // R$ 0,005000 por m²
							active: true,
							tags: ["i3200", "epson", "printhead", "premium"],
							supplier: null,
							color: null,
							volumeMl: null,
							material: null,
							diameter: null,
							minStock: 0,
							maxStock: 0,
							currentStock: 0,
							alertThreshold: 0,
							autoReorder: false,
							notes: null,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					];

					apiLogger.info("Returning mock print heads (no data in DB)", {
						companyId,
						count: mockHeads.length,
						equipmentId: input.equipmentId,
						duration: Date.now() - startTime,
					});

					return mockHeads as any;
				}

				const duration = Date.now() - startTime;

				apiLogger.info("Print heads retrieved successfully", {
					companyId,
					count: printHeads.length,
					equipmentId: input.equipmentId,
					duration,
				});
				return printHeads;
			} catch (error) {
				const duration = Date.now() - startTime;

				apiLogger.error("Failed to retrieve print heads", {
					error: error instanceof Error ? error.message : "Unknown error",
					companyId,
					equipmentId: input.equipmentId,
					duration,
				});

				throw error;
			}
		}),
});
