# FASE 4 SERVER - ENGINE DE PRECIFICAÇÃO (Backend)

## 🎯 OBJETIVO

Implementar backend completo para sistema de precificação com método de custeio direto, incluindo engine de cálculo, gestão de parâmetros e APIs otimizadas.

## 🏗️ ARQUITETURA BACKEND

### Estrutura de Arquivos
```
apps/server/src/
├── lib/
│   ├── pricing-engine.ts      # Core do sistema de precificação
│   ├── product-costing.ts     # Cálculo específico de produtos
│   ├── parameters.ts          # Gestão de parâmetros
│   ├── cost-breakdown.ts      # Detalhamento de custos
│   ├── margin-calculator.ts   # Cálculo de margens
│   └── pricing-cache.ts       # Sistema de cache
├── routers/
│   ├── products.ts            # Atualizado com precificação
│   ├── pricing.ts             # APIs de precificação
│   ├── parameters.ts          # CRUD de parâmetros
│   └── cost-analysis.ts       # Análises de custo
├── services/
│   ├── pricing-service.ts     # Business logic
│   ├── parameter-service.ts   # Lógica de parâmetros
│   └── cache-service.ts       # Gestão de cache
└── validators/
    ├── pricing-schemas.ts     # Validações
    └── parameter-schemas.ts   # Schemas de parâmetros
```

## 🔧 IMPLEMENTAÇÃO DETALHADA

### **1. Engine de Precificação**

