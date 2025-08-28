import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ensureCompanyAccess } from "../lib/tenancy";
import { protectedProcedure, router } from "../lib/trpc";
import { apiLogger, errorLogger } from "../lib/logger";
import { ConsumableUnit } from "../types/consumables";

const consumableSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  code: z.string().optional(),
  type: z.enum(['ink', 'printHead', 'tool', 'material', 'other']),
  cost: z.number().min(0, 'Custo deve ser positivo'),
  unit: z.nativeEnum(ConsumableUnit),
  supplier: z.string().optional(),
  color: z.string().optional(),
  volumeMl: z.number().int().positive().optional(),
  lifespan: z.number().int().positive().optional(),
  currentUse: z.number().int().min(0).optional(),
  material: z.string().optional(),
  diameter: z.number().positive().optional(),
  // Campos específicos para cabeças de impressão
  model: z.string().optional(),
  durationMonths: z.number().int().positive().optional(),
  installationDate: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return val instanceof Date ? val : new Date(val as string);
  }, z.date().optional()),
  optimalSpeedRange: z.string().optional(),
  shotsPerM2: z.number().int().positive().optional(),
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
    .input(z.object({
      type: z.enum(['ink', 'printHead', 'tool', 'material', 'other']).optional(),
      active: z.boolean().optional(),
      search: z.string().optional(),
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(20),
    }))
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
              { name: { contains: input.search, mode: 'insensitive' as const } },
              { description: { contains: input.search, mode: 'insensitive' as const } },
              { code: { contains: input.search, mode: 'insensitive' as const } },
            ],
          }),
        };

        const [consumables, total] = await Promise.all([
          ctx.db.consumable.findMany({
            where,
            orderBy: { name: 'asc' },
            skip,
            take: input.limit,
          }),
          ctx.db.consumable.count({ where }),
        ]);

        const duration = Date.now() - startTime;
        
        apiLogger.info('Consumables listed successfully', {
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
        
        apiLogger.error('Failed to list consumables', {
          error: error instanceof Error ? error.message : 'Unknown error',
          companyId,
          filters: input,
          duration,
        });
        
        throw error;
      }
    }),

  // Obter consumível por ID
  byId: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
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
          throw new Error('Consumível não encontrado');
        }

        const duration = Date.now() - startTime;
        
        apiLogger.info('Consumable retrieved successfully', {
          consumableId: input.id,
          companyId,
          duration,
        });

        return consumable;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        apiLogger.error('Failed to retrieve consumable', {
          error: error instanceof Error ? error.message : 'Unknown error',
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
            throw new Error('Código já existe para outro consumível');
          }
        }

        // Para tintas, sempre forçar unidade como L (litros)
        const consumableData = {
          ...input,
          companyId,
          ...(input.type === 'ink' && { unit: 'L' })
        };

        const consumable = await ctx.db.consumable.create({
          data: consumableData,
        });

        const duration = Date.now() - startTime;
        
        apiLogger.info('Consumable created successfully', {
          consumableId: consumable.id,
          name: consumable.name,
          type: consumable.type,
          companyId,
          duration,
        });

        return consumable;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        apiLogger.error('Failed to create consumable', {
          error: error instanceof Error ? error.message : 'Unknown error',
          input: { ...input, companyId },
          duration,
        });
        
        throw error;
      }
    }),

  // Atualizar consumível
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: consumableSchema.partial(),
    }))
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
          throw new Error('Consumível não encontrado');
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
            throw new Error('Código já existe para outro consumível');
          }
        }

        // Para tintas, sempre forçar unidade como L (litros)
        const updateData = {
          ...input.data,
          ...(input.data.type === 'ink' && { unit: 'L' })
        };

        const consumable = await ctx.db.consumable.update({
          where: { id: input.id },
          data: updateData,
        });

        const duration = Date.now() - startTime;
        
        apiLogger.info('Consumable updated successfully', {
          consumableId: input.id,
          companyId,
          changes: Object.keys(input.data),
          duration,
        });

        return consumable;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        apiLogger.error('Failed to update consumable', {
          error: error instanceof Error ? error.message : 'Unknown error',
          consumableId: input.id,
          companyId,
          duration,
        });
        
        throw error;
      }
    }),

  // Deletar consumível
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
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
          throw new Error('Consumível não encontrado');
        }

        await ctx.db.consumable.delete({
          where: { id: input.id },
        });

        const duration = Date.now() - startTime;
        
        apiLogger.info('Consumable deleted successfully', {
          consumableId: input.id,
          name: existing.name,
          companyId,
          duration,
        });

        return { success: true };
      } catch (error) {
        const duration = Date.now() - startTime;
        
        apiLogger.error('Failed to delete consumable', {
          error: error instanceof Error ? error.message : 'Unknown error',
          consumableId: input.id,
          companyId,
          duration,
        });
        
        throw error;
      }
    }),

  // Buscar cabeças de impressão para equipamento
  getPrintHeadsForEquipment: protectedProcedure
    .input(z.object({
      equipmentId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx);
      const startTime = Date.now();

      try {
        const printHeads = await ctx.db.consumable.findMany({
          where: {
            companyId,
            type: 'printHead',
            active: true,
          },
          orderBy: { name: 'asc' },
        });

        const duration = Date.now() - startTime;
        
        apiLogger.info('Print heads retrieved successfully', {
          companyId,
          count: printHeads.length,
          equipmentId: input.equipmentId,
          duration,
        });

        return printHeads;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        apiLogger.error('Failed to retrieve print heads', {
          error: error instanceof Error ? error.message : 'Unknown error',
          companyId,
          equipmentId: input.equipmentId,
          duration,
        });
        
        throw error;
      }
    }),

  // Atualizar estoque
  updateStock: protectedProcedure
    .input(z.object({
      id: z.string(),
      quantity: z.number().int(),
      type: z.enum(['add', 'remove', 'set']),
      reason: z.string().optional(),
    }))
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
          throw new Error('Consumível não encontrado');
        }

        let newStock: number;
        switch (input.type) {
          case 'add':
            newStock = existing.currentStock + input.quantity;
            break;
          case 'remove':
            newStock = existing.currentStock - input.quantity;
            break;
          case 'set':
            newStock = input.quantity;
            break;
        }

        if (newStock < 0) {
          throw new Error('Estoque não pode ser negativo');
        }

        const consumable = await ctx.db.consumable.update({
          where: { id: input.id },
          data: { currentStock: newStock },
        });

        const duration = Date.now() - startTime;
        
        apiLogger.info('Consumable stock updated successfully', {
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
        
        apiLogger.error('Failed to update consumable stock', {
          error: error instanceof Error ? error.message : 'Unknown error',
          consumableId: input.id,
          companyId,
          duration,
        });
        
        throw error;
      }
    }),
});