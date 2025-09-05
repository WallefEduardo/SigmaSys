"use client";

import {
	ArrowLeft,
	Calculator,
	Calendar,
	CheckSquare,
	Edit,
	Package,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/trpc";
// import { Separator } from "@/components/ui/separator";

export default function VisualizarProdutoPage() {
	const router = useRouter();
	const params = useParams();
	const productId = params?.id as string;

	// Buscar dados do produto
	const { data: productData, isLoading: isLoadingProduct } =
		api.products.getById.useQuery({ id: productId }, { enabled: !!productId });

	const getComplexityColor = (complexity: string) => {
		const colors = {
			simple:
				"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
			medium:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
			complex: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
		};
		return colors[complexity as keyof typeof colors] || colors.medium;
	};

	const getComplexityLabel = (complexity: string) => {
		const labels = {
			simple: "Simples",
			medium: "Médio",
			complex: "Complexo",
		};
		return labels[complexity as keyof typeof labels] || "Médio";
	};

	if (isLoadingProduct) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
					<p className="text-muted-foreground">Carregando produto...</p>
				</div>
			</div>
		);
	}

	if (!productData) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						Produto não encontrado
					</p>
					<Button
						onClick={() => router.back()}
						variant="outline"
						className="mt-4"
					>
						Voltar
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" onClick={() => router.back()}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Button>
					<div>
						<h1 className="font-bold text-3xl">{productData.name}</h1>
						<p className="text-muted-foreground">
							{productData.code && `${productData.code} • `}
							Criado em{" "}
							{new Date(productData.createdAt).toLocaleDateString("pt-BR")}
						</p>
					</div>
				</div>

				<Button asChild>
					<Link href={`/cadastros/produtos/${productId}/editar`}>
						<Edit className="mr-2 h-4 w-4" />
						Editar
					</Link>
				</Button>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Informações Básicas */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Package className="h-5 w-5" />
							Informações Básicas
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label className="font-medium text-muted-foreground text-sm">
									Nome
								</label>
								<p className="text-sm">{productData.name}</p>
							</div>

							{productData.code && (
								<div>
									<label className="font-medium text-muted-foreground text-sm">
										Código
									</label>
									<p className="text-sm">{productData.code}</p>
								</div>
							)}

							{productData.category && (
								<div>
									<label className="font-medium text-muted-foreground text-sm">
										Categoria
									</label>
									<div className="mt-1">
										<Badge variant="outline">{productData.category}</Badge>
									</div>
								</div>
							)}

							<div>
								<label className="font-medium text-muted-foreground text-sm">
									Complexidade
								</label>
								<div className="mt-1">
									<Badge className={getComplexityColor("medium")}>
										{getComplexityLabel("medium")}
									</Badge>
								</div>
							</div>
						</div>

						{productData.description && (
							<>
								<hr className="border-border" />
								<div>
									<label className="font-medium text-muted-foreground text-sm">
										Descrição
									</label>
									<p className="mt-1 text-sm">{productData.description}</p>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Sidebar Info */}
				<div className="space-y-6">
					{/* Fórmula */}
					{productData.formula && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<Calculator className="h-4 w-4" />
									Fórmula de Cálculo
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="rounded bg-muted/50 p-3">
									<code className="break-all font-mono text-xs">
										{productData.formula}
									</code>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Margin/Markup */}
					{productData.margin && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									Configuração de Preços
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{productData.margin.markup && (
									<div className="flex justify-between">
										<span className="text-muted-foreground text-sm">
											Markup:
										</span>
										<span className="font-medium text-sm">
											{productData.margin.markup}x
										</span>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Checklist Status */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<CheckSquare className="h-4 w-4" />
								Status do Checklist
							</CardTitle>
						</CardHeader>
						<CardContent>
							{productData.checklist &&
							productData.checklist.nodes?.length > 0 ? (
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-green-600">
										<CheckSquare className="h-4 w-4" />
										<span className="font-medium text-sm">Configurado</span>
									</div>
									<p className="text-muted-foreground text-xs">
										{productData.checklist.nodes.length} pergunta(s) criada(s)
									</p>
								</div>
							) : (
								<div className="flex items-center gap-2 text-muted-foreground">
									<Package className="h-4 w-4" />
									<span className="text-sm">Não configurado</span>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Data de Criação */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<Calendar className="h-4 w-4" />
								Informações
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between">
								<span className="text-muted-foreground text-sm">
									Criado em:
								</span>
								<span className="text-sm">
									{new Date(productData.createdAt).toLocaleDateString("pt-BR")}
								</span>
							</div>
							{productData.updatedAt && (
								<div className="flex justify-between">
									<span className="text-muted-foreground text-sm">
										Atualizado em:
									</span>
									<span className="text-sm">
										{new Date(productData.updatedAt).toLocaleDateString(
											"pt-BR",
										)}
									</span>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