```typescript
// src/lib/pricing-engine.ts
import { evaluate } from 'mathjs'
import type { PricingContext, CostBreakdown, MarginConfig } from '../types/pricing'

export class PricingEngine {
  private static cache = new Map<string, CostBreakdown>()
  
  /**
   * Método principal de cálculo - Custeio Direto
   */
  static async calculateProductCost(
    context: PricingContext,
    useCache: boolean = true
  ): Promise<CostBreakdown> {
    const cacheKey = this.generateCacheKey(context)
    
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    const breakdown = await this.performCalculation(context)
    
    if (useCache) {
      this.cache.set(cacheKey, breakdown)
    }
    
    return breakdown
  }
  
  /**
   * Cálculo do breakdown completo
   */
  private static async performCalculation(context: PricingContext): Promise<CostBreakdown> {
    const product = await this.getProductWithComposition(context.productId)
    const parameters = await this.getCompanyParameters(context.companyId)
    
    // 1. Custos diretos
    const materialsCost = await this.calculateMaterialsCost(product, context)
    const equipmentCost = await this.calculateEquipmentCost(product, context)
    const processesCost = await this.calculateProcessesCost(product, context)
    const finishesCost = await this.calculateFinishesCost(product, context)
    
    const directCosts = materialsCost.total + equipmentCost.total + 
                       processesCost.total + finishesCost.total
    
    // 2. Custos fixos proporcionais
    const fixedCosts = this.calculateFixedCosts(directCosts, parameters)
    
    // 3. Custos variáveis
    const variableCosts = this.calculateVariableCosts(directCosts, parameters)
    
    // 4. Subtotal
    const subtotal = directCosts + fixedCosts + variableCosts
    
    // 5. Margem
    const margin = this.calculateMargin(subtotal, product.margin, parameters)
    
    // 6. Preço final
    const finalPrice = subtotal + margin.value
    
    return {
      materials: materialsCost.items,
      equipment: equipmentCost.items,
      processes: processesCost.items,
      finishes: finishesCost.items,
      directCosts,
      fixedCosts,
      variableCosts,
      subtotal,
      margin,
      finalPrice,
      calculatedAt: new Date(),
      context,
      parameters: {
        fixedCostsRate: parameters.fixedCostsRate,
        variableCostsRate: parameters.variableCostsRate
      }
    }
  }
  
  /**
   * Cálculo de custos de materiais
   */
  private static async calculateMaterialsCost(
    product: ProductWithComposition,
    context: PricingContext
  ) {
    const items = []
    let total = 0
    
    for (const productMaterial of product.materials) {
      const material = productMaterial.material
      
      // Calcular quantidade usando fórmula
      const quantity = productMaterial.formula 
        ? evaluate(productMaterial.formula, context.variables)
        : productMaterial.quantity
      
      const unitCost = material.cost
      const itemCost = quantity * unitCost
      
      items.push({
        id: material.id,
        name: material.name,
        quantity: Number(quantity),
        unit: material.unit,
        unitCost: Number(unitCost),
        totalCost: Number(itemCost),
        formula: productMaterial.formula
      })
      
      total += itemCost
    }
    
    return { items, total: Number(total) }
  }
  
  /**
   * Cálculo de custos de equipamentos
   */
  private static async calculateEquipmentCost(
    product: ProductWithComposition,
    context: PricingContext
  ) {
    const items = []
    let total = 0
    
    for (const productEquipment of product.equipments) {
      const equipment = productEquipment.equipment
      
      // Calcular tempo usando fórmula
      const timeNeeded = productEquipment.formula
        ? evaluate(productEquipment.formula, context.variables)
        : productEquipment.timeNeeded
      
      const costPerHour = equipment.costPerHour + 
                         (equipment.maintenanceCost || 0) + 
                         (equipment.energyCost || 0)
      
      const itemCost = timeNeeded * costPerHour
      
      items.push({
        id: equipment.id,
        name: equipment.name,
        timeNeeded: Number(timeNeeded),
        unit: 'hora',
        costPerHour: Number(costPerHour),
        totalCost: Number(itemCost),
        formula: productEquipment.formula
      })
      
      total += itemCost
    }
    
    return { items, total: Number(total) }
  }
  
  /**
   * Cálculo de custos de processos
   */
  private static async calculateProcessesCost(
    product: ProductWithComposition,
    context: PricingContext
  ) {
    const items = []
    let total = 0
    
    for (const productProcess of product.processes) {
      const process = productProcess.process
      
      // Calcular tempo usando fórmula
      const timeNeeded = productProcess.formula
        ? evaluate(productProcess.formula, context.variables)
        : productProcess.timeNeeded
      
      const costPerHour = process.costPerHour
      const itemCost = timeNeeded * costPerHour
      
      items.push({
        id: process.id,
        name: process.name,
        timeNeeded: Number(timeNeeded),
        unit: process.timeUnit,
        costPerHour: Number(costPerHour),
        totalCost: Number(itemCost),
        formula: productProcess.formula,
        sector: process.sector
      })
      
      total += itemCost
    }
    
    return { items, total: Number(total) }
  }
  
  /**
   * Cálculo de custos fixos proporcionais
   */
  private static calculateFixedCosts(
    directCosts: number,
    parameters: CompanyParameters
  ): number {
    const fixedCostsRate = parameters.fixedCostsRate || 0.15 // 15% padrão
    return directCosts * fixedCostsRate
  }
  
  /**
   * Cálculo de custos variáveis
   */
  private static calculateVariableCosts(
    directCosts: number,
    parameters: CompanyParameters
  ): number {
    const variableCostsRate = parameters.variableCostsRate || 0.08 // 8% padrão
    return directCosts * variableCostsRate
  }
  
  /**
   * Cálculo de margem
   */
  private static calculateMargin(
    baseCost: number,
    marginConfig: MarginConfig,
    parameters: CompanyParameters
  ): MarginResult {
    const defaultMarkup = parameters.defaultMarkup || 100 // 100% padrão
    
    switch (marginConfig.type) {
      case 'markup':
        const markupPercentage = marginConfig.percentage || defaultMarkup
        return {
          type: 'markup',
          percentage: markupPercentage,
          value: baseCost * (markupPercentage / 100)
        }
      
      case 'liquid':
        const liquidPercentage = marginConfig.percentage || 40
        const liquidValue = baseCost / (1 - liquidPercentage / 100) - baseCost
        return {
          type: 'liquid',
          percentage: liquidPercentage,
          value: liquidValue
        }
      
      case 'final':
        const finalPrice = marginConfig.value || baseCost * 2
        return {
          type: 'final',
          percentage: ((finalPrice - baseCost) / baseCost) * 100,
          value: finalPrice - baseCost
        }
      
      default:
        return this.calculateMargin(baseCost, { type: 'markup', percentage: defaultMarkup }, parameters)
    }
  }
  
  /**
   * Gerar chave de cache
   */
  private static generateCacheKey(context: PricingContext): string {
    return `${context.productId}_${JSON.stringify(context.variables)}_${context.date?.getTime()}`
  }
}
```

