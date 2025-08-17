# FASE 5 SERVER - ESTOQUE INTELIGENTE (Backend)

## 🎯 OBJETIVO

Implementar backend completo para sistema de estoque com foco no estoque fracionado, otimização de cortes e controle avançado de movimentações.

## 🏗️ ARQUITETURA BACKEND

### Estrutura de Arquivos
```
apps/server/src/
├── lib/
│   ├── inventory-manager.ts      # Core do sistema de estoque
│   ├── fractional-inventory.ts   # Lógica de estoque fracionado
│   ├── cutting-optimizer.ts      # Algoritmos de otimização
│   ├── stock-movements.ts        # Controle de movimentações
│   └── inventory-alerts.ts       # Sistema de alertas
├── routers/
│   ├── inventory.ts              # CRUD de estoque
│   ├── movements.ts              # Movimentações
│   ├── fractional.ts             # Gestão fracionada
│   └── cutting.ts                # Otimizador de cortes
├── services/
│   ├── inventory-service.ts      # Business logic
│   ├── movement-service.ts       # Lógica de movimentações
│   └── optimization-service.ts   # Algoritmos de otimização
└── validators/
    ├── inventory-schemas.ts       # Validações
    └── movement-schemas.ts        # Schemas de movimentações
```

## 🔧 IMPLEMENTAÇÃO DETALHADA

### **1. Inventory Manager Core**

