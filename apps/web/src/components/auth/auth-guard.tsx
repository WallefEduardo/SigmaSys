"use client";

import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

interface AuthGuardProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
	const { isAuthenticated, isLoading, validateSession, checkToken } = useAuth();

	useEffect(() => {
		// Validar sessão quando o componente montar
		if (!isAuthenticated && !isLoading) {
			validateSession();
		}
	}, [isAuthenticated, isLoading, validateSession]);

	// Verificar token periodicamente (a cada 5 minutos)
	useEffect(() => {
		const interval = setInterval(
			() => {
				if (isAuthenticated && !checkToken()) {
					console.warn("Token expirado detectado no check periódico");
					// O hook já vai fazer logout automaticamente
				}
			},
			5 * 60 * 1000,
		); // 5 minutos

		return () => clearInterval(interval);
	}, [isAuthenticated, checkToken]);

	if (isLoading) {
		return (
			fallback || (
				<div className="flex min-h-screen items-center justify-center bg-background">
					<div className="flex flex-col items-center gap-4">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-muted-foreground">Verificando autenticação...</p>
					</div>
				</div>
			)
		);
	}

	return <>{children}</>;
}

// Loading component customizado
export function AuthLoadingScreen() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
			<div className="flex flex-col items-center gap-6 text-white">
				<div className="relative">
					<div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
					<div className="animation-delay-150 absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-r-green-500" />
				</div>
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-xl">ErpSys</h2>
					<p className="text-slate-400">Carregando sistema...</p>
				</div>
			</div>
		</div>
	);
}