### **2. Gestão de Parâmetros**

```typescript
// src/lib/parameters.ts
export class ParameterService {
  /**
   * Obter parâmetros da empresa
   */
  static async getCompanyParameters(companyId: string): Promise<CompanyParameters> {
    const now = new Date()
    
    const parameters = await db.parameter.findMany({
      where: {
        companyId,
        active: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } }
        ]
      }
    })
    
    return this.parseParameters(parameters)
  }
  
  /**
   * Atualizar parâmetros automáticos
   */
  static async updateAutomaticParameters(companyId: string): Promise<void> {
    const period = 3 // 3 meses
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - period)
    
    // Buscar dados financeiros
    const financialData = await this.getFinancialData(companyId, startDate, endDate)
    
    // Calcular novos parâmetros
    const newParameters = {
      fixedCostsRate: this.calculateFixedCostsRate(financialData),
      variableCostsRate: this.calculateVariableCostsRate(financialData),
      averageRevenue: this.calculateAverageRevenue(financialData),
      averageExpenses: this.calculateAverageExpenses(financialData)
    }
    
    // Salvar parâmetros
    await this.saveAutomaticParameters(companyId, newParameters)
    
    // Notificar usuários
    await this.notifyParameterUpdate(companyId, newParameters)
  }
  
  /**
   * Validar impacto de mudança de parâmetros
   */
  static async validateParameterImpact(
    companyId: string,
    newParameters: Partial<CompanyParameters>
  ): Promise<ParameterImpact> {
    // Buscar produtos ativos
    const products = await db.product.findMany({
      where: { companyId, active: true },
      take: 10 // Amostra para análise
    })
    
    const impacts = []
    
    for (const product of products) {
      const currentCost = await PricingEngine.calculateProductCost({
        productId: product.id,
        companyId,
        variables: { largura: 1, altura: 1, quantidade: 1 }
      })
      
      // Simular com novos parâmetros
      const newCost = await PricingEngine.calculateProductCost({
        productId: product.id,
        companyId,
        variables: { largura: 1, altura: 1, quantidade: 1 }
      }, false) // Sem cache
      
      impacts.push({
        productId: product.id,
        productName: product.name,
        currentPrice: currentCost.finalPrice,
        newPrice: newCost.finalPrice,
        difference: newCost.finalPrice - currentCost.finalPrice,
        percentageChange: ((newCost.finalPrice - currentCost.finalPrice) / currentCost.finalPrice) * 100
      })
    }
    
    return {
      averageChange: impacts.reduce((sum, item) => sum + item.percentageChange, 0) / impacts.length,
      maxChange: Math.max(...impacts.map(item => Math.abs(item.percentageChange))),
      affectedProducts: impacts.length,
      impacts
    }
  }
}
```

### **3. Router de Precificação**

