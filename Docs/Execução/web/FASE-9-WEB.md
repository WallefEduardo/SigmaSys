# FASE 9 WEB - INTEGRAÇÃO WHATSAPP (Frontend)

## 🎯 OBJETIVO

Desenvolver interface para gestão de WhatsApp com chat unificado e envio automático de orçamentos.

## 💬 INTERFACE DE CHAT

### Chat Principal
```typescript
// chat/page.tsx
export default function ChatPage() {
  const [selectedContact, setSelectedContact] = useState(null)
  const [messages, setMessages] = useState([])
  
  return (
    <div className="h-full flex">
      <ContactsList 
        contacts={contacts}
        selected={selectedContact}
        onSelect={setSelectedContact}
      />
      
      {selectedContact ? (
        <ChatWindow 
          contact={selectedContact}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
```

### Envio de Orçamentos
```typescript
// components/quote-sender.tsx
export function QuoteSender({ quote }) {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Orçamento via WhatsApp</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <QuotePreview quote={quote} />
          
          <div>
            <Label>Mensagem</Label>
            <Textarea 
              placeholder="Olá! Segue o orçamento solicitado..."
              value={message}
              onChange={setMessage}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox id="pdf" checked={includePDF} onChange={setIncludePDF} />
            <Label htmlFor="pdf">Incluir PDF do orçamento</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleSend}>
            Enviar pelo WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

**IMPORTANTE**: Interface unificada de WhatsApp com chatbot e envio automático de documentos.