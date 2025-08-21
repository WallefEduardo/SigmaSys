import type React from "react";

interface AuthLayoutProps {
	children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted">
			{children}
		</div>
	);
}
