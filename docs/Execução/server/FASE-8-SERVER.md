# FASE 8 SERVER - PCP E PRODUÇÃO (Backend)

## 🎯 OBJETIVO

Implementar backend para PCP com Kanban, sequenciamento automático, apontamento de produção e cálculo de OEE.

## 🏗️ IMPLEMENTAÇÃO CORE

### Production Manager
```typescript
// src/lib/production-manager.ts
export class ProductionManager {
  /**
   * Sequenciar ordens de produção
   */
  static async sequenceOrders(
    companyId: string,
    algorithm: 'FIFO' | 'EDD' | 'SPT' = 'EDD'
  ): Promise<ProductionSequence> {
    const orders = await this.getPendingOrders(companyId)
    
    switch (algorithm) {
      case 'FIFO':
        return orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      case 'EDD':
        return orders.sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime())
      case 'SPT':
        return orders.sort((a, b) => a.estimatedTime - b.estimatedTime)
    }
  }
  
  /**
   * Calcular capacidade disponível
   */
  static async calculateCapacity(
    companyId: string,
    date: Date
  ): Promise<CapacityResult> {
    const equipment = await db.equipment.findMany({
      where: { companyId, active: true }
    })
    
    const totalCapacity = equipment.reduce((sum, eq) => {
      return sum + (eq.hoursPerDay || 8) * 60 // em minutos
    }, 0)
    
    const usedCapacity = await this.getUsedCapacity(companyId, date)
    
    return {
      totalCapacity,
      usedCapacity,
      availableCapacity: totalCapacity - usedCapacity,
      utilizationRate: (usedCapacity / totalCapacity) * 100
    }
  }
}
```

### OEE Calculator
```typescript
// src/lib/oee-calculator.ts
export class OEECalculator {
  /**
   * Calcular OEE de equipamento
   */
  static async calculateOEE(
    equipmentId: string,
    period: { start: Date, end: Date }
  ): Promise<OEEResult> {
    const timeData = await this.getTimeData(equipmentId, period)
    const qualityData = await this.getQualityData(equipmentId, period)
    
    const availability = timeData.operatingTime / timeData.plannedTime
    const performance = timeData.actualOutput / timeData.targetOutput
    const quality = qualityData.goodUnits / qualityData.totalUnits
    
    return {
      availability: availability * 100,
      performance: performance * 100,
      quality: quality * 100,
      oee: (availability * performance * quality) * 100,
      period
    }
  }
}
```

## 📊 ROUTERS

### Production Router
```typescript
// src/routers/production.ts
export const productionRouter = router({
  // Kanban board
  getBoard: protectedProcedure
    .query(async ({ ctx }) => {
      // Retornar dados do kanban
    }),
  
  // Mover card no kanban
  moveCard: protectedProcedure
    .input(moveCardSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementar movimento
    }),
  
  // Apontamento de produção
  clockIn: protectedProcedure
    .input(clockInSchema)
    .mutation(async ({ ctx, input }) => {
      // Registrar início de produção
    }),
  
  // Relatório de OEE
  oeeReport: protectedProcedure
    .query(async ({ ctx, input }) => {
      // Calcular OEE
    })
})
```

---

**IMPORTANTE**: Sistema PCP integrado com sequenciamento inteligente e controle de eficiência em tempo real.