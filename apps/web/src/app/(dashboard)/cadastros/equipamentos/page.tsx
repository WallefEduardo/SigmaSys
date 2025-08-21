"use client";

import { Edit, Filter, Plus, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { getEquipmentTypes, mockEquipments } from "@/lib/mock-data/equipments";
import { EquipmentCard } from "./components/equipment-card";

export default function EquipamentosPage() {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState("");
	const [typeFilter, setTypeFilter] = useState<
		"all" | "printing" | "machining"
	>("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [view, setView] = useState<"card" | "table">("card");

	const equipmentTypes = getEquipmentTypes();
	const statusOptions = ["available", "maintenance", "in_use", "broken"];

	const filteredEquipments = mockEquipments.filter((equipment) => {
		const matchesSearch =
			equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			equipment.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			equipment.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType = typeFilter === "all" || equipment.type === typeFilter;
		const matchesStatus =
			statusFilter === "all" || equipment.status === statusFilter;
		return matchesSearch && matchesType && matchesStatus && equipment.active;
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

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
			key: "costPerHour",
			label: "Custo/Hora",
			render: (value: number) => (
				<div className="font-medium text-green-600">
					{formatCurrency(value)}
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

	const statusCounts = {
		total: filteredEquipments.length,
		available: filteredEquipments.filter((e) => e.status === "available")
			.length,
		maintenance: filteredEquipments.filter((e) => e.status === "maintenance")
			.length,
		in_use: filteredEquipments.filter((e) => e.status === "in_use").length,
		broken: filteredEquipments.filter((e) => e.status === "broken").length,
	};

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
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
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

			{filteredEquipments.length === 0 ? (
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						{searchTerm || typeFilter !== "all" || statusFilter !== "all"
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
						<span>{filteredEquipments.length} equipamentos encontrados</span>
					</div>

					{view === "card" ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredEquipments.map((equipment) => (
								<EquipmentCard key={equipment.id} equipment={equipment} />
							))}
						</div>
					) : (
						<DataTable
							data={filteredEquipments}
							columns={equipmentColumns}
							onEdit={handleEdit}
							onView={handleView}
							emptyMessage="Nenhum equipamento encontrado"
						/>
					)}
				</>
			)}
		</div>
	);
}
