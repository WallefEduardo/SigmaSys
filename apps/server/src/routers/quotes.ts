import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { ensureCompanyAccess } from '../lib/tenancy'
import type { Prisma } from '@repo/database'
import { TRPCError } from '@trpc/server'

const QuoteStatus = z.enum(['draft', 'sent', 'approved', 'rejected', 'expired', 'converted'])
const OrderStatus = z.enum(['pending', 'production', 'completed', 'delivered', 'cancelled'])

const quoteItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitCost: z.number().positive(),
  unitPrice: z.number().positive(),
  totalCost: z.number().positive(),
  totalPrice: z.number().positive(),
  checklist: z.record(z.any()).optional(),
})

const quoteCreateSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  clientId: z.string(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'Adicione pelo menos um item'),
})

const quoteUpdateSchema = quoteCreateSchema.partial().extend({
  status: QuoteStatus.optional(),
})

export const quotesRouter = router({
  // Listar orçamentos com paginação e filtros
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().max(100).default(20),
      search: z.string().optional(),
      status: QuoteStatus.optional(),
      clientId: z.string().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { page, limit, search, status, clientId, startDate, endDate } = input
      
      const where: Prisma.QuoteWhereInput = {
        companyId,
        ...(status && { status }),
        ...(clientId && { clientId }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(search && {
          OR: [
            { number: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } },
            { client: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }),
      }

      const [quotes, total] = await Promise.all([
        ctx.db.quote.findMany({
          where,
          include: {
            client: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                product: { select: { id: true, name: true } }
              }
            },
            _count: { select: { items: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.quote.count({ where }),
      ])

      return {
        quotes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    }),

  // Obter orçamento por ID
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      const quote = await ctx.db.quote.findUnique({
        where: { id: input.id, companyId },
        include: {
          client: true,
          items: {
            include: {
              product: {
                include: {
                  materials: {
                    include: { material: true }
                  },
                  equipments: {
                    include: { equipment: true }
                  },
                  processes: {
                    include: { process: true }
                  },
                  finishes: {
                    include: { finish: true }
                  },
                }
              }
            }
          },
          order: true,
        },
      })

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Orçamento não encontrado',
        })
      }

      return quote
    }),

  // Criar novo orçamento
  create: protectedProcedure
    .input(quoteCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { items, ...quoteData } = input

      // Gerar número sequencial do orçamento
      const lastQuote = await ctx.db.quote.findFirst({
        where: { companyId },
        orderBy: { number: 'desc' },
        select: { number: true }
      })

      const nextNumber = lastQuote 
        ? `ORC-${String(parseInt(lastQuote.number.split('-')[1]) + 1).padStart(6, '0')}`
        : 'ORC-000001'

      // Calcular totais
      const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0)
      const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0)
      const margin = totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0

      const quote = await ctx.db.quote.create({
        data: {
          ...quoteData,
          number: nextNumber,
          companyId,
          totalCost,
          totalPrice,
          margin,
          validUntil: quoteData.validUntil ? new Date(quoteData.validUntil) : null,
          items: {
            create: items,
          },
        },
        include: {
          client: true,
          items: {
            include: { product: true }
          },
        },
      })

      return quote
    }),

  // Atualizar orçamento
  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(quoteUpdateSchema))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { id, items, ...updateData } = input

      // Verificar se orçamento existe e pertence à empresa
      const existingQuote = await ctx.db.quote.findUnique({
        where: { id, companyId },
        include: { order: true }
      })

      if (!existingQuote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Orçamento não encontrado',
        })
      }

      // Não permitir edição de orçamento já convertido
      if (existingQuote.order && items) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Não é possível editar itens de orçamento já convertido em ordem de serviço',
        })
      }

      // Calcular novos totais se houver itens
      let totalCost = existingQuote.totalCost
      let totalPrice = existingQuote.totalPrice
      let margin = existingQuote.margin

      if (items) {
        totalCost = items.reduce((sum, item) => sum + item.totalCost, 0)
        totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0)
        margin = totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0
      }

      const quote = await ctx.db.quote.update({
        where: { id },
        data: {
          ...updateData,
          ...(items && { totalCost, totalPrice, margin }),
          validUntil: updateData.validUntil ? new Date(updateData.validUntil) : undefined,
          ...(items && {
            items: {
              deleteMany: {},
              create: items,
            },
          }),
        },
        include: {
          client: true,
          items: {
            include: { product: true }
          },
          order: true,
        },
      })

      return quote
    }),

  // Deletar orçamento
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const quote = await ctx.db.quote.findUnique({
        where: { id: input.id, companyId },
        include: { order: true }
      })

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Orçamento não encontrado',
        })
      }

      if (quote.order) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Não é possível deletar orçamento que já foi convertido em ordem de serviço',
        })
      }

      await ctx.db.quote.delete({
        where: { id: input.id },
      })

      return { success: true, message: 'Orçamento deletado com sucesso' }
    }),

  // Converter orçamento em ordem de serviço
  convertToOrder: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
      startDate: z.string().datetime().optional(),
      deliveryDate: z.string().datetime().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { quoteId, startDate, deliveryDate, notes } = input

      const quote = await ctx.db.quote.findUnique({
        where: { id: quoteId, companyId },
        include: {
          items: {
            include: { product: true }
          },
          client: true,
          order: true,
        },
      })

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Orçamento não encontrado',
        })
      }

      if (quote.order) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este orçamento já foi convertido em ordem de serviço',
        })
      }

      if (quote.status !== 'approved') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas orçamentos aprovados podem ser convertidos em ordem de serviço',
        })
      }

      // Gerar número sequencial da ordem
      const lastOrder = await ctx.db.order.findFirst({
        where: { companyId },
        orderBy: { number: 'desc' },
        select: { number: true }
      })

      const nextOrderNumber = lastOrder 
        ? `OS-${String(parseInt(lastOrder.number.split('-')[1]) + 1).padStart(6, '0')}`
        : 'OS-000001'

      const order = await ctx.db.$transaction(async (tx) => {
        // Criar ordem de serviço
        const newOrder = await tx.order.create({
          data: {
            number: nextOrderNumber,
            title: quote.title,
            description: quote.description,
            companyId,
            clientId: quote.clientId,
            quoteId: quote.id,
            totalCost: quote.totalCost,
            totalPrice: quote.totalPrice,
            startDate: startDate ? new Date(startDate) : null,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
            notes: notes || quote.notes,
            items: {
              create: quote.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                unitPrice: item.unitPrice,
                totalCost: item.totalCost,
                totalPrice: item.totalPrice,
              })),
            },
          },
          include: {
            client: true,
            items: {
              include: { product: true }
            },
            quote: true,
          },
        })

        // Atualizar status do orçamento
        await tx.quote.update({
          where: { id: quoteId },
          data: { status: 'converted' },
        })

        return newOrder
      })

      return order
    }),

  // Duplicar orçamento
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const originalQuote = await ctx.db.quote.findUnique({
        where: { id: input.id, companyId },
        include: {
          items: true,
        },
      })

      if (!originalQuote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Orçamento não encontrado',
        })
      }

      // Gerar novo número
      const lastQuote = await ctx.db.quote.findFirst({
        where: { companyId },
        orderBy: { number: 'desc' },
        select: { number: true }
      })

      const nextNumber = lastQuote 
        ? `ORC-${String(parseInt(lastQuote.number.split('-')[1]) + 1).padStart(6, '0')}`
        : 'ORC-000001'

      const duplicatedQuote = await ctx.db.quote.create({
        data: {
          number: nextNumber,
          title: `${originalQuote.title} (Cópia)`,
          description: originalQuote.description,
          companyId,
          clientId: originalQuote.clientId,
          totalCost: originalQuote.totalCost,
          totalPrice: originalQuote.totalPrice,
          margin: originalQuote.margin,
          status: 'draft',
          validUntil: null,
          notes: originalQuote.notes,
          items: {
            create: originalQuote.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              unitPrice: item.unitPrice,
              totalCost: item.totalCost,
              totalPrice: item.totalPrice,
              checklist: item.checklist,
            })),
          },
        },
        include: {
          client: true,
          items: {
            include: { product: true }
          },
        },
      })

      return duplicatedQuote
    }),

  // Estatísticas dos orçamentos
  stats: protectedProcedure
    .input(z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { startDate, endDate } = input

      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      } : {}

      const [total, byStatus, byMonth] = await Promise.all([
        ctx.db.quote.count({
          where: { companyId, ...dateFilter },
        }),
        ctx.db.quote.groupBy({
          by: ['status'],
          where: { companyId, ...dateFilter },
          _count: true,
          _sum: { totalPrice: true },
        }),
        ctx.db.quote.groupBy({
          by: ['createdAt'],
          where: { companyId, ...dateFilter },
          _count: true,
          _sum: { totalPrice: true },
        }),
      ])

      const conversionRate = byStatus.find(s => s.status === 'converted')?._count || 0
      const totalQuotes = byStatus.reduce((sum, s) => sum + s._count, 0)

      return {
        total,
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count,
          value: s._sum.totalPrice || 0,
        })),
        conversionRate: totalQuotes > 0 ? (conversionRate / totalQuotes) * 100 : 0,
        totalValue: byStatus.reduce((sum, s) => sum + (s._sum.totalPrice || 0), 0),
      }
    }),
})