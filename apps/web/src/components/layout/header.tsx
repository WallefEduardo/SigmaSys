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
		<header className="relative flex h-full w-full items-center justify-between overflow-hidden px-6">
			{/* Clean background */}
			<div className="absolute inset-0 bg-[#2E3842]" />
			<div className="absolute bottom-0 left-0 w-full h-px bg-slate-600/30" />
			
			<div className="relative flex items-center gap-4 z-10">
				{/* Modern logo/title */}
				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
						<div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
							<div className="w-3 h-3 rounded-sm bg-[#2E3842]" />
						</div>
					</div>
					<div>
						<h1 className="font-bold text-xl text-white">
							Sistema ERP
						</h1>
						<p className="text-xs text-slate-400 font-medium">Comunicação Visual</p>
					</div>
				</div>
			</div>

			<div className="relative flex items-center gap-3 z-10">
				{/* Modern notifications button */}
				<Button 
					variant="outline" 
					size="icon" 
					className="relative group border-slate-600/50 bg-slate-800/50 text-slate-300 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all duration-300 rounded-lg"
				>
					<Bell className="h-4 w-4 transition-colors duration-300" />
					<span className="-top-1 -right-1 absolute h-3 w-3 rounded-full bg-red-500 animate-pulse" />
				</Button>

				{/* Modern theme toggle */}
				<ThemeToggle />

				{/* User menu */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="relative group flex items-center gap-3 p-2 pr-3 rounded-lg hover:bg-white/10 transition-all duration-300"
						>
							<div className="hidden text-right md:block">
								<p className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors duration-300">
									{displayUser.name}
								</p>
								<p className="text-xs text-slate-400 group-hover:text-white transition-colors duration-300">
									{displayUser.company}
								</p>
							</div>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white font-bold text-[#2E3842] text-sm">
								{getInitials(displayUser.name)}
							</div>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent 
						align="end" 
						className="w-64 border-slate-600/50 bg-[#2E3842]"
					>
						<DropdownMenuLabel>
							<div className="flex flex-col space-y-2 p-2">
								<div className="flex items-center space-x-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white font-bold text-[#2E3842]">
										{getInitials(displayUser.name)}
									</div>
									<div>
										<p className="font-semibold text-white">
											{displayUser.name}
										</p>
										<p className="text-xs text-slate-400">
											{displayUser.email}
										</p>
									</div>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator className="bg-slate-600/30" />
						<DropdownMenuItem className="focus:bg-white/10 text-slate-300 hover:text-white transition-colors duration-200">
							<User className="mr-3 h-4 w-4 text-white" />
							<span>Perfil</span>
						</DropdownMenuItem>
						<DropdownMenuItem className="focus:bg-white/10 text-slate-300 hover:text-white transition-colors duration-200">
							<Settings className="mr-3 h-4 w-4 text-white" />
							<span>Configurações</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator className="bg-slate-600/30" />
						<DropdownMenuItem
							onClick={logout}
							className="focus:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors duration-200"
						>
							<LogOut className="mr-3 h-4 w-4" />
							<span>Sair</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
