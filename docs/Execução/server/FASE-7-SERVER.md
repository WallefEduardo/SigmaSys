# FASE 7 SERVER - FINANCEIRO COMPLETO (Backend)

## 🎯 OBJETIVO

Implementar backend robusto para sistema financeiro com contas a pagar/receber, DRE, fluxo de caixa, comissões e ponto de equilíbrio.

## 🏗️ IMPLEMENTAÇÃO CORE

### Financial Manager
```typescript
// src/lib/financial-manager.ts
export class FinancialManager {
  /**
   * Calcular DRE
   */
  static async calculateDRE(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DREResult> {
    const revenue = await this.getRevenue(companyId, startDate, endDate)
    const expenses = await this.getExpenses(companyId, startDate, endDate)
    
    return {
      revenue,
      expenses,
      grossProfit: revenue.total - expenses.cogs,
      netProfit: revenue.total - expenses.total,
      margin: ((revenue.total - expenses.total) / revenue.total) * 100
    }
  }
  
  /**
   * Calcular ponto de equilíbrio
   */
  static async calculateBreakEven(
    companyId: string,
    period: number = 12
  ): Promise<BreakEvenResult> {
    const fixedCosts = await this.getFixedCosts(companyId, period)
    const avgMargin = await this.getAverageMargin(companyId, period)
    
    const breakEvenRevenue = fixedCosts / (avgMargin / 100)
    
    return {
      fixedCosts,
      averageMargin: avgMargin,
      breakEvenRevenue,
      currentRevenue: await this.getCurrentRevenue(companyId),
      safetyMargin: (await this.getCurrentRevenue(companyId) - breakEvenRevenue) / breakEvenRevenue * 100
    }
  }
}
```

### Commission Calculator
```typescript
// src/lib/commission-calculator.ts
export class CommissionCalculator {
  /**
   * Calcular comissões por vendedor
   */
  static async calculateCommissions(
    companyId: string,
    period: { start: Date, end: Date }
  ): Promise<CommissionResult[]> {
    const sales = await db.quote.findMany({
      where: {
        companyId,
        status: 'approved',
        approvedAt: {
          gte: period.start,
          lte: period.end
        }
      },
      include: { creator: true }
    })
    
    const commissionsBySeller = new Map()
    
    for (const sale of sales) {
      const rules = await this.getCommissionRules(sale.createdBy, companyId)
      const commission = this.calculateSaleCommission(sale, rules)
      
      const current = commissionsBySeller.get(sale.createdBy) || 0
      commissionsBySeller.set(sale.createdBy, current + commission)
    }
    
    return Array.from(commissionsBySeller.entries()).map(([sellerId, amount]) => ({
      sellerId,
      amount,
      period
    }))
  }
}
```

## 📊 ROUTERS PRINCIPAIS

### Accounts Router
```typescript
// src/routers/accounts.ts
export const accountsRouter = router({
  // Contas a pagar/receber
  list: protectedProcedure
    .input(z.object({
      type: z.enum(['payable', 'receivable']),
      status: z.string().optional(),
      dueDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Implementar listagem com filtros
    }),
  
  // Baixar conta
  pay: protectedProcedure
    .input(payAccountSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementar baixa de conta
    }),
  
  // Relatório financeiro
  report: protectedProcedure
    .query(async ({ ctx, input }) => {
      // Gerar DRE, fluxo de caixa, etc.
    })
})
```

---

**IMPORTANTE**: Sistema financeiro com DRE automático, controle de fluxo e indicadores em tempo real.