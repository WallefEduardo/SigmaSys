// Export the Prisma client instance
export { prisma, default as db } from './client';

// Export all Prisma types
export * from '../generated/client';

// Export specific types for common use
export type {
  User,
  Company,
  Client,
  Material,
  Product,
  Equipment,
  Order,
  Quote,
  Plan,
  Role,
  Permission
} from '../generated/client';