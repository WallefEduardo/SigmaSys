"use client";

import { Clock, DollarSign, Edit, Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { getProcessSectors, mockProcesses } from "@/lib/mock-data/processes";

export default function ProcessosPage() {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState("");
	const [sectorFilter, setSectorFilter] = useState("all");
	const [view, setView] = useState<"card" | "table">("card");

	const sectors = getProcessSectors();

	const filteredProcesses = mockProcesses.filter((process) => {
		const matchesSearch =
			process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			process.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			process.sector?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesSector =
			sectorFilter === "all" || process.sector === sectorFilter;
		return matchesSearch && matchesSector && process.active;
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const formatTime = (hours: number) => {
		if (hours >= 1) {
			return `${hours}h`;
		}
		const minutes = Math.round(hours * 60);
		return `${minutes}min`;
	};

	const getSectorColor = (sector: string) => {
		const colors = {
			Impressão:
				"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
			Usinagem:
				"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
			Metalurgia:
				"bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
			Montagem:
				"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
			Acabamento:
				"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
			Pintura:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
			Instalação: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
		};
		return (
			colors[sector as keyof typeof colors] || "bg-muted text-muted-foreground"
		);
	};

	const processColumns = [
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
			key: "sector",
			label: "Setor",
			render: (value: string) =>
				value ? <Badge className={getSectorColor(value)}>{value}</Badge> : "-",
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
			key: "timeUnit",
			label: "Unidade",
			render: (value: string) => value,
		},
		{
			key: "defaultTime",
			label: "Tempo Padrão",
			render: (value: number, item: any) =>
				value ? (
					<div>
						{formatTime(value)} / {item.timeUnit}
					</div>
				) : (
					"-"
				),
		},
	];

	const handleEdit = (process: any) => {
		router.push(`/cadastros/processos/${process.id}/editar`);
	};

	const handleView = (process: any) => {
		router.push(`/cadastros/processos/${process.id}`);
	};

	// Estatísticas por setor
	const sectorStats = sectors.map((sector) => {
		const sectorProcesses = filteredProcesses.filter(
			(p) => p.sector === sector,
		);
		const avgCost =
			sectorProcesses.reduce((sum, p) => sum + p.costPerHour, 0) /
			sectorProcesses.length;
		return {
			sector,
			count: sectorProcesses.length,
			avgCost: avgCost || 0,
		};
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Processos e Setores</h1>
					<p className="text-muted-foreground">
						Gerencie processos produtivos e custos por setor
					</p>
				</div>
				<Button asChild>
					<Link href="/cadastros/processos/novo">
						<Plus className="mr-2 h-4 w-4" />
						Novo Processo
					</Link>
				</Button>
			</div>

			{/* Estatísticas por Setor */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{sectorStats.slice(0, 4).map((stat) => (
					<Card key={stat.sector}>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-muted-foreground text-sm">
								{stat.sector}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{stat.count}</div>
							<div className="text-muted-foreground text-xs">
								Custo médio: {formatCurrency(stat.avgCost)}/h
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Filtros */}
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="relative flex-1">
					<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar processos por nome, descrição ou setor..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>

				<Select value={sectorFilter} onValueChange={setSectorFilter}>
					<SelectTrigger className="w-full md:w-48">
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Setor" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todos os setores</SelectItem>
						{sectors.map((sector) => (
							<SelectItem key={sector} value={sector}>
								{sector}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<ViewToggle view={view} onViewChange={setView} />
			</div>

			{filteredProcesses.length === 0 ? (
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						{searchTerm || sectorFilter !== "all"
							? "Nenhum processo encontrado com os filtros aplicados"
							: "Nenhum processo cadastrado"}
					</div>
					<Button asChild variant="outline">
						<Link href="/cadastros/processos/novo">
							Cadastrar primeiro processo
						</Link>
					</Button>
				</div>
			) : (
				<>
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>{filteredProcesses.length} processos encontrados</span>
					</div>

					{view === "card" ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredProcesses.map((process) => (
								<Card
									key={process.id}
									className="flex h-full flex-col transition-shadow hover:shadow-lg"
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<CardTitle className="line-clamp-2 text-lg leading-tight">
													{process.name}
												</CardTitle>
												{process.description && (
													<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
														{process.description}
													</p>
												)}
											</div>
											{process.sector && (
												<Badge className={getSectorColor(process.sector)}>
													{process.sector}
												</Badge>
											)}
										</div>
									</CardHeader>

									<CardContent className="flex-1 space-y-3">
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<span className="flex items-center gap-1 text-muted-foreground text-sm">
													<DollarSign className="h-3 w-3" />
													Custo/hora:
												</span>
												<span className="font-semibold text-green-600">
													{formatCurrency(process.costPerHour)}
												</span>
											</div>

											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Unidade:
												</span>
												<span className="font-medium text-sm">
													{process.timeUnit}
												</span>
											</div>

											{process.defaultTime && (
												<div className="flex items-center justify-between">
													<span className="flex items-center gap-1 text-muted-foreground text-sm">
														<Clock className="h-3 w-3" />
														Tempo padrão:
													</span>
													<span className="font-medium text-sm">
														{formatTime(process.defaultTime)} /{" "}
														{process.timeUnit}
													</span>
												</div>
											)}
										</div>

										{/* Cálculo de custo por unidade */}
										{process.defaultTime && (
											<div className="rounded bg-muted/50 p-3 text-sm">
												<div className="flex items-center justify-between">
													<span className="text-muted-foreground">
														Custo por {process.timeUnit}:
													</span>
													<span className="font-semibold text-blue-600">
														{formatCurrency(
															process.costPerHour * process.defaultTime,
														)}
													</span>
												</div>
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
												<Link href={`/cadastros/processos/${process.id}`}>
													Ver Detalhes
												</Link>
											</Button>
											<Button variant="outline" size="sm" asChild>
												<Link
													href={`/cadastros/processos/${process.id}/editar`}
												>
													<Edit className="h-4 w-4" />
												</Link>
											</Button>
										</div>
									</div>
								</Card>
							))}
						</div>
					) : (
						<DataTable
							data={filteredProcesses}
							columns={processColumns}
							onEdit={handleEdit}
							onView={handleView}
							emptyMessage="Nenhum processo encontrado"
						/>
					)}
				</>
			)}
		</div>
	);
}
