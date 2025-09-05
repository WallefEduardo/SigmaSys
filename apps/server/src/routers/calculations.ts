import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../lib/trpc";
import { ensureCompanyAccess } from "../lib/tenancy";
import { CalculationService } from "../services/calculation-service";
import { logger } from "../lib/logger";

// Schema para validar medidas
const MeasurementSchema = z.record(z.string(), z.number());

// Schema para item de material/processo/equipamento no checklist
const ChecklistItemSchema = z.object({
  id: z.string(),
  materialId: z.string().optional(),
  materialName: z.string().optional(),
  equipmentId: z.string().optional(),
  equipmentName: z.string().optional(),
  processId: z.string().optional(),
  processName: z.string().optional(),
  calculationType: z.enum(['fixed', 'formula']),
  fixedQuantity: z.number().optional(),
  calculationRuleId: z.string().optional(),
  calculationRuleFormula: z.string().optional(),
  multiplier: z.number().default(1),
  unit: z.string().optional(),
});

// Schema para custos detalhados
const ProductCostBreakdownSchema = z.object({
  materials: z.object({
    items: z.array(z.object({
      materialId: z.string(),
      name: z.string(),
      unitCost: z.number(),
      calculatedQuantity: z.number(),
      totalCost: z.number(),
      formula: z.string().optional(),
      measurements: MeasurementSchema.optional(),
    })),
    subtotal: z.number(),
  }),
  equipments: z.object({
    items: z.array(z.object({
      equipmentId: z.string(),
      name: z.string(),
      costPerM2: z.number(),
      areaProcessed: z.number(),
      totalCost: z.number(),
      costBreakdown: z.object({
        depreciation: z.number(),
        energy: z.number(),
        maintenance: z.number(),
        inkCosts: z.number(),
        printHeadCosts: z.number(),
      }).optional(),
    })),
    subtotal: z.number(),
  }),
  processes: z.object({
    items: z.array(z.object({
      processId: z.string(),
      name: z.string(),
      costPerHour: z.number(),
      timeRequired: z.number(),
      totalCost: z.number(),
    })),
    subtotal: z.number(),
  }),
  grandTotal: z.number(),
  calculations: z.object({
    formulas: z.record(z.string(), z.any()),
    measurements: MeasurementSchema,
    timestamp: z.date(),
  }),
});

