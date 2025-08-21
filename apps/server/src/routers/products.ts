import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type FormulaContext, FormulaEngine } from "../lib/formulas";
import { ensureCompanyAccess } from "../lib/tenancy";
import { protectedProcedure, router } from "../lib/trpc";

const productMaterialSchema = z.object({
	materialId: z.string(),
	quantity: z.number().min(0),
	formula: z.string().optional(),
});

const productEquipmentSchema = z.object({
	equipmentId: z.string(),
	timeNeeded: z.number().min(0),
	formula: z.string().optional(),
});

const productProcessSchema = z.object({
	processId: z.string(),
	timeNeeded: z.number().min(0),
	formula: z.string().optional(),
});

const productFinishSchema = z.object({
	finishId: z.string(),
	quantity: z.number().min(0),
});

const checklistSchema = z
	.array(
		z.object({
			id: z.string(),
			question: z.string(),
			type: z.enum(["boolean", "number", "text", "select"]),
			options: z.array(z.string()).optional(),
			required: z.boolean().default(false),
			defaultValue: z.any().optional(),
		}),
	)
	.optional();

const marginSchema = z.object({
	markup: z.number().min(0).optional(), // percentual sobre o custo
	liquidMargin: z.number().min(0).optional(), // margem líquida desejada
	finalPrice: z.number().min(0).optional(), // preço final fixo
});

