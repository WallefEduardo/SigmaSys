"use client";

import { ArrowLeft, Clock, DollarSign, Edit, Settings, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils/currency";

export default function ProcessoDetalhesPage() {
	const router = useRouter();
	const params = useParams();
	const processId = params.id as string;

	const { 
		data: process, 
		isLoading, 
		error 
	} = api.processes.getById.useQuery({ id: processId });

	if (isLoading) {
		return (
			<div className="flex h-32 items-center justify-center">
				<div className="animate-pulse space-y-4">
					<div className="h-4 w-32 rounded bg-muted" />
					<div className="h-4 w-48 rounded bg-muted" />
				</div>
			</div>
		);
	}

	if (error || !process) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						Processo não encontrado
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						{error?.message || "O processo solicitado não existe ou foi removido"}
					</p>
					<div className="mt-4 flex gap-2">
						<Button variant="outline" onClick={() => router.back()}>
							Voltar
						</Button>
						<Button asChild>
							<Link href="/cadastros/processos">
								Ver todos os processos
							</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const getSectorColor = (sector: string) => {
		const colors: Record<string, string> = {
			Impressão: "default",
			Usinagem: "secondary",
			Metalurgia: "destructive",
			Montagem: "outline",
			Acabamento: "warning",
			Pintura: "secondary",
			Instalação: "default",
		};
		return colors[sector] || "default";
	};

	const getTimeUnitLabel = (unit: string) => {
		const units: Record<string, string> = {
			hour: "Hora",
			m2: "Metro Quadrado (m²)",
			m: "Metro Linear (m)",
			L: "Litro (L)",
			kg: "Quilograma (kg)",
			un: "Unidade",
		};
		return units[unit] || unit;
	};

	const formatTime = (hours: number) => {
		if (hours >= 1) {
			return `${hours}h`;
		}
		const minutes = Math.round(hours * 60);
		return `${minutes}min`;
	};

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			{/* Cabeçalho */}
			<div className="flex items-center justify-between">
				<div>
					<div className="flex items-center gap-3 mb-2">
						<h1 className="text-3xl font-bold">{process.name}</h1>
						{process.sector && (
							<Badge className={getSectorColor(process.sector)}>
								{process.sector}
							</Badge>
						)}
						<Badge variant={process.active ? "default" : "secondary"}>
							{process.active ? "Ativo" : "Inativo"}
						</Badge>
					</div>
					{process.description && (
						<p className="text-muted-foreground">{process.description}</p>
					)}
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => router.back()}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Button>
					<Button asChild>
						<Link href={`/cadastros/processos/${process.id}/editar`}>
							<Edit className="mr-2 h-4 w-4" />
							Editar
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Informações Básicas */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" />
							Informações Básicas
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label className="font-medium text-sm">Nome do Processo</label>
							<p className="text-muted-foreground">{process.name}</p>
						</div>
						
						{process.description && (
							<div>
								<label className="font-medium text-sm">Descrição</label>
								<p className="text-muted-foreground">{process.description}</p>
							</div>
						)}

						{process.sector && (
							<div>
								<label className="font-medium text-sm">Setor</label>
								<div className="mt-1">
									<Badge className={getSectorColor(process.sector)}>
										{process.sector}
									</Badge>
								</div>
							</div>
						)}

						<div>
							<label className="font-medium text-sm">Unidade de Medida</label>
							<p className="text-muted-foreground">
								{getTimeUnitLabel(process.timeUnit)}
							</p>
						</div>

						<Separator />

						<div>
							<label className="font-medium text-sm">Status</label>
							<div className="mt-1">
								<Badge variant={process.active ? "default" : "secondary"}>
									{process.active ? "Ativo" : "Inativo"}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Custos e Tempos */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DollarSign className="h-5 w-5" />
							Custos e Tempos
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label className="font-medium text-sm">
								Custo por {getTimeUnitLabel(process.timeUnit)}
							</label>
							<p className="font-semibold text-green-600 text-lg">
								{formatCurrency(process.costPerHour)}
							</p>
						</div>

						{process.defaultTime && (
							<div>
								<label className="font-medium text-sm">Tempo Padrão</label>
								<p className="text-muted-foreground">
									{process.timeUnit === 'hour' 
										? formatTime(process.defaultTime)
										: `${process.defaultTime} ${getTimeUnitLabel(process.timeUnit)}`
									}
								</p>
							</div>
						)}

						{/* Custo Total Padrão */}
						{process.defaultTime && (
							<>
								<Separator />
								<div className="rounded-lg bg-muted/50 p-4">
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">Custo Total Padrão:</span>
										<span className="font-bold text-primary text-lg">
											{formatCurrency(process.costPerHour * process.defaultTime)}
										</span>
									</div>
									<p className="mt-1 text-muted-foreground text-xs">
										Baseado no tempo padrão definido
									</p>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Estatísticas de Uso */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Estatísticas de Uso
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="text-center">
							<div className="font-bold text-2xl">
								{process._count?.productItems || 0}
							</div>
							<div className="text-muted-foreground text-sm">Produtos usando</div>
						</div>
						
						<div className="text-center">
							<div className="font-bold text-2xl">
								{formatCurrency(process.costPerHour)}
							</div>
							<div className="text-muted-foreground text-sm">Custo por unidade</div>
						</div>
						
						<div className="text-center">
							<div className="font-bold text-2xl">
								{process.active ? "Ativo" : "Inativo"}
							</div>
							<div className="text-muted-foreground text-sm">Status atual</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Produtos que usam este processo */}
			{process.productItems && process.productItems.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Produtos que utilizam este processo</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{process.productItems.map((item: any) => (
								<div key={item.id} className="flex items-center justify-between p-2 rounded border">
									<span className="font-medium">{item.product.name}</span>
									<Badge variant="outline">
										Quantidade: {item.quantity}
									</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}