"use client";

import {
	Building2,
	Calendar,
	Eye,
	Mail,
	MapPin,
	MoreHorizontal,
	Phone,
	Plus,
	Search,
	Star,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import {
	statusColors,
	statusLabels,
	typeLabels,
} from "@/lib/mock-data/clients";
import { api } from "@/lib/trpc";

export default function ClientsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [segmentFilter, setSegmentFilter] = useState<string>("all");
	const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
	const [viewingClient, setViewingClient] = useState<any>(null);
	const [page, setPage] = useState(1);

	// tRPC queries
	const {
		data: clientsData,
		isLoading,
		refetch,
	} = api.clients.list.useQuery({
		page,
		limit: 10,
		search: searchTerm || undefined,
		type:
			typeFilter !== "all" ? (typeFilter as "person" | "company") : undefined,
		status:
			statusFilter !== "all"
				? (statusFilter as "active" | "inactive" | "prospect" | "lead")
				: undefined,
		segment: segmentFilter !== "all" ? segmentFilter : undefined,
	});

	const { data: clientStats } = api.clients.stats.useQuery();

	const deactivateClientMutation = api.clients.deactivate.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const clients = clientsData?.clients || [];
	const pagination = clientsData?.pagination;

	const handleView = (client: any) => {
		setViewingClient(client);
		setIsViewDialogOpen(true);
	};

	const handleToggleStatus = (clientId: string) => {
		deactivateClientMutation.mutate({ id: clientId });
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	// Get unique segments for filter
	const uniqueSegments = [
		...new Set(clients.map((c) => c.segment).filter(Boolean)),
	];

	if (isLoading) {
		return (
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex h-32 items-center justify-center">
					<div className="text-muted-foreground">Carregando clientes...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="font-bold text-3xl tracking-tight">
					CRM - Gestão de Clientes
				</h2>
				<div className="flex items-center space-x-2">
					<Button asChild>
						<Link href="/cadastros/clientes/novo">
							<Plus className="mr-2 h-4 w-4" />
							Novo Cliente
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total de Clientes
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{clientStats?.totalClients || 0}
						</div>
						<p className="text-muted-foreground text-xs">
							{clientStats?.activeClients || 0} ativos
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Prospects</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{clientStats?.prospects || 0}
						</div>
						<p className="text-muted-foreground text-xs">
							Oportunidades ativas
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Leads</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{clientStats?.leads || 0}</div>
						<p className="text-muted-foreground text-xs">Qualificados</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Segmentos</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{clientStats?.topSegments?.length || 0}
						</div>
						<p className="text-muted-foreground text-xs">Principais setores</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Aniversariantes
						</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{clientStats?.birthdays?.length || 0}
						</div>
						<p className="text-muted-foreground text-xs">Este mês</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Buscar clientes..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-8"
								/>
							</div>
						</div>
						<div className="w-full md:w-[160px]">
							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos os tipos</SelectItem>
									<SelectItem value="person">Pessoa Física</SelectItem>
									<SelectItem value="company">Pessoa Jurídica</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="w-full md:w-[160px]">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos status</SelectItem>
									<SelectItem value="active">Ativo</SelectItem>
									<SelectItem value="inactive">Inativo</SelectItem>
									<SelectItem value="prospect">Prospect</SelectItem>
									<SelectItem value="lead">Lead</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="w-full md:w-[160px]">
							<Select value={segmentFilter} onValueChange={setSegmentFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Segmento" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos segmentos</SelectItem>
									{uniqueSegments.map((segment) => (
										<SelectItem key={segment} value={segment!}>
											{segment}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Clients Table */}
			<Card>
				<CardHeader>
					<CardTitle>Clientes ({clients.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Cliente</TableHead>
								<TableHead>Tipo</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Segmento</TableHead>
								<TableHead>Avaliação</TableHead>
								<TableHead>Orçamentos</TableHead>
								<TableHead>Pedidos</TableHead>
								<TableHead className="text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{clients.map((client: any) => (
								<TableRow key={client.id}>
									<TableCell className="font-medium">
										<div>
											<div className="font-medium">{client.name}</div>
											<div className="text-muted-foreground text-sm">
												{client.email}
											</div>
											{client.document && (
												<div className="text-muted-foreground text-xs">
													{client.document}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{typeLabels[client.type as keyof typeof typeLabels]}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											className={
												statusColors[client.status as keyof typeof statusColors]
											}
										>
											{statusLabels[client.status as keyof typeof statusLabels]}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="text-sm">{client.segment || "-"}</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center">
											{client.rating ? (
												<>
													<Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
													<span>{client.rating}</span>
												</>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</div>
									</TableCell>
									<TableCell>{client._count?.quotes || 0}</TableCell>
									<TableCell>{client._count?.orders || 0}</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleView(client)}
											>
												<Eye className="h-4 w-4" />
											</Button>
											<Button variant="outline" size="sm" asChild>
												<Link href={`/cadastros/clientes/${client.id}/editar`}>
													Editar
												</Link>
											</Button>
											<Button
												variant={client.active ? "destructive" : "default"}
												size="sm"
												onClick={() => handleToggleStatus(client.id)}
												disabled={deactivateClientMutation.isPending}
											>
												{client.active ? "Desativar" : "Ativar"}
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Client Details View Dialog */}
			<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
					<DialogHeader>
						<DialogTitle>Detalhes do Cliente</DialogTitle>
						<DialogDescription>
							Informações completas e histórico de interações
						</DialogDescription>
					</DialogHeader>
					{viewingClient && (
						<div className="grid gap-6 py-4">
							{/* Basic Info */}
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">
											Informações Básicas
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<div>
											<strong>Nome:</strong> {viewingClient.name}
										</div>
										<div>
											<strong>Tipo:</strong>{" "}
											{
												typeLabels[
													viewingClient.type as keyof typeof typeLabels
												]
											}
										</div>
										<div>
											<strong>Email:</strong>{" "}
											{viewingClient.email || "Não informado"}
										</div>
										<div>
											<strong>Telefone:</strong>{" "}
											{viewingClient.phone || "Não informado"}
										</div>
										<div>
											<strong>Documento:</strong>{" "}
											{viewingClient.document || "Não informado"}
										</div>
										<div>
											<strong>Segmento:</strong>{" "}
											{viewingClient.segment || "Não informado"}
										</div>
										<div>
											<strong>Status:</strong>
											<Badge
												className={`ml-2 ${statusColors[viewingClient.status as keyof typeof statusColors]}`}
											>
												{
													statusLabels[
														viewingClient.status as keyof typeof statusLabels
													]
												}
											</Badge>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Estatísticas</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<div>
											<strong>Orçamentos:</strong>{" "}
											{viewingClient._count?.quotes || 0}
										</div>
										<div>
											<strong>Pedidos:</strong>{" "}
											{viewingClient._count?.orders || 0}
										</div>
										<div>
											<strong>Interações:</strong>{" "}
											{viewingClient._count?.interactions || 0}
										</div>
										<div>
											<strong>Avaliação:</strong>
											{viewingClient.rating ? (
												<div className="ml-2 flex inline-flex items-center">
													<Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
													<span>{viewingClient.rating}</span>
												</div>
											) : (
												<span className="ml-2">Não avaliado</span>
											)}
										</div>
										<div>
											<strong>Limite de Crédito:</strong>{" "}
											{viewingClient.creditLimit
												? formatCurrency(viewingClient.creditLimit)
												: "Não definido"}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Address */}
							{viewingClient.address && (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Endereço</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-sm">
											{viewingClient.address.street},{" "}
											{viewingClient.address.number}
											{viewingClient.address.complement &&
												`, ${viewingClient.address.complement}`}
											<br />
											{viewingClient.address.neighborhood} -{" "}
											{viewingClient.address.city}/{viewingClient.address.state}
											<br />
											CEP: {viewingClient.address.zipCode}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Tags */}
							{viewingClient.tags?.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Tags</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex flex-wrap gap-2">
											{viewingClient.tags.map((tag: string, index: number) => (
												<Badge key={index} variant="outline">
													{tag}
												</Badge>
											))}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Notes */}
							{viewingClient.notes && (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Observações</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm">{viewingClient.notes}</p>
									</CardContent>
								</Card>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
