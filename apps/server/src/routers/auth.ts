import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authService } from "../lib/auth";
import { authLogger, performanceLogger } from "../lib/logger";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

export const authRouter = router({
	// Login
	login: publicProcedure
		.input(
			z.object({
				email: z.string().email(),
				password: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { email, password } = input;
			const timer = performanceLogger.start("auth.login");

			authLogger.info(
				{ email: email.replace(/(.{2}).*@/, "$1***@") },
				"Login attempt",
			);

			// Buscar usuário por email
			const user = await ctx.db.user.findUnique({
				where: { email },
				include: {
					company: {
						select: {
							id: true,
							name: true,
							plan: true,
							active: true,
						},
					},
				},
			});

			if (!user) {
				authLogger.warn(
					{ email: email.replace(/(.{2}).*@/, "$1***@") },
					"Login failed: user not found",
				);
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid credentials",
				});
			}

			// Verificar se usuário está ativo
			if (!user.active) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "User account is deactivated",
				});
			}

			// Verificar se empresa está ativa
			if (!user.company.active) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Company account is deactivated",
				});
			}

			// Verificar senha
			const isValidPassword = await authService.comparePassword(
				password,
				user.password,
			);
			if (!isValidPassword) {
				authLogger.warn(
					{
						email: email.replace(/(.{2}).*@/, "$1***@"),
						userId: user.id,
					},
					"Login failed: invalid password",
				);
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid credentials",
				});
			}

			// Atualizar último login
			await ctx.db.user.update({
				where: { id: user.id },
				data: { lastLoginAt: new Date() },
			});

			// Gerar token
			const token = authService.generateToken({
				userId: user.id,
				companyId: user.companyId,
				role: user.role,
				permissions: user.permissions as string[] | undefined,
			});

			authLogger.info(
				{
					userId: user.id,
					email: email.replace(/(.{2}).*@/, "$1***@"),
					role: user.role,
					companyId: user.companyId,
				},
				"Login successful",
			);

			timer.end();

			return {
				token,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					department: user.department,
					position: user.position,
					avatar: user.avatar,
					company: user.company,
				},
			};
		}),

	// Logout (apenas para invalidar token no frontend)
	logout: protectedProcedure.mutation(async ({ ctx }) => {
		// Por enquanto só retorna success
		// Futuramente pode implementar blacklist de tokens
		return { success: true };
	}),

	// Verificar token atual
	me: protectedProcedure.query(async ({ ctx }) => {
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
				avatar: true,
				phone: true,
				active: true,
				lastLoginAt: true,
				company: {
					select: {
						id: true,
						name: true,
						plan: true,
						active: true,
					},
				},
			},
		});

		if (!user) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "User not found",
			});
		}

		return user;
	}),

	// Refresh token
	refresh: protectedProcedure.mutation(async ({ ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.user!.userId },
			include: {
				company: {
					select: {
						active: true,
					},
				},
			},
		});

		if (!user || !user.active || !user.company.active) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "User or company is deactivated",
			});
		}

		// Gerar novo token
		const token = authService.generateToken({
			userId: user.id,
			companyId: user.companyId,
			role: user.role,
			permissions: user.permissions as string[] | undefined,
		});

		return { token };
	}),
});
