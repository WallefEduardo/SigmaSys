# FASE 11 SERVER - SEGURANÇA E PERFORMANCE (Backend)

## 🎯 OBJETIVO

Implementar segurança robusta, cache Redis e otimizações de performance.

## 🔧 IMPLEMENTAÇÃO

### Security Middleware
```typescript
// src/middleware/security.ts
export const securityMiddleware = {
  rateLimit: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições por IP
    message: 'Muitas requisições, tente novamente em 15 minutos'
  }),
  
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }),
  
  sanitize: (req, res, next) => {
    // Sanitizar todos os inputs
    req.body = sanitize(req.body)
    req.query = sanitize(req.query)
    next()
  }
}
```

### Cache Service
```typescript
// src/lib/cache-service.ts
export class CacheService {
  private static redis = new Redis(process.env.REDIS_URL)
  
  static async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key)
    return cached ? JSON.parse(cached) : null
  }
  
  static async set(
    key: string,
    value: any,
    ttl: number = 3600
  ): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }
  
  static async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}
```

### Audit Logger
```typescript
// src/lib/audit-logger.ts
export class AuditLogger {
  static async log(
    action: string,
    userId: string,
    companyId: string,
    details: any
  ): Promise<void> {
    await db.auditLog.create({
      data: {
        action,
        userId,
        companyId,
        details: JSON.stringify(details),
        ip: this.getClientIP(),
        userAgent: this.getUserAgent(),
        timestamp: new Date()
      }
    })
  }
  
  static async detectAnomalies(
    companyId: string
  ): Promise<SecurityAlert[]> {
    // Detectar atividades suspeitas
    const recentLogs = await this.getRecentLogs(companyId, 24) // últimas 24h
    
    const alerts = []
    
    // Muitos logins falhados
    const failedLogins = recentLogs.filter(l => l.action === 'login_failed')
    if (failedLogins.length > 10) {
      alerts.push({
        type: 'brute_force',
        severity: 'high',
        description: `${failedLogins.length} tentativas de login falhadas`,
        recommendations: ['Bloquear IP', 'Alertar usuário']
      })
    }
    
    return alerts
  }
}
```

## 📊 PERFORMANCE

### Query Optimization
```typescript
// Otimizações do Prisma
const optimizedQueries = {
  // Cache de consultas frequentes
  getMaterials: async (companyId: string) => {
    const cacheKey = `materials:${companyId}`
    let materials = await CacheService.get(cacheKey)
    
    if (!materials) {
      materials = await db.material.findMany({
        where: { companyId },
        include: { priceHistory: { take: 1, orderBy: { createdAt: 'desc' } } }
      })
      await CacheService.set(cacheKey, materials, 1800) // 30 min
    }
    
    return materials
  }
}
```

---

**IMPORTANTE**: Segurança multicamadas com cache inteligente para performance máxima.