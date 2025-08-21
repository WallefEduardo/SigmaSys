"use client";

import {
	Building2,
	Filter,
	Loader2,
	MoreHorizontal,
	Package,
	Plus,
	Search,
	ShoppingCart,
	Users,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";

export default function EmpresasPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [planFilter, setPlanFilter] = useState<string>("all");
	const [page, setPage] = useState(1);

	// Queries
	const {
		data: companiesData,
		isLoading: loadingCompanies,
		refetch,
	} = api.companies.list.useQuery({
		page,
		limit: 10,
		search: searchTerm || undefined,
		planId: planFilter === "all" ? undefined : planFilter,
		active: statusFilter === "all" ? undefined : statusFilter === "active",
	});

	const { data: plans, isLoading: loadingPlans } =
		api.companies.plans.useQuery();

	// Mutations
	const toggleActiveMutation = api.companies.toggleActive.useMutation({
		onSuccess: () => {
			toast({
				title: "Status alterado",
				description: "O status da empresa foi alterado com sucesso.",
			});
			refetch();
		},
		onError: (error) => {
			toast({
				title: "Erro",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const handleToggleActive = async (id: string, active: boolean) => {
		if (
			confirm(
				`Tem certeza que deseja ${active ? "ativar" : "desativar"} esta empresa?`,
			)
		) {
			toggleActiveMutation.mutate({ id, active });
		}
	};

	const companies = companiesData?.companies || [];
	const pagination = companiesData?.pagination;

	const stats = {
		total: pagination?.total || 0,
		active: companies.filter((c) => c.active).length,
		inactive: companies.filter((c) => !c.active).length,
		trial: companies.filter((c) => c.plan?.name.toLowerCase().includes("trial"))
			.length,
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Empresas</h1>
					<p className="text-muted-foreground">
						Gerencie todas as empresas do sistema
					</p>
				</div>
				<Button asChild>
					<Link href="/superadmin/empresas/nova">
						<Plus className="mr-2 h-4 w-4" />
						Nova Empresa
					</Link>
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total de Empresas
						</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.total}</div>
						<p className="text-muted-foreground text-xs">
							{stats.active} ativas, {stats.inactive} inativas
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Empresas Ativas
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.active}</div>
						<p className="text-muted-foreground text-xs">
							{((stats.active / stats.total) * 100).toFixed(1)}% do total
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Em Trial</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.trial}</div>
						<p className="text-muted-foreground text-xs">
							Precisam converter para plano pago
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Receita Potencial
						</CardTitle>
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">R$ 24.5k</div>
						<p className="text-muted-foreground text-xs">
							+12% em relação ao mês anterior
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4 md:flex-row md:items-center">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar por nome, CNPJ ou email..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>

						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-full md:w-48">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos os status</SelectItem>
								<SelectItem value="active">Ativas</SelectItem>
								<SelectItem value="inactive">Inativas</SelectItem>
							</SelectContent>
						</Select>

						<Select value={planFilter} onValueChange={setPlanFilter}>
							<SelectTrigger className="w-full md:w-48">
								<SelectValue placeholder="Plano" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos os planos</SelectItem>
								{plans?.map((plan) => (
									<SelectItem key={plan.id} value={plan.id}>
										{plan.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle>Lista de Empresas ({companies.length})</CardTitle>
				</CardHeader>
				<CardContent>
					{loadingCompanies ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Empresa</TableHead>
										<TableHead>Plano</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Usuários</TableHead>
										<TableHead>Clientes</TableHead>
										<TableHead>Trial</TableHead>
										<TableHead>Criada em</TableHead>
										<TableHead className="w-12" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{companies.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={8}
												className="py-8 text-center text-muted-foreground"
											>
												Nenhuma empresa encontrada
											</TableCell>
										</TableRow>
									) : (
										companies.map((company) => (
											<TableRow key={company.id}>
												<TableCell>
													<div>
														<div className="font-medium">{company.name}</div>
														{company.cnpj && (
															<div className="text-muted-foreground text-sm">
																{company.cnpj}
															</div>
														)}
														{company.email && (
															<div className="text-muted-foreground text-sm">
																{company.email}
															</div>
														)}
													</div>
												</TableCell>
												<TableCell>
													{company.plan ? (
														<Badge className="border-primary/20 bg-primary/10 text-primary">
															{company.plan.name}
														</Badge>
													) : (
														<Badge variant="outline">Sem plano</Badge>
													)}
												</TableCell>
												<TableCell>
													<Badge
														variant={company.active ? "default" : "secondary"}
													>
														{company.active ? "Ativa" : "Inativa"}
													</Badge>
												</TableCell>
												<TableCell>{company._count.users}</TableCell>
												<TableCell>{company._count.clients}</TableCell>
												<TableCell>
													{company.trialEndsAt ? (
														<div className="text-sm">
															<div>Até {formatDate(company.trialEndsAt)}</div>
															<div className="text-muted-foreground text-xs">
																{new Date(company.trialEndsAt) > new Date() ? (
																	<span className="text-amber-600">
																		Em trial
																	</span>
																) : (
																	<span className="text-red-600">
																		Trial expirado
																	</span>
																)}
															</div>
														</div>
													) : (
														<span className="text-muted-foreground">N/A</span>
													)}
												</TableCell>
												<TableCell>{formatDate(company.createdAt)}</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon">
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuLabel>Ações</DropdownMenuLabel>
															<DropdownMenuItem asChild>
																<Link
																	href={`/superadmin/empresas/${company.id}`}
																>
																	Ver detalhes
																</Link>
															</DropdownMenuItem>
															<DropdownMenuItem asChild>
																<Link
																	href={`/superadmin/empresas/${company.id}/editar`}
																>
																	Editar
																</Link>
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																className={
																	company.active
																		? "text-red-600"
																		: "text-green-600"
																}
																onClick={() =>
																	handleToggleActive(
																		company.id,
																		!company.active,
																	)
																}
																disabled={toggleActiveMutation.isLoading}
															>
																{toggleActiveMutation.isLoading ? (
																	<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																) : null}
																{company.active ? "Desativar" : "Ativar"}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
