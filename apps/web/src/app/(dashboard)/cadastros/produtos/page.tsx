"use client";

import { Calculator, Edit, Filter, Package, Plus, Search } from "lucide-react";
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

// Mock data para produtos
interface Product {
	id: string;
	name: string;
	description?: string;
	code?: string;
	category?: string;
	formula?: string;
	margin: {
		markup: number;
		liquidMargin: number;
	};
	baseCost: number;
	finalPrice: number;
	active: boolean;
	complexity: "simple" | "medium" | "complex";
	tags: string[];
}

const mockProducts: Product[] = [
	{
		id: "1",
		name: "Placa de Acrílico Personalizada",
		description: "Placa de acrílico com impressão UV e corte personalizado",
		code: "PRD-ACR-001",
		category: "Placas",
		formula: "largura * altura * 45.80 + perimetro * 12.50",
		margin: { markup: 2.5, liquidMargin: 60 },
		baseCost: 125.4,
		finalPrice: 313.5,
		active: true,
		complexity: "medium",
		tags: ["acrílico", "impressão", "corte", "personalizado"],
	},
	{
		id: "2",
		name: "Banner em Lona",
		description: "Banner impresso em lona 440g com acabamento soldado",
		code: "PRD-LON-001",
		category: "Banners",
		formula: "largura * altura * 8.90 + perimetro * 2.50",
		margin: { markup: 3.0, liquidMargin: 67 },
		baseCost: 89.5,
		finalPrice: 268.5,
		active: true,
		complexity: "simple",
		tags: ["lona", "banner", "impressão", "soldado"],
	},
	{
		id: "3",
		name: "Letreiro em Aço Inox",
		description: "Letreiro corporativo em aço inox com LED",
		code: "PRD-LET-001",
		category: "Letreiros",
		formula: "largura * altura * 150.00 + quantidade * 45.00",
		margin: { markup: 2.8, liquidMargin: 64 },
		baseCost: 420.0,
		finalPrice: 1176.0,
		active: true,
		complexity: "complex",
		tags: ["aço", "inox", "led", "corporativo"],
	},
	{
		id: "4",
		name: "Adesivo para Vitrine",
		description: "Adesivo recortado para aplicação em vitrine",
		code: "PRD-ADE-001",
		category: "Adesivos",
		formula: "area * 15.50 + max(largura, altura) * 5.00",
		margin: { markup: 3.5, liquidMargin: 71 },
		baseCost: 45.8,
		finalPrice: 160.3,
		active: true,
		complexity: "simple",
		tags: ["adesivo", "vitrine", "recorte"],
	},
	{
		id: "5",
		name: "Estrutura para Outdoor",
		description: "Estrutura metálica para outdoor com impressão",
		code: "PRD-OUT-001",
		category: "Outdoor",
		formula: "largura * altura * 25.00 + volume * 180.00",
		margin: { markup: 2.2, liquidMargin: 55 },
		baseCost: 850.0,
		finalPrice: 1870.0,
		active: false,
		complexity: "complex",
		tags: ["outdoor", "estrutura", "metálica"],
	},
];

