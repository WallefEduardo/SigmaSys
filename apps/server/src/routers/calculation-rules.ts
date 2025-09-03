import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../lib/trpc";
import { ensureCompanyAccess } from "../lib/tenancy";
import { FormulaEngine, PREDEFINED_RULES, type FormulaVariables } from "../lib/formula-engine";
import { CalculationService } from "../services/calculation-service";

/**
 * 🧮 CALCULATION RULES ROUTER - API para Regras de Cálculo Inteligentes
 * 
 * Endpoints para gerenciar regras de cálculo dinâmicas e realizar
 * cálculos de custos de materiais usando fórmulas matemáticas.
 */

export const calculationRulesRouter = router({
  // Listar regras de cálculo
  list: protectedProcedure
    .input(z.object({
      category: z.enum(['AREA', 'LENGTH', 'UNIT']).optional(),
      active: z.boolean().optional().default(true)
    }))
    .query(async ({ ctx, input }) => {
      const rules = await ctx.db.calculationRule.findMany({
        where: {
          ...(input.category && { category: input.category }),
          active: input.active
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      return { rules };
    }),

  // Obter regras pré-definidas
  getPredefined: protectedProcedure
    .input(z.object({
      category: z.enum(['AREA', 'LENGTH', 'UNIT']).optional()
    }))
    .query(({ input }) => {
      const rules = input.category 
        ? PREDEFINED_RULES.filter(rule => rule.category === input.category)
        : PREDEFINED_RULES;

      return { rules };
    }),

  // Criar regra de cálculo
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      category: z.enum(['AREA', 'LENGTH', 'UNIT']),
      formula: z.string().min(1),
      variables: z.array(z.string()).min(1),
      resultUnit: z.string().min(1),
      description: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Validar fórmula
      const isValid = FormulaEngine.validate(input.formula, input.variables);
      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fórmula inválida ou variáveis obrigatórias ausentes"
        });
      }

      const rule = await ctx.db.calculationRule.create({
        data: {
          name: input.name,
          category: input.category,
          formula: input.formula,
          variables: input.variables,
          resultUnit: input.resultUnit,
          description: input.description,
          active: true
        }
      });

      return rule;
    }),

  // Atualizar regra de cálculo
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      formula: z.string().optional(),
      variables: z.array(z.string()).optional(),
      resultUnit: z.string().optional(),
      description: z.string().optional(),
      active: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Se atualizando fórmula, validar
      if (updateData.formula && updateData.variables) {
        const isValid = FormulaEngine.validate(updateData.formula, updateData.variables);
        if (!isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Fórmula inválida"
          });
        }
      }

      const rule = await ctx.db.calculationRule.update({
        where: { id },
        data: updateData
      });

      return rule;
    }),

  // Deletar regra de cálculo
  delete: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se regra está sendo usada
      const usage = await ctx.db.productMaterialRule.count({
        where: { calculationRuleId: input.id }
      });

      if (usage > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Regra está sendo usada em ${usage} configurações de produto`
        });
      }

      await ctx.db.calculationRule.delete({
        where: { id: input.id }
      });

      return { success: true };
    }),

  // Testar fórmula
  testFormula: protectedProcedure
    .input(z.object({
      formula: z.string().min(1),
      variables: z.record(z.string(), z.number()),
      resultUnit: z.string().min(1)
    }))
    .mutation(({ input }) => {
      try {
        const result = FormulaEngine.calculateWithRule(
          input.formula, 
          input.variables as FormulaVariables, 
          input.resultUnit
        );

        return {
          success: true,
          result: result.result,
          formula: result.formula,
          variables: result.variables,
          unit: result.unit,
          error: result.error
        };
      } catch (error) {
        return {
          success: false,
          result: 0,
          formula: input.formula,
          variables: input.variables,
          unit: input.resultUnit,
          error: (error as Error).message
        };
      }
    }),

  // Calcular custo de material
  calculateMaterialCost: protectedProcedure
    .input(z.object({
      materialId: z.string(),
      ruleId: z.string(),
      variables: z.record(z.string(), z.number())
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx);
      const calculationService = new CalculationService();

      try {
        const result = await calculationService.calculateMaterialCost(
          input.materialId,
          input.ruleId,
          input.variables as FormulaVariables,
          companyId
        );

        return {
          success: true,
          calculation: result
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: (error as Error).message
        });
      }
    }),

  // Calcular custo total do produto
  calculateProductCost: protectedProcedure
    .input(z.object({
      productId: z.string(),
      answers: z.record(z.string(), z.string()), // questionId -> answerOption
      measurements: z.record(z.string(), z.number()) // L, A, E, etc.
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx);
      const calculationService = new CalculationService();

      try {
        const result = await calculationService.calculateProductCost(
          input.productId,
          input.answers,
          input.measurements as FormulaVariables,
          companyId
        );

        return {
          success: true,
          calculation: result
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR", 
          message: (error as Error).message
        });
      }
    }),

  // Obter histórico de cálculos
  getCalculationHistory: protectedProcedure
    .input(z.object({
      quoteId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const calculationService = new CalculationService();

      const history = await calculationService.getCalculationHistory(input.quoteId);

      return { history };
    }),

  // Criar regras a partir de template pré-definido
  createFromTemplate: protectedProcedure
    .input(z.object({
      templateIds: z.array(z.string()).min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const templates = PREDEFINED_RULES.filter(rule => 
        input.templateIds.includes(rule.id)
      );

      if (templates.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhum template válido encontrado"
        });
      }

      const createdRules = [];

      for (const template of templates) {
        // Verificar se regra já existe
        const existing = await ctx.db.calculationRule.findFirst({
          where: { 
            name: template.name,
            formula: template.formula 
          }
        });

        if (!existing) {
          const rule = await ctx.db.calculationRule.create({
            data: {
              name: template.name,
              category: template.category,
              formula: template.formula,
              variables: template.variables,
              resultUnit: template.resultUnit,
              description: template.description,
              active: true
            }
          });
          createdRules.push(rule);
        }
      }

      return {
        success: true,
        created: createdRules.length,
        rules: createdRules
      };
    })
});