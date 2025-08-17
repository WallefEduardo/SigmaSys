import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { PermissionService } from '../lib/permissions'
import { authService } from '../lib/auth'
import { TRPCError } from '@trpc/server'
import { ensureCompanyAccess } from '../lib/tenancy'

export const usersRouter = router({
  // Listar usuários
  list: protectedProcedure
    .use(PermissionService.requirePermission('users.read'))
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
    .use(PermissionService.requirePermission('users.read'))
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
    .use(PermissionService.requirePermission('users.create'))
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
    .use(PermissionService.requirePermission('users.update'))
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
        PermissionService.requirePermission('users.update')(ctx)
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
    .use(PermissionService.requirePermission('users.delete'))
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
    })
})