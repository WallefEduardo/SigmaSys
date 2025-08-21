"use client";

import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/providers/theme-provider";
import { TRPCProvider } from "@/providers/trpc-provider";

interface ClientProvidersProps {
	children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<TRPCProvider>
				{children}
				<Toaster />
			</TRPCProvider>
		</ThemeProvider>
	);
}
