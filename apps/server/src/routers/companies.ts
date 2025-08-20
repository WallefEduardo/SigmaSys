import { z } from 'zod'
import { router, protectedProcedure, masterProcedure } from '../lib/trpc'
import { requireAuth, requireRole } from '../lib/auth'
import { TRPCError } from '@trpc/server'
import { logger } from '../lib/logger'

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
      planId: z.string().optional(),
      active: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { page, limit, search, planId, active } = input
        const offset = (page - 1) * limit

        const where = {
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { cnpj: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } }
            ]
          }),
          ...(planId && { planId }),
          ...(active !== undefined && { active })
        }

        logger.info('Listando empresas', { where, pagination: { page, limit } })

        const [companies, total] = await Promise.all([
          ctx.db.company.findMany({
            where,
            skip: offset,
            take: limit,
            include: {
              plan: true,
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

        logger.info('Empresas listadas com sucesso', { total, returned: companies.length })

        return {
          companies,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      } catch (error) {
        logger.error('Erro ao listar empresas', error)
        throw error
      }
    }),

  // Obter empresa atual
  current: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = requireAuth(ctx)
        
        logger.info('Obtendo empresa atual', { companyId: user.companyId })

        const company = await ctx.db.company.findUnique({
          where: { id: user.companyId },
          include: {
            plan: true,
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

        logger.info('Empresa atual obtida com sucesso', { companyId: company.id, name: company.name })
        return company
      } catch (error) {
        logger.error('Erro ao obter empresa atual', error)
        throw error
      }
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
      planId: z.string().optional(),
      trialDays: z.number().min(0).max(365).default(15)
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { planId, trialDays, ...companyData } = input

        logger.info('Criando nova empresa', { name: input.name, planId })

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

        // Verificar se plano existe (se fornecido)
        if (planId) {
          const plan = await ctx.db.plan.findUnique({
            where: { id: planId }
          })
          
          if (!plan) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Plan not found'
            })
          }
        }

        // Calcular data de término do trial
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

        const company = await ctx.db.company.create({
          data: {
            ...companyData,
            planId,
            trialEndsAt
          },
          include: {
            plan: true,
            _count: {
              select: { users: true }
            }
          }
        })

        logger.info('Empresa criada com sucesso', { companyId: company.id, name: company.name })
        return company
      } catch (error) {
        logger.error('Erro ao criar empresa', error)
        throw error
      }
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
      planId: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, planId, ...data } = input
        
        // Se não especificar ID, usa a empresa do usuário
        const companyId = id || ctx.user!.companyId
        
        logger.info('Atualizando empresa', { companyId, data })

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

        // Verificar se plano existe (se fornecido)
        if (planId) {
          const plan = await ctx.db.plan.findUnique({
            where: { id: planId }
          })
          
          if (!plan) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Plan not found'
            })
          }
        }

        const company = await ctx.db.company.update({
          where: { id: companyId },
          data: {
            ...data,
            ...(planId && { planId })
          },
          include: {
            plan: true,
            _count: {
              select: {
                users: true,
                clients: true,
                products: true
              }
            }
          }
        })

        logger.info('Empresa atualizada com sucesso', { companyId: company.id, name: company.name })
        return company
      } catch (error) {
        logger.error('Erro ao atualizar empresa', error)
        throw error
      }
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
      try {
        logger.info('Alterando status da empresa', { companyId: input.id, active: input.active })

        const company = await ctx.db.company.update({
          where: { id: input.id },
          data: { active: input.active },
          include: {
            plan: true
          }
        })

        logger.info('Status da empresa alterado com sucesso', { companyId: company.id, active: company.active })
        return company
      } catch (error) {
        logger.error('Erro ao alterar status da empresa', error)
        throw error
      }
    }),

  // Listar planos disponíveis (para formulário de empresas)
  plans: protectedProcedure
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Superadmin access required'
        })
      }
      return next()
    })
    .query(async ({ ctx }) => {
      try {
        logger.info('Listando planos disponíveis para empresas')

        const plans = await ctx.db.plan.findMany({
          where: { active: true },
          orderBy: { price: 'asc' }
        })

        logger.info('Planos listados com sucesso', { total: plans.length })
        return plans
      } catch (error) {
        logger.error('Erro ao listar planos', error)
        throw error
      }
    }),

  // Estatísticas da empresa
  stats: masterProcedure
    .input(z.object({
      companyId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const companyId = input.companyId || ctx.user!.companyId
        
        logger.info('Obtendo estatísticas da empresa', { companyId })

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

        const stats = {
          totalUsers,
          totalClients,
          totalProducts,
          totalOrders,
          totalQuotes,
          recentOrders,
          monthlyRevenue: monthlyRevenue._sum.totalPrice || 0
        }

        logger.info('Estatísticas obtidas com sucesso', { companyId, stats: { totalUsers, totalClients, totalProducts } })
        return stats
      } catch (error) {
        logger.error('Erro ao obter estatísticas da empresa', error)
        throw error
      }
    })
})