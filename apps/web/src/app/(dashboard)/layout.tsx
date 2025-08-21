"use client";

import type React from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { MainLayout } from "@/components/layout/main-layout";

interface DashboardLayoutProps {
	children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	return (
		<AuthGuard>
			<MainLayout>{children}</MainLayout>
		</AuthGuard>
	);
}
