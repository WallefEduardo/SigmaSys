import * as React from "react";

interface ToastProps {
	title?: string;
	description?: string;
	variant?: "default" | "destructive";
	duration?: number;
}

// Mock toast implementation - você pode substituir por uma biblioteca real como sonner
export function toast({
	title,
	description,
	variant = "default",
	duration = 4000,
}: ToastProps) {
	// Para desenvolvimento, usar console.log
	// Em produção, substituir por uma implementação real de toast
	const message = title ? `${title}: ${description}` : description;

	if (variant === "destructive") {
		console.error("🔴 Toast Error:", message);
		// Em produção, mostrar toast de erro
	} else {
		console.log("✅ Toast Success:", message);
		// Em produção, mostrar toast de sucesso
	}

	// Simular notificação do browser como fallback
	if (typeof window !== "undefined" && "Notification" in window) {
		if (Notification.permission === "granted") {
			new Notification(title || "Notification", {
				body: description,
				icon: variant === "destructive" ? "❌" : "✅",
			});
		}
	}
}
