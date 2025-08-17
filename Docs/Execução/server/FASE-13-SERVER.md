# FASE 13 SERVER - DOCUMENTAÇÃO E DEPLOY (Backend)

## 🎯 OBJETIVO

Configurar deploy de produção, documentação da API e monitoramento completo.

## 🚀 DEPLOY E PRODUÇÃO

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/erp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: erp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    volumes:
      - redis_data:/data
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app
            git pull origin main
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up -d --build
            docker-compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy
```

## 📊 MONITORAMENTO

### Health Checks
```typescript
// src/routes/health.ts
export const healthRouter = router({
  check: publicProcedure
    .query(async () => {
      const checks = {
        database: await checkDatabase(),
        redis: await checkRedis(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
      
      return {
        status: Object.values(checks).every(c => c.status === 'healthy') ? 'healthy' : 'unhealthy',
        checks
      }
    })
})

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await db.$queryRaw`SELECT 1`
    return { status: 'healthy', latency: Date.now() }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}
```

### Metrics Collection
```typescript
// src/lib/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client'

export const metrics = {
  httpRequests: new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status']
  }),
  
  httpDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route']
  }),
  
  activeConnections: new Gauge({
    name: 'active_connections',
    help: 'Number of active connections'
  })
}

export const metricsMiddleware = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    
    metrics.httpRequests.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    })
    
    metrics.httpDuration.observe({
      method: req.method,
      route: req.route?.path || req.path
    }, duration)
  })
  
  next()
}
```

## 📝 DOCUMENTAÇÃO DA API

### OpenAPI Spec
```typescript
// src/lib/openapi.ts
import { generateOpenApiDocument } from 'trpc-openapi'
import { appRouter } from '../routers'

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'ErpSys API',
  description: 'API do Sistema ERP para Comunicação Visual',
  version: '1.0.0',
  baseUrl: 'https://api.erpsys.com',
  docsUrl: 'https://docs.erpsys.com',
  tags: [
    { name: 'Auth', description: 'Autenticação e autorização' },
    { name: 'Products', description: 'Gestão de produtos' },
    { name: 'Pricing', description: 'Engine de precificação' },
    { name: 'Inventory', description: 'Controle de estoque' },
    { name: 'Quotes', description: 'Orçamentos' },
    { name: 'Orders', description: 'Ordens de serviço' },
    { name: 'Financial', description: 'Gestão financeira' },
    { name: 'Production', description: 'PCP e produção' }
  ]
})
```

### Backup Strategy
```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="erp_system"

# Backup do banco
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_$DATE.sql"

# Backup dos uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /app/uploads/

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Upload para S3 (opcional)
aws s3 sync $BACKUP_DIR s3://erpsys-backups/
```

---

**IMPORTANTE**: Sistema completamente documentado, monitorado e preparado para produção com backup automatizado.