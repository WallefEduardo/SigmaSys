"use client";

import {
	ArrowLeft,
	Calendar,
	Edit,
	Mail,
	MapPin,
	Phone,
	Star,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc";
import { InteractionTimeline } from "../components/interaction-timeline";

export default function ClienteDetalhesPage() {
	const params = useParams();
	const clientId = params.id as string;

	const { data: client, isLoading } = api.clients.getById.useQuery({
		id: clientId,
	});

	const { data: interactions } = api.clients.getInteractions.useQuery({
		clientId,
	});

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 w-64 rounded bg-muted" />
					<div className="h-32 rounded bg-muted" />
				</div>
			</div>
		);
	}

	if (!client) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="font-semibold text-destructive text-lg">
					Cliente não encontrado
				</p>
			</div>
		);
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "default";
			case "inactive":
				return "secondary";
			case "prospect":
				return "outline";
			case "lead":
				return "destructive";
			default:
				return "default";
		}
	};

	const formatAddress = (address: any) => {
		if (!address) return "Endereço não informado";

		const parts = [
			address.street,
			address.number,
			address.neighborhood,
			address.city,
			address.state,
		].filter(Boolean);

		return parts.length > 0 ? parts.join(", ") : "Endereço não informado";
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" asChild>
						<Link href="/cadastros/clientes">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Voltar
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-3xl">{client.name}</h1>
						<div className="mt-1 flex items-center gap-2">
							<Badge variant={getStatusColor(client.status)}>
								{client.status}
							</Badge>
							<Badge variant="outline">
								{client.type === "person" ? "Pessoa Física" : "Pessoa Jurídica"}
							</Badge>
							{client.rating && (
								<div className="flex items-center gap-1">
									<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
									<span className="text-sm">{client.rating}/5</span>
								</div>
							)}
						</div>
					</div>
				</div>
				<Button asChild>
					<Link href={`/cadastros/clientes/${client.id}/editar`}>
						<Edit className="mr-2 h-4 w-4" />
						Editar
					</Link>
				</Button>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Informações Principais */}
				<div className="space-y-6 lg:col-span-2">
					{/* Dados Básicos */}
					<Card>
						<CardHeader>
							<CardTitle>Informações de Contato</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								{client.email && (
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<span>{client.email}</span>
									</div>
								)}
								{client.phone && (
									<div className="flex items-center gap-2">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<span>{client.phone}</span>
									</div>
								)}
								{client.document && (
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">Documento:</span>
										<span>{client.document}</span>
									</div>
								)}
								{client.birthday && (
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span>
											{new Date(client.birthday).toLocaleDateString()}
										</span>
									</div>
								)}
							</div>

							{client.address && (
								<div>
									<div className="mb-2 flex items-center gap-2">
										<MapPin className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">Endereço</span>
									</div>
									<p className="pl-6 text-muted-foreground text-sm">
										{formatAddress(client.address)}
									</p>
								</div>
							)}

							{client.notes && (
								<div>
									<span className="font-medium">Observações</span>
									<p className="mt-1 text-muted-foreground text-sm">
										{client.notes}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Timeline de Interações */}
					{interactions && (
						<Card>
							<CardHeader>
								<CardTitle>Histórico de Interações</CardTitle>
							</CardHeader>
							<CardContent>
								<InteractionTimeline
									interactions={interactions.interactions}
									clientId={client.id}
								/>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Sidebar - Métricas */}
				<div className="space-y-6">
					{/* Estatísticas */}
					<Card>
						<CardHeader>
							<CardTitle>Estatísticas</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-3">
								<div className="flex justify-between">
									<span className="text-sm">Orçamentos</span>
									<span className="font-medium">{client._count.quotes}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Pedidos</span>
									<span className="font-medium">{client._count.orders}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Interações</span>
									<span className="font-medium">
										{client._count.interactions}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Informações Comerciais */}
					<Card>
						<CardHeader>
							<CardTitle>Informações Comerciais</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{client.segment && (
								<div>
									<span className="font-medium text-sm">Segmento</span>
									<p className="text-muted-foreground text-sm">
										{client.segment}
									</p>
								</div>
							)}
							{client.creditLimit && (
								<div>
									<span className="font-medium text-sm">Limite de Crédito</span>
									<p className="text-muted-foreground text-sm">
										R$ {client.creditLimit.toLocaleString()}
									</p>
								</div>
							)}
							{client.paymentTerm && (
								<div>
									<span className="font-medium text-sm">
										Prazo de Pagamento
									</span>
									<p className="text-muted-foreground text-sm">
										{client.paymentTerm} dias
									</p>
								</div>
							)}
							{client.discount && (
								<div>
									<span className="font-medium text-sm">Desconto Padrão</span>
									<p className="text-muted-foreground text-sm">
										{client.discount}%
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Tags */}
					{client.tags && client.tags.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Tags</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{client.tags.map((tag) => (
										<Badge key={tag} variant="secondary">
											{tag}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
