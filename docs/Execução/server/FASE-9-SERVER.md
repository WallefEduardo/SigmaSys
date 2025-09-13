# FASE 9 SERVER - INTEGRAÇÃO WHATSAPP (Backend)

## 🎯 OBJETIVO

Implementar integração dupla com WhatsApp (Baileys + Meta Oficial) e chatbot inteligente.

## 🔧 IMPLEMENTAÇÃO

### WhatsApp Manager
```typescript
// src/lib/whatsapp-manager.ts
export class WhatsAppManager {
  static async sendMessage(
    phone: string,
    message: string,
    companyId: string
  ): Promise<void> {
    const config = await this.getConfig(companyId)
    
    if (config.preferredAPI === 'meta') {
      await this.sendViaMeta(phone, message, config.metaToken)
    } else {
      await this.sendViaBaileys(phone, message, config.baileysSession)
    }
  }
  
  static async sendQuotePDF(
    quoteId: string,
    phone: string
  ): Promise<void> {
    const pdf = await PDFGenerator.generateQuotePDF(quoteId)
    await this.sendDocument(phone, pdf, 'orcamento.pdf')
  }
}
```

### Chatbot Engine
```typescript
// src/lib/chatbot-engine.ts
export class ChatbotEngine {
  static async processMessage(
    message: string,
    phone: string,
    companyId: string
  ): Promise<string> {
    const intent = await this.detectIntent(message)
    
    switch (intent) {
      case 'quote_status':
        return await this.getQuoteStatus(phone, companyId)
      case 'order_status':
        return await this.getOrderStatus(phone, companyId)
      case 'schedule_meeting':
        return await this.scheduleCallback(phone, message)
      default:
        return await this.generateAIResponse(message, companyId)
    }
  }
}
```

## 📊 ROUTER

```typescript
// src/routers/whatsapp.ts
export const whatsappRouter = router({
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      return WhatsAppManager.sendMessage(
        input.phone,
        input.message,
        ctx.companyId
      )
    }),
  
  webhook: publicProcedure
    .input(webhookSchema)
    .mutation(async ({ input }) => {
      return ChatbotEngine.processWebhook(input)
    })
})
```

---

**IMPORTANTE**: Integração completa com chatbot IA e APIs duplas para máxima compatibilidade.