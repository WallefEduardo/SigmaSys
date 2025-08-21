"use client";

import React from "react";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
	const { user, company } = useAuth();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl">Dashboard</h1>
				<p className="text-muted-foreground">
					Bem-vindo ao sistema ERP de comunicação visual
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-lg border p-4">
					<h3 className="font-semibold">Usuário</h3>
					<p className="text-muted-foreground text-sm">{user?.name}</p>
					<p className="text-muted-foreground text-sm">{user?.email}</p>
				</div>

				<div className="rounded-lg border p-4">
					<h3 className="font-semibold">Empresa</h3>
					<p className="text-muted-foreground text-sm">
						{company?.name || "N/A"}
					</p>
					<p className="text-muted-foreground text-sm">
						Plano: {company?.plan || "N/A"}
					</p>
				</div>

				<div className="rounded-lg border p-4">
					<h3 className="font-semibold">Sistema</h3>
					<p className="text-muted-foreground text-sm">FASE 1 - Implementada</p>
					<p className="text-muted-foreground text-sm">Status: ✅ Funcional</p>
				</div>

				<div className="rounded-lg border p-4">
					<h3 className="font-semibold">Próximos Passos</h3>
					<p className="text-muted-foreground text-sm">FASE 2 - Cadastros</p>
					<p className="text-muted-foreground text-sm">Em desenvolvimento</p>
				</div>
			</div>
		</div>
	);
}