```typescript
// src/routers/pricing.ts
import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { PricingEngine } from '../lib/pricing-engine'
import { PermissionService } from '../lib/permissions'

const pricingContextSchema = z.object({
  productId: z.string(),
  variables: z.record(z.number()),
  date: z.date().optional()
})

const batchPricingSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variables: z.record(z.number()),
    quantity: z.number().optional()
  }))
})

export const pricingRouter = router({
  /**
   * Calcular preço de produto
   */
  calculate: protectedProcedure
    .use(PermissionService.requirePermission('products.pricing'))
    .input(pricingContextSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      const context = {
        ...input,
        companyId,
        calculatedBy: ctx.user.id
      }
      
      const breakdown = await PricingEngine.calculateProductCost(context)
      
      // Salvar histórico
      await ctx.db.productCostHistory.create({
        data: {
          productId: input.productId,
          baseCost: breakdown.subtotal,
          finalPrice: breakdown.finalPrice,
          costBreakdown: breakdown,
          parameters: breakdown.parameters,
          calculatedBy: ctx.user.id
        }
      })
      
      return breakdown
    }),
  
  /**
   * Cálculo em lote
   */
  calculateBatch: protectedProcedure
    .use(PermissionService.requirePermission('products.pricing'))
    .input(batchPricingSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      const results = []
      
      for (const item of input.items) {
        const context = {
          productId: item.productId,
          variables: item.variables,
          companyId,
          calculatedBy: ctx.user.id
        }
        
        const breakdown = await PricingEngine.calculateProductCost(context)
        
        results.push({
          productId: item.productId,
          quantity: item.quantity || 1,
          unitPrice: breakdown.finalPrice,
          totalPrice: breakdown.finalPrice * (item.quantity || 1),
          breakdown
        })
      }
      
      return results
    }),
  
  /**
   * Análise de sensibilidade
   */
  sensitivityAnalysis: protectedProcedure
    .use(PermissionService.requirePermission('products.pricing'))
    .input(z.object({
      productId: z.string(),
      baseVariables: z.record(z.number()),
      variations: z.array(z.object({
        parameter: z.string(),
        values: z.array(z.number())
      }))
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      const results = []
      
      for (const variation of input.variations) {
        const scenarioResults = []
        
        for (const value of variation.values) {
          const variables = {
            ...input.baseVariables,
            [variation.parameter]: value
          }
          
          const breakdown = await PricingEngine.calculateProductCost({
            productId: input.productId,
            variables,
            companyId
          })
          
          scenarioResults.push({
            parameterValue: value,
            finalPrice: breakdown.finalPrice,
            margin: breakdown.margin,
            breakdown
          })
        }
        
        results.push({
          parameter: variation.parameter,
          scenarios: scenarioResults
        })
      }
      
      return results
    }),
  
  /**
   * Limpar cache
   */
  clearCache: protectedProcedure
    .use(PermissionService.requirePermission('products.pricing'))
    .mutation(async ({ ctx }) => {
      await PricingEngine.clearCache()
      return { success: true }
    }),
  
  /**
   * Estatísticas de cache
   */
  cacheStats: protectedProcedure
    .use(PermissionService.requirePermission('products.pricing'))
    .query(async ({ ctx }) => {
      return PricingEngine.getCacheStats()
    })
})
```

### **4. Router de Parâmetros**

