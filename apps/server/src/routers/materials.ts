import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ensureCompanyAccess } from "../lib/tenancy";
import { protectedProcedure, router } from "../lib/trpc";

export const materialsRouter = router({
	// Listar materiais - SIMPLES
	list: protectedProcedure
		.input(
			z.object({
				search: z.string().optional(),
				category: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			const where = {
				companyId,
				...(input.search && {
					name: {
						contains: input.search,
						mode: "insensitive" as const,
					},
				}),
				...(input.category && { category: input.category }),
			};

			const materials = await ctx.db.material.findMany({
				where,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					description: true,
					code: true,
					category: true,
					unit: true,
					cost: true,
					supplier: true,
					minStock: true,
					createdAt: true,
					// Incluir regras de cálculo
					calculationRules: {
						select: {
							calculationRule: {
								select: {
									id: true,
									name: true,
									category: true,
									formula: true,
									resultUnit: true,
									description: true,
								},
							},
						},
					},
				},
			});

			return { materials };
		}),

	// Criar material - COM REGRAS DE CÁLCULO
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().optional(),
				code: z.string().optional(),
				category: z.string().optional(),
				unit: z.enum(["m2", "ml", "un"]),
				cost: z.number().min(0),
				supplier: z.string().optional(),
				minStock: z.number().nonnegative().optional(),
				calculationRuleIds: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			console.log("Creating material with input:", input);
			const companyId = ensureCompanyAccess()(ctx);
			const { calculationRuleIds, ...materialData } = input;

			// Gerar código automático se não fornecido
			let code = materialData.code;
			if (!code) {
				// Buscar o próximo número disponível
				const lastMaterial = await ctx.db.material.findFirst({
					where: { companyId },
					orderBy: { createdAt: "desc" },
					select: { code: true },
				});

				let nextNumber = 1;
				if (lastMaterial?.code && /^MAT-(\d+)$/.test(lastMaterial.code)) {
					const match = lastMaterial.code.match(/^MAT-(\d+)$/);
					nextNumber = match ? Number.parseInt(match[1]) + 1 : 1;
				}

				code = `MAT-${nextNumber.toString().padStart(3, "0")}`;
			}

			// Criar material
			const material = await ctx.db.material.create({
				data: {
					...materialData,
					code,
					companyId,
					active: true,
				},
			});

			// Associar regras de cálculo se fornecidas
			if (calculationRuleIds && calculationRuleIds.length > 0) {
				// Verificar se todas as regras existem
				const existingRules = await ctx.db.calculationRule.findMany({
					where: {
						id: { in: calculationRuleIds },
						active: true,
					},
				});

				if (existingRules.length !== calculationRuleIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Uma ou mais regras de cálculo não foram encontradas",
					});
				}

				// Criar associações
				await ctx.db.materialCalculationRule.createMany({
					data: calculationRuleIds.map((ruleId) => ({
						materialId: material.id,
						calculationRuleId: ruleId,
					})),
				});
			}

			return material;
		}),

	// Deletar material - HARD DELETE
	delete: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			// Verificar se existe
			const material = await ctx.db.material.findFirst({
				where: { id: input.id, companyId },
			});

			if (!material) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Material not found",
				});
			}

			// DELETE REAL - vai pro escambal
			await ctx.db.material.delete({
				where: { id: input.id, companyId },
			});

			return { success: true };
		}),

	// Categorias disponíveis
	categories: protectedProcedure.query(async ({ ctx }) => {
		const companyId = ensureCompanyAccess()(ctx);

		const categories = await ctx.db.material.findMany({
			where: {
				companyId,
				category: { not: null },
			},
			select: { category: true },
			distinct: ["category"],
		});

		return categories.map((m) => m.category).filter(Boolean);
	}),
});
