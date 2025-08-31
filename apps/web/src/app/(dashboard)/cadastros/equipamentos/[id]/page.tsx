"use client";

import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils/currency";

export default function EquipamentoPage() {
	const router = useRouter();
	const params = useParams();
	const equipmentId = params.id as string;

	// Buscar dados do equipamento
	const {
		data: equipment,
		isLoading,
		error,
	} = api.equipments.getById.useQuery({
		id: equipmentId,
	});

	// Mutation para deletar
	const deleteEquipment = api.equipments.deactivate.useMutation({
		onSuccess: () => {
			toast({
				title: "Sucesso",
				description: "Equipamento excluído com sucesso!",
			});
			router.push("/cadastros/equipamentos");
		},
		onError: (error) => {
			toast({
				title: "Erro",
				description: error.message || "Erro ao excluir equipamento",
				variant: "destructive",
			});
		},
	});

	const handleDelete = async () => {
		if (!equipment) return;

		if (
			confirm(
				`Tem certeza que deseja desativar o equipamento "${equipment.name}"?`,
			)
		) {
			try {
				await deleteEquipment.mutateAsync({
					id: equipmentId,
					reason: "Desativado pelo usuário",
				});
			} catch (error) {
				console.error("Erro ao desativar equipamento:", error);
			}
		}
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

	const getTypeLabel = (type: string) => {
		return type === "printing" ? "Impressão" : "Usinagem";
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="animate-pulse space-y-4">
						<div className="mx-auto h-4 w-32 rounded bg-muted" />
						<div className="mx-auto h-4 w-48 rounded bg-muted" />
					</div>
					<p className="mt-2 text-muted-foreground text-sm">
						Carregando equipamento...
					</p>
				</div>
			</div>
		);
	}

	if (error || !equipment) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						{error
							? "Erro ao carregar equipamento"
							: "Equipamento não encontrado"}
					</p>
					<p className="mt-1 text-muted-foreground text-sm">{error?.message}</p>
					<Button
						onClick={() => router.push("/cadastros/equipamentos")}
						variant="outline"
						className="mt-4"
					>
						Voltar para lista
					</Button>
				</div>
			</div>
		);
	}

	const statusInfo = getStatusBadge(equipment.status);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="icon" onClick={() => router.back()}>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-3xl">{equipment.name}</h1>
						<div className="mt-1 flex items-center gap-2">
							<p className="text-muted-foreground">Código: {equipment.code}</p>
							<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						onClick={() =>
							router.push(`/cadastros/equipamentos/${equipmentId}/editar`)
						}
					>
						<Edit className="mr-2 h-4 w-4" />
						Editar
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={deleteEquipment.isPending}
					>
						<Trash2 className="mr-2 h-4 w-4" />
						{deleteEquipment.isPending ? "Excluindo..." : "Excluir"}
					</Button>
				</div>
			</div>

			{/* Detalhes */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Informações Básicas */}
				<Card>
					<CardHeader>
						<CardTitle>Informações Básicas</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tipo:</span>
							<span className="font-medium">
								{getTypeLabel(equipment.type)}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Status:</span>
							<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
						</div>
						{equipment.model && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Modelo:</span>
								<span>{equipment.model}</span>
							</div>
						)}
						{equipment.manufacturer && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Fabricante:</span>
								<span>{equipment.manufacturer}</span>
							</div>
						)}
						{equipment.serialNumber && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Nº Série:</span>
								<span>{equipment.serialNumber}</span>
							</div>
						)}
						{equipment.purchaseDate && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Data de Compra:</span>
								<span>
									{new Date(equipment.purchaseDate).toLocaleDateString("pt-BR")}
								</span>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Custos */}
				<Card>
					<CardHeader>
						<CardTitle>Custos e Valores</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{equipment.purchaseCost && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Custo de Compra:</span>
								<span className="font-medium text-green-600">
									{formatCurrency(equipment.purchaseCost)}
								</span>
							</div>
						)}
						{equipment.hourlyRate && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Taxa Horária:</span>
								<span className="font-medium text-green-600">
									{formatCurrency(equipment.hourlyRate)}/h
								</span>
							</div>
						)}
						{equipment.maintenanceCost && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Custo de Manutenção:
								</span>
								<span className="font-medium text-orange-600">
									{formatCurrency(equipment.maintenanceCost)}
								</span>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Descrição */}
				{equipment.description && (
					<Card className="md:col-span-2">
						<CardHeader>
							<CardTitle>Descrição</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm leading-relaxed">{equipment.description}</p>
						</CardContent>
					</Card>
				)}

				{/* Especificações */}
				{equipment.specifications && (
					<Card className="md:col-span-2">
						<CardHeader>
							<CardTitle>Especificações Técnicas</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
								{equipment.specifications}
							</pre>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