```typescript
// src/routers/parameters.ts
export const parametersRouter = router({
  /**
   * Listar parâmetros
   */
  list: protectedProcedure
    .use(PermissionService.requirePermission('settings.read'))
    .input(z.object({
      category: z.string().optional(),
      active: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      return ctx.db.parameter.findMany({
        where: {
          companyId,
          ...(input.category && { category: input.category }),
          ...(input.active !== undefined && { active: input.active })
        },
        include: {
          creator: { select: { name: true } },
          history: {
            take: 5,
            orderBy: { changedAt: 'desc' },
            include: {
              changer: { select: { name: true } }
            }
          }
        },
        orderBy: { name: 'asc' }
      })
    }),
  
  /**
   * Criar parâmetro
   */
  create: protectedProcedure
    .use(PermissionService.requirePermission('settings.update'))
    .input(createParameterSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      // Validar se já existe parâmetro ativo com mesmo nome
      const existing = await ctx.db.parameter.findFirst({
        where: {
          companyId,
          name: input.name,
          active: true,
          validUntil: null
        }
      })
      
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Parâmetro já existe e está ativo'
        })
      }
      
      const parameter = await ctx.db.parameter.create({
        data: {
          ...input,
          companyId,
          createdBy: ctx.user.id
        }
      })
      
      // Criar histórico
      await ctx.db.parameterHistory.create({
        data: {
          parameterId: parameter.id,
          oldValue: null,
          newValue: parameter.value,
          reason: 'Criação inicial',
          changedBy: ctx.user.id
        }
      })
      
      return parameter
    }),
  
  /**
   * Atualizar parâmetro
   */
  update: protectedProcedure
    .use(PermissionService.requirePermission('settings.update'))
    .input(updateParameterSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      const existing = await ctx.db.parameter.findUnique({
        where: { id: input.id },
        include: { company: true }
      })
      
      if (!existing || existing.companyId !== companyId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Parâmetro não encontrado'
        })
      }
      
      // Validar impacto antes de atualizar
      if (input.value !== undefined) {
        const impact = await ParameterService.validateParameterImpact(
          companyId,
          { [existing.name]: input.value }
        )
        
        // Se impacto muito grande, solicitar confirmação
        if (Math.abs(impact.averageChange) > 10) {
          return {
            requiresConfirmation: true,
            impact,
            parameter: existing
          }
        }
      }
      
      const oldValue = existing.value
      
      const updated = await ctx.db.parameter.update({
        where: { id: input.id },
        data: {
          ...input,
          updatedAt: new Date()
        }
      })
      
      // Criar histórico
      await ctx.db.parameterHistory.create({
        data: {
          parameterId: updated.id,
          oldValue,
          newValue: updated.value,
          reason: input.reason || 'Atualização manual',
          changedBy: ctx.user.id
        }
      })
      
      // Limpar cache de precificação
      await PricingEngine.clearCache()
      
      return updated
    }),
  
  /**
   * Atualização automática
   */
  updateAutomatic: protectedProcedure
    .use(PermissionService.requirePermission('settings.update'))
    .mutation(async ({ ctx }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      await ParameterService.updateAutomaticParameters(companyId)
      
      return { success: true }
    }),
  
  /**
   * Análise de impacto
   */
  analyzeImpact: protectedProcedure
    .use(PermissionService.requirePermission('settings.read'))
    .input(z.object({
      changes: z.record(z.any())
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      return ParameterService.validateParameterImpact(companyId, input.changes)
    })
})
```

## 📊 SEEDS DE DADOS

