"use client";

import {
	BarChart3,
	Calculator,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	DollarSign,
	Droplets,
	Factory,
	FileText,
	Home,
	MessageSquare,
	Package,
	Palette,
	Settings,
	ShoppingCart,
	Truck,
	Users,
	Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface MenuItem {
	id: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	href?: string;
	children?: Omit<MenuItem, "children">[];
}

const menuItems: MenuItem[] = [
	{
		id: "dashboard",
		label: "Dashboard",
		icon: Home,
		href: "/dashboard",
	},
	{
		id: "cadastros",
		label: "Cadastros",
		icon: Package,
		children: [
			{
				id: "clientes",
				label: "Clientes",
				icon: Users,
				href: "/cadastros/clientes",
			},
			{
				id: "produtos",
				label: "Produtos",
				icon: Package,
				href: "/cadastros/produtos",
			},
			{
				id: "materiais",
				label: "Matérias-Primas",
				icon: Package,
				href: "/cadastros/materias-primas",
			},
			{
				id: "equipamentos",
				label: "Equipamentos",
				icon: Wrench,
				href: "/cadastros/equipamentos",
			},
			{
				id: "insumos",
				label: "Insumos",
				icon: Droplets,
				href: "/cadastros/insumos",
			},
			{
				id: "processos",
				label: "Processos",
				icon: Factory,
				href: "/cadastros/processos",
			},
			{
				id: "acabamentos",
				label: "Acabamentos",
				icon: Palette,
				href: "/cadastros/acabamentos",
			},
		],
	},
	{
		id: "comercial",
		label: "Comercial",
		icon: ShoppingCart,
		children: [
			{
				id: "orcamentos",
				label: "Orçamentos",
				icon: Calculator,
				href: "/comercial/orcamentos",
			},
			{
				id: "ordens-servico",
				label: "Ordens de Serviço",
				icon: FileText,
				href: "/comercial/ordens",
			},
			{
				id: "funil",
				label: "Funil de Vendas",
				icon: BarChart3,
				href: "/comercial/funil",
			},
		],
	},
	{
		id: "financeiro",
		label: "Financeiro",
		icon: DollarSign,
		children: [
			{
				id: "dashboard-financeiro",
				label: "Dashboard",
				icon: BarChart3,
				href: "/financeiro/dashboard",
			},
			{
				id: "transacoes",
				label: "Transações",
				icon: DollarSign,
				href: "/financeiro/transacoes",
			},
			{
				id: "orcamentos-financeiro",
				label: "Orçamentos",
				icon: Calculator,
				href: "/financeiro/orcamentos",
			},
			{
				id: "categorias",
				label: "Categorias",
				icon: FileText,
				href: "/financeiro/categorias",
			},
			{
				id: "metas",
				label: "Metas Financeiras",
				icon: BarChart3,
				href: "/financeiro/metas",
			},
			{
				id: "relatorios-financeiro",
				label: "Relatórios",
				icon: FileText,
				href: "/financeiro/relatorios",
			},
			{
				id: "configuracoes-financeiro",
				label: "Configurações",
				icon: Settings,
				href: "/financeiro/configuracoes",
			},
		],
	},
	{
		id: "producao",
		label: "Produção",
		icon: Factory,
		children: [
			{ id: "pcp", label: "PCP", icon: BarChart3, href: "/producao/pcp" },
			{
				id: "apontamento",
				label: "Apontamento",
				icon: FileText,
				href: "/producao/apontamento",
			},
		],
	},
	{
		id: "estoque",
		label: "Estoque",
		icon: Truck,
		href: "/estoque",
	},
	{
		id: "chat",
		label: "Chat WhatsApp",
		icon: MessageSquare,
		href: "/chat",
	},
	{
		id: "admin",
		label: "Administração",
		icon: Settings,
		children: [
			{ id: "planos", label: "Planos", icon: Package, href: "/admin/planos" },
			{
				id: "empresas",
				label: "Empresas",
				icon: Users,
				href: "/admin/companies",
			},
			{
				id: "usuarios-sistema",
				label: "Usuários do Sistema",
				icon: Users,
				href: "/admin/users",
			},
			{
				id: "ia-config",
				label: "Configuração IA",
				icon: Settings,
				href: "/admin/ia-config",
			},
		],
	},
	{
		id: "configuracoes",
		label: "Configurações",
		icon: Settings,
		children: [
			{
				id: "usuarios",
				label: "Usuários",
				icon: Users,
				href: "/configuracoes/usuarios",
			},
			{
				id: "parametros",
				label: "Parâmetros",
				icon: Settings,
				href: "/configuracoes/parametros",
			},
		],
	},
];

interface SidebarProps {
	className?: string;
}

export function Sidebar({ className }: SidebarProps) {
	const { isCollapsed, toggleSidebar } = useSidebar();
	const [expandedItems, setExpandedItems] = useState<string[]>([]);
	const pathname = usePathname();
	const { user } = useAuth();

	// Filtrar menus baseado no role do usuário
	const filteredMenuItems = useMemo(() => {
		return menuItems.filter((item) => {
			// Seção de Administração só para superadmin
			if (item.id === "admin" && user?.role !== "superadmin") {
				return false;
			}
			return true;
		});
	}, [user?.role]);

	const toggleExpanded = (itemId: string) => {
		setExpandedItems((prev) =>
			prev.includes(itemId)
				? prev.filter((id) => id !== itemId)
				: [...prev, itemId],
		);
	};

	const isExpanded = (itemId: string) => expandedItems.includes(itemId);

	const SidebarContent = () => (
		<div className="flex h-full flex-col relative overflow-hidden">
			{/* Clean Background */}
			<div className="absolute inset-0 bg-[#2E3842]" />
			<div className="absolute top-0 left-0 w-full h-px bg-slate-600/30" />
			
			{/* Header */}
			<div className="relative flex h-16 items-center justify-between border-b border-slate-600/30 px-4">
				{!isCollapsed && (
					<div className="flex items-center space-x-2">
						<div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
							<div className="w-4 h-4 rounded-sm bg-[#2E3842]" />
						</div>
						<h2 className="font-bold text-lg text-white">
							ERP System
						</h2>
					</div>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={toggleSidebar}
					className="hidden lg:flex relative group hover:bg-white/10 rounded-lg transition-all duration-300"
				>
					{isCollapsed ? (
						<ChevronRight className="h-4 w-4 text-white" />
					) : (
						<ChevronLeft className="h-4 w-4 text-white" />
					)}
				</Button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 space-y-1 overflow-y-auto p-3 relative">
				{filteredMenuItems.map((item, index) => (
					<div key={item.id} className="relative group">
						{item.children ? (
							// Menu com submenu
							<div>
								{isCollapsed ? (
									// Ícone quando colapsado
									<Button
										variant="ghost"
										className="w-full justify-center p-3 relative group rounded-lg transition-all duration-300 hover:bg-white/10"
										title={item.label}
									>
										<item.icon className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors duration-300" />
									</Button>
								) : (
									// Menu expandido
									<>
										<Button
											variant="ghost"
											className="w-full justify-between p-3 relative group rounded-lg transition-all duration-300 hover:bg-white/10"
											onClick={() => toggleExpanded(item.id)}
										>
											<div className="flex items-center gap-3">
												<item.icon className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors duration-300" />
												<span className="font-medium text-slate-200 group-hover:text-white transition-colors duration-300">{item.label}</span>
											</div>
											<ChevronDown
												className={cn(
													"h-4 w-4 text-slate-400 group-hover:text-white transition-all duration-300",
													isExpanded(item.id) && "rotate-180 text-white",
												)}
											/>
										</Button>
										{isExpanded(item.id) && (
											<div className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-300">
												{item.children.map((child, childIndex) => (
													<Button
														key={child.id}
														variant="ghost"
														asChild
														className={cn(
															"w-full justify-start p-2 relative group rounded-lg transition-all duration-300",
															pathname === child.href
																? "bg-white/15 text-white border border-white/20"
																: "hover:bg-white/10 text-slate-300 hover:text-white",
														)}
														style={{ animationDelay: `${childIndex * 50}ms` }}
													>
														<Link href={child.href || "#"} className="flex items-center">
															{pathname === child.href && (
																<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
															)}
															<span className="ml-2 font-medium transition-colors duration-300">{child.label}</span>
														</Link>
													</Button>
												))}
											</div>
										)}
									</>
								)}
							</div>
						) : (
							// Menu simples
							<Button
								variant="ghost"
								asChild
								className={cn(
									"w-full relative group rounded-lg transition-all duration-300",
									isCollapsed ? "justify-center p-3" : "justify-start p-3",
									pathname === item.href
										? "bg-white/15 border border-white/20"
										: "hover:bg-white/10",
								)}
							>
								<Link href={item.href || "#"} className="flex items-center">
									{pathname === item.href && !isCollapsed && (
										<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
									)}
									<item.icon 
										className={cn(
											"h-5 w-5 transition-colors duration-300",
											pathname === item.href 
												? "text-white" 
												: "text-slate-300 group-hover:text-white"
										)} 
									/>
									{!isCollapsed && (
										<span 
											className={cn(
												"ml-3 font-medium transition-colors duration-300",
												pathname === item.href 
													? "text-white" 
													: "text-slate-200 group-hover:text-white"
											)}
										>
											{item.label}
										</span>
									)}
								</Link>
							</Button>
						)}
						
						{/* Subtle separator lines */}
						{index < filteredMenuItems.length - 1 && (
							<div className="h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent my-1" />
						)}
					</div>
				))}
			</nav>
			
			{/* Bottom gradient fade */}
			<div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#2E3842] to-transparent pointer-events-none" />
		</div>
	);

	return (
		<div
			className={cn(
				"h-full w-full relative",
				"hidden flex-col lg:flex",
				"transition-all duration-500 ease-out",
				"border-r border-slate-600/30",
				"bg-[#2E3842]",
				className,
			)}
		>
			{/* Border effect */}
			<div className="absolute inset-y-0 right-0 w-px bg-slate-600/30" />
			
			<SidebarContent />
		</div>
	);
}