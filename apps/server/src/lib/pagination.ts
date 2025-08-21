import { z } from "zod";
import { logger } from "./logger";

// Schema para paginação tradicional (offset-based)
export const offsetPaginationSchema = z.object({
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(20),
});

// Schema para paginação baseada em cursor
export const cursorPaginationSchema = z.object({
	cursor: z.string().optional(), // ID do último item da página anterior
	limit: z.number().min(1).max(100).default(20),
	direction: z.enum(["forward", "backward"]).default("forward"),
});

// Schema unificado que aceita ambos os tipos
export const paginationSchema = z.union([
	offsetPaginationSchema.extend({
		type: z.literal("offset").default("offset"),
	}),
	cursorPaginationSchema.extend({
		type: z.literal("cursor").default("cursor"),
	}),
]);

export interface PaginationResult<T> {
	items: T[];
	pagination: {
		// Offset-based pagination
		page?: number;
		limit: number;
		total?: number;
		pages?: number;

		// Cursor-based pagination
		cursor?: string;
		nextCursor?: string;
		previousCursor?: string;
		hasNextPage?: boolean;
		hasPreviousPage?: boolean;

		// Metadados
		type: "offset" | "cursor";
		itemCount: number;
	};
}

export class PaginationHelper {
	/**
	 * Cria where clause para cursor-based pagination
	 */
	static createCursorWhere(
		cursor: string | undefined,
		direction: "forward" | "backward",
		orderField = "id",
	): any {
		if (!cursor) return {};

		const operator = direction === "forward" ? "gt" : "lt";

		return {
			[orderField]: {
				[operator]: cursor,
			},
		};
	}

	/**
	 * Determina a ordem para cursor-based pagination
	 */
	static createCursorOrder(
		direction: "forward" | "backward",
		orderField = "id",
		defaultOrder: "asc" | "desc" = "asc",
	): any {
		const order =
			direction === "forward"
				? defaultOrder
				: defaultOrder === "asc"
					? "desc"
					: "asc";

		return {
			[orderField]: order,
		};
	}

	/**
	 * Processa resultados de cursor-based pagination
	 */
	static processCursorResults<T extends { id: string }>(
		items: T[],
		limit: number,
		direction: "forward" | "backward",
		originalCursor?: string,
	): {
		processedItems: T[];
		nextCursor?: string;
		previousCursor?: string;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	} {
		const hasMore = items.length > limit;
		const processedItems = hasMore ? items.slice(0, limit) : items;

		if (direction === "backward") {
			processedItems.reverse();
		}

		const firstItem = processedItems[0];
		const lastItem = processedItems[processedItems.length - 1];

		return {
			processedItems,
			nextCursor: hasMore && direction === "forward" ? lastItem?.id : undefined,
			previousCursor:
				hasMore && direction === "backward" ? firstItem?.id : undefined,
			hasNextPage: hasMore && direction === "forward",
			hasPreviousPage:
				!!originalCursor || (hasMore && direction === "backward"),
		};
	}

	/**
	 * Cria resultado paginado unificado
	 */
	static createPaginatedResult<T extends { id?: string }>(
		items: T[],
		input: any,
		total?: number,
	): PaginationResult<T> {
		const { type, limit } = input;

		if (type === "cursor") {
			const { cursor, direction } = input;
			const typedItems = items as (T & { id: string })[];

			const cursorResult = PaginationHelper.processCursorResults(
				typedItems,
				limit,
				direction,
				cursor,
			);

			return {
				items: cursorResult.processedItems,
				pagination: {
					type: "cursor",
					limit,
					cursor,
					nextCursor: cursorResult.nextCursor,
					previousCursor: cursorResult.previousCursor,
					hasNextPage: cursorResult.hasNextPage,
					hasPreviousPage: cursorResult.hasPreviousPage,
					itemCount: cursorResult.processedItems.length,
				},
			};
		}
		// Offset-based pagination
		const { page } = input;
		const calculatedTotal = total ?? items.length;

		return {
			items,
			pagination: {
				type: "offset",
				page,
				limit,
				total: calculatedTotal,
				pages: Math.ceil(calculatedTotal / limit),
				itemCount: items.length,
			},
		};
	}

	/**
	 * Helper para logs de performance
	 */
	static logPaginationPerformance(
		operation: string,
		type: "offset" | "cursor",
		itemCount: number,
		executionTime: number,
		additionalData?: Record<string, any>,
	): void {
		logger.debug("Pagination performance", {
			operation,
			type,
			itemCount,
			executionTime: `${executionTime}ms`,
			...additionalData,
		});

		// Warning para queries lentas
		if (executionTime > 1000) {
			logger.warn("Slow pagination query detected", {
				operation,
				type,
				executionTime: `${executionTime}ms`,
				itemCount,
				...additionalData,
			});
		}
	}

	/**
	 * Recomenda tipo de paginação baseado no contexto
	 */
	static recommendPaginationType(
		totalEstimated: number,
		isRealTime = false,
		hasComplexFilters = false,
	): "offset" | "cursor" {
		// Para datasets grandes (>10k) ou dados em tempo real, usar cursor
		if (totalEstimated > 10000 || isRealTime) {
			return "cursor";
		}

		// Para filtros complexos, offset pode ser mais flexível
		if (hasComplexFilters) {
			return "offset";
		}

		// Default para datasets pequenos
		return "offset";
	}

	/**
	 * Converte cursor base64 para ID e vice-versa
	 */
	static encodeCursor(id: string): string {
		return Buffer.from(id).toString("base64");
	}

	static decodeCursor(cursor: string): string {
		try {
			return Buffer.from(cursor, "base64").toString("utf-8");
		} catch (error) {
			logger.error("Invalid cursor format", { cursor, error });
			throw new Error("Invalid cursor format");
		}
	}

	/**
	 * Cria cursor opaco para uso em APIs públicas
	 */
	static createOpaqueCursor(id: string, timestamp?: Date): string {
		const cursorData = {
			id,
			timestamp: timestamp?.toISOString() || new Date().toISOString(),
		};

		return Buffer.from(JSON.stringify(cursorData)).toString("base64");
	}

	static parseOpaqueCursor(cursor: string): { id: string; timestamp: string } {
		try {
			const decoded = Buffer.from(cursor, "base64").toString("utf-8");
			const parsed = JSON.parse(decoded);

			if (!parsed.id || !parsed.timestamp) {
				throw new Error("Invalid cursor structure");
			}

			return parsed;
		} catch (error) {
			logger.error("Failed to parse opaque cursor", { cursor, error });
			throw new Error("Invalid cursor format");
		}
	}
}

// Tipos auxiliares para TypeScript
export type OffsetPaginationInput = z.infer<typeof offsetPaginationSchema>;
export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// Utility type para adicionar paginação a qualquer query
export type WithPagination<T> = T & {
	pagination: PaginationInput;
};
