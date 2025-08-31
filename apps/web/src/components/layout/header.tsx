"use client";

import { Bell, LogOut, Settings, User } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
	const { user, company, logout } = useAuth();

	// Garantir que temos valores string para renderização
	const displayUser = {
		name: user?.name || "Administrador Teste",
		email: user?.email || "admin@empresateste.com",
		company: company?.name || "Empresa Teste",
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<header className="flex h-full w-full items-center justify-between border-b bg-background px-6">
			<div className="flex items-center gap-4">
				<h1 className="font-semibold text-foreground text-xl">
					Sistema ERP - Comunicação Visual
				</h1>
			</div>

			<div className="flex items-center gap-4">
				{/* Notificações */}
				<Button variant="outline" size="icon" className="relative">
					<Bell className="h-4 w-4" />
					<span className="-top-1 -right-1 absolute h-3 w-3 rounded-full bg-red-500 text-xs" />
				</Button>

				{/* Toggle de tema */}
				<ThemeToggle />

				{/* Menu do usuário */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="flex items-center gap-2 hover:bg-muted"
						>
							<div className="hidden text-right md:block">
								<p className="font-medium text-sm">{displayUser.name}</p>
								<p className="text-muted-foreground text-xs">
									{displayUser.company}
								</p>
							</div>
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
								{getInitials(displayUser.name)}
							</div>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>
							<div className="flex flex-col space-y-1">
								<p className="font-medium text-sm leading-none">
									{displayUser.name}
								</p>
								<p className="text-muted-foreground text-xs leading-none">
									{displayUser.email}
								</p>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<User className="mr-2 h-4 w-4" />
							<span>Perfil</span>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Settings className="mr-2 h-4 w-4" />
							<span>Configurações</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={logout}
							className="text-red-600 focus:text-red-600"
						>
							<LogOut className="mr-2 h-4 w-4" />
							<span>Sair</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
