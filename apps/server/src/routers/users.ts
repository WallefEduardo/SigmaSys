import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { authService } from '../lib/auth'
import { TRPCError } from '@trpc/server'
import { ensureCompanyAccess } from '../lib/tenancy'

export const usersRouter = router({
  // Listar usuários
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
      role: z.string().optional(),
      active: z.boolean().optional(),
      department: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { page, limit, search, role, active, department } = input
      const offset = (page - 1) * limit

      const where = {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { position: { contains: search, mode: 'insensitive' as const } }
          ]
        }),
        ...(role && { role }),
        ...(active !== undefined && { active }),
        ...(department && { department })
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip: offset,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            position: true,
            phone: true,
            active: true,
            lastLoginAt: true,
            createdAt: true,
            creator: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        ctx.db.user.count({ where })
      ])

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }),

  // Obter usuário por ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.id,
          companyId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          department: true,
          position: true,
          phone: true,
          avatar: true,
          active: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: { name: true, email: true }
          }
        }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      return user
    }),

  // Criar usuário
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['admin', 'manager', 'user']),
      department: z.string().optional(),
      position: z.string().optional(),
      phone: z.string().optional(),
      permissions: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se email já existe
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email }
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already exists'
        })
      }

      // Verificar limite de usuários
      const currentUserCount = await ctx.db.user.count({
        where: { companyId }
      })

      // Implementar verificação de limite aqui se necessário

      const hashedPassword = await authService.hashPassword(input.password)

      const user = await ctx.db.user.create({
        data: {
          ...input,
          password: hashedPassword,
          companyId,
          createdBy: ctx.user!.userId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
          phone: true,
          active: true,
          createdAt: true
        }
      })

      return user
    }),

  // Atualizar usuário
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
      role: z.enum(['admin', 'manager', 'user']).optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      phone: z.string().optional(),
      permissions: z.array(z.string()).optional(),
      active: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { id, email, ...data } = input

      // Verificar se usuário existe na empresa
      const existingUser = await ctx.db.user.findFirst({
        where: { id, companyId }
      })

      if (!existingUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      // Verificar se email já existe em outro usuário
      if (email && email !== existingUser.email) {
        const emailExists = await ctx.db.user.findUnique({
          where: { email }
        })

        if (emailExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already exists'
          })
        }
      }

      // Não permitir alterar próprio role (exceto master/superadmin)
      if (ctx.user!.userId === id && data.role && !['master', 'superadmin'].includes(ctx.user!.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change your own role'
        })
      }

      const user = await ctx.db.user.update({
        where: { id },
        data: {
          ...data,
          ...(email && { email })
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
          phone: true,
          active: true,
          updatedAt: true
        }
      })

      return user
    }),

  // Alterar senha
  changePassword: protectedProcedure
    .input(z.object({
      id: z.string().optional(), // Se não especificar, altera própria senha
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6)
    }))
    .mutation(async ({ ctx, input }) => {
      const targetUserId = input.id || ctx.user!.userId
      const companyId = ensureCompanyAccess()(ctx)

      // Se alterando senha de outro usuário, precisa de permissão
      if (targetUserId !== ctx.user!.userId) {
        // Permissão removida temporariamente
      }

      const user = await ctx.db.user.findFirst({
        where: { id: targetUserId, companyId }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      // Verificar senha atual (apenas se alterando própria senha)
      if (targetUserId === ctx.user!.userId && input.currentPassword) {
        const isValidPassword = await authService.comparePassword(
          input.currentPassword,
          user.password
        )

        if (!isValidPassword) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect'
          })
        }
      }

      const hashedPassword = await authService.hashPassword(input.newPassword)

      await ctx.db.user.update({
        where: { id: targetUserId },
        data: { password: hashedPassword }
      })

      return { success: true }
    }),

  // Desativar usuário
  deactivate: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Não permitir desativar a si mesmo
      if (ctx.user!.userId === input.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot deactivate yourself'
        })
      }

      const user = await ctx.db.user.update({
        where: {
          id: input.id,
          companyId
        },
        data: { active: false }
      })

      return user
    }),

  // Perfil do usuário atual
  profile: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user!.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          department: true,
          position: true,
          phone: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
              plan: true
            }
          }
        }
      })

      return user
    }),

  // Atualizar perfil
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(100).optional(),
      phone: z.string().optional(),
      avatar: z.string().url().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.user!.userId },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          updatedAt: true
        }
      })

      return user
    }),

  // Obter permissões de um usuário
  getPermissions: protectedProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const user = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
          companyId
        },
        select: {
          permissions: true
        }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      // Retorna array de permissões
      return (user.permissions as string[]) || []
    }),

  // Atualizar permissões de um usuário
  updatePermissions: protectedProcedure
    .input(z.object({
      userId: z.string(),
      permissions: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se usuário existe na empresa
      const existingUser = await ctx.db.user.findFirst({
        where: { 
          id: input.userId, 
          companyId 
        }
      })

      if (!existingUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      // Não permitir alterar próprias permissões (except superadmin)
      if (ctx.user!.userId === input.userId && ctx.user!.role !== 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change your own permissions'
        })
      }

      // Atualizar permissões
      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          permissions: input.permissions
        },
        select: {
          id: true,
          name: true,
          email: true,
          permissions: true
        }
      })

      return user
    }),

  // Listar todas as permissões disponíveis
  getAvailablePermissions: protectedProcedure
    .query(async ({ ctx }) => {
      // Retorna todas as permissões disponíveis no sistema
      const permissions = {
        dashboard: {
          label: "Dashboard",
          permissions: {
            "dashboard.read": "Visualizar dashboard"
          }
        },
        cadastros: {
          label: "Cadastros",
          permissions: {
            "clients.read": "Visualizar clientes",
            "clients.create": "Criar clientes", 
            "clients.update": "Editar clientes",
            "clients.delete": "Excluir clientes",
            "products.read": "Visualizar produtos",
            "products.create": "Criar produtos",
            "products.update": "Editar produtos", 
            "products.delete": "Excluir produtos",
            "materials.read": "Visualizar matérias-primas",
            "materials.create": "Criar matérias-primas",
            "materials.update": "Editar matérias-primas",
            "materials.delete": "Excluir matérias-primas",
            "equipments.read": "Visualizar equipamentos",
            "equipments.create": "Criar equipamentos",
            "equipments.update": "Editar equipamentos",
            "equipments.delete": "Excluir equipamentos",
            "processes.read": "Visualizar processos",
            "processes.create": "Criar processos", 
            "processes.update": "Editar processos",
            "processes.delete": "Excluir processos",
            "finishes.read": "Visualizar acabamentos",
            "finishes.create": "Criar acabamentos",
            "finishes.update": "Editar acabamentos",
            "finishes.delete": "Excluir acabamentos"
          }
        },
        comercial: {
          label: "Comercial",
          permissions: {
            "quotes.read": "Visualizar orçamentos",
            "quotes.create": "Criar orçamentos",
            "quotes.update": "Editar orçamentos",
            "quotes.delete": "Excluir orçamentos",
            "quotes.approve": "Aprovar orçamentos",
            "orders.read": "Visualizar ordens de serviço",
            "orders.create": "Criar ordens de serviço",
            "orders.update": "Editar ordens de serviço",
            "orders.delete": "Excluir ordens de serviço",
            "sales.read": "Visualizar funil de vendas",
            "sales.manage": "Gerenciar funil de vendas"
          }
        },
        financeiro: {
          label: "Financeiro",
          permissions: {
            "financial.read": "Visualizar financeiro",
            "accounts-receivable.read": "Visualizar contas a receber",
            "accounts-receivable.create": "Criar contas a receber",
            "accounts-receivable.update": "Editar contas a receber",
            "accounts-payable.read": "Visualizar contas a pagar",
            "accounts-payable.create": "Criar contas a pagar", 
            "accounts-payable.update": "Editar contas a pagar",
            "chart-accounts.read": "Visualizar plano de contas",
            "chart-accounts.manage": "Gerenciar plano de contas",
            "break-even.read": "Visualizar ponto de equilíbrio",
            "break-even.manage": "Gerenciar análises financeiras"
          }
        },
        producao: {
          label: "Produção",
          permissions: {
            "production.read": "Visualizar produção",
            "pcp.read": "Visualizar PCP",
            "pcp.manage": "Gerenciar PCP",
            "tracking.read": "Visualizar apontamentos",
            "tracking.create": "Criar apontamentos",
            "tracking.update": "Editar apontamentos"
          }
        },
        estoque: {
          label: "Estoque",
          permissions: {
            "inventory.read": "Visualizar estoque",
            "inventory.create": "Criar movimentações",
            "inventory.update": "Editar estoque",
            "inventory.manage": "Gerenciar estoque completo"
          }
        },
        chat: {
          label: "Chat WhatsApp",
          permissions: {
            "chat.read": "Visualizar conversas",
            "chat.send": "Enviar mensagens",
            "chat.manage": "Gerenciar configurações"
          }
        },
        admin: {
          label: "Administração",
          permissions: {
            "companies.read": "Visualizar empresas",
            "companies.create": "Criar empresas",
            "companies.update": "Editar empresas",
            "companies.delete": "Excluir empresas",
            "system-users.read": "Visualizar usuários do sistema",
            "system-users.create": "Criar usuários do sistema",
            "system-users.update": "Editar usuários do sistema",
            "system-users.delete": "Excluir usuários do sistema",
            "system-users.permissions": "Gerenciar permissões de usuários"
          }
        },
        configuracoes: {
          label: "Configurações",
          permissions: {
            "users.read": "Visualizar usuários",
            "users.create": "Criar usuários",
            "users.update": "Editar usuários",
            "users.delete": "Excluir usuários",
            "parameters.read": "Visualizar parâmetros",
            "parameters.update": "Editar parâmetros",
            "settings.manage": "Gerenciar configurações gerais"
          }
        }
      }

      return permissions
    })
})