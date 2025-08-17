# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an ERP system for visual communication companies built with the Better-T-Stack (Next.js, Fastify, tRPC, Prisma, PostgreSQL). The system features intelligent pricing, quotation/order management, robust financial control, PCP with Kanban, WhatsApp integration, fractional inventory, and a flexible formula engine.

## Architecture

### Monorepo Structure
- **apps/web/**: Next.js 15 frontend (port 3001)
- **apps/server/**: Fastify backend with tRPC (port 3000)
- **Docs/**: Complete project documentation and execution phases
- **pnpm workspace** managed by Turborepo

### Key Technologies
- **Frontend**: Next.js 15, TypeScript, TailwindCSS, shadcn/ui, tRPC client
- **Backend**: Fastify, tRPC server, Prisma ORM, PostgreSQL
- **Dev Tools**: Biome (linting/formatting), pnpm, Turborepo
- **UI**: Dark/Light themes, collapsible sidebar, responsive design

## Development Commands

### Core Development
```bash
pnpm dev                    # Start both frontend and backend
pnpm dev:web               # Start only frontend (port 3001)
pnpm dev:server            # Start only backend (port 3000)
pnpm build                 # Build all applications
pnpm check                 # Run Biome linting and formatting
pnpm check-types           # TypeScript type checking
```

### Database Operations
```bash
pnpm db:push               # Push schema changes to database
pnpm db:studio             # Open Prisma Studio UI
pnpm db:generate           # Generate Prisma client
pnpm db:migrate            # Run database migrations
pnpm db:start              # Start Docker PostgreSQL container
pnpm db:stop               # Stop Docker container
pnpm db:down               # Remove Docker container
```

### Development Workflow
```bash
# Start development environment
pnpm install               # Install dependencies
pnpm db:start              # Start PostgreSQL
pnpm db:push               # Setup database schema
pnpm dev                   # Start development servers

# Test endpoints
curl http://localhost:3000/health     # Backend health check
# Frontend: http://localhost:3001
```

## Development Approach

### Phase-Based Development
The project follows a 24-week structured development plan:
- **Phases 1-2**: Foundation + Core Registrations (authentication, multi-tenancy, users, clients)
- **Phases 3-4**: Products + Pricing Engine (formula engine, materials, equipment, complex pricing)
- **Phases 5-8**: Operations (inventory, sales, financial, production)
- **Phases 9-13**: Advanced Features (WhatsApp, AI, security, testing, deployment)

### Execution Structure
Each phase has three coordinated documents:
- `Docs/Execução/FASE-X-GERAL.md`: Overall coordination and integration
- `Docs/Execução/server/FASE-X-SERVER.md`: Backend implementation with real data
- `Docs/Execução/web/FASE-X-WEB.md`: Frontend implementation with mocked data initially

### Data Strategy
- **Backend**: Always use real data and database connections
- **Frontend**: Start with mocked data for visual development, integrate with real APIs after
- **Authentication**: Real authentication system from the beginning

## Key System Features

### Multi-Tenancy
Complete company isolation with role-based permissions. Superadmin can manage multiple companies, each with isolated data.

### Formula Engine
Flexible mathematical formula system for complex pricing calculations with multiple units of measurement (m², linear meters, perimeter, volume, weight, quantity).

### Visual Communication Specifics
- Complex product composition (materials + processes + equipment + finishes)
- Intelligent checklists for product configuration
- Direct costing method for pricing
- Fractional inventory (partial sheet cutting)
- Equipment management (printing and machining types)

### UI/UX Guidelines
- Use Lucide React icons (never emojis)
- Collapsible sidebar with popover when minimized
- Hierarchical menu groups with icons only on main items
- Dark/Light theme system with centralized colors
- Modern animations without performance impact
- No modals - use dedicated pages for forms

## Code Patterns

### tRPC Integration
```typescript
// Backend router pattern
export const exampleRouter = router({
  list: protectedProcedure
    .use(PermissionService.requirePermission('example.read'))
    .input(z.object({...}))
    .query(async ({ ctx, input }) => {...}),
})

// Frontend usage
const { data } = api.example.list.useQuery(input)
```

### Permission System
All routes use granular permission checking:
```typescript
.use(PermissionService.requirePermission('module.action'))
```

### Company Isolation
All data queries must include company filtering:
```typescript
const companyId = ensureCompanyAccess()(ctx)
const data = await ctx.db.model.findMany({
  where: { companyId, ...otherFilters }
})
```

## File Naming Conventions
- Use kebab-case for directories and files
- Components use PascalCase
- Pages follow Next.js App Router conventions
- Group related functionality in feature folders

## Testing Strategy
- Unit tests with Jest (target >80% coverage)
- Integration tests for tRPC procedures
- E2E tests with Playwright for critical user flows
- Performance testing for complex calculations

## Environment Setup
- PostgreSQL database required
- Environment variables in `apps/server/.env`
- Docker Compose provided for local database
- Hot reload enabled for both frontend and backend
- Nunca em hipotese nenhuma use o comando pnpm dev, pois o servidor sempre ja vai está rodando, então quando voce usa, ai acaba conflitando entendeu, então nunca use esse comando, pois o servidor ja vai está rodando, e quando n tiver, voce apenas fale pra mim startar o servidor.