import { z } from 'zod'
import { router, protectedProcedure, masterProcedure } from '../lib/trpc'
import { requireAuth, requireRole } from '../lib/auth'
import { TRPCError } from '@trpc/server'

export const companiesRouter = router({
  // Listar empresas (apenas superadmin)
  list: protectedProcedure
    .use(async ({ ctx, next }) => {
      // Verificar se é superadmin (role especial do sistema)
      if (ctx.user?.role !== 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Superadmin access required'
        })
      }
      return next()
    })
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      plan: z.string().optional(),
      active: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, plan, active } = input
      const offset = (page - 1) * limit

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { cnpj: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        }),
        ...(plan && { plan }),
        ...(active !== undefined && { active })
      }

      const [companies, total] = await Promise.all([
        ctx.db.company.findMany({
          where,
          skip: offset,
          take: limit,
          include: {
            _count: {
              select: {
                users: true,
                clients: true,
                products: true,
                orders: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        ctx.db.company.count({ where })
      ])

      return {
        companies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }),

  // Obter empresa atual
  current: protectedProcedure
    .query(async ({ ctx }) => {
      const user = requireAuth(ctx)
      
      const company = await ctx.db.company.findUnique({
        where: { id: user.companyId },
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              products: true,
              materials: true,
              equipments: true,
              orders: true,
              quotes: true
            }
          }
        }
      })

      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found'
        })
      }

      return company
    }),

  // Criar empresa (superadmin)
  create: protectedProcedure
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Superadmin access required'
        })
      }
      return next()
    })
    .input(z.object({
      name: z.string().min(2).max(100),
      cnpj: z.string().min(14).max(18).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      plan: z.enum(['trial', 'basic', 'premium', 'enterprise']).default('trial')
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se CNPJ já existe (se fornecido)
      if (input.cnpj) {
        const existingCompany = await ctx.db.company.findUnique({
          where: { cnpj: input.cnpj }
        })
        
        if (existingCompany) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'CNPJ already exists'
          })
        }
      }

      const company = await ctx.db.company.create({
        data: input,
        include: {
          _count: {
            select: { users: true }
          }
        }
      })

      return company
    }),

  // Atualizar empresa
  update: masterProcedure
    .input(z.object({
      id: z.string().optional(), // Superadmin pode especificar ID
      name: z.string().min(2).max(100).optional(),
      cnpj: z.string().min(14).max(18).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      plan: z.enum(['trial', 'basic', 'premium', 'enterprise']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      
      // Se não especificar ID, usa a empresa do usuário
      const companyId = id || ctx.user!.companyId
      
      // Verificar permissão: superadmin ou master da própria empresa
      if (ctx.user!.role !== 'superadmin' && companyId !== ctx.user!.companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot update other companies'
        })
      }

      // Verificar se CNPJ já existe em outra empresa
      if (data.cnpj) {
        const existingCompany = await ctx.db.company.findFirst({
          where: {
            cnpj: data.cnpj,
            id: { not: companyId }
          }
        })
        
        if (existingCompany) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'CNPJ already exists'
          })
        }
      }

      const company = await ctx.db.company.update({
        where: { id: companyId },
        data,
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              products: true
            }
          }
        }
      })

      return company
    }),

  // Ativar/Desativar empresa (superadmin)
  toggleActive: protectedProcedure
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Superadmin access required'
        })
      }
      return next()
    })
    .input(z.object({
      id: z.string(),
      active: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.update({
        where: { id: input.id },
        data: { active: input.active }
      })

      return company
    }),

  // Estatísticas da empresa
  stats: masterProcedure
    .input(z.object({
      companyId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = input.companyId || ctx.user!.companyId
      
      // Verificar permissão
      if (ctx.user!.role !== 'superadmin' && companyId !== ctx.user!.companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot access other company stats'
        })
      }

      const [
        totalUsers,
        totalClients,
        totalProducts,
        totalOrders,
        totalQuotes,
        recentOrders,
        monthlyRevenue
      ] = await Promise.all([
        ctx.db.user.count({ where: { companyId, active: true } }),
        ctx.db.client.count({ where: { companyId, active: true } }),
        ctx.db.product.count({ where: { companyId, active: true } }),
        ctx.db.order.count({ where: { companyId } }),
        ctx.db.quote.count({ where: { companyId } }),
        ctx.db.order.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            client: { select: { name: true } }
          }
        }),
        ctx.db.order.aggregate({
          where: {
            companyId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _sum: { totalPrice: true }
        })
      ])

      return {
        totalUsers,
        totalClients,
        totalProducts,
        totalOrders,
        totalQuotes,
        recentOrders,
        monthlyRevenue: monthlyRevenue._sum.totalPrice || 0
      }
    })
})