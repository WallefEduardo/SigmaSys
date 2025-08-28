import { Loader2 } from "lucide-react";
import * as React from "react";

/**
 * Componente de loading padrão para lazy loading
 */
export function LazyLoadingFallback({
	message = "Carregando...",
	className = "flex min-h-[200px] items-center justify-center",
}: {
	message?: string;
	className?: string;
}) {
	return (
		<div className={className}>
			<div className="flex flex-col items-center gap-2">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-muted-foreground text-sm">{message}</p>
			</div>
		</div>
	);
}

/**
 * Componente de loading para páginas inteiras
 */
export function PageLoadingFallback() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<div className="relative">
					<div className="h-12 w-12 rounded-full border-4 border-muted" />
					<div className="absolute top-0 left-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
				<div className="space-y-2 text-center">
					<h3 className="font-medium">Carregando página...</h3>
					<p className="text-muted-foreground text-sm">Aguarde um momento</p>
				</div>
			</div>
		</div>
	);
}

/**
 * HOC para adicionar lazy loading com fallback customizado
 */
export function withLazyLoading<P extends object>(
	importFn: () => Promise<{ default: React.ComponentType<P> }>,
	fallback?: React.ComponentType,
) {
	const LazyComponent = React.lazy(importFn);

	return function WrappedLazyComponent(props: P) {
		const Fallback = fallback || LazyLoadingFallback;

		return (
			<React.Suspense fallback={<Fallback />}>
				<LazyComponent {...props} />
			</React.Suspense>
		);
	};
}

/**
 * Lazy components para módulos pesados
 */

// FormulaBuilder (componente pesado)
export const LazyFormulaBuilder = React.lazy(() =>
	import("@/components/forms/formula-builder").then((module) => ({
		default: module.FormulaBuilder,
	})),
);

// FormulaPreview
export const LazyFormulaPreview = React.lazy(() =>
	import("@/components/forms/formula-preview").then((module) => ({
		default: module.FormulaPreview,
	})),
);

// Páginas de CRUD (lazy load)
export const LazyMaterialsPage = React.lazy(
	() => import("@/app/(dashboard)/cadastros/materias-primas/page"),
);

export const LazyEquipmentsPage = React.lazy(
	() => import("@/app/(dashboard)/cadastros/equipamentos/page"),
);

export const LazyProcessesPage = React.lazy(
	() => import("@/app/(dashboard)/cadastros/processos/page"),
);

export const LazyFinishesPage = React.lazy(
	() => import("@/app/(dashboard)/cadastros/acabamentos/page"),
);

// Formulários pesados
export const LazyMaterialForm = React.lazy(() =>
	import(
		"@/app/(dashboard)/cadastros/materias-primas/components/material-form"
	).then((module) => ({
		default: module.MaterialForm,
	})),
);

export const LazyEquipmentForm = React.lazy(() =>
	import(
		"@/app/(dashboard)/cadastros/equipamentos/components/equipment-form"
	).then((module) => ({
		default: module.EquipmentForm,
	})),
);

/**
 * Wrapper com error boundary para componentes lazy
 */
export function LazyComponentWrapper({
	children,
	fallback = LazyLoadingFallback,
	errorFallback,
}: {
	children: React.ReactNode;
	fallback?: React.ComponentType;
	errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}) {
	return (
		<ErrorBoundary fallback={errorFallback}>
			<React.Suspense fallback={<fallback />}>{children}</React.Suspense>
		</ErrorBoundary>
	);
}

// Import ErrorBoundary (assumindo que já foi criado)
import { ErrorBoundary } from "@/components/error-boundary";

/**
 * Hook para preload de componentes lazy
 */
export function usePreloadComponent(
	importFn: () => Promise<any>,
	condition = true,
) {
	React.useEffect(() => {
		if (condition) {
			// Preload do componente
			importFn().catch((error) => {
				console.warn("Failed to preload component:", error);
			});
		}
	}, [importFn, condition]);
}

/**
 * Utilidades para gerenciar lazy loading
 */
export const lazyUtils = {
	// Preload de múltiplos componentes
	preloadComponents: async (importFunctions: Array<() => Promise<any>>) => {
		const promises = importFunctions.map((fn) =>
			fn().catch((err) => {
				console.warn("Component preload failed:", err);
				return null;
			}),
		);

		return Promise.allSettled(promises);
	},

	// Preload baseado em interação do usuário
	preloadOnHover: (importFn: () => Promise<any>) => {
		let preloaded = false;

		return {
			onMouseEnter: () => {
				if (!preloaded) {
					preloaded = true;
					importFn().catch((err) => console.warn("Hover preload failed:", err));
				}
			},
		};
	},

	// Preload baseado na visibilidade
	preloadOnVisible: (
		importFn: () => Promise<any>,
		ref: React.RefObject<Element>,
	) => {
		React.useEffect(() => {
			const element = ref.current;
			if (!element) return;

			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							importFn().catch((err) =>
								console.warn("Visibility preload failed:", err),
							);
							observer.unobserve(element);
						}
					});
				},
				{ threshold: 0.1 },
			);

			observer.observe(element);

			return () => observer.disconnect();
		}, [importFn, ref]);
	},
};
