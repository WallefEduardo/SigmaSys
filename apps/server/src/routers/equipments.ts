import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ensureCompanyAccess } from "../lib/tenancy";
import { protectedProcedure, router } from "../lib/trpc";
import { apiLogger, errorLogger } from "../lib/logger";
import TelemetryService from "../lib/telemetry-mock";
import { EquipmentDepreciationService } from "../lib/equipment-depreciation";
import { EquipmentPassesService } from "../lib/equipment-passes";
import { EquipmentConsumablesService } from "../lib/equipment-consumables";
import { EquipmentCostCalculator } from "../lib/equipment-cost-calculator";

const printingConfigSchema = z
	.object({
		maxWidth: z.number().optional(),
		maxHeight: z.number().optional(),
		minWidth: z.number().optional(),
		minHeight: z.number().optional(),
		maxThickness: z.number().optional(),
		resolution: z.number().optional(), // DPI
		colorModes: z.array(z.string()).optional(), // CMYK, RGB, etc
		supportedMaterials: z.array(z.string()).optional(),
		printSpeed: z.number().optional(), // m²/h
	})
	.optional();

const machiningConfigSchema = z
	.object({
		maxWidth: z.number().optional(),
		maxHeight: z.number().optional(),
		maxThickness: z.number().optional(),
		toolTypes: z.array(z.string()).optional(), // fresa, furadeira, etc
		spindleSpeed: z.number().optional(), // RPM
		feedRate: z.number().optional(), // mm/min
		precision: z.number().optional(), // tolerância em mm
	})
	.optional();

const consumablesSchema = z
	.array(
		z.object({
			name: z.string(),
			type: z.string(), // tinta, cabeça, broca, etc
			cost: z.number(),
			unit: z.string(),
			supplier: z.string().optional(),
		}),
	)
	.optional();

