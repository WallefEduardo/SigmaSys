# FASE 12 WEB - TESTES E QUALIDADE (Frontend)

## 🎯 OBJETIVO

Implementar testes automatizados completos para componentes React e fluxos E2E.

## 🧪 TESTES DE COMPONENTES

### Testes Unitários
```typescript
// __tests__/components/pricing-calculator.test.tsx
describe('PricingCalculator', () => {
  it('should calculate price when variables change', async () => {
    const onPriceCalculated = jest.fn()
    
    render(
      <PricingCalculator 
        productId="test-product" 
        onPriceCalculated={onPriceCalculated}
      />
    )
    
    const widthInput = screen.getByLabelText(/largura/i)
    fireEvent.change(widthInput, { target: { value: '2' } })
    
    await waitFor(() => {
      expect(onPriceCalculated).toHaveBeenCalled()
    })
  })
})
```

### Testes E2E
```typescript
// e2e/quote-creation.spec.ts
test('should create quote successfully', async ({ page }) => {
  await page.goto('/comercial/orcamentos/novo')
  
  await page.fill('[data-testid="quote-title"]', 'Teste E2E')
  await page.selectOption('[data-testid="client-select"]', 'client-1')
  await page.click('[data-testid="add-product"]')
  await page.click('[data-testid="save-quote"]')
  
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
})
```

---

**IMPORTANTE**: Cobertura completa de testes com foco em componentes críticos e fluxos principais.