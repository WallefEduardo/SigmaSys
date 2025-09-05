// Export the Prisma client instance

// Export specific types for common use
export type {
	Client,
	Company,
	Equipment,
	Material,
	Order,
	Permission,
	Plan,
	Product,
	Quote,
	Role,
	User,
} from "../generated/client";

// Export all Prisma types
export * from "../generated/client";
export { default as db, prisma } from "./client";
