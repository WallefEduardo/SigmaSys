import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { TRPCError } from '@trpc/server'
import type { Context } from './context'

export interface JWTPayload {
  userId: string
  companyId: string
  role: string
  permissions?: string[]
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
  private static readonly SALT_ROUNDS = 12

  static async hashPassword(password: string): Promise<string> {
    return bcryptjs.hash(password, this.SALT_ROUNDS)
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash)
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    })
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload
    } catch (error) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid token'
      })
    }
  }

  static extractTokenFromHeader(authorization?: string): string | null {
    if (!authorization) return null
    
    const parts = authorization.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null
    
    return parts[1]
  }
}

export function requireAuth(ctx: Context) {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    })
  }
  return ctx.user
}

export function requireRole(role: string) {
  return (ctx: Context) => {
    const user = requireAuth(ctx)
    
    if (user.role !== role && user.role !== 'superadmin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Role required: ${role}`
      })
    }
    
    return user
  }
}

export const authService = AuthService