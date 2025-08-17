# FASE 13 WEB - DOCUMENTAÇÃO E DEPLOY (Frontend)

## 🎯 OBJETIVO

Configurar deploy de produção do frontend, documentação de componentes e otimizações finais.

## 🚀 DEPLOY E PRODUÇÃO

### Next.js Build Optimization
```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  compress: true,
  images: {
    domains: ['cdn.erpsys.com'],
    formats: ['image/webp', 'image/avif']
  },
  experimental: {
    optimizeCss: true,
    bundlePagesRouterDependencies: true
  }
}
```

### Docker para Frontend
```dockerfile
# Dockerfile.web
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Documentação de Componentes
```typescript
// Storybook stories
export default {
  title: 'Components/PricingCalculator',
  component: PricingCalculator,
  parameters: {
    docs: {
      description: {
        component: 'Calculadora de preços em tempo real'
      }
    }
  }
} as Meta

export const Default: Story = {
  args: {
    productId: 'sample-product'
  }
}
```

### Monitoramento Frontend
```typescript
// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // Enviar métricas para serviço de monitoramento
  analytics.track('web-vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating
  })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

---

**IMPORTANTE**: Frontend otimizado para produção com documentação completa e monitoramento de performance.