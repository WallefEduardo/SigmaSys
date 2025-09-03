"use client";

import { ArrowLeft, DollarSign, Edit, Layers, Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils/currency";

export default function AcabamentoDetalhesPage() {
	const router = useRouter();
	const params = useParams();
	const finishId = params.id as string;

	const { 
		data: finish, 
		isLoading, 
		error 
	} = api.finishes.getById.useQuery({ id: finishId });

	// Buscar materiais e processos para mostrar nomes completos
	const { data: materialsData } = api.materials.list.useQuery({ active: true });
	const { data: processesData } = api.processes.list.useQuery({ active: true });

	const materials = materialsData?.materials || [];
	const processes = processesData?.processes || [];

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

	if (error || !finish) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						Acabamento não encontrado
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						{error?.message || "O acabamento solicitado não existe ou foi removido"}
					</p>
					<div className="mt-4 flex gap-2">
						<Button variant="outline" onClick={() => router.back()}>
							Voltar
						</Button>
						<Button asChild>
							<Link href="/cadastros/acabamentos">
								Ver todos os acabamentos
							</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const getMaterialName = (materialId: string) => {
		const material = materials.find(m => m.id === materialId);
		return material ? material.name : 'Material não encontrado';
	};

	const getProcessName = (processId: string) => {
		const process = processes.find(p => p.id === processId);
		return process ? process.name : 'Processo não encontrado';
	};

	const calculateCompositionCost = () => {
		let totalCost = 0;

		// Custo dos materiais
		if (finish.composition?.materials) {
			finish.composition.materials.forEach((comp: any) => {
				const material = materials.find(m => m.id === comp.materialId);
				if (material) {
					totalCost += material.costPerUnit * comp.quantity;
				}
			});
		}

		// Custo dos processos
		if (finish.composition?.processes) {
			finish.composition.processes.forEach((comp: any) => {
				const process = processes.find(p => p.id === comp.processId);
				if (process) {
					totalCost += process.costPerHour * comp.timeNeeded;
				}
			});
		}

		return totalCost;
	};

	const compositionCost = calculateCompositionCost();

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			{/* Cabeçalho */}
			<div className="flex items-center justify-between">
				<div>
					<div className="flex items-center gap-3 mb-2">
						<h1 className="text-3xl font-bold">{finish.name}</h1>
						<Badge variant={finish.active ? "default" : "secondary"}>
							{finish.active ? "Ativo" : "Inativo"}
						</Badge>
					</div>
					{finish.description && (
						<p className="text-muted-foreground">{finish.description}</p>
					)}
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => router.back()}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Button>
					<Button asChild>
						<Link href={`/cadastros/acabamentos/${finish.id}/editar`}>
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
							<Layers className="h-5 w-5" />
							Informações Básicas
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label className="font-medium text-sm">Nome do Acabamento</label>
							<p className="text-muted-foreground">{finish.name}</p>
						</div>
						
						{finish.description && (
							<div>
								<label className="font-medium text-sm">Descrição</label>
								<p className="text-muted-foreground">{finish.description}</p>
							</div>
						)}

						<Separator />

						<div>
							<label className="font-medium text-sm">Status</label>
							<div className="mt-1">
								<Badge variant={finish.active ? "default" : "secondary"}>
									{finish.active ? "Ativo" : "Inativo"}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Custos */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DollarSign className="h-5 w-5" />
							Análise de Custos
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label className="font-medium text-sm">Custo Definido</label>
							<p className="font-semibold text-green-600 text-xl">
								{formatCurrency(finish.cost)}
							</p>
						</div>

						{compositionCost > 0 && (
							<div>
								<label className="font-medium text-sm">Custo da Composição</label>
								<p className="font-semibold text-muted-foreground text-lg">
									{formatCurrency(compositionCost)}
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									Baseado nos materiais e processos
								</p>
							</div>
						)}

						{compositionCost > 0 && (
							<>
								<Separator />
								<div className="rounded-lg bg-muted/50 p-4">
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">
											{finish.cost > compositionCost ? 'Margem:' : 'Diferença:'}
										</span>
										<span className={`font-bold text-lg ${
											finish.cost > compositionCost ? 'text-green-600' : 'text-red-600'
										}`}>
											{formatCurrency(Math.abs(finish.cost - compositionCost))}
										</span>
									</div>
									{finish.cost > compositionCost && (
										<p className="text-xs text-muted-foreground mt-1">
											{(((finish.cost - compositionCost) / compositionCost) * 100).toFixed(1)}% sobre o custo de composição
										</p>
									)}
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Composição - Materiais */}
			{finish.composition?.materials && finish.composition.materials.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Composição - Materiais</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{finish.composition.materials.map((comp: any, index: number) => {
								const material = materials.find(m => m.id === comp.materialId);
								const itemCost = material ? material.costPerUnit * comp.quantity : 0;
								
								return (
									<div key={index} className="flex items-center justify-between p-3 rounded border">
										<div className="flex-1">
											<p className="font-medium">{getMaterialName(comp.materialId)}</p>
											<p className="text-muted-foreground text-sm">
												{comp.quantity} {comp.unit}
												{material && ` × ${formatCurrency(material.costPerUnit)}/${material.unit}`}
											</p>
										</div>
										<div className="text-right">
											<p className="font-semibold text-green-600">
												{formatCurrency(itemCost)}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Composição - Processos */}
			{finish.composition?.processes && finish.composition.processes.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Composição - Processos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{finish.composition.processes.map((comp: any, index: number) => {
								const process = processes.find(p => p.id === comp.processId);
								const itemCost = process ? process.costPerHour * comp.timeNeeded : 0;
								
								return (
									<div key={index} className="flex items-center justify-between p-3 rounded border">
										<div className="flex-1">
											<p className="font-medium">{getProcessName(comp.processId)}</p>
											<p className="text-muted-foreground text-sm">
												{comp.timeNeeded} {comp.unit}
												{process && ` × ${formatCurrency(process.costPerHour)}/h`}
											</p>
										</div>
										<div className="text-right">
											<p className="font-semibold text-blue-600">
												{formatCurrency(itemCost)}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

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
								{finish.products?.length || 0}
							</div>
							<div className="text-muted-foreground text-sm">Produtos usando</div>
						</div>
						
						<div className="text-center">
							<div className="font-bold text-2xl">
								{formatCurrency(finish.cost)}
							</div>
							<div className="text-muted-foreground text-sm">Custo unitário</div>
						</div>
						
						<div className="text-center">
							<div className="font-bold text-2xl">
								{finish.active ? "Ativo" : "Inativo"}
							</div>
							<div className="text-muted-foreground text-sm">Status atual</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Produtos que usam este acabamento */}
			{finish.products && finish.products.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Produtos que utilizam este acabamento</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{finish.products.map((item: any) => (
								<div key={item.id} className="flex items-center justify-between p-2 rounded border">
									<span className="font-medium">{item.product.name}</span>
									<Badge variant="outline">
										ID: {item.product.id}
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