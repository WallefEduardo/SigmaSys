import type { QueryClient } from "@tanstack/react-query";

/**
 * Utilitários para otimizar queries e mutações
 */

export const queryUtils = {
	/**
	 * Optimistic update para adicionar item à lista
	 */
	optimisticAdd: <T>(queryClient: QueryClient, queryKey: any[], newItem: T) => {
		queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
			if (!old) return [newItem];
			return [...old, newItem];
		});
	},

	/**
	 * Optimistic update para atualizar item na lista
	 */
	optimisticUpdate: <T extends { id: string }>(
		queryClient: QueryClient,
		queryKey: any[],
		updatedItem: T,
	) => {
		queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
			if (!old) return [updatedItem];
			return old.map((item) =>
				item.id === updatedItem.id ? { ...item, ...updatedItem } : item,
			);
		});
	},

	/**
	 * Optimistic update para remover item da lista
	 */
	optimisticRemove: <T extends { id: string }>(
		queryClient: QueryClient,
		queryKey: any[],
		itemId: string,
	) => {
		queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
			if (!old) return [];
			return old.filter((item) => item.id !== itemId);
		});
	},

	/**
	 * Rollback para desfazer optimistic update
	 */
	rollback: (queryClient: QueryClient, queryKey: any[], previousData: any) => {
		queryClient.setQueryData(queryKey, previousData);
	},

	/**
	 * Invalidar queries relacionadas
	 */
	invalidateRelated: (
		queryClient: QueryClient,
		baseQueryKey: string,
		additionalKeys: string[] = [],
	) => {
		// Invalidar query base
		queryClient.invalidateQueries({ queryKey: [baseQueryKey] });

		// Invalidar queries relacionadas
		additionalKeys.forEach((key) => {
			queryClient.invalidateQueries({ queryKey: [key] });
		});
	},
};

/**
 * Configurações de cache por tipo de dados
 */
export const cacheConfig = {
	// Dados estáticos (raramente mudam)
	static: {
		staleTime: 30 * 60 * 1000, // 30 minutos
		gcTime: 60 * 60 * 1000, // 1 hora
		refetchOnWindowFocus: false,
		retry: 3,
	},

	// Dados dinâmicos (mudam frequentemente)
	dynamic: {
		staleTime: 2 * 60 * 1000, // 2 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
		refetchOnWindowFocus: true,
		retry: 2,
	},

	// Dados em tempo real
	realtime: {
		staleTime: 30 * 1000, // 30 segundos
		gcTime: 2 * 60 * 1000, // 2 minutos
		refetchOnWindowFocus: true,
		refetchInterval: 60 * 1000, // 1 minuto
		retry: 1,
	},

	// Dados de relatórios (atualizados periodicamente)
	reports: {
		staleTime: 15 * 60 * 1000, // 15 minutos
		gcTime: 30 * 60 * 1000, // 30 minutos
		refetchOnWindowFocus: false,
		retry: 2,
	},
};

/**
 * Helper para criar mutation com optimistic update
 */
export const createOptimisticMutation = <
	TData,
	TVariables extends { id?: string },
>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	options: {
		queryKey: any[];
		queryClient: QueryClient;
		type: "create" | "update" | "delete";
		onSuccess?: (data: TData, variables: TVariables) => void;
		onError?: (error: Error, variables: TVariables) => void;
	},
) => {
	return {
		mutationFn,
		onMutate: async (variables: TVariables) => {
			// Cancelar queries em andamento
			await options.queryClient.cancelQueries({
				queryKey: options.queryKey,
			});

			// Snapshot dos dados atuais
			const previousData = options.queryClient.getQueryData(options.queryKey);

			// Optimistic update
			if (options.type === "create") {
				queryUtils.optimisticAdd(
					options.queryClient,
					options.queryKey,
					variables,
				);
			} else if (options.type === "update" && variables.id) {
				queryUtils.optimisticUpdate(
					options.queryClient,
					options.queryKey,
					variables as any,
				);
			} else if (options.type === "delete" && variables.id) {
				queryUtils.optimisticRemove(
					options.queryClient,
					options.queryKey,
					variables.id,
				);
			}

			return { previousData };
		},
		onError: (error: Error, variables: TVariables, context: any) => {
			// Rollback em caso de erro
			if (context?.previousData) {
				queryUtils.rollback(
					options.queryClient,
					options.queryKey,
					context.previousData,
				);
			}
			options.onError?.(error, variables);
		},
		onSuccess: (data: TData, variables: TVariables) => {
			options.onSuccess?.(data, variables);
		},
		onSettled: () => {
			// Refetch para garantir sincronização
			options.queryClient.invalidateQueries({
				queryKey: options.queryKey,
			});
		},
	};
};
