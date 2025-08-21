"use client";

import { Edit, Filter, Package, Plus, Search } from "lucide-react";
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
import {
	getMaterialCategories,
	mockMaterials,
} from "@/lib/mock-data/materials";
import { MaterialCard } from "./components/material-card";

export default function MateriasPage() {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [view, setView] = useState<"card" | "table">("card");

	const categories = getMaterialCategories();

	const filteredMaterials = mockMaterials.filter((material) => {
		const matchesSearch =
			material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			material.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			material.description?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory =
			categoryFilter === "all" || material.category === categoryFilter;
		return matchesSearch && matchesCategory && material.active;
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

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
			key: "stock",
			label: "Estoque",
			render: (value: number, item: any) => {
				if (!value && value !== 0) return "-";
				const status = !item.minStock
					? "normal"
					: value <= item.minStock
						? "low"
						: item.maxStock && value >= item.maxStock
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
							{value} {item.unit}
						</span>
						<Badge variant={badgeVariant} className="text-xs">
							{status === "low" ? "Baixo" : status === "high" ? "Alto" : "OK"}
						</Badge>
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

	const handleEdit = (material: any) => {
		router.push(`/cadastros/materias-primas/${material.id}/editar`);
	};

	const handleView = (material: any) => {
		router.push(`/cadastros/materias-primas/${material.id}`);
	};

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
					<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar materiais por nome, código ou descrição..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
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

			{filteredMaterials.length === 0 ? (
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						{searchTerm || categoryFilter !== "all"
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
						<span>{filteredMaterials.length} materiais encontrados</span>
					</div>

					{view === "card" ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredMaterials.map((material) => (
								<MaterialCard key={material.id} material={material} />
							))}
						</div>
					) : (
						<DataTable
							data={filteredMaterials}
							columns={materialColumns}
							onEdit={handleEdit}
							onView={handleView}
							emptyMessage="Nenhum material encontrado"
						/>
					)}
				</>
			)}
		</div>
	);
}
