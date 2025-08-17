# FASE 12 SERVER - TESTES E QUALIDADE (Backend)

## 🎯 OBJETIVO

Implementar testes automatizados completos para garantir qualidade e confiabilidade.

## 🧪 ESTRATÉGIA DE TESTES

### Testes Unitários
```typescript
// __tests__/lib/pricing-engine.test.ts
describe('PricingEngine', () => {
  beforeEach(async () => {
    await setupTestDatabase()
  })
  
  it('should calculate product cost correctly', async () => {
    const context = {
      productId: 'test-product',
      companyId: 'test-company',
      variables: { largura: 2, altura: 1.5 }
    }
    
    const result = await PricingEngine.calculateProductCost(context)
    
    expect(result.directCosts).toBeGreaterThan(0)
    expect(result.finalPrice).toBeGreaterThan(result.subtotal)
    expect(result.margin.percentage).toBeGreaterThanOrEqual(0)
  })
  
  it('should cache calculations correctly', async () => {
    const context = {
      productId: 'test-product',
      companyId: 'test-company',
      variables: { largura: 1, altura: 1 }
    }
    
    // Primeira chamada
    const start1 = Date.now()
    const result1 = await PricingEngine.calculateProductCost(context)
    const time1 = Date.now() - start1
    
    // Segunda chamada (cache)
    const start2 = Date.now()
    const result2 = await PricingEngine.calculateProductCost(context)
    const time2 = Date.now() - start2
    
    expect(result1.finalPrice).toBe(result2.finalPrice)
    expect(time2).toBeLessThan(time1)
  })
})
```

### Testes de Integração
```typescript
// __tests__/routers/products.test.ts
describe('Products Router', () => {
  let testContext: TestContext
  
  beforeEach(async () => {
    testContext = await createTestContext()
  })
  
  it('should create product with materials', async () => {
    const product = await testContext.caller.products.create({
      name: 'Teste Adesivo',
      description: 'Adesivo de teste',
      category: 'Adesivos',
      formula: 'largura * altura',
      materials: [
        {
          materialId: testContext.materials[0].id,
          quantity: 1,
          formula: 'largura * altura * 1.1'
        }
      ]
    })
    
    expect(product.id).toBeDefined()
    expect(product.materials).toHaveLength(1)
  })
  
  it('should calculate product price', async () => {
    const calculation = await testContext.caller.pricing.calculate({
      productId: testContext.products[0].id,
      variables: { largura: 2, altura: 1.5 }
    })
    
    expect(calculation.finalPrice).toBeGreaterThan(0)
    expect(calculation.materials).toHaveLength(1)
  })
})
```

### Testes de Performance
```typescript
// __tests__/performance/load.test.ts
describe('Load Tests', () => {
  it('should handle concurrent pricing calculations', async () => {
    const promises = []
    
    // 50 cálculos simultâneos
    for (let i = 0; i < 50; i++) {
      promises.push(
        testContext.caller.pricing.calculate({
          productId: 'test-product',
          variables: { largura: Math.random() * 5, altura: Math.random() * 3 }
        })
      )
    }
    
    const start = Date.now()
    const results = await Promise.all(promises)
    const duration = Date.now() - start
    
    expect(results).toHaveLength(50)
    expect(duration).toBeLessThan(5000) // < 5 segundos
  })
  
  it('should not leak memory', async () => {
    const initialMemory = process.memoryUsage().heapUsed
    
    // Executar muitas operações
    for (let i = 0; i < 1000; i++) {
      await testContext.caller.materials.list({})
    }
    
    // Forçar garbage collection
    if (global.gc) global.gc()
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    // Aumento de memória deve ser razoável
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // < 50MB
  })
})
```

## 🔧 UTILITÁRIOS DE TESTE

### Test Database Setup
```typescript
// __tests__/utils/test-setup.ts
export async function setupTestDatabase() {
  // Reset database
  await db.$executeRaw`TRUNCATE TABLE "companies" RESTART IDENTITY CASCADE`
  
  // Create test company
  const company = await db.company.create({
    data: {
      name: 'Test Company',
      cnpj: '12.345.678/0001-90',
      active: true
    }
  })
  
  // Create test user
  const user = await db.user.create({
    data: {
      email: 'test@test.com',
      name: 'Test User',
      password: await bcrypt.hash('123456', 10),
      role: 'admin',
      companyId: company.id
    }
  })
  
  return { company, user }
}
```

## 📊 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run database migrations
        run: pnpm db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

**IMPORTANTE**: Cobertura >80% com testes automatizados que garantem qualidade e confiabilidade em todos os níveis.