```typescript
// src/lib/inventory-manager.ts
import type { InventoryItem, Material, InventoryMovement } from '../types/inventory'

export class InventoryManager {
  /**
   * Verificar disponibilidade de material
   */
  static async checkAvailability(
    materialId: string,
    requiredQuantity: number,
    companyId: string,
    dimensions?: Dimensions
  ): Promise<AvailabilityResult> {
    const items = await this.getAvailableItems(materialId, companyId)
    
    if (!dimensions) {
      // Verificação simples por quantidade
      const totalAvailable = items.reduce((sum, item) => sum + item.availableQty, 0)
      return {
        available: totalAvailable >= requiredQuantity,
        totalAvailable,
        items: items.slice(0, Math.ceil(requiredQuantity))
      }
    }
    
    // Verificação para estoque fracionado
    return this.checkFractionalAvailability(items, dimensions, requiredQuantity)
  }
  
  /**
   * Reservar material para produção
   */
  static async reserveMaterial(
    reservationData: ReservationRequest
  ): Promise<InventoryReservation> {
    const availability = await this.checkAvailability(
      reservationData.materialId,
      reservationData.quantity,
      reservationData.companyId,
      reservationData.dimensions
    )
    
    if (!availability.available) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Material insuficiente. Disponível: ${availability.totalAvailable}`
      })
    }
    
    return await this.createReservation(reservationData, availability.items)
  }
  
  /**
   * Consumir material reservado
   */
  static async consumeReservation(
    reservationId: string,
    actualQuantity?: number
  ): Promise<InventoryMovement> {
    const reservation = await this.getReservation(reservationId)
    
    if (reservation.status !== 'active') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Reserva não está ativa'
      })
    }
    
    const consumedQty = actualQuantity || reservation.quantity
    
    // Criar movimento de saída
    const movement = await this.createMovement({
      type: 'out',
      inventoryId: reservation.inventoryId,
      quantity: consumedQty,
      reason: `Consumo da reserva ${reservation.id}`,
      reference: reservation.referenceId,
      reservationId: reservation.id
    })
    
    // Atualizar status da reserva
    await this.updateReservationStatus(reservationId, 'consumed')
    
    return movement
  }
  
  /**
   * Ajustar estoque (inventário físico)
   */
  static async adjustStock(
    inventoryId: string,
    newQuantity: number,
    reason: string,
    userId: string
  ): Promise<InventoryMovement> {
    const item = await db.inventoryItem.findUnique({
      where: { id: inventoryId }
    })
    
    if (!item) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Item de estoque não encontrado'
      })
    }
    
    const difference = newQuantity - Number(item.quantity)
    
    if (difference === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Quantidade não alterada'
      })
    }
    
    // Criar movimento de ajuste
    const movement = await this.createMovement({
      type: difference > 0 ? 'in' : 'out',
      inventoryId,
      quantity: Math.abs(difference),
      reason: `Ajuste de inventário: ${reason}`,
      adjustmentType: 'inventory',
      performedBy: userId
    })
    
    // Atualizar quantidade no item
    await db.inventoryItem.update({
      where: { id: inventoryId },
      data: {
        quantity: newQuantity,
        availableQty: newQuantity - this.getReservedQuantity(inventoryId)
      }
    })
    
    return movement
  }
}
```

### **2. Sistema Fracionado**

```typescript
// src/lib/fractional-inventory.ts
export class FractionalInventory {
  /**
   * Executar corte em material fracionado
   */
  static async executeCut(
    cutRequest: FractionalCutRequest
  ): Promise<FractionalCutResult> {
    const item = await this.getFractionalItem(cutRequest.inventoryId)
    
    // Validar se o corte é possível
    const validation = this.validateCut(item, cutRequest.cuts)
    if (!validation.valid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: validation.error
      })
    }
    
    // Executar cortes
    const cutResults = []
    for (const cut of cutRequest.cuts) {
      const cutResult = await this.performCut(item, cut, cutRequest.cutBy)
      cutResults.push(cutResult)
    }
    
    // Atualizar áreas disponíveis
    await this.updateAvailableAreas(item.id, cutResults)
    
    // Calcular nova quantidade disponível
    const newAvailableArea = this.calculateAvailableArea(item.id)
    await this.updateAvailableQuantity(item.id, newAvailableArea)
    
    return {
      cuts: cutResults,
      newAvailableArea,
      wasteGenerated: this.calculateWaste(cutResults),
      efficiency: this.calculateEfficiency(item, cutResults)
    }
  }
  
  /**
   * Otimizar aproveitamento de cortes
   */
  static async optimizeCutting(
    materialId: string,
    requiredCuts: RequiredCut[],
    companyId: string
  ): Promise<CuttingPlan> {
    const availableSheets = await this.getAvailableSheets(materialId, companyId)
    
    let bestPlan = null
    let bestEfficiency = 0
    
    for (const sheet of availableSheets) {
      const plan = CuttingOptimizer.optimize(sheet.dimensions, requiredCuts)
      
      if (plan.efficiency > bestEfficiency) {
        bestEfficiency = plan.efficiency
        bestPlan = {
          ...plan,
          sheetId: sheet.id,
          materialId,
          companyId
        }
      }
    }
    
    if (!bestPlan) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Não foi possível otimizar os cortes com o material disponível'
      })
    }
    
    return bestPlan
  }
  
  /**
   * Calcular áreas disponíveis após cortes
   */
  private static calculateAvailableAreas(
    originalDimensions: Dimensions,
    existingCuts: FractionalCut[]
  ): AvailableArea[] {
    // Implementar algoritmo de detecção de áreas livres
    // Considerando cortes existentes
    const areas = []
    
    // Dividir a chapa em grid
    const grid = this.createGrid(originalDimensions, existingCuts)
    
    // Encontrar retângulos livres máximos
    const freeRectangles = this.findMaximalRectangles(grid)
    
    return freeRectangles.map(rect => ({
      position: { x: rect.x, y: rect.y },
      dimensions: { width: rect.width, height: rect.height },
      area: rect.width * rect.height,
      usable: rect.width >= 0.1 && rect.height >= 0.1 // Mínimo utilizável
    }))
  }
}
```

### **3. Otimizador de Cortes**

```typescript
// src/lib/cutting-optimizer.ts
export class CuttingOptimizer {
  /**
   * Algoritmo principal de otimização (2D Bin Packing)
   */
  static optimize(
    sheetDimensions: Dimensions,
    requiredCuts: RequiredCut[]
  ): OptimizationResult {
    // Ordenar cortes por área (maiores primeiro)
    const sortedCuts = requiredCuts.sort((a, b) => 
      (b.width * b.height) - (a.width * a.height)
    )
    
    const placedCuts = []
    const failedCuts = []
    
    // Tentar diferentes orientações para cada corte
    for (const cut of sortedCuts) {
      const orientations = [
        { width: cut.width, height: cut.height },
        { width: cut.height, height: cut.width } // Rotacionado
      ]
      
      let placed = false
      
      for (const orientation of orientations) {
        const position = this.findBestPosition(
          sheetDimensions,
          placedCuts,
          orientation
        )
        
        if (position) {
          placedCuts.push({
            ...cut,
            ...orientation,
            position,
            rotated: orientation.width !== cut.width
          })
          placed = true
          break
        }
      }
      
      if (!placed) {
        failedCuts.push(cut)
      }
    }
    
    const usedArea = placedCuts.reduce((sum, cut) => 
      sum + (cut.width * cut.height), 0
    )
    const totalArea = sheetDimensions.width * sheetDimensions.height
    const efficiency = (usedArea / totalArea) * 100
    
    return {
      placedCuts,
      failedCuts,
      efficiency,
      wasteArea: totalArea - usedArea,
      canFitAll: failedCuts.length === 0
    }
  }
  
