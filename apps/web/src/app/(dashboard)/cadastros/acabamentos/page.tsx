"use client";

import {
	Calculator,
	Edit,
	Filter,
	Layers,
	Package,
	Plus,
	Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useDebounce } from "@/lib/hooks/useDebounce";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils/currency";

export default function AcabamentosPage() {
	const router = useRouter();
	const [searchInput, setSearchInput] = useState("");
	const [typeFilter, setTypeFilter] = useState<"all" | "simple" | "composed">(
		"all",
	);
	const [view, setView] = useState<"card" | "table">("card");

	// Buscar dados reais da API
	const {
		data: finishesData,
		isLoading,
		error,
		refetch,
	} = api.finishes.list.useQuery({
		search: searchInput || undefined,
		type: typeFilter !== "all" ? typeFilter : undefined,
		active: true,
	});

	const finishes = Array.isArray(finishesData) ? finishesData : [];

	// Debounce para busca
	const debouncedSearch = useDebounce((term: string) => {
		// A busca é reativa através do useQuery
	}, 300);

	const getTypeInfo = React.useCallback((type: string) => {
		const typeLabels: Record<string, string> = {
			simple: "Simples",
			composed: "Composto",
		};

		const label = typeLabels[type] || type;

		// Convert variant to CSS classes
		const colorClasses =
			type === "simple"
				? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
				: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";

		return { label, color: colorClasses };
	}, []);

	const finishColumns = [
		{
			key: "name",
			label: "Nome",
			render: (value: string, item: any) => (
				<div>
					<div className="font-medium">{value}</div>
					{item.description && (
						<div className="line-clamp-1 text-muted-foreground text-sm">
							{item.description}
						</div>
					)}
				</div>
			),
		},
		{
			key: "type",
			label: "Tipo",
			render: (value: string) => {
				const typeInfo = getTypeInfo(value);
				return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
			},
		},
		{
			key: "baseCost",
			label: "Custo Base",
			render: (value: number, item: any) => (
				<div className="font-medium text-red-600">
					{formatCurrency(value)} / {item.unit}
				</div>
			),
		},
		{
			key: "finalPrice",
			label: "Preço Final",
			render: (value: number, item: any) => (
				<div className="font-medium text-green-600">
					{formatCurrency(value)} / {item.unit}
				</div>
			),
		},
		{
			key: "margin",
			label: "Margem",
			render: (value: number) => (
				<div className="font-medium text-blue-600">{value}x</div>
			),
		},
		{
			key: "composition",
			label: "Composição",
			render: (value: any, item: any) => {
				if (item.type === "simple")
					return <span className="text-muted-foreground text-xs">-</span>;
				if (!value)
					return <span className="text-muted-foreground text-xs">-</span>;

				const materialsCount = value.materials?.length || 0;
				const processesCount = value.processes?.length || 0;

				return (
					<div className="text-xs">
						{materialsCount > 0 && <div>{materialsCount} materiais</div>}
						{processesCount > 0 && <div>{processesCount} processos</div>}
					</div>
				);
			},
		},
	];

	const handleEdit = (finish: any) => {
		router.push(`/cadastros/acabamentos/${finish.id}/editar`);
	};

	const handleView = (finish: any) => {
		router.push(`/cadastros/acabamentos/${finish.id}`);
	};

	// Estados de erro e loading
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						Erro ao carregar acabamentos
					</p>
					<p className="mt-1 text-muted-foreground text-sm">{error.message}</p>
					<Button onClick={() => refetch()} variant="outline" className="mt-4">
						Tentar novamente
					</Button>
				</div>
			</div>
		);
	}

	// Estatísticas com memoização
	const stats = useMemo(() => {
		return {
			total: finishes.length,
			simple: finishes.filter((f) => f.type === "simple").length,
			composed: finishes.filter((f) => f.type === "composed").length,
			avgMargin: Math.round(
				finishes.reduce((sum, f) => sum + f.margin, 0) / finishes.length || 0,
			),
		};
	}, [finishes]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Acabamentos</h1>
					<p className="text-muted-foreground">
						Gerencie acabamentos simples e compostos
					</p>
				</div>
				<Button asChild>
					<Link href="/cadastros/acabamentos/novo">
						<Plus className="mr-2 h-4 w-4" />
						Novo Acabamento
					</Link>
				</Button>
			</div>

			{/* Estatísticas */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Total
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.total}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Simples
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-blue-600">
							{stats.simple}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Compostos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-purple-600">
							{stats.composed}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Margem Média
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{stats.avgMargin}x
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filtros */}
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="relative flex-1">
					<Search
						className="absolute top-3 left-3 h-4 w-4 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						placeholder="Buscar acabamentos por nome ou descrição..."
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value);
							debouncedSearch(e.target.value);
						}}
						className="pl-10"
						aria-label="Campo de busca para acabamentos"
						aria-describedby="search-hint"
					/>
					<span id="search-hint" className="sr-only">
						Digite para buscar por nome ou descrição dos acabamentos
					</span>
				</div>

				<Select
					value={typeFilter}
					onValueChange={(value) => setTypeFilter(value as any)}
				>
					<SelectTrigger className="w-full md:w-48">
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os tipos</SelectItem>
						<SelectItem value="simple">Simples</SelectItem>
						<SelectItem value="composed">Composto</SelectItem>
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
							Carregando acabamentos...
						</p>
					</div>
				</div>
			) : finishes.length === 0 ? (
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						{searchInput || typeFilter !== "all"
							? "Nenhum acabamento encontrado com os filtros aplicados"
							: "Nenhum acabamento cadastrado"}
					</div>
					<Button asChild variant="outline">
						<Link href="/cadastros/acabamentos/novo">
							Cadastrar primeiro acabamento
						</Link>
					</Button>
				</div>
			) : (
				<>
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>{finishes.length} acabamentos encontrados</span>
					</div>

					{view === "card" ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{finishes.map((finish) => (
								<Card
									key={finish.id}
									className="flex h-full flex-col transition-shadow hover:shadow-lg"
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<CardTitle className="line-clamp-2 text-lg leading-tight">
													{finish.name}
												</CardTitle>
												{finish.description && (
													<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
														{finish.description}
													</p>
												)}
											</div>
											<Badge className={getTypeInfo(finish.type).color}>
												{getTypeInfo(finish.type).label}
											</Badge>
										</div>
									</CardHeader>

									<CardContent className="flex-1 space-y-3">
										{/* Preços */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Custo base:
												</span>
												<span className="font-medium text-red-600">
													{formatCurrency(finish.baseCost)} / {finish.unit}
												</span>
											</div>

											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Preço final:
												</span>
												<span className="font-semibold text-green-600">
													{formatCurrency(finish.finalPrice)} / {finish.unit}
												</span>
											</div>

											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Margem:
												</span>
												<span className="font-medium text-blue-600">
													{finish.margin}x
												</span>
											</div>
										</div>

										{/* Composição */}
										{finish.type === "composed" && finish.composition && (
											<div className="rounded bg-muted/50 p-3 text-sm">
												<div className="mb-2 font-medium text-muted-foreground">
													Composição:
												</div>
												<div className="space-y-1">
													{finish.composition.materials.length > 0 && (
														<div className="flex items-center gap-1">
															<Package className="h-3 w-3" />
															<span>
																{finish.composition.materials.length} materiais
															</span>
														</div>
													)}
													{finish.composition.processes.length > 0 && (
														<div className="flex items-center gap-1">
															<Layers className="h-3 w-3" />
															<span>
																{finish.composition.processes.length} processos
															</span>
														</div>
													)}
												</div>
											</div>
										)}

										{/* Tags */}
										{finish.tags && finish.tags.length > 0 && (
											<div className="flex flex-wrap gap-1">
												{finish.tags.slice(0, 3).map((tag) => (
													<Badge
														key={tag}
														variant="outline"
														className="text-xs"
													>
														{tag}
													</Badge>
												))}
												{finish.tags.length > 3 && (
													<Badge variant="outline" className="text-xs">
														+{finish.tags.length - 3}
													</Badge>
												)}
											</div>
										)}
									</CardContent>

									<div className="p-6 pt-3">
										<div className="flex w-full gap-2">
											<Button
												variant="outline"
												size="sm"
												asChild
												className="flex-1"
											>
												<Link href={`/cadastros/acabamentos/${finish.id}`}>
													<Layers className="mr-1 h-4 w-4" />
													Detalhes
												</Link>
											</Button>
											<Button variant="outline" size="sm" asChild>
												<Link
													href={`/cadastros/acabamentos/${finish.id}/editar`}
												>
													<Calculator className="h-4 w-4" />
												</Link>
											</Button>
										</div>
									</div>
								</Card>
							))}
						</div>
					) : (
						<DataTable
							data={finishes}
							columns={finishColumns}
							onEdit={handleEdit}
							onView={handleView}
							emptyMessage="Nenhum acabamento encontrado"
						/>
					)}
				</>
			)}
		</div>
	);
}
