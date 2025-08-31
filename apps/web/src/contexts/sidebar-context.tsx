"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

interface SidebarContextType {
	isCollapsed: boolean;
	toggleSidebar: () => void;
	sidebarWidth: string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [isCollapsed, setIsCollapsed] = useState(false);

	const toggleSidebar = () => {
		setIsCollapsed((prev) => !prev);
	};

	const sidebarWidth = isCollapsed ? "4rem" : "16rem"; // w-16 = 4rem, w-64 = 16rem

	return (
		<SidebarContext.Provider
			value={{
				isCollapsed,
				toggleSidebar,
				sidebarWidth,
			}}
		>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (context === undefined) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}