  /**
   * Encontrar melhor posição para um corte
   */
  private static findBestPosition(
    sheetDimensions: Dimensions,
    existingCuts: PlacedCut[],
    cutDimensions: Dimensions
  ): Position | null {
    // Implementar algoritmo Bottom-Left-Fill
    const candidates = this.generateCandidatePositions(
      sheetDimensions,
      existingCuts,
      cutDimensions
    )
    
    for (const position of candidates) {
      if (this.isValidPosition(position, cutDimensions, sheetDimensions, existingCuts)) {
        return position
      }
    }
    
    return null
  }
  
  /**
   * Verificar se posição é válida (sem sobreposição)
   */
  private static isValidPosition(
    position: Position,
    dimensions: Dimensions,
    sheetDimensions: Dimensions,
    existingCuts: PlacedCut[]
  ): boolean {
    // Verificar se cabe na chapa
    if (position.x + dimensions.width > sheetDimensions.width ||
        position.y + dimensions.height > sheetDimensions.height) {
      return false
    }
    
    // Verificar sobreposição com cortes existentes
    for (const cut of existingCuts) {
      if (this.rectanglesOverlap(
        { ...position, ...dimensions },
        { ...cut.position, width: cut.width, height: cut.height }
      )) {
        return false
      }
    }
    
    return true
  }
}
```

### **4. Router de Estoque**

```typescript
// src/routers/inventory.ts
export const inventoryRouter = router({
  /**
   * Listar itens de estoque
   */
  list: protectedProcedure
    .use(PermissionService.requirePermission('inventory.read'))
    .input(z.object({
      search: z.string().optional(),
      materialId: z.string().optional(),
      location: z.string().optional(),
      lowStock: z.boolean().optional(),
      fractional: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      return ctx.db.inventoryItem.findMany({
        where: {
          companyId,
          ...(input.materialId && { materialId: input.materialId }),
          ...(input.location && { location: { contains: input.location } }),
          ...(input.lowStock && {
            quantity: { lt: ctx.db.inventoryItem.fields.minStock }
          }),
          ...(input.fractional && {
            fractionalData: { not: null }
          }),
          ...(input.search && {
            OR: [
              { material: { name: { contains: input.search, mode: 'insensitive' } } },
              { location: { contains: input.search, mode: 'insensitive' } },
              { batch: { contains: input.search, mode: 'insensitive' } }
            ]
          })
        },
        include: {
          material: true,
          movements: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          reservations: {
            where: { status: 'active' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }),
  
  /**
   * Executar movimento de estoque
   */
  createMovement: protectedProcedure
    .use(PermissionService.requirePermission('inventory.update'))
    .input(createMovementSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      // Validar item de estoque
      const item = await ctx.db.inventoryItem.findUnique({
        where: { id: input.inventoryId },
        include: { material: true }
      })
      
      if (!item || item.companyId !== companyId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Item de estoque não encontrado'
        })
      }
      
      // Validar movimento de saída
      if (input.type === 'out' && Number(item.availableQty) < input.quantity) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Quantidade insuficiente. Disponível: ${item.availableQty}`
        })
      }
      
      return await InventoryManager.createMovement({
        ...input,
        performedBy: ctx.user.id
      })
    }),
  
  /**
   * Verificar disponibilidade
   */
  checkAvailability: protectedProcedure
    .use(PermissionService.requirePermission('inventory.read'))
    .input(z.object({
      materialId: z.string(),
      quantity: z.number().positive(),
      dimensions: z.object({
        width: z.number().positive(),
        height: z.number().positive()
      }).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      return InventoryManager.checkAvailability(
        input.materialId,
        input.quantity,
        companyId,
        input.dimensions
      )
    }),
  
  /**
   * Relatório de estoque
   */
  report: protectedProcedure
    .use(PermissionService.requirePermission('inventory.read'))
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      materialIds: z.array(z.string()).optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      // Implementar relatório detalhado
      const items = await ctx.db.inventoryItem.findMany({
        where: {
          companyId,
          ...(input.materialIds && {
            materialId: { in: input.materialIds }
          })
        },
        include: {
          material: true,
          movements: {
            where: {
              ...(input.startDate && { createdAt: { gte: input.startDate } }),
              ...(input.endDate && { createdAt: { lte: input.endDate } })
            }
          }
        }
      })
      
      return this.processInventoryReport(items, input)
    })
})
```

## 📊 SEEDS DE DADOS

```typescript
// prisma/seeds/phase5-seed.ts
export async function seedPhase5() {
  console.log('🌱 Seeding FASE 5 - Estoque Inteligente...')
  
  const company = await prisma.company.findFirst({
    where: { name: 'Empresa Teste Ltda' }
  })
  
  const materials = await prisma.material.findMany({
    where: { companyId: company.id }
  })
  
  // Criar itens de estoque com diferentes tipos
  const stockItems = [
    // Estoque normal
    {
      materialId: materials[0].id, // Vinil
      quantity: 150.0,
      availableQty: 150.0,
      minStock: 50.0,
      location: 'Estoque A - Prateleira 1',
      batch: 'LOTE-VIN-001',
      cost: 1875.00, // 150 * 12.50
      companyId: company.id
    },
    // Estoque fracionado - Chapa de acrílico
    {
      materialId: materials[1].id, // Acrílico
      quantity: 6.0, // 6m² de uma chapa 2x3
      availableQty: 6.0,
      minStock: 2.0,
      location: 'Estoque B - Área 2',
      batch: 'LOTE-ACR-001',
      cost: 274.80, // 6 * 45.80
      dimensions: {
        width: 2.0,
        height: 3.0,
        thickness: 3.0,
        originalWidth: 2.0,
        originalHeight: 3.0
      },
      fractionalData: {
        type: 'sheet',
        cuts: [],
        availableAreas: [
          {
            position: { x: 0, y: 0 },
            dimensions: { width: 2.0, height: 3.0 },
            area: 6.0,
            usable: true
          }
        ],
        totalOriginalArea: 6.0,
        usedArea: 0.0,
        wasteArea: 0.0
      },
      companyId: company.id
    }
  ]
  
  for (const item of stockItems) {
    await prisma.inventoryItem.create({ data: item })
  }
  
  console.log('✅ FASE 5 seedada com sucesso!')
  console.log(`   📦 ${stockItems.length} itens de estoque criados`)
}
```

## 🧪 TESTES

```typescript
// __tests__/inventory-manager.test.ts
describe('InventoryManager', () => {
  it('should check availability correctly', async () => {
    const result = await InventoryManager.checkAvailability(
      'material-1',
      10,
      'company-1'
    )
    
    expect(result.available).toBe(true)
    expect(result.totalAvailable).toBeGreaterThanOrEqual(10)
  })
  
  it('should create reservation correctly', async () => {
    const reservation = await InventoryManager.reserveMaterial({
      materialId: 'material-1',
      quantity: 5,
      companyId: 'company-1',
      reservedFor: 'order',
      referenceId: 'order-1'
    })
    
    expect(reservation.status).toBe('active')
    expect(reservation.quantity).toBe(5)
  })
  
  it('should optimize cutting correctly', async () => {
    const plan = await CuttingOptimizer.optimize(
      { width: 2, height: 3 },
      [
        { width: 0.5, height: 0.8, quantity: 2 },
        { width: 1, height: 0.5, quantity: 1 }
      ]
    )
    
    expect(plan.efficiency).toBeGreaterThan(70)
    expect(plan.canFitAll).toBe(true)
  })
})
```

---

**IMPORTANTE**: O sistema de estoque fracionado é específico da comunicação visual e requer algoritmos otimizados para maximizar aproveitamento e minimizar desperdício.