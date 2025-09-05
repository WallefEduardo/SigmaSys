"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { useEffect, useState } from "react";
import { api } from "@/lib/trpc";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000, // 1 minute
						refetchOnWindowFocus: false,
						retry: (failureCount, error) => {
							// Não tentar novamente se for erro de autenticação
							if (
								error instanceof TRPCClientError &&
								error.data?.code === "UNAUTHORIZED"
							) {
								return false;
							}
							return failureCount < 3;
						},
					},
					mutations: {
						retry: (failureCount, error) => {
							// Não tentar novamente se for erro de autenticação
							if (
								error instanceof TRPCClientError &&
								error.data?.code === "UNAUTHORIZED"
							) {
								return false;
							}
							// Não tentar novamente para erros de conflict (409) - são erros de negócio
							if (
								error instanceof TRPCClientError &&
								error.data?.httpStatus === 409
							) {
								return false;
							}
							return failureCount < 1;
						},
					},
				},
			}),
	);

	const [trpcClient] = useState(() =>
		api.createClient({
			links: [
				httpBatchLink({
					url: `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3005"}/trpc`,
					headers() {
						// Buscar token do Zustand store
						if (typeof window === "undefined") {
							return {};
						}

						// Acessar o token do store global
						const authStore = localStorage.getItem("auth-storage");
						let token = null;

						if (authStore) {
							try {
								const parsedStore = JSON.parse(authStore);
								token = parsedStore.state?.token;
							} catch (error) {
								console.error("Erro ao parsear auth storage:", error);
							}
						}

						// Log para debug (removido em produção)

						return token ? { authorization: `Bearer ${token}` } : {};
					},
					// Interceptar responses para detectar 401
					fetch(url, options) {
						return fetch(url, options)
							.then(async (response) => {
								// Se receber 401, fazer logout através do hook
								if (response.status === 401 && typeof window !== "undefined") {
									console.warn("Token expirado ou inválido, fazendo logout...");
									// Limpar storage e redirecionar
									localStorage.removeItem("auth-storage");
									window.location.href = "/login";
									return response;
								}

								return response;
							})
							.catch((error) => {
								console.error("Erro na requisição tRPC:", error);
								throw error;
							});
					},
				}),
			],
		}),
	);

	// Invalidar queries quando o token mudar
	useEffect(() => {
		// Verificar mudanças no localStorage
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "auth-token") {
				console.log("🔄 Token changed, invalidating queries...");
				queryClient.invalidateQueries();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [queryClient]);

	// Interceptor global de erros
	useEffect(() => {
		const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
			if (event.type === "updated" && event.query.state.error) {
				const error = event.query.state.error as any;

				// Se for erro de autenticação, fazer logout
				if (
					error?.data?.code === "UNAUTHORIZED" ||
					error?.shape?.code === "UNAUTHORIZED"
				) {
					console.warn("Erro de autenticação detectado, fazendo logout...");
					localStorage.removeItem("auth-token");
					window.location.href = "/login";
				}
			}
		});

		return unsubscribe;
	}, [queryClient]);

	return (
		<api.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</api.Provider>
	);
}
