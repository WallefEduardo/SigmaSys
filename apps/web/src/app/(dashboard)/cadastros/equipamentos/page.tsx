"use client";

import { Edit, Filter, Plus, Search, Settings } from "lucide-react";
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
import { EquipmentCard } from "./components/equipment-card";

export default function EquipamentosPage() {
	const router = useRouter();
	const [searchInput, setSearchInput] = useState("");
	const [typeFilter, setTypeFilter] = useState<
		"all" | "printing" | "machining"
	>("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [view, setView] = useState<"card" | "table">("card");

	// Buscar dados reais da API
	const {
		data: equipmentsData,
		isLoading,
		error,
		refetch,
	} = api.equipments.list.useQuery({
		search: searchInput || undefined,
		type: typeFilter !== "all" ? typeFilter : undefined,
		status: statusFilter !== "all" ? statusFilter : undefined,
		active: true,
	});

	// Mutações CRUD
	const deleteEquipment = api.equipments.deactivate.useMutation({
		onSuccess: () => {
			// Refetch a lista após desativar
			refetch();
		},
		onError: (error) => {
			// Erro será exibido via toast automaticamente pela mutação
		},
	});

	// A API retorna uma estrutura paginada: { equipments: [...], pagination: {...} }
	const equipments = equipmentsData?.equipments || [];
	const equipmentTypes = ["printing", "machining"];
	const statusOptions = ["available", "maintenance", "in_use", "broken"];

	// Debounce para busca
	const debouncedSearch = useDebounce((term: string) => {
		// A busca é reativa através do useQuery
	}, 300);

	// Usando utility function de formatação

	const getStatusBadge = (status: string) => {
		const variants = {
			available: { variant: "default" as const, label: "Disponível" },
			maintenance: { variant: "secondary" as const, label: "Manutenção" },
			in_use: { variant: "destructive" as const, label: "Em Uso" },
			broken: { variant: "destructive" as const, label: "Quebrado" },
		};
		return variants[status as keyof typeof variants] || variants.available;
	};

	const equipmentColumns = [
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
			key: "type",
			label: "Tipo",
			render: (value: string) => (
				<Badge
					className={
						value === "printing"
							? "bg-blue-100 text-blue-800"
							: "bg-purple-100 text-purple-800"
					}
				>
					{value === "printing" ? "Impressão" : "Usinagem"}
				</Badge>
			),
		},
		{
			key: "status",
			label: "Status",
			render: (value: string) => {
				const statusInfo = getStatusBadge(value);
				return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
			},
		},
		{
			key: "totalCostPerM2",
			label: "Custo Total",
			render: (value: number, item: any) => (
				<div className="flex items-center gap-2">
					{item.totalCostPerM2 && item.totalCostPerM2 > 0 ? (
						<>
							<span className="font-medium text-green-600">
								{formatCurrency(item.totalCostPerM2)}/m²
							</span>
							{item.costBreakdown?.isComplete ? (
								<Badge variant="default" className="text-xs">
									Total
								</Badge>
							) : (
								<Badge variant="secondary" className="text-xs">
									Parcial
								</Badge>
							)}
						</>
					) : (
						<>
							<span className="font-medium text-orange-600">
								{item.calculatedCostPerM2
									? formatCurrency(item.calculatedCostPerM2) + "/m²"
									: item.calculatedCostPerHour
										? formatCurrency(item.calculatedCostPerHour) + "/h"
										: "Não calculado"}
							</span>
							<Badge variant="outline" className="text-xs">
								Incompleto
							</Badge>
						</>
					)}
				</div>
			),
		},
		{
			key: "manufacturer",
			label: "Fabricante",
			render: (value: string) => value || "-",
		},
		{
			key: "location",
			label: "Localização",
			render: (value: string) => value || "-",
		},
	];

	const handleEdit = (equipment: any) => {
		router.push(`/cadastros/equipamentos/${equipment.id}/editar`);
	};

	const handleView = (equipment: any) => {
		router.push(`/cadastros/equipamentos/${equipment.id}`);
	};

	const handleDelete = async (equipment: any) => {
		if (
			confirm(
				`Tem certeza que deseja desativar o equipamento "${equipment.name}"?`,
			)
		) {
			try {
				await deleteEquipment.mutateAsync({
					id: equipment.id,
					reason: "Desativado pelo usuário",
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
					<p className="font-semibold text-destructive text-lg">
						Erro ao carregar equipamentos
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
		total: equipments.length,
		available: equipments.filter((e) => e.status === "available").length,
		maintenance: equipments.filter((e) => e.status === "maintenance").length,
		in_use: equipments.filter((e) => e.status === "in_use").length,
		broken: equipments.filter((e) => e.status === "broken").length,
	};

	// Usar virtualização para listas grandes
	const { shouldVirtualize } = useVirtualization(equipments.length, 20);

	const renderEquipmentCard = React.useCallback(
		({ item }: { item: any }) => (
			<EquipmentCard equipment={item} onDelete={handleDelete} />
		),
		[],
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Equipamentos</h1>
					<p className="text-muted-foreground">
						Gerencie máquinas, impressoras e equipamentos
					</p>
				</div>
				<Button asChild>
					<Link href="/cadastros/equipamentos/novo">
						<Plus className="mr-2 h-4 w-4" />
						Novo Equipamento
					</Link>
				</Button>
			</div>

			{/* Status Cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
				<div className="rounded-lg bg-muted/50 p-4">
					<div className="font-bold text-2xl">{statusCounts.total}</div>
					<div className="text-muted-foreground text-sm">Total</div>
				</div>
				<div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
					<div className="font-bold text-2xl text-green-600">
						{statusCounts.available}
					</div>
					<div className="text-green-600 text-sm">Disponível</div>
				</div>
				<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
					<div className="font-bold text-2xl text-blue-600">
						{statusCounts.in_use}
					</div>
					<div className="text-blue-600 text-sm">Em Uso</div>
				</div>
				<div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950/20">
					<div className="font-bold text-2xl text-yellow-600">
						{statusCounts.maintenance}
					</div>
					<div className="text-sm text-yellow-600">Manutenção</div>
				</div>
				<div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
					<div className="font-bold text-2xl text-red-600">
						{statusCounts.broken}
					</div>
					<div className="text-red-600 text-sm">Quebrado</div>
				</div>
			</div>

			{/* Filtros */}
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="relative flex-1">
					<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar equipamentos por nome, código ou fabricante..."
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value);
							debouncedSearch(e.target.value);
						}}
						className="pl-10"
						aria-label="Campo de busca para equipamentos"
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
						<SelectItem value="printing">Impressão</SelectItem>
						<SelectItem value="machining">Usinagem</SelectItem>
					</SelectContent>
				</Select>

				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-full md:w-48">
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os status</SelectItem>
						{statusOptions.map((status) => {
							const statusInfo = getStatusBadge(status);
							return (
								<SelectItem key={status} value={status}>
									{statusInfo.label}
								</SelectItem>
							);
						})}
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
							Carregando equipamentos...
						</p>
					</div>
				</div>
			) : equipments.length === 0 ? (
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						{searchInput || typeFilter !== "all" || statusFilter !== "all"
							? "Nenhum equipamento encontrado com os filtros aplicados"
							: "Nenhum equipamento cadastrado"}
					</div>
					<Button asChild variant="outline">
						<Link href="/cadastros/equipamentos/novo">
							Cadastrar primeiro equipamento
						</Link>
					</Button>
				</div>
			) : (
				<>
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>{equipments.length} equipamentos encontrados</span>
					</div>

					{view === "card" ? (
						shouldVirtualize ? (
							<VirtualizedList
								items={equipments}
								itemHeight={280}
								renderItem={renderEquipmentCard}
								className="h-[600px]"
								threshold={20}
								emptyMessage="Nenhum equipamento encontrado"
							/>
						) : (
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
								{equipments.map((equipment) => (
									<EquipmentCard
										key={equipment.id}
										equipment={equipment}
										onDelete={handleDelete}
									/>
								))}
							</div>
						)
					) : (
						<DataTable
							data={equipments}
							columns={equipmentColumns}
							onEdit={handleEdit}
							onView={handleView}
							onDelete={handleDelete}
							emptyMessage="Nenhum equipamento encontrado"
							isDeleting={deleteEquipment.isPending}
						/>
					)}
				</>
			)}
		</div>
	);
}
