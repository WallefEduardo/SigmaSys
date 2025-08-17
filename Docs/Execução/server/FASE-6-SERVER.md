# FASE 6 SERVER - COMERCIAL E CRM (Backend)

## 🎯 OBJETIVO

Implementar backend completo para sistema comercial com orçamentos inteligentes, funil de vendas Kanban e ordens de serviço integradas.

## 🏗️ ARQUITETURA BACKEND

### Estrutura Principal
```
apps/server/src/
├── lib/
│   ├── quote-engine.ts           # Engine de orçamentos
│   ├── sales-pipeline.ts         # Lógica do funil
│   ├── order-converter.ts        # Conversão orçamento → OS
│   └── approval-workflow.ts      # Sistema de aprovações
├── routers/
│   ├── quotes.ts                 # CRUD de orçamentos
│   ├── sales-pipeline.ts         # Funil de vendas
│   ├── orders.ts                 # Ordens de serviço
│   └── approvals.ts              # Workflow de aprovações
└── services/
    ├── quote-service.ts          # Business logic de orçamentos
    ├── pipeline-service.ts       # Lógica do pipeline
    └── notification-service.ts   # Notificações automáticas
```

## 🔧 IMPLEMENTAÇÃO CORE

### **Quote Engine**
```typescript
// src/lib/quote-engine.ts
export class QuoteEngine {
  /**
   * Criar orçamento com produtos e precificação
   */
  static async createQuote(
    quoteData: CreateQuoteRequest,
    companyId: string,
    userId: string
  ): Promise<Quote> {
    // Gerar número único
    const number = await this.generateQuoteNumber(companyId)
    
    // Calcular itens usando engine de precificação
    const calculatedItems = []
    let totalCost = 0
    let totalPrice = 0
    
    for (const item of quoteData.items) {
      const breakdown = await PricingEngine.calculateProductCost({
        productId: item.productId,
        variables: item.variables,
        companyId
      })
      
      const calculatedItem = {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: breakdown.subtotal,
        unitPrice: breakdown.finalPrice,
        totalCost: breakdown.subtotal * item.quantity,
        totalPrice: breakdown.finalPrice * item.quantity,
        checklist: item.checklist,
        breakdown
      }
      
      calculatedItems.push(calculatedItem)
      totalCost += calculatedItem.totalCost
      totalPrice += calculatedItem.totalPrice
    }
    
    const quote = await db.quote.create({
      data: {
        number,
        title: quoteData.title,
        description: quoteData.description,
        clientId: quoteData.clientId,
        totalCost,
        totalPrice,
        margin: ((totalPrice - totalCost) / totalCost) * 100,
        validUntil: quoteData.validUntil,
        stage: 'elaboracao',
        companyId,
        createdBy: userId,
        items: {
          create: calculatedItems
        }
      },
      include: {
        items: { include: { product: true } },
        client: true
      }
    })
    
    // Mover para pipeline
    await SalesPipeline.addToStage(quote.id, 'elaboracao', companyId)
    
    return quote
  }
  
  /**
   * Gerar nova versão do orçamento
   */
  static async createVersion(
    originalQuoteId: string,
    changes: QuoteUpdateRequest,
    userId: string
  ): Promise<Quote> {
    const original = await db.quote.findUnique({
      where: { id: originalQuoteId },
      include: { items: true }
    })
    
    const newVersion = await db.quote.create({
      data: {
        ...original,
        id: undefined,
        version: original.version + 1,
        parentId: originalQuoteId,
        status: 'draft',
        ...changes,
        createdBy: userId,
        createdAt: new Date()
      }
    })
    
    return newVersion
  }
}
```

### **Sales Pipeline**
```typescript
// src/lib/sales-pipeline.ts
export class SalesPipeline {
  /**
   * Mover orçamento no funil
   */
  static async moveToStage(
    quoteId: string,
    newStage: string,
    companyId: string,
    userId: string
  ): Promise<Quote> {
    // Validar estágio
    const pipeline = await this.getCompanyPipeline(companyId)
    const stage = pipeline.stages.find(s => s.id === newStage)
    
    if (!stage) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Estágio inválido'
      })
    }
    
    // Executar ações automáticas do estágio
    await this.executeStageActions(quoteId, stage, userId)
    
    // Atualizar orçamento
    const updatedQuote = await db.quote.update({
      where: { id: quoteId },
      data: {
        stage: newStage,
        updatedAt: new Date()
      },
      include: {
        client: true,
        items: { include: { product: true } }
      }
    })
    
    // Registrar movimento no histórico
    await this.logStageMovement(quoteId, newStage, userId)
    
    return updatedQuote
  }
  
  /**
   * Executar automações do estágio
   */
  private static async executeStageActions(
    quoteId: string,
    stage: PipelineStage,
    userId: string
  ): Promise<void> {
    for (const action of stage.automations || []) {
      switch (action.type) {
        case 'send_email':
          await NotificationService.sendQuoteEmail(quoteId, action.template)
          break
        case 'send_whatsapp':
          await NotificationService.sendQuoteWhatsApp(quoteId, action.message)
          break
        case 'create_task':
          await this.createFollowUpTask(quoteId, action.task, userId)
          break
        case 'update_probability':
          await this.updateWinProbability(quoteId, action.probability)
          break
      }
    }
  }
}
```