export const equipmentsRouter = router({
	// Listar equipamentos
	list: protectedProcedure

		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				search: z.string().optional(),
				type: z.string().optional(),
				status: z.string().optional(),
				location: z.string().optional(),
				active: z.boolean().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);
			const { page, limit, search, type, status, location, active } = input;
			const offset = (page - 1) * limit;

			try {

			const where = {
				companyId,
				...(search && {
					OR: [
						{ name: { contains: search, mode: "insensitive" as const } },
						{ description: { contains: search, mode: "insensitive" as const } },
						{ code: { contains: search, mode: "insensitive" as const } },
						{
							manufacturer: { contains: search, mode: "insensitive" as const },
						},
						{ model: { contains: search, mode: "insensitive" as const } },
						{ tags: { hasSome: [search] } },
					],
				}),
				...(type && { type }),
				...(status && { status }),
				...(location && { location }),
				...(active !== undefined && { active }),
			};

			const [equipments, total] = await Promise.all([
				ctx.db.equipment.findMany({
					where,
					skip: offset,
					take: limit,
					include: {
						creator: { select: { name: true } },
						usageLog: {
							take: 5,
							orderBy: { createdAt: "desc" },
							include: {
								operator: { select: { name: true } },
							},
						},
						_count: {
							select: {
								productItems: true,
								usageLog: true,
							},
						},
					},
					orderBy: { name: "asc" },
				}),
				ctx.db.equipment.count({ where }),
			]);

			const duration = performance.now() - startTime;
			
			// Logs estruturados seguindo padrão do ROADMAP
			apiLogger.info('Equipment list retrieved', {
				companyId,
				userId: ctx.user!.id,
				page,
				limit,
				search: search || undefined,
				type: type || undefined,
				status: status || undefined,
				location: location || undefined,
				active,
				count: equipments.length,
				total,
				duration: Math.round(duration)
			});

			// Telemetria seguindo padrão do ROADMAP
			TelemetryService.recordHistogram('equipment_list_duration', duration);
			TelemetryService.incrementCounter('equipment_list_total', { companyId });

			return {
				equipments,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			};

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to retrieve equipment list', {
					companyId,
					userId: ctx.user!.id,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				TelemetryService.trackError(error as Error, { 
					operation: 'equipment_list',
					companyId,
					userId: ctx.user!.id
				});

				throw error;
			}
		}),

	// Obter equipamento por ID
	getById: protectedProcedure

		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			const equipment = await ctx.db.equipment.findFirst({
				where: {
					id: input.id,
					companyId,
				},
				include: {
					creator: { select: { name: true, email: true } },
					updater: { select: { name: true, email: true } },
					usageLog: {
						take: 20,
						orderBy: { createdAt: "desc" },
						include: {
							operator: { select: { name: true } },
						},
					},
					productItems: {
						include: {
							product: {
								select: { id: true, name: true },
							},
						},
					},
				},
			});

			if (!equipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Equipment not found",
				});
			}

			return equipment;
		}),

	// Criar equipamento
	create: protectedProcedure

		.input(
			z.object({
				name: z.string().min(2).max(200),
				description: z.string().optional(),
				code: z.string().max(50).optional(),
				type: z.enum(["printing", "machining"]),
				energyCostPerHour: z.number().min(0).optional(),
				maintenanceCostPerHour: z.number().min(0).optional(),
				// Removido costUnit - impressoras sempre usam m²
				
				// Campos de depreciação
				acquisitionValue: z.number().min(0).optional(),
				residualValue: z.number().min(0).optional(),
				depreciationMethod: z.enum(["linear", "accelerated"]).optional(),
				usefulLifeHours: z.number().min(1).optional(),
				usefulLifeYears: z.number().min(1).optional(),
				
				maxWidth: z.number().min(0).optional(),
				maxHeight: z.number().min(0).optional(),
				maxThickness: z.number().min(0).optional(),
				printingConfig: printingConfigSchema,
				machiningConfig: machiningConfigSchema,
				
				// Sistema de passadas integrado com insumos cadastrados
				passes: z.record(
					z.string(),
					z.object({
						name: z.string(),
						description: z.string().optional(),
						speedM2PerHour: z.number().min(0), // velocidade em m²/h para conversões
						inkConsumables: z.array(z.object({
							consumableId: z.string(), // ID do insumo cadastrado tipo "ink"
							consumptionMlPerM2: z.number().min(0), // ml consumidos por m²
						})).default([]),
						printHeadConsumables: z.array(z.object({
							consumableId: z.string(), // ID do insumo cadastrado tipo "printHead"
						})).default([]),
					})
				).optional(),

				// Sistema de cabeças de impressão instaladas
				printHeads: z.record(
					z.string(),
					z.object({
						id: z.string(),
						consumableId: z.string(), // ID do insumo tipo cabeça
						position: z.string(), // Posição da cabeça (A1, B2, etc)
						installationDate: z.string(), // Data de instalação
						notes: z.string().optional(),
					})
				).optional(),
				
				consumables: consumablesSchema,
				location: z.string().optional(),
				serialNumber: z.string().optional(),
				manufacturer: z.string().optional(),
				model: z.string().optional(),
				year: z
					.number()
					.min(1900)
					.max(new Date().getFullYear() + 1)
					.optional(),
				maintenanceInterval: z.number().min(1).optional(),
				maintenanceNotes: z.string().optional(),
				manualUrl: z.string().url().optional(),
				images: z.array(z.string().url()).default([]),
				documents: z.array(z.string().url()).default([]),
				notes: z.string().optional(),
				tags: z.array(z.string()).default([]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);

			try {
				// Separar passes e printHeads do input
				const { passes, printHeads, ...equipmentData } = input;
				
				// Log para debug
				apiLogger.info('Equipment creation data received', {
					companyId,
					hasPassses: !!passes,
					passCount: passes ? Object.keys(passes).length : 0,
					hasPrintHeads: !!printHeads,
					printHeadCount: printHeads ? Object.keys(printHeads).length : 0,
				});

				// Verificar se código já existe (se fornecido)
				if (equipmentData.code) {
					const existingEquipment = await ctx.db.equipment.findFirst({
						where: {
							companyId,
							code: equipmentData.code,
						},
					});

					if (existingEquipment) {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Equipment code already exists",
						});
					}
				}

				// Calcular próxima manutenção se intervalo fornecido (em dias)
				const nextMaintenance = equipmentData.maintenanceInterval && equipmentData.maintenanceInterval > 0 && equipmentData.maintenanceInterval <= 3650
					? new Date(Date.now() + equipmentData.maintenanceInterval * 24 * 60 * 60 * 1000)
					: undefined;

				// Se tem passes, salvar no campo passes (JSON)
				// IMPORTANTE: Não incluir printHeads em dataToSave pois não é campo do banco
				const dataToSave: any = {
					...equipmentData,
					companyId,
					nextMaintenance,
					createdBy: ctx.user!.id,
				};
				
				// Remover printHeads se existir (veio no equipmentData mas não existe no schema)
				delete dataToSave.printHeads;
				
				if (passes && Object.keys(passes).length > 0) {
					dataToSave.passes = passes;
				}

				const equipment = await ctx.db.equipment.create({
					data: dataToSave,
					include: {
						creator: { select: { name: true } },
						_count: {
							select: { productItems: true },
						},
					},
				});
				
				// Se tem cabeças de impressão, criar registros EquipmentConsumable
				if (printHeads && Object.keys(printHeads).length > 0) {
					const headRecords = Object.values(printHeads).map((head: any) => ({
						equipmentId: equipment.id,
						consumableId: head.consumableId,
						position: head.position,
						installationDate: new Date(head.installationDate),
						notes: head.notes || null,
						active: true,
					}));
					
					apiLogger.info('Creating print head installations', {
						companyId,
						equipmentId: equipment.id,
						headCount: headRecords.length,
					});
					
					await ctx.db.equipmentConsumable.createMany({
						data: headRecords,
					});
					
					// Buscar o equipamento com as relações
					const equipmentWithRelations = await ctx.db.equipment.findUnique({
						where: { id: equipment.id },
						include: {
							creator: { select: { name: true } },
							installedConsumables: {
								include: {
									consumable: true,
								},
							},
							_count: {
								select: { productItems: true },
							},
						},
					});
					
					return equipmentWithRelations || equipment;
				}

				const duration = performance.now() - startTime;

				// Logs estruturados seguindo padrão do ROADMAP
				apiLogger.info('Equipment created successfully', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: equipment.id,
					equipmentName: equipment.name,
					equipmentType: equipment.type,
					code: equipment.code || undefined,
					duration: Math.round(duration)
				});

				// Telemetria seguindo padrão do ROADMAP
				TelemetryService.recordHistogram('equipment_create_duration', duration);
				TelemetryService.incrementCounter('equipment_create_total', { 
					companyId,
					type: equipment.type
				});

				return equipment;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to create equipment', {
					companyId,
					userId: ctx.user!.id,
					equipmentName: input.name,
					equipmentType: input.type,
					code: input.code || undefined,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				TelemetryService.trackError(error as Error, { 
					operation: 'equipment_create',
					companyId,
					userId: ctx.user!.id,
					equipmentType: input.type
				});

				throw error;
			}
		}),

	// Atualizar equipamento
	update: protectedProcedure

		.input(
			z.object({
				id: z.string(),
				name: z.string().min(2).max(200).optional(),
				description: z.string().optional(),
				code: z.string().max(50).optional(),
				type: z.enum(["printing", "machining"]).optional(),
				energyCostPerHour: z.number().min(0).optional(),
				maintenanceCostPerHour: z.number().min(0).optional(),
				// Removido costUnit - impressoras sempre usam m²
				maxWidth: z.number().min(0).optional(),
				maxHeight: z.number().min(0).optional(),
				maxThickness: z.number().min(0).optional(),
				printingConfig: printingConfigSchema,
				machiningConfig: machiningConfigSchema,
				consumables: consumablesSchema,
				status: z
					.enum(["available", "busy", "maintenance", "broken"])
					.optional(),
				location: z.string().optional(),
				serialNumber: z.string().optional(),
				manufacturer: z.string().optional(),
				model: z.string().optional(),
				year: z
					.number()
					.min(1900)
					.max(new Date().getFullYear() + 1)
					.optional(),
				lastMaintenance: z.date().optional(),
				maintenanceInterval: z.number().min(1).optional(),
				maintenanceNotes: z.string().optional(),
				manualUrl: z.string().url().optional(),
				images: z.array(z.string().url()).optional(),
				documents: z.array(z.string().url()).optional(),
				notes: z.string().optional(),
				tags: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);
			const { id, lastMaintenance, maintenanceInterval, ...data } = input;

			try {
				// Verificar se equipamento existe
				const existingEquipment = await ctx.db.equipment.findFirst({
					where: { id, companyId },
				});

				if (!existingEquipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Equipment not found",
					});
				}

				// Verificar código único (se alterado)
				if (data.code && data.code !== existingEquipment.code) {
					const codeExists = await ctx.db.equipment.findFirst({
						where: {
							companyId,
							code: data.code,
							id: { not: id },
						},
					});

					if (codeExists) {
						throw new TRPCError({
							code: "CONFLICT",
							message: "Equipment code already exists",
						});
					}
				}

				// Calcular próxima manutenção
				let nextMaintenance = existingEquipment.nextMaintenance;
				if (lastMaintenance && maintenanceInterval) {
					nextMaintenance = new Date(
						lastMaintenance.getTime() + maintenanceInterval * 24 * 60 * 60 * 1000,
					);
				} else if (maintenanceInterval && existingEquipment.lastMaintenance) {
					nextMaintenance = new Date(
						existingEquipment.lastMaintenance.getTime() +
							maintenanceInterval * 24 * 60 * 60 * 1000,
					);
				}

				const equipment = await ctx.db.equipment.update({
					where: { id },
					data: {
						...data,
						...(lastMaintenance && { lastMaintenance }),
						...(maintenanceInterval && { maintenanceInterval }),
						...(nextMaintenance && { nextMaintenance }),
						updatedBy: ctx.user!.id,
					},
					include: {
						creator: { select: { name: true } },
						updater: { select: { name: true } },
						_count: {
							select: {
								productItems: true,
								usageLog: true,
							},
						},
					},
				});

				const duration = performance.now() - startTime;

				// Logs estruturados seguindo padrão do ROADMAP
				apiLogger.info('Equipment updated successfully', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: equipment.id,
					equipmentName: equipment.name,
					changedFields: Object.keys(data),
					duration: Math.round(duration)
				});

				// Telemetria seguindo padrão do ROADMAP
				TelemetryService.recordHistogram('equipment_update_duration', duration);
				TelemetryService.incrementCounter('equipment_update_total', { companyId });

				return equipment;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to update equipment', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: id,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				TelemetryService.trackError(error as Error, { 
					operation: 'equipment_update',
					companyId,
					userId: ctx.user!.id,
					equipmentId: id
				});

				throw error;
			}
		}),

	// Desativar equipamento
	deactivate: protectedProcedure

		.input(
			z.object({
				id: z.string(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);

			try {
				// Verificar se equipamento está sendo usado em produtos
				const usage = await ctx.db.productEquipment.count({
					where: {
						equipmentId: input.id,
						product: { companyId },
					},
				});

				if (usage > 0) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Equipment is being used in ${usage} products`,
					});
				}

				const equipment = await ctx.db.equipment.update({
					where: {
						id: input.id,
						companyId,
					},
					data: {
						active: false,
						status: "broken",
						updatedBy: ctx.user!.id,
					},
				});

				const duration = performance.now() - startTime;

				// Logs estruturados seguindo padrão do ROADMAP
				apiLogger.info('Equipment deactivated successfully', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: equipment.id,
					equipmentName: equipment.name,
					reason: input.reason || 'No reason provided',
					duration: Math.round(duration)
				});

				// Telemetria seguindo padrão do ROADMAP
				TelemetryService.recordHistogram('equipment_deactivate_duration', duration);
				TelemetryService.incrementCounter('equipment_deactivate_total', { companyId });

				return equipment;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to deactivate equipment', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.id,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				TelemetryService.trackError(error as Error, { 
					operation: 'equipment_deactivate',
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.id
				});

				throw error;
			}
		}),

	// Registrar uso do equipamento
	logUsage: protectedProcedure

		.input(
			z.object({
				equipmentId: z.string(),
				startTime: z.date(),
				endTime: z.date().optional(),
				description: z.string().optional(),
				orderId: z.string().optional(),
				consumablesUsed: z
					.array(
						z.object({
							name: z.string(),
							quantity: z.number(),
							cost: z.number(),
						}),
					)
					.optional(),
				unitsProduced: z.number().min(0).optional(),
				area: z.number().min(0).optional(),
				length: z.number().min(0).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);

			// Verificar se equipamento existe e pertence à empresa
			const equipment = await ctx.db.equipment.findFirst({
				where: {
					id: input.equipmentId,
					companyId,
				},
			});

			if (!equipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Equipment not found",
				});
			}

			// Calcular duração e custo 
			const duration = input.endTime
				? Math.round(
						(input.endTime.getTime() - input.startTime.getTime()) / (1000 * 60),
					)
				: undefined;

			// Usar custo calculado em m² ou por hora conforme disponível
			const costPerM2 = Number(equipment.calculatedCostPerM2 || 0);
			const costPerHour = Number(equipment.calculatedCostPerHour || 0);
			const cost = duration && costPerHour > 0 ? (duration / 60) * costPerHour : undefined;

			const usage = await ctx.db.equipmentUsage.create({
				data: {
					...input,
					equipmentId: input.equipmentId,
					operatorId: ctx.user!.id,
					duration,
					cost,
				},
				include: {
					equipment: { select: { name: true } },
					operator: { select: { name: true } },
				},
			});

			// Atualizar status do equipamento se necessário
			if (input.endTime) {
				await ctx.db.equipment.update({
					where: { id: input.equipmentId },
					data: { status: "available" },
				});
			} else {
				await ctx.db.equipment.update({
					where: { id: input.equipmentId },
					data: { status: "busy" },
				});
			}

			return usage;
		}),

	// Estatísticas
	stats: protectedProcedure.query(async ({ ctx }) => {
		const companyId = ensureCompanyAccess()(ctx);

		const [
			totalEquipments,
			activeEquipments,
			equipmentsByType,
			equipmentsByStatus,
			maintenanceDue,
			recentUsage,
			totalUsageHours,
		] = await Promise.all([
			ctx.db.equipment.count({ where: { companyId } }),
			ctx.db.equipment.count({ where: { companyId, active: true } }),
			ctx.db.equipment.groupBy({
				by: ["type"],
				where: { companyId },
				_count: true,
			}),
			ctx.db.equipment.groupBy({
				by: ["status"],
				where: { companyId, active: true },
				_count: true,
			}),
			ctx.db.equipment.findMany({
				where: {
					companyId,
					active: true,
					nextMaintenance: {
						lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // próximos 7 dias
					},
				},
				select: {
					id: true,
					name: true,
					nextMaintenance: true,
					location: true,
				},
			}),
			ctx.db.equipmentUsage.findMany({
				where: {
					equipment: { companyId },
				},
				take: 10,
				orderBy: { createdAt: "desc" },
				include: {
					equipment: { select: { name: true } },
					operator: { select: { name: true } },
				},
			}),
			ctx.db.equipmentUsage.aggregate({
				where: {
					equipment: { companyId },
					duration: { not: null },
				},
				_sum: { duration: true },
			}),
		]);

		return {
			totalEquipments,
			activeEquipments,
			inactiveEquipments: totalEquipments - activeEquipments,
			equipmentsByType: equipmentsByType.map((e) => ({
				type: e.type,
				count: e._count,
			})),
			equipmentsByStatus: equipmentsByStatus.map((e) => ({
				status: e.status,
				count: e._count,
			})),
			maintenanceDue,
			recentUsage,
			totalUsageHours: Math.round((totalUsageHours._sum.duration || 0) / 60),
			maintenanceDueCount: maintenanceDue.length,
		};
	}),

	// === FUNCIONALIDADES AVANÇADAS ===

	// Calcular depreciação de equipamento
	calculateDepreciation: protectedProcedure
		.input(
			z.object({
				equipmentId: z.string(),
			})
		)
		.query(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);

			try {
				const equipment = await ctx.db.equipment.findFirst({
					where: {
						id: input.equipmentId,
						companyId,
					},
				});

				if (!equipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Equipment not found",
					});
				}

				if (!equipment.acquisitionValue) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Equipment depreciation data not configured",
					});
				}

				const depreciationResult = EquipmentDepreciationService.generateDepreciationReport({
					acquisitionValue: Number(equipment.acquisitionValue),
					residualValue: Number(equipment.residualValue || 0),
					method: equipment.depreciationMethod as 'linear' | 'accelerated' || 'linear',
					usefulLifeHours: equipment.usefulLifeHours || undefined,
					usefulLifeYears: equipment.usefulLifeYears || undefined,
					accumulatedHours: equipment.accumulatedHours || 0,
				});

				const duration = performance.now() - startTime;

				apiLogger.info('Equipment depreciation calculated', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					currentValue: depreciationResult.equipment.currentValue,
					needsReplacement: depreciationResult.renewal.recommended,
					duration: Math.round(duration)
				});

				TelemetryService.recordHistogram('equipment_depreciation_duration', duration);
				TelemetryService.incrementCounter('equipment_depreciation_total', { companyId });

				return depreciationResult;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to calculate equipment depreciation', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// Configurar passadas de impressão
	configurePassQuality: protectedProcedure
		.input(
			z.object({
				equipmentId: z.string(),
				passConfig: z.record(
					z.object({
						quality: z.string(),
						speed: z.number().min(0),
						inkConsumption: z.number().min(0),
						powerConsumption: z.number().min(0),
						printHeadWear: z.number().min(0),
						description: z.string().optional(),
					})
				),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);

			try {
				const equipment = await ctx.db.equipment.findFirst({
					where: {
						id: input.equipmentId,
						companyId,
						type: "printing",
					},
				});

				if (!equipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Printing equipment not found",
					});
				}

				const updatedEquipment = await ctx.db.equipment.update({
					where: { id: input.equipmentId },
					data: {
						passes: input.passConfig,
						updatedBy: ctx.user!.id,
					},
				});

				const duration = performance.now() - startTime;

				apiLogger.info('Equipment pass configuration updated', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					passTypes: Object.keys(input.passConfig),
					duration: Math.round(duration)
				});

				return updatedEquipment;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to configure equipment passes', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// Calcular custo de impressão por passada
	calculatePrintCost: protectedProcedure
		.input(
			z.object({
				equipmentId: z.string(),
				area: z.number().min(0),
				passQuality: z.string(),
			})
		)
		.query(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);

			try {
				const equipment = await ctx.db.equipment.findFirst({
					where: {
						id: input.equipmentId,
						companyId,
						type: "printing",
					},
				});

				if (!equipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Printing equipment not found",
					});
				}

				const passes = equipment.passes as any;
				const passConfig = passes?.[input.passQuality];

				if (!passConfig) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Pass quality '${input.passQuality}' not configured for this equipment`,
					});
				}

				const consumables = equipment.consumables as any;
				const equipmentConfig = {
					energyCostPerHour: Number(equipment.energyCostPerHour || 0),
					maintenanceCostPerHour: Number(equipment.maintenanceCostPerHour || 0),
					// Custos de tinta e cabeça vêm dos insumos cadastrados
				};

				const result = EquipmentPassesService.calculatePrintJob({
					area: input.area,
					passConfig,
					equipmentConfig,
				});

				const duration = performance.now() - startTime;

				apiLogger.info('Print cost calculated', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					area: input.area,
					passQuality: input.passQuality,
					totalCost: result.costs.total,
					timeRequired: result.timeRequired,
					duration: Math.round(duration)
				});

				return result;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to calculate print cost', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// Monitorar estoque de consumíveis
	monitorConsumables: protectedProcedure
		.input(
			z.object({
				equipmentId: z.string(),
			})
		)
		.query(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);

			try {
				const equipment = await ctx.db.equipment.findFirst({
					where: {
						id: input.equipmentId,
						companyId,
					},
				});

				if (!equipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Equipment not found",
					});
				}

				const consumables = equipment.consumables as any;
				if (!consumables) {
					return { alerts: [], summary: null };
				}

				// Mock de histórico de uso para demonstração
				const usageHistory: any[] = [];

				const consumablesList = EquipmentConsumablesService.getDefaultPrintingConsumables();
				const alerts = EquipmentConsumablesService.monitorStock(consumablesList, usageHistory);

				const duration = performance.now() - startTime;

				apiLogger.info('Consumables monitoring completed', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					alertCount: alerts.length,
					duration: Math.round(duration)
				});

				return {
					alerts,
					summary: {
						totalConsumables: consumablesList.length,
						alertCount: alerts.length,
						criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
					}
				};

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to monitor consumables', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// Sugerir melhor configuração de passada
	suggestBestPass: protectedProcedure
		.input(
			z.object({
				equipmentId: z.string(),
				area: z.number().min(0),
				priority: z.enum(["cost", "speed", "quality", "balanced"]),
				maxBudget: z.number().optional(),
				maxTime: z.number().optional(),
				minQuality: z.enum(["draft", "normal", "high", "photo"]).optional(),
			})
		)
		.query(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);

			try {
				const equipment = await ctx.db.equipment.findFirst({
					where: {
						id: input.equipmentId,
						companyId,
						type: "printing",
					},
				});

				if (!equipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Printing equipment not found",
					});
				}

				const equipmentConfig = {
					energyCostPerHour: Number(equipment.energyCostPerHour || 0),
					maintenanceCostPerHour: Number(equipment.maintenanceCostPerHour || 0),
					// Custos vêm dos insumos cadastrados na nova lógica
				};

				const suggestion = EquipmentPassesService.suggestBestPass(
					input.area,
					equipmentConfig,
					{
						priority: input.priority,
						maxBudget: input.maxBudget,
						maxTime: input.maxTime,
						minQuality: input.minQuality,
					}
				);

				const duration = performance.now() - startTime;

				apiLogger.info('Pass suggestion generated', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					area: input.area,
					priority: input.priority,
					recommended: suggestion.recommended,
					duration: Math.round(duration)
				});

				return suggestion;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to generate pass suggestion', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// Buscar cabeças instaladas em um equipamento
	getInstalledPrintHeads: protectedProcedure
		.input(z.object({
			equipmentId: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = performance.now();

			try {
				const installations = await ctx.db.equipmentConsumable.findMany({
					where: {
						equipmentId: input.equipmentId,
						active: true,
						equipment: { companyId },
						consumable: { type: 'printHead' }
					},
					include: {
						consumable: true,
					},
					orderBy: { position: 'asc' },
				});

				const duration = performance.now() - startTime;
				
				apiLogger.info('Print heads retrieved for equipment', {
					companyId,
					equipmentId: input.equipmentId,
					count: installations.length,
					duration: Math.round(duration)
				});

				return installations;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to retrieve installed print heads', {
					companyId,
					equipmentId: input.equipmentId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// Instalar cabeça de impressão
	installPrintHead: protectedProcedure
		.input(z.object({
			equipmentId: z.string(),
			consumableId: z.string(),
			position: z.string(),
			notes: z.string().optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = performance.now();

			try {
				// Verificar se equipamento existe e pertence à empresa
				const equipment = await ctx.db.equipment.findFirst({
					where: { id: input.equipmentId, companyId },
				});

				if (!equipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Equipment not found",
					});
				}

				// Verificar se consumível existe e é cabeça de impressão
				const consumable = await ctx.db.consumable.findFirst({
					where: { 
						id: input.consumableId, 
						companyId,
						type: 'printHead' 
					},
				});

				if (!consumable) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Print head consumable not found",
					});
				}

				// Verificar se posição já está ocupada
				const existingInstallation = await ctx.db.equipmentConsumable.findFirst({
					where: {
						equipmentId: input.equipmentId,
						position: input.position,
						active: true,
					},
				});

				if (existingInstallation) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Position already occupied",
					});
				}

				const installation = await ctx.db.equipmentConsumable.create({
					data: {
						equipmentId: input.equipmentId,
						consumableId: input.consumableId,
						position: input.position,
						notes: input.notes,
					},
					include: {
						consumable: true,
					},
				});

				const duration = performance.now() - startTime;
				
				apiLogger.info('Print head installed', {
					companyId,
					equipmentId: input.equipmentId,
					consumableId: input.consumableId,
					position: input.position,
					duration: Math.round(duration)
				});

				return installation;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to install print head', {
					companyId,
					equipmentId: input.equipmentId,
					consumableId: input.consumableId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// Remover cabeça de impressão
	uninstallPrintHead: protectedProcedure
		.input(z.object({
			installationId: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = performance.now();

			try {
				const installation = await ctx.db.equipmentConsumable.findFirst({
					where: {
						id: input.installationId,
						equipment: { companyId },
					},
				});

				if (!installation) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Installation not found",
					});
				}

				await ctx.db.equipmentConsumable.update({
					where: { id: input.installationId },
					data: { active: false },
				});

				const duration = performance.now() - startTime;
				
				apiLogger.info('Print head uninstalled', {
					companyId,
					installationId: input.installationId,
					duration: Math.round(duration)
				});

				return { success: true };

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to uninstall print head', {
					companyId,
					installationId: input.installationId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// Atualizar uso da cabeça
	updatePrintHeadUsage: protectedProcedure
		.input(z.object({
			installationId: z.string(),
			currentUse: z.number().int().min(0),
		}))
		.mutation(async ({ ctx, input }) => {
			const companyId = ensureCompanyAccess()(ctx);
			const startTime = performance.now();

			try {
				const installation = await ctx.db.equipmentConsumable.findFirst({
					where: {
						id: input.installationId,
						equipment: { companyId },
					},
				});

				if (!installation) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Installation not found",
					});
				}

				const updated = await ctx.db.equipmentConsumable.update({
					where: { id: input.installationId },
					data: { currentUse: input.currentUse },
					include: {
						consumable: true,
					},
				});

				const duration = performance.now() - startTime;
				
				apiLogger.info('Print head usage updated', {
					companyId,
					installationId: input.installationId,
					currentUse: input.currentUse,
					duration: Math.round(duration)
				});

				return updated;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to update print head usage', {
					companyId,
					installationId: input.installationId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// === SISTEMA DE CÁLCULO AUTOMÁTICO DE CUSTOS ===
	
	// Calcular custos de equipamento em tempo real (nova lógica)
	calculateCosts: protectedProcedure
		.input(z.object({
			equipmentId: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);

			try {
				// Verificar se equipamento pertence à empresa
				const equipment = await ctx.db.equipment.findFirst({
					where: {
						id: input.equipmentId,
						companyId,
					},
				});

				if (!equipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Equipment not found",
					});
				}

				const calculator = new EquipmentCostCalculator(ctx.db);
				const breakdown = await calculator.calculateEquipmentCost(input.equipmentId);

				const duration = performance.now() - startTime;

				apiLogger.info('Equipment costs calculated with new logic', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					fixedCostPerM2: breakdown.fixedCosts.totalFixedPerM2,
					passCount: breakdown.passCosts.length,
					duration: Math.round(duration)
				});

				return breakdown;

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to calculate equipment costs', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),

	// Recalcular e salvar custos de equipamento (nova lógica)
	recalculateCosts: protectedProcedure
		.input(z.object({
			equipmentId: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			const startTime = performance.now();
			const companyId = ensureCompanyAccess()(ctx);

			try {
				// Verificar se equipamento pertence à empresa
				const equipment = await ctx.db.equipment.findFirst({
					where: {
						id: input.equipmentId,
						companyId,
					},
				});

				if (!equipment) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Equipment not found",
					});
				}

				const calculator = new EquipmentCostCalculator(ctx.db);
				await calculator.recalculateAndSaveEquipmentCost(input.equipmentId);

				const duration = performance.now() - startTime;

				apiLogger.info('Equipment costs recalculated and saved with new logic', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					duration: Math.round(duration)
				});

				return { success: true };

			} catch (error) {
				const duration = performance.now() - startTime;
				
				errorLogger.error('Failed to recalculate equipment costs', {
					companyId,
					userId: ctx.user!.id,
					equipmentId: input.equipmentId,
					error: error instanceof Error ? error.message : String(error),
					duration: Math.round(duration)
				});

				throw error;
			}
		}),
});
