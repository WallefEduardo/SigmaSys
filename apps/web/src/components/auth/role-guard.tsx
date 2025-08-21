"use client";

import { Lock } from "lucide-react";
import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface RoleGuardProps {
	children: React.ReactNode;
	allowedRoles: string[];
	fallback?: React.ReactNode;
	showFallback?: boolean;
}

export function RoleGuard({
	children,
	allowedRoles,
	fallback,
	showFallback = true,
}: RoleGuardProps) {
	const { user, isAuthenticated } = useAuth();

	// Se não está autenticado, não renderiza nada (AuthGuard cuida disso)
	if (!isAuthenticated || !user) {
		return null;
	}

	// Verificar se o usuário tem permissão
	const hasPermission = allowedRoles.includes(user.role);

	if (!hasPermission) {
		if (fallback) {
			return <>{fallback}</>;
		}

		if (!showFallback) {
			return null;
		}

		// Fallback padrão com mensagem de acesso negado
		return (
			<div className="flex min-h-[400px] flex-1 items-center justify-center">
				<Card className="mx-auto w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
							<Lock className="h-6 w-6 text-red-600" />
						</div>
						<CardTitle className="text-red-800 text-xl">
							Acesso Negado
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-muted-foreground">
							Você não tem permissão para acessar esta página.
						</p>
						<div className="rounded-md bg-muted p-3 text-muted-foreground text-sm">
							<strong>Seu perfil:</strong> {user.role}
							<br />
							<strong>Perfis permitidos:</strong> {allowedRoles.join(", ")}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return <>{children}</>;
}

// Hook para verificar permissões
export function useRoleCheck() {
	const { user } = useAuth();

	const hasRole = (allowedRoles: string | string[]) => {
		if (!user) return false;

		const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
		return roles.includes(user.role);
	};

	const isSuperAdmin = () => hasRole("superadmin");
	const isAdmin = () => hasRole(["admin", "superadmin"]);
	const isManager = () => hasRole(["manager", "admin", "superadmin"]);

	return {
		hasRole,
		isSuperAdmin,
		isAdmin,
		isManager,
		userRole: user?.role,
	};
}
