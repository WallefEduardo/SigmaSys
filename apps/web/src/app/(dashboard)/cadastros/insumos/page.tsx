"use client";

import {
	AlertTriangle,
	Edit,
	Filter,
	Loader2,
	Plus,
	Search,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ViewToggle } from "@/components/ui/view-toggle";
import {
	useVirtualization,
	VirtualizedList,
} from "@/components/ui/virtualized-list";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils/currency";
import { ConsumableCard } from "./components/consumable-card";

export default function ConsumablesPage() {
	const router = useRouter();
	const [searchInput, setSearchInput] = useState("");
	const [typeFilter, setTypeFilter] = useState<
		"all" | "ink" | "printHead" | "tool" | "material" | "other"
	>("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [view, setView] = useState<"card" | "table">("card");

	// Buscar dados reais da API
	const {
		data: consumablesData,
		isLoading,
		error,
		refetch,
	} = api.consumables.list.useQuery({
		search: searchInput || undefined,
		type: typeFilter !== "all" ? typeFilter : undefined,
		active:
			statusFilter === "active"
				? true
				: statusFilter === "inactive"
					? false
					: undefined,
		page: 1,
		limit: 100, // Carregar todos para estatísticas
	});

	// Mutações CRUD
	const deleteConsumable = api.consumables.delete.useMutation({
		onSuccess: () => {
			refetch();
		},
		onError: (error) => {
			// Erro será exibido via toast automaticamente pela mutação
		},
	});

	const consumables = consumablesData?.data || [];
	const consumableTypes = ["ink", "printHead", "tool", "material", "other"];

	// Debounce para busca
	const debouncedSearch = useDebounce((term: string) => {
		// A busca é reativa através do useQuery
	}, 300);

	// Filtrar consumables para low_stock no frontend
	const filteredConsumables = useMemo(() => {
		if (statusFilter === "low_stock") {
			return consumables.filter(
				(consumable) => consumable.currentStock <= consumable.alertThreshold,
			);
		}
		return consumables;
	}, [consumables, statusFilter]);

	const getTypeLabel = (type: string) => {
		const types = {
			ink: "Tinta",
			printHead: "Cabeça de Impressão",
			tool: "Ferramenta",
			material: "Material",
			other: "Outro",
		};
		return types[type as keyof typeof types] || type;
	};

	const getTypeBadge = (type: string) => {
		const variants = {
			ink: {
				variant: "default" as const,
				label: "Tinta",
				className: "bg-blue-100 text-blue-800",
			},
			printHead: {
				variant: "secondary" as const,
				label: "Cabeça",
				className: "bg-purple-100 text-purple-800",
			},
			tool: {
				variant: "outline" as const,
				label: "Ferramenta",
				className: "bg-gray-100 text-gray-800",
			},
			material: {
				variant: "outline" as const,
				label: "Material",
				className: "bg-green-100 text-green-800",
			},
			other: {
				variant: "outline" as const,
				label: "Outro",
				className: "bg-orange-100 text-orange-800",
			},
		};
		return variants[type as keyof typeof variants] || variants.other;
	};

	const getStockStatus = (consumable: any) => {
		if (consumable.currentStock <= consumable.alertThreshold) {
			return { label: "Estoque Baixo", variant: "destructive" as const };
		}
		if (consumable.currentStock <= consumable.minStock) {
			return { label: "Estoque Mínimo", variant: "secondary" as const };
		}
		return { label: "Estoque OK", variant: "default" as const };
	};

	const consumableColumns = [
		{
			key: "name",
			label: "Nome",
			render: (value: string, item: any) => (
				<div>
					<div className="font-medium">{value}</div>
					<div className="text-muted-foreground text-sm">
						{item.code || "Sem código"}
					</div>
				</div>
			),
		},
		{
			key: "type",
			label: "Tipo",
			render: (value: string) => {
				const typeInfo = getTypeBadge(value);
				return <Badge className={typeInfo.className}>{typeInfo.label}</Badge>;
			},
		},
		{
			key: "currentStock",
			label: "Estoque",
			render: (value: number, item: any) => {
				const stockStatus = getStockStatus(item);
				return (
					<div className="space-y-1">
						<div className="font-medium">
							{value} {item.unit}
						</div>
						<Badge variant={stockStatus.variant} className="text-xs">
							{stockStatus.label}
						</Badge>
					</div>
				);
			},
		},
		{
			key: "cost",
			label: "Custo",
			render: (value: number, item: any) => (
				<div className="font-medium text-green-600">
					{formatCurrency(Number(value))}/{item.unit}
				</div>
			),
		},
		{
			key: "costPerM2",
			label: "Desgaste/m²",
			render: (value: number, item: any) => {
				// Só mostrar para cabeças de impressão
				if (item.type !== "printHead" || !value) {
					return <span className="text-muted-foreground text-sm">-</span>;
				}
				return (
					<div className="text-center">
						<div className="font-medium text-blue-600">
							{formatCurrency(Number(value))}
						</div>
						<div className="text-muted-foreground text-xs">por m²</div>
					</div>
				);
			},
		},
		{
			key: "supplier",
			label: "Fornecedor",
			render: (value: string) => value || "-",
		},
		{
			key: "active",
			label: "Status",
			render: (value: boolean) => (
				<Badge variant={value ? "default" : "secondary"}>
					{value ? "Ativo" : "Inativo"}
				</Badge>
			),
		},
	];

	const handleEdit = (consumable: any) => {
		router.push(`/cadastros/insumos/${consumable.id}`);
	};

	const handleView = (consumable: any) => {
		router.push(`/cadastros/insumos/${consumable.id}`);
	};

	const handleDelete = async (consumable: any) => {
		if (
			confirm(`Tem certeza que deseja excluir o insumo "${consumable.name}"?`)
		) {
			try {
				await deleteConsumable.mutateAsync({
					id: consumable.id,
				});
			} catch (error) {
				// Erro tratado pelo onError
			}
		}
	};

	// Estados de erro e loading
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="text-center">
					<AlertTriangle className="mx-auto mb-4 h-8 w-8 text-destructive" />
					<p className="font-semibold text-destructive text-lg">
						Erro ao carregar insumos
					</p>
					<p className="mt-1 text-muted-foreground text-sm">{error.message}</p>
					<Button onClick={() => refetch()} variant="outline" className="mt-4">
						Tentar novamente
					</Button>
				</div>
			</div>
		);
	}

	const statusCounts = {
		total: consumables.length,
		active: consumables.filter((c) => c.active).length,
		inactive: consumables.filter((c) => !c.active).length,
		lowStock: consumables.filter((c) => c.currentStock <= c.alertThreshold)
			.length,
		ink: consumables.filter((c) => c.type === "ink").length,
		tools: consumables.filter(
			(c) => c.type === "tool" || c.type === "printHead",
		).length,
	};

	// Usar virtualização para listas grandes
	const { shouldVirtualize } = useVirtualization(
		filteredConsumables.length,
		20,
	);

	const renderConsumableCard = React.useCallback(
		({ item }: { item: any }) => <ConsumableCard consumable={item} />,
		[],
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Insumos</h1>
					<p className="text-muted-foreground">
						Gerencie tintas, cabeças de impressão, ferramentas e materiais
					</p>
				</div>
				<Button asChild>
					<Link href="/cadastros/insumos/novo">
						<Plus className="mr-2 h-4 w-4" />
						Novo Insumo
					</Link>
				</Button>
			</div>

			{/* Status Cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-6">
				<div className="rounded-lg bg-muted/50 p-4">
					<div className="font-bold text-2xl">{statusCounts.total}</div>
					<div className="text-muted-foreground text-sm">Total</div>
				</div>
				<div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
					<div className="font-bold text-2xl text-green-600">
						{statusCounts.active}
					</div>
					<div className="text-green-600 text-sm">Ativos</div>
				</div>
				<div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
					<div className="font-bold text-2xl text-red-600">
						{statusCounts.lowStock}
					</div>
					<div className="text-red-600 text-sm">Estoque Baixo</div>
				</div>
				<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
					<div className="font-bold text-2xl text-blue-600">
						{statusCounts.ink}
					</div>
					<div className="text-blue-600 text-sm">Tintas</div>
				</div>
				<div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950/20">
					<div className="font-bold text-2xl text-purple-600">
						{statusCounts.tools}
					</div>
					<div className="text-purple-600 text-sm">Ferramentas</div>
				</div>
				<div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-950/20">
					<div className="font-bold text-2xl text-gray-600">
						{statusCounts.inactive}
					</div>
					<div className="text-gray-600 text-sm">Inativos</div>
				</div>
			</div>

			{/* Filtros */}
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="relative flex-1">
					<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar insumos por nome, código ou fornecedor..."
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value);
							debouncedSearch(e.target.value);
						}}
						className="pl-10"
						aria-label="Campo de busca para insumos"
					/>
				</div>

				<Select
					value={typeFilter}
					onValueChange={(value) => setTypeFilter(value as any)}
				>
					<SelectTrigger className="w-full md:w-48">
						<Settings className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os tipos</SelectItem>
						<SelectItem value="ink">Tinta</SelectItem>
						<SelectItem value="printHead">Cabeça de Impressão</SelectItem>
						<SelectItem value="tool">Ferramenta</SelectItem>
						<SelectItem value="material">Material</SelectItem>
						<SelectItem value="other">Outro</SelectItem>
					</SelectContent>
				</Select>

				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-full md:w-48">
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os status</SelectItem>
						<SelectItem value="active">Ativos</SelectItem>
						<SelectItem value="inactive">Inativos</SelectItem>
						<SelectItem value="low_stock">Estoque Baixo</SelectItem>
					</SelectContent>
				</Select>

				<ViewToggle view={view} onViewChange={setView} />
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">
							Carregando insumos...
						</p>
					</div>
				</div>
			) : filteredConsumables.length === 0 ? (
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						{searchInput || typeFilter !== "all" || statusFilter !== "all"
							? "Nenhum insumo encontrado com os filtros aplicados"
							: "Nenhum insumo cadastrado"}
					</div>
					<Button asChild variant="outline">
						<Link href="/cadastros/insumos/novo">
							Cadastrar primeiro insumo
						</Link>
					</Button>
				</div>
			) : (
				<>
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>{filteredConsumables.length} insumos encontrados</span>
					</div>

					{view === "card" ? (
						shouldVirtualize ? (
							<VirtualizedList
								items={filteredConsumables}
								itemHeight={280}
								renderItem={renderConsumableCard}
								className="h-[600px]"
								threshold={20}
								emptyMessage="Nenhum insumo encontrado"
							/>
						) : (
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{filteredConsumables.map((consumable) => (
									<ConsumableCard key={consumable.id} consumable={consumable} />
								))}
							</div>
						)
					) : (
						<DataTable
							data={filteredConsumables}
							columns={consumableColumns}
							onEdit={handleEdit}
							onView={handleView}
							onDelete={handleDelete}
							emptyMessage="Nenhum insumo encontrado"
							isDeleting={deleteConsumable.isPending}
						/>
					)}
				</>
			)}
		</div>
	);
}