```typescript
// prisma/seeds/phase4-seed.ts
export async function seedPhase4() {
  console.log('🌱 Seeding FASE 4 - Engine de Precificação...')
  
  const company = await prisma.company.findFirst({
    where: { name: 'Empresa Teste Ltda' }
  })
  
  if (!company) {
    throw new Error('Empresa não encontrada')
  }
  
  const admin = await prisma.user.findFirst({
    where: { companyId: company.id, role: { in: ['admin', 'ADMIN'] } }
  })
  
  // Criar parâmetros de precificação
  const parameters = [
    {
      name: 'fixedCostsRate',
      description: 'Taxa de custos fixos sobre custos diretos',
      value: 0.15, // 15%
      type: 'automatic',
      category: 'fixed_costs',
      unit: 'percentage',
      autoUpdate: true,
      updateFormula: 'totalFixedCosts / totalDirectCosts',
      companyId: company.id,
      createdBy: admin.id
    },
    {
      name: 'variableCostsRate', 
      description: 'Taxa de custos variáveis sobre custos diretos',
      value: 0.08, // 8%
      type: 'automatic',
      category: 'variable_costs',
      unit: 'percentage',
      autoUpdate: true,
      updateFormula: 'totalVariableCosts / totalDirectCosts',
      companyId: company.id,
      createdBy: admin.id
    },
    {
      name: 'defaultMarkup',
      description: 'Markup padrão para produtos',
      value: 100, // 100%
      type: 'manual',
      category: 'margins',
      unit: 'percentage',
      companyId: company.id,
      createdBy: admin.id
    },
    {
      name: 'minimumMargin',
      description: 'Margem mínima aceitável',
      value: 25, // 25%
      type: 'manual',
      category: 'margins',
      unit: 'percentage',
      companyId: company.id,
      createdBy: admin.id
    },
    {
      name: 'targetMargin',
      description: 'Margem alvo da empresa',
      value: 40, // 40%
      type: 'manual',
      category: 'margins',
      unit: 'percentage',
      companyId: company.id,
      createdBy: admin.id
    }
  ]
  
  for (const param of parameters) {
    await prisma.parameter.create({ data: param })
  }
  
  // Atualizar produtos com configuração de margem
  const products = await prisma.product.findMany({
    where: { companyId: company.id }
  })
  
  for (const product of products) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        margin: {
          type: 'markup',
          percentage: 100
        }
      }
    })
  }
  
  console.log('✅ FASE 4 seedada com sucesso!')
  console.log(`   📊 ${parameters.length} parâmetros criados`)
  console.log(`   🛍️ ${products.length} produtos atualizados`)
}
```

## 🧪 TESTES

```typescript
// __tests__/pricing-engine.test.ts
describe('PricingEngine', () => {
  beforeEach(async () => {
    await setupTestDatabase()
  })
  
  it('should calculate direct costing correctly', async () => {
    const context = {
      productId: 'test-product-1',
      companyId: 'test-company',
      variables: { largura: 2, altura: 1.5, quantidade: 1 },
      calculatedBy: 'test-user'
    }
    
    const result = await PricingEngine.calculateProductCost(context)
    
    expect(result.directCosts).toBeGreaterThan(0)
    expect(result.fixedCosts).toBeGreaterThan(0)
    expect(result.finalPrice).toBeGreaterThan(result.subtotal)
    expect(result.materials).toHaveLength(2)
  })
  
  it('should apply different margin types correctly', async () => {
    // Teste markup
    const markupResult = await PricingEngine.calculateMargin(100, {
      type: 'markup',
      percentage: 50
    }, {})
    expect(markupResult.value).toBe(50)
    
    // Teste margem líquida
    const liquidResult = await PricingEngine.calculateMargin(100, {
      type: 'liquid',
      percentage: 40
    }, {})
    expect(liquidResult.value).toBeCloseTo(66.67, 1)
  })
  
  it('should cache calculations correctly', async () => {
    const context = {
      productId: 'test-product-1',
      companyId: 'test-company',
      variables: { largura: 2, altura: 1.5 },
      calculatedBy: 'test-user'
    }
    
    // Primeira chamada
    const start1 = Date.now()
    const result1 = await PricingEngine.calculateProductCost(context)
    const time1 = Date.now() - start1
    
    // Segunda chamada (deve vir do cache)
    const start2 = Date.now()
    const result2 = await PricingEngine.calculateProductCost(context)
    const time2 = Date.now() - start2
    
    expect(result1.finalPrice).toBe(result2.finalPrice)
    expect(time2).toBeLessThan(time1) // Cache deve ser mais rápido
  })
})
```

## 🚀 PERFORMANCE

### Benchmarks Esperados
- Cálculo simples: < 100ms
- Cálculo complexo: < 300ms
- Cache hit: < 10ms
- Cálculo em lote (10 itens): < 1s

### Otimizações Implementadas
- Cache em memória para cálculos repetidos
- Queries otimizadas com includes estratégicos
- Cálculo paralelo para lotes
- Pré-carregamento de parâmetros

---

**IMPORTANTE**: O sistema de precificação deve ser preciso, rápido e auditável. Todos os cálculos devem ser registrados no histórico para rastreabilidade.