"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	Building2,
	Calendar,
	DollarSign,
	Edit,
	FileText,
	Mail,
	MapPin,
	MoreHorizontal,
	Phone,
	Star,
	User,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Client {
	id: string;
	name: string;
	email?: string | null;
	phone?: string | null;
	document?: string | null;
	type: "person" | "company";
	status: "active" | "inactive" | "prospect" | "lead";
	segment?: string | null;
	rating?: number | null;
	creditLimit?: number | null;
	paymentTerm?: number | null;
	discount?: number | null;
	source?: string | null;
	notes?: string | null;
	tags?: string[] | null;
	birthday?: Date | null;
	address?: {
		street?: string | null;
		number?: string | null;
		complement?: string | null;
		neighborhood?: string | null;
		city?: string | null;
		state?: string | null;
		zipCode?: string | null;
	} | null;
	_count: {
		quotes: number;
		orders: number;
		interactions: number;
	};
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface ClientCardProps {
	client: Client;
	onEdit?: (client: Client) => void;
	onDeactivate?: (clientId: string) => void;
}

export function ClientCard({ client, onEdit, onDeactivate }: ClientCardProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800 border-green-200";
			case "inactive":
				return "bg-gray-100 text-gray-800 border-gray-200";
			case "prospect":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "lead":
				return "bg-orange-100 text-orange-800 border-orange-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "active":
				return "Ativo";
			case "inactive":
				return "Inativo";
			case "prospect":
				return "Prospect";
			case "lead":
				return "Lead";
			default:
				return status;
		}
	};

	const getTypeLabel = (type: string) => {
		return type === "person" ? "Pessoa Física" : "Pessoa Jurídica";
	};

	const formatAddress = (address: Client["address"]) => {
		if (!address) return null;

		const parts = [
			address.street,
			address.number,
			address.neighborhood,
			address.city,
			address.state,
		].filter(Boolean);

		return parts.length > 0 ? parts.join(", ") : null;
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<div className="flex items-center gap-3 mb-2">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
								{client.type === "company" ? (
									<Building2 className="h-5 w-5 text-primary" />
								) : (
									<User className="h-5 w-5 text-primary" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold text-lg truncate">{client.name}</h3>
								<div className="flex items-center gap-2 mt-1">
									<Badge
										variant="outline"
										className={getStatusColor(client.status)}
									>
										{getStatusLabel(client.status)}
									</Badge>
									<Badge variant="secondary" className="text-xs">
										{getTypeLabel(client.type)}
									</Badge>
								</div>
							</div>
						</div>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link href={`/cadastros/clientes/${client.id}`}>
									Ver Detalhes
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href={`/cadastros/clientes/${client.id}/editar`}>
									<Edit className="mr-2 h-4 w-4" />
									Editar
								</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => onDeactivate?.(client.id)}
								className="text-destructive"
							>
								{client.active ? "Desativar" : "Ativar"}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Contact Information */}
				<div className="space-y-2">
					{client.email && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Mail className="h-4 w-4" />
							<span className="truncate">{client.email}</span>
						</div>
					)}
					{client.phone && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Phone className="h-4 w-4" />
							<span>{client.phone}</span>
						</div>
					)}
					{formatAddress(client.address) && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<MapPin className="h-4 w-4" />
							<span className="truncate">{formatAddress(client.address)}</span>
						</div>
					)}
				</div>

				{/* Additional Info */}
				<div className="space-y-2">
					{client.segment && (
						<div className="flex items-center gap-2 text-sm">
							<Building2 className="h-4 w-4 text-muted-foreground" />
							<span>{client.segment}</span>
						</div>
					)}
					
					{client.rating && (
						<div className="flex items-center gap-2">
							<div className="flex items-center">
								<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
								<span className="ml-1 text-sm font-medium">{client.rating}/5</span>
							</div>
						</div>
					)}
					
					{client.creditLimit && (
						<div className="flex items-center gap-2 text-sm">
							<DollarSign className="h-4 w-4 text-muted-foreground" />
							<span>Limite: {formatCurrency(client.creditLimit)}</span>
						</div>
					)}
				</div>

				{/* Stats */}
				<div className="flex items-center justify-between pt-3 border-t">
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-1">
							<FileText className="h-4 w-4" />
							<span>{client._count.quotes}</span>
							<span className="text-xs">orçamentos</span>
						</div>
						<div className="flex items-center gap-1">
							<DollarSign className="h-4 w-4" />
							<span>{client._count.orders}</span>
							<span className="text-xs">pedidos</span>
						</div>
					</div>
					
					<div className="text-xs text-muted-foreground">
						{client.birthday && (
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3" />
								<span>
									{format(new Date(client.birthday), "dd/MM", { locale: ptBR })}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Tags */}
				{client.tags && client.tags.length > 0 && (
					<div className="flex flex-wrap gap-1 pt-2 border-t">
						{client.tags.slice(0, 3).map((tag) => (
							<Badge key={tag} variant="secondary" className="text-xs">
								{tag}
							</Badge>
						))}
						{client.tags.length > 3 && (
							<Badge variant="outline" className="text-xs">
								+{client.tags.length - 3}
							</Badge>
						)}
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex gap-2 pt-2">
					<Button variant="outline" size="sm" className="flex-1" asChild>
						<Link href={`/cadastros/clientes/${client.id}`}>
							Ver Detalhes
						</Link>
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link href={`/cadastros/clientes/${client.id}/editar`}>
							<Edit className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}