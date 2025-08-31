"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Edit, Filter, Package, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
	VirtualizedMaterialList,
} from "@/components/ui/virtualized-list";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { cacheConfig } from "@/lib/providers/query-provider";
import { api } from "@/lib/trpc";
import type { Material, MaterialFilters } from "@/lib/types/shared";
import { formatCurrency } from "@/lib/utils/currency";
import { queryUtils } from "@/lib/utils/query-utils";
import { MaterialCard } from "./components/material-card";

export default function MateriasPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [searchInput, setSearchInput] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [view, setView] = useState<"card" | "table">("card");

	// Buscar dados reais da API com cache otimizado
	const {
		data: materialsData,
		isLoading,
		error,
		refetch,
	} = api.materials.list.useQuery(
		{
			search: searchInput || undefined,
			category: categoryFilter !== "all" ? categoryFilter : undefined,
			active: true,
		},
		cacheConfig.dynamic,
	);

	// Buscar categorias disponíveis (dados mais estáticos)
	const { data: categoriesData } = api.materials.categories.useQuery(
		undefined,
		cacheConfig.static,
	);

	// Mutações CRUD com optimistic updates
	const deleteMaterial = api.materials.delete.useMutation({
		onMutate: async (variables) => {
			// Cancelar queries em andamento
			await queryClient.cancelQueries({ queryKey: ["materials"] });

			// Snapshot dos dados atuais
			const previousMaterials = queryClient.getQueryData(["materials"]);

			// Optimistic update - remover material da lista
			queryUtils.optimisticRemove(queryClient, ["materials"], variables.id);

			return { previousMaterials };
		},
		onError: (error, variables, context) => {
			// Rollback em caso de erro
			if (context?.previousMaterials) {
				queryClient.setQueryData(["materials"], context.previousMaterials);
			}
			console.error("Erro ao deletar material:", error);
		},
		onSuccess: () => {
			// Invalidar para sincronizar com servidor
			queryClient.invalidateQueries({ queryKey: ["materials"] });
		},
	});

	const materials = materialsData?.materials || [];
	const pagination = materialsData?.pagination;
	const categories = Array.isArray(categoriesData) ? categoriesData : [];

	// Implementar debounce para otimizar a busca
	const debouncedSearch = useDebounce((term: string) => {
		// A busca é reativa através do useQuery
	}, 300);

	// Usar virtualização para listas grandes
	const { shouldVirtualize } = useVirtualization(materials?.length || 0, 20);

	// Removido - usando utility function

	const materialColumns = [
		{
			key: "name",
			label: "Nome",
			render: (value: string, item: any) => (
				<div>
					<div className="font-medium">{value}</div>
					<div className="text-muted-foreground text-sm">{item.code}</div>
				</div>
			),
		},
		{
			key: "category",
			label: "Categoria",
			render: (value: string) =>
				value ? <Badge variant="outline">{value}</Badge> : "-",
		},
		{
			key: "cost",
			label: "Custo",
			render: (value: number, item: any) => (
				<div className="font-medium text-green-600">
					{formatCurrency(value)} / {item.unit}
				</div>
			),
		},
		{
			key: "inventory",
			label: "Estoque",
			render: (inventory: any[], item: any) => {
				if (!inventory || inventory.length === 0) return "-";
				
				const totalStock = inventory.reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);
				const minStock = item.minStock ? Number(item.minStock) : 0;
				
				const status = !minStock
					? "normal"
					: totalStock <= minStock
						? "low"
						: item.maxStock && totalStock >= Number(item.maxStock)
							? "high"
							: "normal";
							
				const badgeVariant =
					status === "low"
						? "destructive"
						: status === "high"
							? "secondary"
							: "default";

				return (
					<div className="flex items-center gap-2">
						<span>
							{totalStock} {item.unit}
						</span>
						{minStock > 0 && (
							<Badge variant={badgeVariant} className="text-xs">
								{status === "low" ? "Baixo" : status === "high" ? "Alto" : "OK"}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			key: "supplier",
			label: "Fornecedor",
			render: (value: string) => value || "-",
		},
	];

	const handleEdit = (material: Material) => {
		router.push(`/cadastros/materias-primas/${material.id}/editar`);
	};

	const handleView = (material: Material) => {
		router.push(`/cadastros/materias-primas/${material.id}`);
	};

	const handleDelete = async (material: Material) => {
		if (
			confirm(`Tem certeza que deseja deletar o material "${material.name}"?`)
		) {
			try {
				await deleteMaterial.mutateAsync({ id: material.id });
				// Sucesso será tratado pelo onSuccess da mutation
			} catch (error) {
				// Erro será tratado pelo onError da mutation
			}
		}
	};

	// States de loading e error
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						Erro ao carregar materiais
					</p>
					<p className="mt-1 text-muted-foreground text-sm">{error.message}</p>
					<Button onClick={() => refetch()} variant="outline" className="mt-4">
						Tentar novamente
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Matérias-Primas</h1>
					<p className="text-muted-foreground">
						Gerencie materiais, preços e estoque
					</p>
				</div>
				<Button asChild>
					<Link href="/cadastros/materias-primas/novo">
						<Plus className="mr-2 h-4 w-4" />
						Nova Matéria-Prima
					</Link>
				</Button>
			</div>

			<div className="flex flex-col gap-4 md:flex-row">
				<div className="relative flex-1">
					<Search
						className="absolute top-3 left-3 h-4 w-4 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						placeholder="Buscar materiais por nome, código ou descrição..."
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value);
							debouncedSearch(e.target.value);
						}}
						className="pl-10"
						aria-label="Campo de busca para materiais"
						aria-describedby="search-hint"
					/>
					<span id="search-hint" className="sr-only">
						Digite para buscar por nome, código ou descrição dos materiais
					</span>
				</div>

				<Select value={categoryFilter} onValueChange={setCategoryFilter}>
					<SelectTrigger className="w-full md:w-48">
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Filtrar categoria" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas categorias</SelectItem>
						{categories.map((category) => (
							<SelectItem key={category} value={category}>
								{category}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<ViewToggle view={view} onViewChange={setView} />
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<div className="animate-pulse space-y-4">
							<div className="mx-auto h-4 w-32 rounded bg-muted" />
							<div className="mx-auto h-4 w-48 rounded bg-muted" />
						</div>
						<p className="mt-2 text-muted-foreground text-sm">
							Carregando materiais...
						</p>
					</div>
				</div>
			) : materials.length === 0 ? (
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						{searchInput || categoryFilter !== "all"
							? "Nenhum material encontrado com os filtros aplicados"
							: "Nenhuma matéria-prima cadastrada"}
					</div>
					<Button asChild variant="outline">
						<Link href="/cadastros/materias-primas/novo">
							Cadastrar primeira matéria-prima
						</Link>
					</Button>
				</div>
			) : (
				<>
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>{materials.length} materiais encontrados</span>
					</div>

					{view === "card" ? (
						shouldVirtualize ? (
							<VirtualizedMaterialList
								materials={materials}
								cardComponent={MaterialCard}
								className="h-[600px]"
							/>
						) : (
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{materials.map((material) => (
									<MaterialCard key={material.id} material={material} />
								))}
							</div>
						)
					) : (
						<DataTable
							data={materials}
							columns={materialColumns}
							onEdit={handleEdit}
							onView={handleView}
							onDelete={handleDelete}
							emptyMessage="Nenhum material encontrado"
							isDeleting={deleteMaterial.isPending}
						/>
					)}
				</>
			)}
		</div>
	);
}
