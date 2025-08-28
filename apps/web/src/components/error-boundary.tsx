"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary para capturar erros em componentes React
 * Implementa padrão de recuperação graceful
 */
export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);

		// Log estruturado para monitoramento
		const errorDetails = {
			error: {
				message: error.message,
				stack: error.stack,
				name: error.name,
			},
			errorInfo: {
				componentStack: errorInfo.componentStack,
			},
			timestamp: new Date().toISOString(),
			url: typeof window !== "undefined" ? window.location.href : "unknown",
			userAgent:
				typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
		};

		// Enviar para serviço de monitoramento (Sentry, etc)
		this.props.onError?.(error, errorInfo);

		// Log no console para desenvolvimento
		if (process.env.NODE_ENV === "development") {
			console.group("🚨 Error Boundary Details");
			console.error("Error:", error);
			console.error("Error Info:", errorInfo);
			console.error("Full Details:", errorDetails);
			console.groupEnd();
		}

		this.setState({ error, errorInfo });
	}

	resetError = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
	};

	render() {
		if (this.state.hasError) {
			const CustomFallback = this.props.fallback;

			if (CustomFallback) {
				return (
					<CustomFallback
						error={this.state.error}
						resetError={this.resetError}
					/>
				);
			}

			return (
				<DefaultErrorFallback
					error={this.state.error}
					resetError={this.resetError}
				/>
			);
		}

		return this.props.children;
	}
}

/**
 * Componente padrão de fallback para erros
 */
function DefaultErrorFallback({
	error,
	resetError,
}: {
	error?: Error;
	resetError: () => void;
}) {
	return (
		<div className="flex min-h-[400px] items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
						<AlertTriangle className="h-6 w-6" />
					</div>
					<CardTitle>Oops! Algo deu errado</CardTitle>
					<CardDescription>
						Ocorreu um erro inesperado. Nosso time foi notificado e está
						trabalhando para resolver.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-center">
					{process.env.NODE_ENV === "development" && error && (
						<details className="text-left">
							<summary className="cursor-pointer text-muted-foreground text-sm hover:text-foreground">
								Detalhes do erro (desenvolvimento)
							</summary>
							<pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
								{error.message}
								{"\n"}
								{error.stack}
							</pre>
						</details>
					)}

					<div className="flex gap-2">
						<Button onClick={resetError} className="flex-1">
							<RefreshCw className="mr-2 h-4 w-4" />
							Tentar novamente
						</Button>
						<Button
							variant="outline"
							onClick={() => window.location.reload()}
							className="flex-1"
						>
							Recarregar página
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Hook para criar error boundary programático
 */
export function useErrorBoundary() {
	const [error, setError] = React.useState<Error | null>(null);

	const resetError = React.useCallback(() => {
		setError(null);
	}, []);

	const captureError = React.useCallback((error: Error) => {
		setError(error);
	}, []);

	if (error) {
		throw error;
	}

	return { captureError, resetError };
}

/**
 * HOC para envolver componentes com Error Boundary
 */
export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) {
	const WrappedComponent = (props: P) => (
		<ErrorBoundary {...errorBoundaryProps}>
			<Component {...props} />
		</ErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

	return WrappedComponent;
}