export const calculationsRouter = router({
  // Endpoint de teste para debug - verificar custos de equipamento
  debugEquipmentCosts: protectedProcedure
    .input(z.object({
      equipmentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx);
      const { EquipmentCostCalculator } = await import('../lib/equipment-cost-calculator');
      const calculator = new EquipmentCostCalculator(ctx.db);

      try {
        // Buscar equipamento
        const equipment = await ctx.db.equipment.findUnique({
          where: { id: input.equipmentId, companyId },
          select: {
            id: true,
            name: true,
            type: true,
            defaultPassKey: true,
            passes: true,
          }
        });

        // Buscar breakdown
        const breakdown = await calculator.getOrganizedCosts(input.equipmentId);
        
        // Testar cálculo
        const costData = await calculator.getCostForProductCalculation(input.equipmentId);

        return {
          equipment,
          breakdown,
          costData,
        };
      } catch (error) {
        logger.error('Erro no debug de custos:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro no debug de custos',
        });
      }
    }),

  // Calcular custo completo de produto baseado em checklist
  calculateProductCost: protectedProcedure
    .input(z.object({
      productId: z.string().optional(),
      checklistItems: z.object({
        materials: z.array(ChecklistItemSchema),
        processes: z.array(ChecklistItemSchema),  
        equipments: z.array(ChecklistItemSchema),
      }),
      measurements: MeasurementSchema,
      selectedAnswers: z.record(z.string(), z.string()).optional(),
    }))
    .output(ProductCostBreakdownSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx);
      const startTime = Date.now();
      
      try {
        logger.info(`🧮 Iniciando cálculo de custos para empresa ${companyId}`);
        logger.info(`📊 Dados recebidos:`, {
          materialsCount: input.checklistItems.materials.length,
          materialsData: input.checklistItems.materials,
          equipmentsCount: input.checklistItems.equipments.length,
          equipmentsData: input.checklistItems.equipments,
          processesCount: input.checklistItems.processes.length,
          processesData: input.checklistItems.processes,
          measurements: input.measurements
        });
        
        const calculationService = new CalculationService(ctx.db);
        const breakdown = {
          materials: { items: [], subtotal: 0 },
          equipments: { items: [], subtotal: 0 },
          processes: { items: [], subtotal: 0 },
          grandTotal: 0,
          calculations: {
            formulas: {},
            measurements: input.measurements,
            timestamp: new Date(),
          },
        };

        // 1. CALCULAR CUSTOS DOS MATERIAIS
        logger.info(`🧮 Processando ${input.checklistItems.materials.length} materiais`);
        for (const material of input.checklistItems.materials) {
          logger.info(`📦 Processando material:`, {
            materialId: material.materialId,
            materialName: material.materialName,
            calculationType: material.calculationType,
            fixedQuantity: material.fixedQuantity,
            calculationRuleId: material.calculationRuleId,
            calculationRuleFormula: material.calculationRuleFormula
          });

          if (!material.materialId) {
            logger.warn(`Material sem ID: ${JSON.stringify(material)}`);
            continue;
          }

          try {
            let totalCost = 0;
            let calculatedQuantity = 0;

            if (material.calculationType === 'fixed' && material.fixedQuantity) {
              calculatedQuantity = material.fixedQuantity;
              logger.info(`📊 Quantidade fixa: ${calculatedQuantity}`);
            } else if (material.calculationType === 'formula' && material.calculationRuleId) {
              // Usar CalculationService para cálculo baseado em fórmula
              logger.info(`🧮 Calculando com fórmula:`, {
                ruleId: material.calculationRuleId,
                formula: material.calculationRuleFormula,
                measurements: input.measurements
              });
              
              try {
                const calculation = await calculationService.calculateMaterialCost(
                  material.materialId,
                  material.calculationRuleId,
                  input.measurements,
                  companyId
                );
                calculatedQuantity = calculation.calculatedQuantity;
                totalCost = calculation.totalCost;
                logger.info(`✅ Resultado do cálculo via CalculationService:`, {
                  quantity: calculatedQuantity,
                  totalCost
                });
              } catch (calculationError) {
                logger.error(`❌ Erro no CalculationService para material ${material.materialId}:`, calculationError);
                logger.info(`⚠️ Tentando cálculo manual direto da fórmula`);
                
                // Fallback: calcular diretamente se o CalculationService falhar
                if (material.calculationRuleFormula) {
                  const { evaluate } = await import('mathjs');
                  calculatedQuantity = evaluate(material.calculationRuleFormula, input.measurements);
                  logger.info(`🧮 Quantidade calculada manualmente: ${calculatedQuantity}`);
                }
              }
            } else {
              logger.warn(`⚠️ Material sem tipo de cálculo válido:`, {
                calculationType: material.calculationType,
                fixedQuantity: material.fixedQuantity,
                calculationRuleId: material.calculationRuleId
              });
            }

            // Buscar dados reais do material
            const materialData = await ctx.db.material.findUnique({
              where: { id: material.materialId, companyId },
              select: { name: true, cost: true, unit: true }
            });

            if (!materialData) {
              logger.warn(`❌ Material ${material.materialId} não encontrado na base de dados`);
              continue;
            }

            const unitCost = Number(materialData.cost);
            logger.info(`💰 Custo unitário: R$ ${unitCost}`);
            
            // Se não veio do CalculationService, calcular manualmente
            if (totalCost === 0 && calculatedQuantity > 0) {
              totalCost = unitCost * calculatedQuantity * (material.multiplier || 1);
              logger.info(`🧮 Cálculo manual: ${unitCost} x ${calculatedQuantity} x ${material.multiplier || 1} = R$ ${totalCost}`);
            }

            // Verificação final antes de adicionar ao breakdown
            if (calculatedQuantity === 0) {
              logger.warn(`⚠️ Material ${materialData.name} com quantidade calculada = 0, verificando se deve ser incluído`);
            }

            if (totalCost === 0) {
              logger.warn(`⚠️ Material ${materialData.name} com custo total = 0, verificando se deve ser incluído`);
            }

            breakdown.materials.items.push({
              materialId: material.materialId,
              name: materialData.name,
              unitCost,
              calculatedQuantity,
              totalCost,
              formula: material.calculationRuleFormula,
              measurements: input.measurements,
            });

            breakdown.materials.subtotal += totalCost;
            breakdown.calculations.formulas[material.materialId] = {
              formula: material.calculationRuleFormula,
              result: calculatedQuantity,
              unitCost,
            };

            logger.info(`✅ Material ${materialData.name} adicionado: R$ ${totalCost.toFixed(2)}`);

          } catch (error) {
            logger.error(`❌ Erro ao calcular custo do material ${material.materialId}:`, error);
          }
        }

        logger.info(`📊 Subtotal de materiais: R$ ${breakdown.materials.subtotal.toFixed(2)} (${breakdown.materials.items.length} itens)`);
        

        // 2. CALCULAR CUSTOS DOS EQUIPAMENTOS COM CONSUMÍVEIS
        logger.info(`🛠️ Processando ${input.checklistItems.equipments.length} equipamentos`);
        for (const equipment of input.checklistItems.equipments) {
          logger.info(`⚙️ Processando equipamento:`, {
            equipmentId: equipment.equipmentId,
            equipmentName: equipment.equipmentName,
            calculationType: equipment.calculationType,
            calculationRuleFormula: equipment.calculationRuleFormula
          });

          if (!equipment.equipmentId) {
            logger.warn(`Equipamento sem ID: ${JSON.stringify(equipment)}`);
            continue;
          }

          try {
            // Importar e usar o EquipmentCostCalculator para custos completos
            const { EquipmentCostCalculator } = await import('../lib/equipment-cost-calculator');
            const costCalculator = new EquipmentCostCalculator(ctx.db);

            // Buscar dados básicos do equipamento
            const equipmentData = await ctx.db.equipment.findUnique({
              where: { id: equipment.equipmentId, companyId },
              select: { 
                name: true, 
                type: true,
                defaultPassKey: true,
                calculatedCostPerM2: true,
                passes: true, // Incluir configuração de passadas
              }
            });

            if (!equipmentData) {
              logger.warn(`❌ Equipamento ${equipment.equipmentId} não encontrado na base de dados`);
              continue;
            }

            logger.info(`🔧 Dados do equipamento obtidos:`, {
              name: equipmentData.name,
              type: equipmentData.type,
              defaultPassKey: equipmentData.defaultPassKey,
              calculatedCostPerM2: equipmentData.calculatedCostPerM2,
              hasPassesConfig: !!equipmentData.passes,
              passesConfig: equipmentData.passes
            });

            let areaProcessed = 0;
            let totalCost = 0;
            let costBreakdownDetail = {
              depreciation: 0,
              energy: 0,
              maintenance: 0,
              inkCosts: 0,
              printHeadCosts: 0,
            };

            // Calcular área baseada na fórmula ou medidas
            if (equipment.calculationType === 'formula' && equipment.calculationRuleFormula) {
              const { evaluate } = await import('mathjs');
              areaProcessed = evaluate(equipment.calculationRuleFormula, input.measurements);
              logger.info(`📐 Área calculada via fórmula: ${areaProcessed}m²`);
            } else if (input.measurements.L && input.measurements.A) {
              // Fallback para área padrão
              areaProcessed = input.measurements.L * input.measurements.A;
              logger.info(`📐 Área calculada (L x A): ${areaProcessed}m²`);
            }

            if (areaProcessed > 0) {
              try {
                // Usar o sistema avançado de cálculo de custos com consumíveis
                logger.info(`🔧 Chamando getCostForProductCalculation com:`, {
                  equipmentId: equipment.equipmentId,
                  defaultPassKey: equipmentData.defaultPassKey,
                  passKeyType: typeof equipmentData.defaultPassKey
                });

                const costData = await costCalculator.getCostForProductCalculation(
                  equipment.equipmentId, 
                  equipmentData.defaultPassKey || undefined
                );

                logger.info(`💰 Dados de custo obtidos do EquipmentCostCalculator:`);
                logger.info(`   - costData existe: ${!!costData}`);
                logger.info(`   - fixedCostPerM2: ${costData?.fixedCostPerM2}`);
                logger.info(`   - passCost existe: ${!!costData?.passCost}`);
                logger.info(`   - inkCostPerM2: ${costData?.passCost?.inkCostPerM2}`);
                logger.info(`   - headCostPerM2: ${costData?.passCost?.headCostPerM2}`);
                logger.info(`   - totalCostPerM2: ${costData?.passCost?.totalCostPerM2}`);

                if (costData.passCost) {
                  // Usar custo completo (fixo + variável) que inclui consumíveis
                  const costPerM2 = costData.passCost.totalCostPerM2;
                  totalCost = costPerM2 * areaProcessed * (equipment.multiplier || 1);

                  // Buscar breakdown detalhado dos custos fixos
                  const breakdown = await costCalculator.getOrganizedCosts(equipment.equipmentId);
                  
                  // Verificar nomes corretos dos campos
                  const inkCostPerM2 = costData.passCost.inkCostPerM2 || costData.passCost.totalInkCostPerM2 || 0;
                  const headCostPerM2 = costData.passCost.headCostPerM2 || costData.passCost.totalHeadCostPerM2 || 0;
                  
                  const inkCostsTotal = inkCostPerM2 * areaProcessed;
                  const printHeadCostsTotal = headCostPerM2 * areaProcessed;
                  
                  costBreakdownDetail = {
                    depreciation: Number(breakdown.depreciationPerM2 || 0) * areaProcessed,
                    energy: Number(breakdown.energyPerM2 || 0) * areaProcessed,
                    maintenance: Number(breakdown.maintenancePerM2 || 0) * areaProcessed,
                    inkCosts: inkCostsTotal,
                    printHeadCosts: printHeadCostsTotal,
                  };

                  logger.info(`🎯 Custos variáveis detalhados:`);
                  logger.info(`   - inkCostPerM2: ${inkCostPerM2}`);
                  logger.info(`   - headCostPerM2: ${headCostPerM2}`);
                  logger.info(`   - areaProcessed: ${areaProcessed}`);
                  logger.info(`   - inkCostsTotal: ${inkCostsTotal}`);
                  logger.info(`   - printHeadCostsTotal: ${printHeadCostsTotal}`);

                  logger.info(`✅ Custo completo calculado: R$ ${costPerM2}/m² x ${areaProcessed}m² = R$ ${totalCost.toFixed(2)}`);
                  logger.info(`🎯 Breakdown: Tinta R$ ${costBreakdownDetail.inkCosts.toFixed(2)} + Cabeça R$ ${costBreakdownDetail.printHeadCosts.toFixed(2)} + Fixo R$ ${costBreakdownDetail.depreciation.toFixed(2)}`);
                } else {
                  // Fallback para custo fixo apenas
                  logger.warn(`⚠️ Nenhum custo variável encontrado (passCost = null/undefined)`);
                  logger.info(`🔍 Motivos possíveis:`, {
                    'defaultPassKey': equipmentData.defaultPassKey,
                    'equipmentType': equipmentData.type,
                    'hasPassesConfig': !!equipmentData.passes
                  });

                  const costPerM2 = costData.fixedCostPerM2;
                  totalCost = costPerM2 * areaProcessed * (equipment.multiplier || 1);
                  
                  // Buscar breakdown detalhado dos custos fixos
                  const breakdown = await costCalculator.getOrganizedCosts(equipment.equipmentId);
                  costBreakdownDetail = {
                    depreciation: Number(breakdown.depreciationPerM2 || 0) * areaProcessed,
                    energy: Number(breakdown.energyPerM2 || 0) * areaProcessed,
                    maintenance: Number(breakdown.maintenancePerM2 || 0) * areaProcessed,
                    inkCosts: 0, // Sem custos variáveis
                    printHeadCosts: 0, // Sem custos variáveis
                  };
                  
                  logger.warn(`⚠️ Usando apenas custos fixos: R$ ${costPerM2}/m² x ${areaProcessed}m² = R$ ${totalCost.toFixed(2)}`);
                }
              } catch (costCalculatorError) {
                logger.warn(`⚠️ Erro no calculador avançado, usando custo básico:`, costCalculatorError);
                // Fallback para custo básico
                const costPerM2 = Number(equipmentData.calculatedCostPerM2) || 0;
                totalCost = costPerM2 * areaProcessed * (equipment.multiplier || 1);
                costBreakdownDetail.depreciation = totalCost;
              }
            }

            logger.info(`📊 CostBreakdownDetail final:`);
            logger.info(`   - depreciation: ${costBreakdownDetail?.depreciation}`);
            logger.info(`   - energy: ${costBreakdownDetail?.energy}`);
            logger.info(`   - maintenance: ${costBreakdownDetail?.maintenance}`);
            logger.info(`   - inkCosts: ${costBreakdownDetail?.inkCosts}`);
            logger.info(`   - printHeadCosts: ${costBreakdownDetail?.printHeadCosts}`);

            breakdown.equipments.items.push({
              equipmentId: equipment.equipmentId,
              name: equipmentData.name,
              costPerM2: totalCost / (areaProcessed || 1),
              areaProcessed,
              totalCost,
              costBreakdown: costBreakdownDetail,
            });

            breakdown.equipments.subtotal += totalCost;
            logger.info(`✅ Equipamento ${equipmentData.name} adicionado: R$ ${totalCost.toFixed(2)}`);

          } catch (error) {
            logger.error(`❌ Erro ao calcular custo do equipamento ${equipment.equipmentId}:`, error);
          }
        }

        logger.info(`🛠️ Subtotal de equipamentos: R$ ${breakdown.equipments.subtotal.toFixed(2)} (${breakdown.equipments.items.length} itens)`);
        

        // 3. CALCULAR CUSTOS DOS PROCESSOS
        logger.info(`⚙️ Processando ${input.checklistItems.processes.length} processos`);
        for (const process of input.checklistItems.processes) {
          logger.info(`🔧 Processando processo:`, {
            processId: process.processId,
            processName: process.processName,
            calculationType: process.calculationType,
            fixedQuantity: process.fixedQuantity,
            calculationRuleFormula: process.calculationRuleFormula
          });

          if (!process.processId) {
            logger.warn(`Processo sem ID: ${JSON.stringify(process)}`);
            continue;
          }

          try {
            // Buscar dados reais do processo
            const processData = await ctx.db.process.findUnique({
              where: { id: process.processId, companyId },
              select: { name: true, costPerHour: true, timeUnit: true }
            });

            if (!processData) {
              logger.warn(`❌ Processo ${process.processId} não encontrado na base de dados`);
              continue;
            }

            const costPerHour = Number(processData.costPerHour);
            let timeRequired = 0;

            // Calcular tempo baseado na fórmula ou fixo
            if (process.calculationType === 'fixed' && process.fixedQuantity) {
              timeRequired = process.fixedQuantity;
              logger.info(`⏱️ Tempo fixo: ${timeRequired}h`);
            } else if (process.calculationType === 'formula' && process.calculationRuleFormula) {
              const { evaluate } = await import('mathjs');
              timeRequired = evaluate(process.calculationRuleFormula, input.measurements);
              logger.info(`🧮 Tempo calculado via fórmula: ${timeRequired}h`);
            }

            const totalCost = costPerHour * timeRequired * (process.multiplier || 1);
            logger.info(`💰 Custo do processo: R$ ${costPerHour}/h x ${timeRequired}h x ${process.multiplier || 1} = R$ ${totalCost.toFixed(2)}`);

            breakdown.processes.items.push({
              processId: process.processId,
              name: processData.name,
              costPerHour,
              timeRequired,
              totalCost,
            });

            breakdown.processes.subtotal += totalCost;
            logger.info(`✅ Processo ${processData.name} adicionado: R$ ${totalCost.toFixed(2)}`);

          } catch (error) {
            logger.error(`❌ Erro ao calcular custo do processo ${process.processId}:`, error);
          }
        }

        logger.info(`⚙️ Subtotal de processos: R$ ${breakdown.processes.subtotal.toFixed(2)} (${breakdown.processes.items.length} itens)`);
        

        // 4. CALCULAR TOTAL GERAL
        breakdown.grandTotal = 
          breakdown.materials.subtotal + 
          breakdown.equipments.subtotal + 
          breakdown.processes.subtotal;

        logger.info(`✅ Cálculo concluído em ${Date.now() - startTime}ms. Total: R$ ${breakdown.grandTotal.toFixed(2)}`);

        return breakdown as any;

      } catch (error) {
        logger.error('Erro no cálculo de custos:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno no cálculo de custos',
        });
      }
    }),

  // Buscar dados de materiais/equipamentos/processos para o checklist
  getChecklistData: protectedProcedure
    .input(z.object({
      materialIds: z.array(z.string()).optional(),
      equipmentIds: z.array(z.string()).optional(),
      processIds: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx);

      const [materials, equipments, processes] = await Promise.all([
        // Materiais com custos e regras de cálculo
        input.materialIds ? ctx.db.material.findMany({
          where: { id: { in: input.materialIds }, companyId },
          select: {
            id: true,
            name: true,
            cost: true,
            unit: true,
            calculationRules: {
              select: {
                calculationRule: {
                  select: {
                    id: true,
                    name: true,
                    formula: true,
                    resultUnit: true,
                  }
                }
              }
            }
          }
        }) : [],

        // Equipamentos com custos calculados
        input.equipmentIds ? ctx.db.equipment.findMany({
          where: { id: { in: input.equipmentIds }, companyId },
          select: {
            id: true,
            name: true,
            calculatedCostPerM2: true,
            costBreakdowns: {
              where: { isActive: true },
              orderBy: { calculatedAt: 'desc' },
              take: 1,
            }
          }
        }) : [],

        // Processos com custos por hora
        input.processIds ? ctx.db.process.findMany({
          where: { id: { in: input.processIds }, companyId },
          select: {
            id: true,
            name: true,
            costPerHour: true,
            timeUnit: true,
          }
        }) : [],
      ]);

      return {
        materials: materials.map(m => ({
          ...m,
          cost: Number(m.cost),
          calculationRules: m.calculationRules.map(cr => ({
            id: cr.calculationRule.id,
            name: cr.calculationRule.name,
            formula: cr.calculationRule.formula,
            resultUnit: cr.calculationRule.resultUnit,
          }))
        })),
        equipments: equipments.map(e => ({
          ...e,
          calculatedCostPerM2: Number(e.calculatedCostPerM2),
          latestCostBreakdown: e.costBreakdowns[0] ? {
            depreciationPerM2: Number(e.costBreakdowns[0].depreciationPerM2),
            energyPerM2: Number(e.costBreakdowns[0].energyPerM2),
            maintenancePerM2: Number(e.costBreakdowns[0].maintenancePerM2),
            totalFixedPerM2: Number(e.costBreakdowns[0].totalFixedPerM2),
          } : null
        })),
        processes: processes.map(p => ({
          ...p,
          costPerHour: Number(p.costPerHour),
        }))
      };
    }),
});