### **Order Converter**
```typescript
// src/lib/order-converter.ts
export class OrderConverter {
  /**
   * Converter orçamento aprovado em OS
   */
  static async convertQuoteToOrder(
    quoteId: string,
    orderData: ConvertToOrderRequest,
    userId: string
  ): Promise<Order> {
    const quote = await db.quote.findUnique({
      where: { id: quoteId },
      include: {
        items: { include: { product: true } },
        client: true
      }
    })
    
    if (!quote) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Orçamento não encontrado'
      })
    }
    
    if (quote.status !== 'approved') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Orçamento deve estar aprovado'
      })
    }
    
    // Gerar número da OS
    const orderNumber = await this.generateOrderNumber(quote.companyId)
    
    // Criar OS
    const order = await db.order.create({
      data: {
        number: orderNumber,
        title: quote.title,
        description: quote.description,
        clientId: quote.clientId,
        quoteId: quote.id,
        totalCost: quote.totalCost,
        totalPrice: quote.totalPrice,
        status: 'pending',
        startDate: orderData.startDate,
        deliveryDate: orderData.deliveryDate,
        companyId: quote.companyId,
        createdBy: userId,
        items: {
          create: quote.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            unitPrice: item.unitPrice,
            totalCost: item.totalCost,
            totalPrice: item.totalPrice,
            status: 'pending'
          }))
        }
      },
      include: {
        items: { include: { product: true } },
        client: true,
        quote: true
      }
    })
    
    // Reservar materiais
    await this.reserveMaterials(order)
    
    // Criar tarefas de produção
    await this.createProductionTasks(order)
    
    // Atualizar status do orçamento
    await db.quote.update({
      where: { id: quoteId },
      data: { stage: 'convertido' }
    })
    
    return order
  }
  
  /**
   * Reservar materiais para produção
   */
  private static async reserveMaterials(order: Order): Promise<void> {
    for (const item of order.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: {
          materials: { include: { material: true } }
        }
      })
      
      for (const productMaterial of product.materials) {
        // Calcular quantidade necessária
        const quantity = evaluate(
          productMaterial.formula || productMaterial.quantity.toString(),
          { quantidade: item.quantity }
        )
        
        // Criar reserva
        await InventoryManager.reserveMaterial({
          materialId: productMaterial.materialId,
          quantity,
          companyId: order.companyId,
          reservedFor: 'order',
          referenceId: order.id,
          reservedBy: order.createdBy
        })
      }
    }
  }
}
```

### **Router de Orçamentos**
```typescript
// src/routers/quotes.ts
export const quotesRouter = router({
  /**
   * Criar orçamento
   */
  create: protectedProcedure
    .use(PermissionService.requirePermission('quotes.create'))
    .input(createQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      return QuoteEngine.createQuote(input, companyId, ctx.user.id)
    }),
  
  /**
   * Listar orçamentos
   */
  list: protectedProcedure
    .use(PermissionService.requirePermission('quotes.read'))
    .input(z.object({
      status: z.string().optional(),
      stage: z.string().optional(),
      clientId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      return ctx.db.quote.findMany({
        where: {
          companyId,
          ...(input.status && { status: input.status }),
          ...(input.stage && { stage: input.stage }),
          ...(input.clientId && { clientId: input.clientId }),
          ...(input.startDate && { createdAt: { gte: input.startDate } }),
          ...(input.endDate && { createdAt: { lte: input.endDate } })
        },
        include: {
          client: true,
          items: { include: { product: true } },
          creator: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    }),
  
  /**
   * Aprovar orçamento
   */
  approve: protectedProcedure
    .use(PermissionService.requirePermission('quotes.approve'))
    .input(z.object({
      quoteId: z.string(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      const quote = await ctx.db.quote.update({
        where: { id: input.quoteId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
          clientNotes: input.notes
        }
      })
      
      // Mover para estágio aprovado
      await SalesPipeline.moveToStage(
        input.quoteId,
        'aprovado',
        companyId,
        ctx.user.id
      )
      
      return quote
    }),
  
  /**
   * Converter para OS
   */
  convertToOrder: protectedProcedure
    .use(PermissionService.requirePermission('orders.create'))
    .input(convertToOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return OrderConverter.convertQuoteToOrder(
        input.quoteId,
        input,
        ctx.user.id
      )
    })
})
```

## 📊 SEEDS E TESTES

```typescript
// Seeds para pipeline padrão
const defaultPipeline = {
  name: 'Pipeline Padrão',
  stages: [
    { id: 'elaboracao', name: 'Elaboração', order: 1, color: '#gray' },
    { id: 'enviado', name: 'Enviado', order: 2, color: '#blue' },
    { id: 'negociacao', name: 'Negociação', order: 3, color: '#yellow' },
    { id: 'aprovado', name: 'Aprovado', order: 4, color: '#green' },
    { id: 'convertido', name: 'Convertido', order: 5, color: '#purple' },
    { id: 'perdido', name: 'Perdido', order: 6, color: '#red' }
  ]
}
```

---

**IMPORTANTE**: Esta fase integra todo o poder do sistema de precificação em um fluxo comercial completo, desde a criação do orçamento até a conversão em ordem de serviço.