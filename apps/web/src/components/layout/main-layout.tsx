"use client";

import type React from "react";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface MainLayoutProps {
	children: React.ReactNode;
	className?: string;
}

function MainLayoutContent({ children, className }: MainLayoutProps) {
	const { sidebarWidth } = useSidebar();

	return (
		<div className="relative h-screen w-screen overflow-hidden bg-background">
			{/* Sidebar - posicionamento fixo à esquerda */}
			<div
				className="fixed top-0 left-0 z-40 h-screen transition-all duration-300"
				style={{ width: sidebarWidth }}
			>
				<Sidebar />
			</div>

			{/* Header - posicionamento fixo no topo direito */}
			<div
				className="fixed top-0 z-30 h-16 transition-all duration-300"
				style={{
					left: sidebarWidth,
					right: 0,
				}}
			>
				<Header />
			</div>

			{/* Main - área de conteúdo com scroll isolado */}
			<main
				className={cn(
					"fixed overflow-y-auto overflow-x-hidden transition-all duration-300",
					className,
				)}
				style={{
					top: "64px", // altura do header (h-16 = 64px)
					left: sidebarWidth,
					right: 0,
					bottom: 0,
					width: `calc(100vw - ${sidebarWidth})`,
					height: "calc(100vh - 64px)",
				}}
			>
				<div className="w-full min-h-full p-6 bg-background">
					{children}
				</div>
			</main>
		</div>
	);
}

export function MainLayout({ children, className }: MainLayoutProps) {
	return (
		<SidebarProvider>
			<MainLayoutContent className={className}>{children}</MainLayoutContent>
		</SidebarProvider>
	);
}