export default function ProdutosPage() {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [complexityFilter, setComplexityFilter] = useState("all");
	const [view, setView] = useState<"card" | "table">("card");

	const categories = [
		...new Set(mockProducts.map((p) => p.category).filter(Boolean)),
	];

	const filteredProducts = mockProducts.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.description?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory =
			categoryFilter === "all" || product.category === categoryFilter;
		const matchesComplexity =
			complexityFilter === "all" || product.complexity === complexityFilter;
		return (
			matchesSearch && matchesCategory && matchesComplexity && product.active
		);
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const getComplexityColor = (complexity: string) => {
		const colors = {
			simple:
				"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
			medium:
				"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
			complex: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
		};
		return colors[complexity as keyof typeof colors] || colors.simple;
	};

	const getComplexityLabel = (complexity: string) => {
		const labels = {
			simple: "Simples",
			medium: "Médio",
			complex: "Complexo",
		};
		return labels[complexity as keyof typeof labels] || "Simples";
	};

	const productColumns = [
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
			key: "complexity",
			label: "Complexidade",
			render: (value: string) => (
				<Badge className={getComplexityColor(value)}>
					{getComplexityLabel(value)}
				</Badge>
			),
		},
		{
			key: "baseCost",
			label: "Custo Base",
			render: (value: number) => (
				<div className="font-medium text-red-600">{formatCurrency(value)}</div>
			),
		},
		{
			key: "finalPrice",
			label: "Preço Final",
			render: (value: number) => (
				<div className="font-medium text-green-600">
					{formatCurrency(value)}
				</div>
			),
		},
		{
			key: "margin.liquidMargin",
			label: "Margem",
			render: (value: number) => (
				<div className="font-medium text-blue-600">{value}%</div>
			),
		},
		{
			key: "formula",
			label: "Fórmula",
			render: (value: string) =>
				value ? (
					<div className="flex items-center gap-1">
						<Calculator className="h-3 w-3" />
						<span className="text-xs">Sim</span>
					</div>
				) : (
					<span className="text-muted-foreground text-xs">Não</span>
				),
		},
	];

	const handleEdit = (product: any) => {
		router.push(`/cadastros/produtos/${product.id}/editar`);
	};

	const handleView = (product: any) => {
		router.push(`/cadastros/produtos/${product.id}`);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Produtos</h1>
					<p className="text-muted-foreground">
						Gerencie produtos, fórmulas e precificação
					</p>
				</div>
				<Button asChild>
					<Link href="/cadastros/produtos/novo">
						<Plus className="mr-2 h-4 w-4" />
						Novo Produto
					</Link>
				</Button>
			</div>

			{/* Estatísticas */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Total de Produtos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{filteredProducts.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Margem Média
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{Math.round(
								filteredProducts.reduce(
									(sum, p) => sum + p.margin.liquidMargin,
									0,
								) / filteredProducts.length || 0,
							)}
							%
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Ticket Médio
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-blue-600">
							{formatCurrency(
								filteredProducts.reduce((sum, p) => sum + p.finalPrice, 0) /
									filteredProducts.length || 0,
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Com Fórmulas
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-purple-600">
							{filteredProducts.filter((p) => p.formula).length}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filtros */}
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="relative flex-1">
					<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar produtos por nome, código ou descrição..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>

				<Select value={categoryFilter} onValueChange={setCategoryFilter}>
					<SelectTrigger className="w-full md:w-48">
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Categoria" />
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

				<Select value={complexityFilter} onValueChange={setComplexityFilter}>
					<SelectTrigger className="w-full md:w-48">
						<Package className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Complexidade" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas complexidades</SelectItem>
						<SelectItem value="simple">Simples</SelectItem>
						<SelectItem value="medium">Médio</SelectItem>
						<SelectItem value="complex">Complexo</SelectItem>
					</SelectContent>
				</Select>

				<ViewToggle view={view} onViewChange={setView} />
			</div>

			{filteredProducts.length === 0 ? (
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						{searchTerm ||
						categoryFilter !== "all" ||
						complexityFilter !== "all"
							? "Nenhum produto encontrado com os filtros aplicados"
							: "Nenhum produto cadastrado"}
					</div>
					<Button asChild variant="outline">
						<Link href="/cadastros/produtos/novo">
							Cadastrar primeiro produto
						</Link>
					</Button>
				</div>
			) : (
				<>
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>{filteredProducts.length} produtos encontrados</span>
					</div>

					{view === "card" ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{filteredProducts.map((product) => (
								<Card
									key={product.id}
									className="flex h-full flex-col transition-shadow hover:shadow-lg"
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<CardTitle className="line-clamp-2 text-lg leading-tight">
													{product.name}
												</CardTitle>
												<div className="mt-1 flex items-center gap-2">
													<span className="text-muted-foreground text-sm">
														{product.code}
													</span>
													{product.category && (
														<Badge variant="outline" className="text-xs">
															{product.category}
														</Badge>
													)}
												</div>
											</div>
											<Badge className={getComplexityColor(product.complexity)}>
												{getComplexityLabel(product.complexity)}
											</Badge>
										</div>
										{product.description && (
											<p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
												{product.description}
											</p>
										)}
									</CardHeader>

									<CardContent className="flex-1 space-y-3">
										{/* Preços */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Custo base:
												</span>
												<span className="font-medium text-red-600">
													{formatCurrency(product.baseCost)}
												</span>
											</div>

											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Preço final:
												</span>
												<span className="font-semibold text-green-600">
													{formatCurrency(product.finalPrice)}
												</span>
											</div>

											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Margem:
												</span>
												<span className="font-medium text-blue-600">
													{product.margin.liquidMargin}%
												</span>
											</div>
										</div>

										{/* Fórmula */}
										{product.formula && (
											<div className="rounded bg-muted/50 p-3">
												<div className="mb-1 flex items-center gap-2">
													<Calculator className="h-3 w-3" />
													<span className="font-medium text-muted-foreground text-xs">
														FÓRMULA
													</span>
												</div>
												<code className="break-all font-mono text-xs">
													{product.formula}
												</code>
											</div>
										)}

										{/* Tags */}
										{product.tags && product.tags.length > 0 && (
											<div className="flex flex-wrap gap-1">
												{product.tags.slice(0, 3).map((tag) => (
													<Badge
														key={tag}
														variant="outline"
														className="text-xs"
													>
														{tag}
													</Badge>
												))}
												{product.tags.length > 3 && (
													<Badge variant="outline" className="text-xs">
														+{product.tags.length - 3}
													</Badge>
												)}
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
												<Link href={`/cadastros/produtos/${product.id}`}>
													<Package className="mr-1 h-4 w-4" />
													Detalhes
												</Link>
											</Button>
											<Button variant="outline" size="sm" asChild>
												<Link href={`/cadastros/produtos/${product.id}/editar`}>
													<Calculator className="h-4 w-4" />
												</Link>
											</Button>
										</div>
									</div>
								</Card>
							))}
						</div>
					) : (
						<DataTable
							data={filteredProducts}
							columns={productColumns}
							onEdit={handleEdit}
							onView={handleView}
							emptyMessage="Nenhum produto encontrado"
						/>
					)}
				</>
			)}
		</div>
	);
}
