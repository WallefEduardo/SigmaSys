"use client"

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import * as React from "react"

// Configurações otimizadas do React Query
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Manter cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry em caso de falha
      retry: (failureCount: number, error: any) => {
        // Não fazer retry em erros 4xx (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Máximo 3 tentativas para outros erros
        return failureCount < 3
      },
      // Refetch em caso de reconexão
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Configurar retry delay
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry para mutations
      retry: 1,
    },
  },
  // Cache personalizado para diferentes tipos de queries
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Log estruturado de erros
      console.error('Query Error:', {
        queryKey: query.queryKey,
        error: error,
        meta: query.meta,
        timestamp: new Date().toISOString(),
      })

      // Enviar para serviço de monitoramento em produção
      if (process.env.NODE_ENV === 'production') {
        // Sentry, DataDog, etc.
        // trackError(error, { context: 'react-query', queryKey: query.queryKey })
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      console.error('Mutation Error:', {
        mutationKey: mutation.options.mutationKey,
        error: error,
        variables: variables,
        timestamp: new Date().toISOString(),
      })
    },
    onSuccess: (data, variables, context, mutation) => {
      // Log de sucesso para monitoramento
      if (process.env.NODE_ENV === 'development') {
        console.log('Mutation Success:', {
          mutationKey: mutation.options.mutationKey,
          variables: variables,
        })
      }
    },
  }),
}

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * Provider do React Query com configurações otimizadas
 * Inclui cache inteligente, retry logic e observabilidade
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Criar cliente apenas uma vez para evitar re-criação
  const [queryClient] = React.useState(() => new QueryClient(queryClientConfig))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              marginBottom: '5rem', // Evitar conflito com outros elementos
            },
          }}
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Hook personalizado para criar queries com configurações padrão
 */
export function createQuery<TData, TError = unknown>(
  key: string[],
  config?: {
    staleTime?: number
    gcTime?: number
    retry?: boolean | number
  }
) {
  return {
    queryKey: key,
    staleTime: config?.staleTime ?? queryClientConfig.defaultOptions.queries.staleTime,
    gcTime: config?.gcTime ?? queryClientConfig.defaultOptions.queries.gcTime,
    retry: config?.retry ?? queryClientConfig.defaultOptions.queries.retry,
  }
}

/**
 * Configurações de cache específicas por tipo de dados
 */
export const cacheConfig = {
  // Dados que mudam raramente (unidades, categorias)
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000,    // 1 hora
  },
  // Dados que mudam com frequência (materiais, equipamentos)
  dynamic: {
    staleTime: 2 * 60 * 1000,  // 2 minutos
    gcTime: 10 * 60 * 1000,    // 10 minutos
  },
  // Dados em tempo real (estoque, status)
  realtime: {
    staleTime: 30 * 1000,      // 30 segundos
    gcTime: 2 * 60 * 1000,     // 2 minutos
  },
  // Relatórios e dados pesados
  reports: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
  },
}

/**
 * Padrões de invalidação de cache
 */
export const invalidationPatterns = {
  // Invalidar todos os materiais quando um for alterado
  materials: ['materials'],
  // Invalidar equipamentos
  equipments: ['equipments'],
  // Invalidar processos
  processes: ['processes'],
  // Invalidar acabamentos
  finishes: ['finishes'],
  // Invalidar dados do usuário
  user: ['user'],
  // Invalidar dados da empresa
  company: ['company'],
}

/**
 * Utilitários para cache
 */
export const queryUtils = {
  // Prefetch de dados
  prefetchMaterials: (queryClient: QueryClient) => {
    return queryClient.prefetchQuery({
      queryKey: invalidationPatterns.materials,
      // queryFn: fetchMaterials, // Implementar quando tiver API real
      ...cacheConfig.dynamic,
    })
  },
  
  // Invalidar cache por padrão
  invalidateByPattern: (queryClient: QueryClient, pattern: string[]) => {
    return queryClient.invalidateQueries({
      queryKey: pattern,
    })
  },
  
  // Otimistic update
  optimisticUpdate: <T>(
    queryClient: QueryClient,
    queryKey: string[],
    updater: (old: T | undefined) => T
  ) => {
    queryClient.setQueryData<T>(queryKey, updater)
  },
}