export const productsRouter = router({
	// Listar produtos
	list: protectedProcedure

		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				search: z.string().optional(),
				category: z.string().optional(),
				active: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const { page, limit, search, category, active } = input;
			const offset = (page - 1) * limit;

			const where = {
				companyId,
				...(search && {
					OR: [
						{ name: { contains: search, mode: "insensitive" as const } },
						{ description: { contains: search, mode: "insensitive" as const } },
						{ code: { contains: search, mode: "insensitive" as const } },
					],
				}),
				...(category && { category }),
				...(active !== undefined && { active }),
			};

			const [products, total] = await Promise.all([
				ctx.db.product.findMany({
					where,
					skip: offset,
					take: limit,
					include: {
						_count: {
							select: {
								materials: true,
								equipments: true,
								processes: true,
								finishes: true,
								quoteItems: true,
							},
						},
					},
					orderBy: { name: "asc" },
				}),
				ctx.db.product.count({ where }),
			]);

			return {
				products,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			};
		}),

	// Obter produto por ID
	getById: protectedProcedure

		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			const product = await ctx.db.product.findFirst({
				where: {
					id: input.id,
					companyId,
				},
				include: {
					materials: {
						include: {
							material: {
								select: {
									id: true,
									name: true,
									unit: true,
									cost: true,
								},
							},
						},
					},
					equipments: {
						include: {
							equipment: {
								select: {
									id: true,
									name: true,
									type: true,
									costPerHour: true,
								},
							},
						},
					},
					processes: {
						include: {
							process: {
								select: {
									id: true,
									name: true,
									costPerHour: true,
									timeUnit: true,
								},
							},
						},
					},
					finishes: {
						include: {
							finish: {
								select: {
									id: true,
									name: true,
									cost: true,
								},
							},
						},
					},
				},
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}

			return product;
		}),

	// Criar produto
	create: protectedProcedure

		.input(
			z.object({
				name: z.string().min(2).max(200),
				description: z.string().optional(),
				code: z.string().max(50).optional(),
				category: z.string().optional(),
				formula: z.string().optional(),
				checklist: checklistSchema,
				margin: marginSchema,
				materials: z.array(productMaterialSchema).default([]),
				equipments: z.array(productEquipmentSchema).default([]),
				processes: z.array(productProcessSchema).default([]),
				finishes: z.array(productFinishSchema).default([]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			// Validar fórmula se fornecida
			if (input.formula) {
				const validation = FormulaEngine.validateFormula(input.formula);
				if (!validation.valid) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid formula: ${validation.error}`,
					});
				}
			}

			// Validar fórmulas dos materiais, equipamentos e processos
			for (const material of input.materials) {
				if (material.formula) {
					const validation = FormulaEngine.validateFormula(material.formula);
					if (!validation.valid) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Invalid material formula: ${validation.error}`,
						});
					}
				}
			}

			for (const equipment of input.equipments) {
				if (equipment.formula) {
					const validation = FormulaEngine.validateFormula(equipment.formula);
					if (!validation.valid) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Invalid equipment formula: ${validation.error}`,
						});
					}
				}
			}

			for (const process of input.processes) {
				if (process.formula) {
					const validation = FormulaEngine.validateFormula(process.formula);
					if (!validation.valid) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Invalid process formula: ${validation.error}`,
						});
					}
				}
			}

			// Verificar se código já existe (se fornecido)
			if (input.code) {
				const existingProduct = await ctx.db.product.findFirst({
					where: {
						companyId,
						code: input.code,
					},
				});

				if (existingProduct) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Product code already exists",
					});
				}
			}

			// Criar produto em transação
			const product = await ctx.db.$transaction(async (tx) => {
				const { materials, equipments, processes, finishes, ...productData } =
					input;

				const createdProduct = await tx.product.create({
					data: {
						...productData,
						companyId,
					},
				});

				// Criar relacionamentos com materiais
				if (materials.length > 0) {
					await tx.productMaterial.createMany({
						data: materials.map((material) => ({
							productId: createdProduct.id,
							...material,
						})),
					});
				}

				// Criar relacionamentos com equipamentos
				if (equipments.length > 0) {
					await tx.productEquipment.createMany({
						data: equipments.map((equipment) => ({
							productId: createdProduct.id,
							...equipment,
						})),
					});
				}

				// Criar relacionamentos com processos
				if (processes.length > 0) {
					await tx.productProcess.createMany({
						data: processes.map((process) => ({
							productId: createdProduct.id,
							...process,
						})),
					});
				}

				// Criar relacionamentos com acabamentos
				if (finishes.length > 0) {
					await tx.productFinish.createMany({
						data: finishes.map((finish) => ({
							productId: createdProduct.id,
							...finish,
						})),
					});
				}

				return createdProduct;
			});

			return product;
		}),

	// Atualizar produto
	update: protectedProcedure

		.input(
			z.object({
				id: z.string(),
				name: z.string().min(2).max(200).optional(),
				description: z.string().optional(),
				code: z.string().max(50).optional(),
				category: z.string().optional(),
				formula: z.string().optional(),
				checklist: checklistSchema,
				margin: marginSchema.optional(),
				materials: z.array(productMaterialSchema).optional(),
				equipments: z.array(productEquipmentSchema).optional(),
				processes: z.array(productProcessSchema).optional(),
				finishes: z.array(productFinishSchema).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const { id, materials, equipments, processes, finishes, ...data } = input;

			// Verificar se produto existe
			const existingProduct = await ctx.db.product.findFirst({
				where: { id, companyId },
			});

			if (!existingProduct) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}

			// Validar fórmula se fornecida
			if (data.formula) {
				const validation = FormulaEngine.validateFormula(data.formula);
				if (!validation.valid) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid formula: ${validation.error}`,
					});
				}
			}

			// Atualizar produto em transação
			const product = await ctx.db.$transaction(async (tx) => {
				const updatedProduct = await tx.product.update({
					where: { id },
					data,
				});

				// Atualizar materiais se fornecidos
				if (materials !== undefined) {
					await tx.productMaterial.deleteMany({
						where: { productId: id },
					});

					if (materials.length > 0) {
						await tx.productMaterial.createMany({
							data: materials.map((material) => ({
								productId: id,
								...material,
							})),
						});
					}
				}

				// Atualizar equipamentos se fornecidos
				if (equipments !== undefined) {
					await tx.productEquipment.deleteMany({
						where: { productId: id },
					});

					if (equipments.length > 0) {
						await tx.productEquipment.createMany({
							data: equipments.map((equipment) => ({
								productId: id,
								...equipment,
							})),
						});
					}
				}

				// Atualizar processos se fornecidos
				if (processes !== undefined) {
					await tx.productProcess.deleteMany({
						where: { productId: id },
					});

					if (processes.length > 0) {
						await tx.productProcess.createMany({
							data: processes.map((process) => ({
								productId: id,
								...process,
							})),
						});
					}
				}

				// Atualizar acabamentos se fornecidos
				if (finishes !== undefined) {
					await tx.productFinish.deleteMany({
						where: { productId: id },
					});

					if (finishes.length > 0) {
						await tx.productFinish.createMany({
							data: finishes.map((finish) => ({
								productId: id,
								...finish,
							})),
						});
					}
				}

				return updatedProduct;
			});

			return product;
		}),

	// Calcular custo do produto
	calculateCost: protectedProcedure

		.input(
			z.object({
				id: z.string(),
				context: z.object({
					quantidade: z.number().min(1).default(1),
					largura: z.number().optional(),
					altura: z.number().optional(),
					espessura: z.number().optional(),
				}),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			const product = await ctx.db.product.findFirst({
				where: {
					id: input.id,
					companyId,
				},
				include: {
					materials: {
						include: {
							material: { select: { name: true, cost: true, unit: true } },
						},
					},
					equipments: {
						include: {
							equipment: {
								select: { name: true, costPerHour: true, type: true },
							},
						},
					},
					processes: {
						include: {
							process: {
								select: { name: true, costPerHour: true, timeUnit: true },
							},
						},
					},
					finishes: {
						include: {
							finish: { select: { name: true, cost: true } },
						},
					},
				},
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}

			const context: FormulaContext = input.context;
			let totalCost = 0;
			const breakdown: any[] = [];

			// Calcular custo dos materiais
			for (const productMaterial of product.materials) {
				let quantity = Number(productMaterial.quantity);

				// Aplicar fórmula se existir
				if (productMaterial.formula) {
					try {
						const result = FormulaEngine.calculateFormula(
							productMaterial.formula,
							context,
							productMaterial.material.unit,
						);
						quantity = result.value;
					} catch (error) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Error calculating material formula: ${error instanceof Error ? error.message : "Unknown error"}`,
						});
					}
				}

				const materialCost = Number(productMaterial.material.cost) * quantity;
				totalCost += materialCost;

				breakdown.push({
					type: "material",
					name: productMaterial.material.name,
					quantity,
					unit: productMaterial.material.unit,
					unitCost: Number(productMaterial.material.cost),
					totalCost: materialCost,
					formula: productMaterial.formula,
				});
			}

			// Calcular custo dos equipamentos
			for (const productEquipment of product.equipments) {
				let timeNeeded = Number(productEquipment.timeNeeded);

				// Aplicar fórmula se existir
				if (productEquipment.formula) {
					try {
						const result = FormulaEngine.calculateFormula(
							productEquipment.formula,
							context,
							"hour",
						);
						timeNeeded = result.value;
					} catch (error) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Error calculating equipment formula: ${error instanceof Error ? error.message : "Unknown error"}`,
						});
					}
				}

				const equipmentCost =
					Number(productEquipment.equipment.costPerHour) * timeNeeded;
				totalCost += equipmentCost;

				breakdown.push({
					type: "equipment",
					name: productEquipment.equipment.name,
					timeNeeded,
					unit: "hour",
					costPerHour: Number(productEquipment.equipment.costPerHour),
					totalCost: equipmentCost,
					formula: productEquipment.formula,
				});
			}

			// Calcular custo dos processos
			for (const productProcess of product.processes) {
				let timeNeeded = Number(productProcess.timeNeeded);

				// Aplicar fórmula se existir
				if (productProcess.formula) {
					try {
						const result = FormulaEngine.calculateFormula(
							productProcess.formula,
							context,
							productProcess.process.timeUnit,
						);
						timeNeeded = result.value;
					} catch (error) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Error calculating process formula: ${error instanceof Error ? error.message : "Unknown error"}`,
						});
					}
				}

				const processCost =
					Number(productProcess.process.costPerHour) * timeNeeded;
				totalCost += processCost;

				breakdown.push({
					type: "process",
					name: productProcess.process.name,
					timeNeeded,
					unit: productProcess.process.timeUnit,
					costPerHour: Number(productProcess.process.costPerHour),
					totalCost: processCost,
					formula: productProcess.formula,
				});
			}

			// Calcular custo dos acabamentos
			for (const productFinish of product.finishes) {
				const finishCost =
					Number(productFinish.finish.cost) * Number(productFinish.quantity);
				totalCost += finishCost;

				breakdown.push({
					type: "finish",
					name: productFinish.finish.name,
					quantity: Number(productFinish.quantity),
					unit: "un",
					unitCost: Number(productFinish.finish.cost),
					totalCost: finishCost,
				});
			}

			// Aplicar margem se definida
			const margin = product.margin as any;
			let finalPrice = totalCost;

			if (margin?.markup) {
				finalPrice = totalCost * (1 + margin.markup / 100);
			} else if (margin?.liquidMargin) {
				finalPrice = totalCost / (1 - margin.liquidMargin / 100);
			} else if (margin?.finalPrice) {
				finalPrice = margin.finalPrice;
			}

			return {
				productId: input.id,
				productName: product.name,
				context: input.context,
				totalCost,
				finalPrice,
				margin: finalPrice - totalCost,
				marginPercent:
					totalCost > 0 ? ((finalPrice - totalCost) / totalCost) * 100 : 0,
				breakdown,
			};
		}),

	// Validar fórmula
	validateFormula: protectedProcedure

		.input(
			z.object({
				formula: z.string(),
			}),
		)
		.query(({ input }) => {
			return FormulaEngine.validateFormula(input.formula);
		}),

	// Preview de fórmula
	previewFormula: protectedProcedure

		.input(
			z.object({
				formula: z.string(),
				context: z
					.object({
						quantidade: z.number().optional(),
						largura: z.number().optional(),
						altura: z.number().optional(),
						espessura: z.number().optional(),
					})
					.optional(),
			}),
		)
		.query(({ input }) => {
			return FormulaEngine.previewFormula(input.formula, input.context);
		}),

	// Estatísticas
	stats: protectedProcedure.query(async ({ ctx }) => {
		const companyId = ensureCompanyAccess()(ctx);

		const [totalProducts, activeProducts, productsByCategory, recentProducts] =
			await Promise.all([
				ctx.db.product.count({ where: { companyId } }),
				ctx.db.product.count({ where: { companyId, active: true } }),
				ctx.db.product.groupBy({
					by: ["category"],
					where: { companyId, category: { not: null } },
					_count: true,
					orderBy: { _count: { category: "desc" } },
					take: 10,
				}),
				ctx.db.product.findMany({
					where: { companyId },
					take: 5,
					orderBy: { createdAt: "desc" },
					select: {
						id: true,
						name: true,
						category: true,
						createdAt: true,
					},
				}),
			]);

		return {
			totalProducts,
			activeProducts,
			inactiveProducts: totalProducts - activeProducts,
			productsByCategory: productsByCategory.map((p) => ({
				category: p.category,
				count: p._count,
			})),
			recentProducts,
		};
	}),
});
