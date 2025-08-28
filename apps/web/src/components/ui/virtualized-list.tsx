"use client";

import * as React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import {
	FixedSizeList,
	type ListChildComponentProps,
	VariableSizeList,
} from "react-window";
import { cn } from "@/lib/utils";

interface VirtualizedListProps<T = any> {
	items: T[];
	itemHeight: number | ((index: number) => number);
	renderItem: (
		props: ListChildComponentProps & { item: T },
	) => React.ReactElement;
	className?: string;
	height?: number;
	width?: string | number;
	overscanCount?: number;
	threshold?: number; // Limiar para ativar virtualização
	emptyMessage?: string;
	loading?: boolean;
	onScroll?: (scrollTop: number) => void;
}

/**
 * Lista virtualizada para performance com grandes datasets
 * Só ativa virtualização se exceder o threshold (padrão: 50 itens)
 */
export function VirtualizedList<T = any>({
	items,
	itemHeight,
	renderItem,
	className,
	height = 400,
	width = "100%",
	overscanCount = 5,
	threshold = 50,
	emptyMessage = "Nenhum item encontrado",
	loading = false,
	onScroll,
}: VirtualizedListProps<T>) {
	const containerRef = React.useRef<HTMLDivElement>(null);

	// Se tiver poucos itens, renderizar lista normal
	if (items.length < threshold) {
		return (
			<div className={cn("space-y-2", className)} style={{ height, width }}>
				{loading && (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground text-sm">Carregando...</div>
					</div>
				)}

				{!loading && items.length === 0 && (
					<div className="flex items-center justify-center py-8">
						<div className="text-muted-foreground text-sm">{emptyMessage}</div>
					</div>
				)}

				{!loading &&
					items.map((item, index) => {
						const mockProps: ListChildComponentProps = {
							index,
							style: {},
							data: items,
							isScrolling: false,
						};

						return <div key={index}>{renderItem({ ...mockProps, item })}</div>;
					})}
			</div>
		);
	}

	// Para listas grandes, usar virtualização
	const isVariableHeight = typeof itemHeight === "function";

	const handleScroll = React.useCallback(
		({ scrollTop }: { scrollTop: number }) => {
			onScroll?.(scrollTop);
		},
		[onScroll],
	);

	if (loading) {
		return (
			<div
				className={cn("flex items-center justify-center", className)}
				style={{ height, width }}
			>
				<div className="text-muted-foreground text-sm">Carregando...</div>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div
				className={cn("flex items-center justify-center", className)}
				style={{ height, width }}
			>
				<div className="text-muted-foreground text-sm">{emptyMessage}</div>
			</div>
		);
	}

	const itemRenderer = React.useCallback(
		(props: ListChildComponentProps) => {
			const item = items[props.index];
			return renderItem({ ...props, item });
		},
		[items, renderItem],
	);

	return (
		<div ref={containerRef} className={className} style={{ height, width }}>
			<AutoSizer>
				{({ height: autoHeight, width: autoWidth }) => {
					if (isVariableHeight) {
						return (
							<VariableSizeList
								height={autoHeight}
								width={autoWidth}
								itemCount={items.length}
								itemSize={itemHeight as (index: number) => number}
								itemData={items}
								overscanCount={overscanCount}
								onScroll={handleScroll}
							>
								{itemRenderer}
							</VariableSizeList>
						);
					}

					return (
						<FixedSizeList
							height={autoHeight}
							width={autoWidth}
							itemCount={items.length}
							itemSize={itemHeight as number}
							itemData={items}
							overscanCount={overscanCount}
							onScroll={handleScroll}
						>
							{itemRenderer}
						</FixedSizeList>
					);
				}}
			</AutoSizer>
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
		({ index, style, item }: ListChildComponentProps & { item: any }) => (
			<div style={style} className="p-2">
				<CardComponent material={item} />
			</div>
		),
		[CardComponent],
	);

	return (
		<VirtualizedList
			items={materials}
			itemHeight={180} // Altura aproximada do MaterialCard
			renderItem={renderMaterialCard}
			className={className}
			height={600}
			loading={loading}
			emptyMessage="Nenhum material encontrado"
			threshold={20} // Ativar virtualização com mais de 20 itens
		/>
	);
}

/**
 * Grid virtualizado para layout de cards
 */
interface VirtualizedGridProps<T = any> {
	items: T[];
	itemHeight: number;
	itemsPerRow: number;
	renderItem: (item: T, index: number) => React.ReactElement;
	className?: string;
	height?: number;
	gap?: number;
	loading?: boolean;
	emptyMessage?: string;
}

export function VirtualizedGrid<T = any>({
	items,
	itemHeight,
	itemsPerRow,
	renderItem,
	className,
	height = 600,
	gap = 16,
	loading = false,
	emptyMessage = "Nenhum item encontrado",
}: VirtualizedGridProps<T>) {
	// Agrupar itens por linha
	const rows = React.useMemo(() => {
		const grouped = [];
		for (let i = 0; i < items.length; i += itemsPerRow) {
			grouped.push(items.slice(i, i + itemsPerRow));
		}
		return grouped;
	}, [items, itemsPerRow]);

	const renderRow = React.useCallback(
		({ index, style }: ListChildComponentProps) => {
			const row = rows[index];

			return (
				<div style={style} className="flex gap-4 px-4">
					{row.map((item, itemIndex) => {
						const globalIndex = index * itemsPerRow + itemIndex;
						return (
							<div key={globalIndex} className="flex-1">
								{renderItem(item, globalIndex)}
							</div>
						);
					})}
					{/* Preencher espaços vazios na última linha */}
					{row.length < itemsPerRow &&
						Array(itemsPerRow - row.length)
							.fill(null)
							.map((_, emptyIndex) => (
								<div key={`empty-${emptyIndex}`} className="flex-1" />
							))}
				</div>
			);
		},
		[rows, itemsPerRow, renderItem],
	);

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
		<div className={className} style={{ height }}>
			<AutoSizer>
				{({ height: autoHeight, width }) => (
					<FixedSizeList
						height={autoHeight}
						width={width}
						itemCount={rows.length}
						itemSize={itemHeight + gap}
						overscanCount={2}
					>
						{renderRow}
					</FixedSizeList>
				)}
			</AutoSizer>
		</div>
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

/**
 * Hook para calcular itemsPerRow responsivo
 */
export function useResponsiveGrid(containerWidth: number) {
	return React.useMemo(() => {
		if (containerWidth < 640) return 1; // Mobile
		if (containerWidth < 1024) return 2; // Tablet
		if (containerWidth < 1280) return 3; // Desktop
		return 4; // Large desktop
	}, [containerWidth]);
}
