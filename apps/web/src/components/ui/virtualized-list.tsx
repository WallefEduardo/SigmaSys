"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface VirtualizedListProps<T = any> {
	items: T[];
	className?: string;
	height?: number;
	threshold?: number; // Limiar para ativar virtualização
	emptyMessage?: string;
	loading?: boolean;
	renderItem: (item: T, index: number) => React.ReactElement;
}

/**
 * Lista "virtualizada" simples - só limita itens renderizados se exceder o threshold
 * Para verdadeira virtualização, usar biblioteca como react-window
 */
export function VirtualizedList<T = any>({
	items,
	className,
	height = 400,
	threshold = 100,
	emptyMessage = "Nenhum item encontrado",
	loading = false,
	renderItem,
}: VirtualizedListProps<T>) {
	const [visibleItems, setVisibleItems] = React.useState(() =>
		items.length > threshold ? items.slice(0, threshold) : items,
	);

	const [showingAll, setShowingAll] = React.useState(items.length <= threshold);

	React.useEffect(() => {
		if (items.length <= threshold) {
			setVisibleItems(items);
			setShowingAll(true);
		} else {
			setVisibleItems(items.slice(0, threshold));
			setShowingAll(false);
		}
	}, [items, threshold]);

	const loadMore = React.useCallback(() => {
		if (showingAll) return;

		const nextBatch = Math.min(visibleItems.length + threshold, items.length);
		setVisibleItems(items.slice(0, nextBatch));
		setShowingAll(nextBatch >= items.length);
	}, [items, visibleItems.length, threshold, showingAll]);

	if (loading) {
		return (
			<div
				className={cn("flex items-center justify-center", className)}
				style={{ height }}
			>
				<div className="text-muted-foreground text-sm">Carregando...</div>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div
				className={cn("flex items-center justify-center", className)}
				style={{ height }}
			>
				<div className="text-muted-foreground text-sm">{emptyMessage}</div>
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{visibleItems.map((item, index) => (
					<div key={index}>{renderItem(item, index)}</div>
				))}
			</div>

			{!showingAll && (
				<div className="flex justify-center pt-4">
					<button
						onClick={loadMore}
						className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
					>
						Carregar mais ({items.length - visibleItems.length} restantes)
					</button>
				</div>
			)}

			{items.length > threshold && showingAll && (
				<div className="pt-4 text-center text-muted-foreground text-sm">
					Mostrando todos os {items.length} itens
				</div>
			)}
		</div>
	);
}

/**
 * Lista virtualizada específica para cards de materiais
 */
interface VirtualizedMaterialListProps {
	materials: any[];
	className?: string;
	cardComponent: React.ComponentType<{ material: any }>;
	loading?: boolean;
}

export function VirtualizedMaterialList({
	materials,
	className,
	cardComponent: CardComponent,
	loading = false,
}: VirtualizedMaterialListProps) {
	const renderMaterialCard = React.useCallback(
		(item: any, index: number) => <CardComponent key={index} material={item} />,
		[CardComponent],
	);

	return (
		<VirtualizedList
			items={materials}
			renderItem={renderMaterialCard}
			className={className}
			height={600}
			loading={loading}
			emptyMessage="Nenhum material encontrado"
			threshold={20} // Ativar paginação com mais de 20 itens
		/>
	);
}

/**
 * Hook para detectar quando usar virtualização
 */
export function useVirtualization(itemCount: number, threshold = 50) {
	return {
		shouldVirtualize: itemCount >= threshold,
		itemCount,
		threshold,
	};
}
