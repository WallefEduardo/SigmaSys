import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { ensureCompanyAccess } from '../lib/tenancy'
import type { Prisma } from '@repo/database'
import { TRPCError } from '@trpc/server'

const OrderStatus = z.enum(['pending', 'approved', 'production', 'paused', 'completed', 'delivered', 'cancelled'])
const OrderItemStatus = z.enum(['pending', 'production', 'completed', 'cancelled'])

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitCost: z.number().positive(),
  unitPrice: z.number().positive(),
  totalCost: z.number().positive(),
  totalPrice: z.number().positive(),
  status: OrderItemStatus.default('pending'),
})

const orderCreateSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  clientId: z.string(),
  startDate: z.string().datetime().optional(),
  deliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Adicione pelo menos um item'),
})

const orderUpdateSchema = orderCreateSchema.partial().extend({
  status: OrderStatus.optional(),
})

export const ordersRouter = router({
  // Listar ordens com paginação e filtros
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().max(100).default(20),
      search: z.string().optional(),
      status: OrderStatus.optional(),
      clientId: z.string().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      deliveryFrom: z.string().datetime().optional(),
      deliveryTo: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { page, limit, search, status, clientId, startDate, endDate, deliveryFrom, deliveryTo } = input
      
      const where: Prisma.OrderWhereInput = {
        companyId,
        ...(status && { status }),
        ...(clientId && { clientId }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(deliveryFrom && deliveryTo && {
          deliveryDate: {
            gte: new Date(deliveryFrom),
            lte: new Date(deliveryTo),
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

      const [orders, total] = await Promise.all([
        ctx.db.order.findMany({
          where,
          include: {
            client: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                product: { select: { id: true, name: true } }
              }
            },
            quote: { select: { id: true, number: true } },
            _count: { select: { items: true } }
          },
          orderBy: [
            { deliveryDate: 'asc' },
            { createdAt: 'desc' }
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.db.order.count({ where }),
      ])

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    }),

  // Obter ordem por ID
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      
      const order = await ctx.db.order.findUnique({
        where: { id: input.id, companyId },
        include: {
          client: true,
          quote: {
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          },
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
        },
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ordem de serviço não encontrada',
        })
      }

      return order
    }),

  // Criar nova ordem de serviço
  create: protectedProcedure
    .input(orderCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { items, ...orderData } = input

      // Gerar número sequencial da ordem
      const lastOrder = await ctx.db.order.findFirst({
        where: { companyId },
        orderBy: { number: 'desc' },
        select: { number: true }
      })

      const nextNumber = lastOrder 
        ? `OS-${String(parseInt(lastOrder.number.split('-')[1]) + 1).padStart(6, '0')}`
        : 'OS-000001'

      // Calcular totais
      const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0)
      const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0)

      const order = await ctx.db.order.create({
        data: {
          ...orderData,
          number: nextNumber,
          companyId,
          totalCost,
          totalPrice,
          startDate: orderData.startDate ? new Date(orderData.startDate) : null,
          deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : null,
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

      return order
    }),

  // Atualizar ordem
  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(orderUpdateSchema))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { id, items, ...updateData } = input

      // Verificar se ordem existe e pertence à empresa
      const existingOrder = await ctx.db.order.findUnique({
        where: { id, companyId }
      })

      if (!existingOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ordem de serviço não encontrada',
        })
      }

      // Não permitir edição de ordem já entregue
      if (existingOrder.status === 'delivered' && (items || updateData.status !== 'delivered')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Não é possível editar ordem já entregue',
        })
      }

      // Calcular novos totais se houver itens
      let totalCost = existingOrder.totalCost
      let totalPrice = existingOrder.totalPrice

      if (items) {
        totalCost = items.reduce((sum, item) => sum + item.totalCost, 0)
        totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0)
      }

      const order = await ctx.db.order.update({
        where: { id },
        data: {
          ...updateData,
          ...(items && { totalCost, totalPrice }),
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          deliveryDate: updateData.deliveryDate ? new Date(updateData.deliveryDate) : undefined,
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
          quote: true,
        },
      })

      return order
    }),

  // Atualizar status de item específico
  updateItemStatus: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      itemId: z.string(),
      status: OrderItemStatus,
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { orderId, itemId, status } = input

      // Verificar se ordem pertence à empresa
      const order = await ctx.db.order.findUnique({
        where: { id: orderId, companyId },
        select: { id: true }
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ordem de serviço não encontrada',
        })
      }

      const updatedItem = await ctx.db.orderItem.update({
        where: { id: itemId },
        data: { status },
        include: {
          product: { select: { id: true, name: true } }
        }
      })

      // Verificar se todos os itens estão completos para atualizar status da ordem
      const allItems = await ctx.db.orderItem.findMany({
        where: { orderId },
        select: { status: true }
      })

      const allCompleted = allItems.every(item => item.status === 'completed')
      const hasProduction = allItems.some(item => item.status === 'production')

      let newOrderStatus = order.status
      if (allCompleted && order.status !== 'delivered') {
        newOrderStatus = 'completed'
      } else if (hasProduction && order.status === 'pending') {
        newOrderStatus = 'production'
      }

      if (newOrderStatus !== order.status) {
        await ctx.db.order.update({
          where: { id: orderId },
          data: { status: newOrderStatus }
        })
      }

      return { item: updatedItem, orderStatus: newOrderStatus }
    }),

  // Deletar ordem
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const order = await ctx.db.order.findUnique({
        where: { id: input.id, companyId }
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ordem de serviço não encontrada',
        })
      }

      if (['production', 'completed', 'delivered'].includes(order.status)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Não é possível deletar ordem em produção, completa ou entregue',
        })
      }

      await ctx.db.order.delete({
        where: { id: input.id },
      })

      return { success: true, message: 'Ordem de serviço deletada com sucesso' }
    }),

  // Cancelar ordem
  cancel: protectedProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().min(1, 'Motivo do cancelamento é obrigatório'),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const order = await ctx.db.order.findUnique({
        where: { id: input.id, companyId }
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ordem de serviço não encontrada',
        })
      }

      if (order.status === 'delivered') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Não é possível cancelar ordem já entregue',
        })
      }

      const cancelledOrder = await ctx.db.order.update({
        where: { id: input.id },
        data: {
          status: 'cancelled',
          notes: order.notes 
            ? `${order.notes}\n\nCANCELADO: ${input.reason}` 
            : `CANCELADO: ${input.reason}`
        },
        include: {
          client: true,
          items: {
            include: { product: true }
          },
        },
      })

      return cancelledOrder
    }),

  // Duplicar ordem
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const originalOrder = await ctx.db.order.findUnique({
        where: { id: input.id, companyId },
        include: {
          items: true,
        },
      })

      if (!originalOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ordem de serviço não encontrada',
        })
      }

      // Gerar novo número
      const lastOrder = await ctx.db.order.findFirst({
        where: { companyId },
        orderBy: { number: 'desc' },
        select: { number: true }
      })

      const nextNumber = lastOrder 
        ? `OS-${String(parseInt(lastOrder.number.split('-')[1]) + 1).padStart(6, '0')}`
        : 'OS-000001'

      const duplicatedOrder = await ctx.db.order.create({
        data: {
          number: nextNumber,
          title: `${originalOrder.title} (Cópia)`,
          description: originalOrder.description,
          companyId,
          clientId: originalOrder.clientId,
          totalCost: originalOrder.totalCost,
          totalPrice: originalOrder.totalPrice,
          status: 'pending',
          startDate: null,
          deliveryDate: null,
          notes: originalOrder.notes,
          items: {
            create: originalOrder.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              unitPrice: item.unitPrice,
              totalCost: item.totalCost,
              totalPrice: item.totalPrice,
              status: 'pending',
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

      return duplicatedOrder
    }),

  // Estatísticas das ordens
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

      const [total, byStatus, deliveryStats] = await Promise.all([
        ctx.db.order.count({
          where: { companyId, ...dateFilter },
        }),
        ctx.db.order.groupBy({
          by: ['status'],
          where: { companyId, ...dateFilter },
          _count: true,
          _sum: { totalPrice: true },
        }),
        ctx.db.order.aggregate({
          where: { 
            companyId, 
            ...dateFilter,
            deliveryDate: { not: null }
          },
          _avg: {
            totalPrice: true,
          },
          _sum: {
            totalPrice: true,
          },
        }),
      ])

      const onTime = await ctx.db.order.count({
        where: {
          companyId,
          ...dateFilter,
          status: 'delivered',
          deliveryDate: { lte: new Date() },
        },
      })

      const overdue = await ctx.db.order.count({
        where: {
          companyId,
          ...dateFilter,
          status: { in: ['pending', 'production'] },
          deliveryDate: { lt: new Date() },
        },
      })

      return {
        total,
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count,
          value: s._sum.totalPrice || 0,
        })),
        totalValue: byStatus.reduce((sum, s) => sum + (s._sum.totalPrice || 0), 0),
        averageValue: deliveryStats._avg.totalPrice || 0,
        onTime,
        overdue,
      }
    }),

  // Obter ordens para Kanban (PCP)
  kanban: protectedProcedure
    .query(async ({ ctx }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const orders = await ctx.db.order.findMany({
        where: {
          companyId,
          status: { in: ['pending', 'approved', 'production', 'completed'] },
        },
        include: {
          client: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } }
            }
          },
        },
        orderBy: [
          { deliveryDate: 'asc' },
          { createdAt: 'asc' }
        ],
      })

      const kanbanColumns = {
        pending: orders.filter(o => o.status === 'pending'),
        approved: orders.filter(o => o.status === 'approved'),
        production: orders.filter(o => o.status === 'production'),
        completed: orders.filter(o => o.status === 'completed'),
      }

      return kanbanColumns
    }),

  // Atualizar posição no Kanban
  updateKanbanPosition: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      newStatus: OrderStatus,
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId, companyId }
      })

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ordem de serviço não encontrada',
        })
      }

      const updatedOrder = await ctx.db.order.update({
        where: { id: input.orderId },
        data: { status: input.newStatus },
        include: {
          client: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } }
            }
          },
        },
      })

      return updatedOrder
    }),
})