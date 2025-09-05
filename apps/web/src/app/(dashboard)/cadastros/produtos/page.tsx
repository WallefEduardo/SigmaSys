"use client";

import { Calculator, CheckSquare, Edit, Filter, Package, Plus, Search, Trash2 } from "lucide-react";
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
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils/currency";


export default function ProdutosPage() {
	const router = useRouter();
	const [searchInput, setSearchInput] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [complexityFilter, setComplexityFilter] = useState("all");
	const [view, setView] = useState<"card" | "table">("table"); // Sempre tabela como padrão
	const { confirm, ConfirmDialog } = useConfirmDialog();

	// Buscar dados reais da API
	const {
		data: productsData,
		isLoading,
		error,
		refetch,
	} = api.products.list.useQuery({
		search: searchInput || undefined,
		category: categoryFilter !== "all" ? categoryFilter : undefined,
		active: true, // Sempre buscar apenas produtos ativos
	});

	// Buscar categorias disponíveis
	const { data: categoriesData } = api.products.categories.useQuery();

	// Mutation para deletar produto
	const { mutateAsync: deleteProduct, isLoading: isDeleting } = api.products.delete.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const products = productsData?.products || [];
	const categories = Array.isArray(categoriesData) ? categoriesData : [];
	
	// Debug logs removidos


	// Debounce para busca
	const debouncedSearch = useDebounce((term: string) => {
		// A busca é reativa através do useQuery
	}, 300);

	// Filtrar produtos no frontend 
	const filteredProducts = products.filter((product) => {
		const matchesComplexity =
			complexityFilter === "all" || (product.complexity || 'medium') === complexityFilter;
		return matchesComplexity && (product.active !== false); // Default true se não existir
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
			render: (value: string, item: any) => (
				<Badge className={getComplexityColor(value || 'medium')}>
					{getComplexityLabel(value || 'medium')}
				</Badge>
			),
		},
		{
			key: "createdAt",
			label: "Data de Criação",
			render: (value: string) => (
				<div className="text-sm">{new Date(value).toLocaleDateString('pt-BR')}</div>
			),
		},
		{
			key: "checklist",
			label: "Checklist",
			render: (value: any) => (
				<div className="flex items-center gap-1">
					{value && (value.nodes?.length > 0 || value.length > 0) ? (
						<>
							<CheckSquare className="h-3 w-3 text-green-600" />
							<span className="text-xs text-green-600">Configurado</span>
						</>
					) : (
						<span className="text-muted-foreground text-xs">Não configurado</span>
					)}
				</div>
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

	const handleDelete = async (product: any) => {
		const confirmed = await confirm({
			title: "Deletar Produto",
			description: `Tem certeza que deseja deletar "${product.name}"? Esta ação não pode ser desfeita.`,
			confirmText: "Deletar",
			variant: "destructive",
			isLoading: isDeleting,
		});

		if (confirmed) {
			try {
				await deleteProduct({ id: product.id });
			} catch (error: any) {
				console.error('Erro ao deletar produto:', error);
				
				// Mostrar erro específico para o usuário
				let errorMessage = "Erro ao deletar produto";
				if (error.message?.includes("being used in") && error.message?.includes("orders")) {
					const match = error.message.match(/being used in (\d+) orders?/);
					const count = match ? match[1] : "alguns";
					errorMessage = `Não é possível deletar "${product.name}" porque está sendo usado em ${count} pedido${count !== "1" ? "s" : ""}.`;
				}
				
				// Mostrar dialog de erro
				await confirm({
					title: "Não foi possível deletar",
					description: errorMessage,
					confirmText: "Ok",
					cancelText: "",
					variant: "default",
				});
			}
		}
	};

	// Estados de erro e loading
	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						Erro ao carregar produtos
					</p>
					<p className="mt-1 text-muted-foreground text-sm">{error.message}</p>
					<Button onClick={() => refetch()} variant="outline" className="mt-4">
						Tentar novamente
					</Button>
				</div>
			</div>
		);
	}

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
							Categorias
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{categories.length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Com Checklist
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-blue-600">
							{filteredProducts.filter((p) => p.checklist && (p.checklist.nodes?.length > 0 || p.checklist.length > 0)).length}
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
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value);
							debouncedSearch(e.target.value);
						}}
						className="pl-10"
						aria-label="Campo de busca para produtos"
						aria-describedby="search-hint"
					/>
					<span id="search-hint" className="sr-only">
						Digite para buscar por nome, código ou descrição dos produtos
					</span>
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

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<div className="animate-pulse space-y-4">
							<div className="mx-auto h-4 w-32 rounded bg-muted" />
							<div className="mx-auto h-4 w-48 rounded bg-muted" />
						</div>
						<p className="mt-2 text-muted-foreground text-sm">
							Carregando produtos...
						</p>
					</div>
				</div>
			) : filteredProducts.length === 0 ? (
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						{searchInput ||
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
											<Badge className={getComplexityColor(product.complexity || 'medium')}>
												{getComplexityLabel(product.complexity || 'medium')}
											</Badge>
										</div>
										{product.description && (
											<p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
												{product.description}
											</p>
										)}
									</CardHeader>

									<CardContent className="flex-1 space-y-3">
										{/* Info básica */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Criado em:
												</span>
												<span className="text-sm">
													{new Date(product.createdAt).toLocaleDateString('pt-BR')}
												</span>
											</div>

											{product.margin && (
												<div className="flex items-center justify-between">
													<span className="text-muted-foreground text-sm">
														Markup:
													</span>
													<span className="font-medium text-blue-600">
														{product.margin.markup || 2.5}x
													</span>
												</div>
											)}
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

										{/* Checklist Status */}
										{product.checklist && (product.checklist.nodes?.length > 0) && (
											<div className="rounded bg-green-50 dark:bg-green-950/20 p-3">
												<div className="flex items-center gap-2">
													<CheckSquare className="h-3 w-3 text-green-600" />
													<span className="text-green-600 font-medium text-xs">
														CHECKLIST CONFIGURADO
													</span>
												</div>
												<div className="mt-1 text-xs text-green-600">
													{product.checklist.nodes.length} perguntas criadas
												</div>
											</div>
										)}
									</CardContent>

									<div className="p-6 pt-3">
										<div className="flex justify-end gap-2">
											<Button 
												variant="outline" 
												size="sm" 
												asChild
												title="Visualizar"
											>
												<Link href={`/cadastros/produtos/${product.id}`}>
													<Package className="h-4 w-4" />
												</Link>
											</Button>
											<Button 
												variant="outline" 
												size="sm" 
												asChild
												title="Editar"
											>
												<Link href={`/cadastros/produtos/${product.id}/editar`}>
													<Edit className="h-4 w-4" />
												</Link>
											</Button>
											<Button 
												variant="outline" 
												size="sm"
												onClick={() => handleDelete(product)}
												title="Deletar"
												className="hover:bg-destructive hover:text-destructive-foreground"
											>
												<Trash2 className="h-4 w-4" />
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
							onDelete={handleDelete}
							emptyMessage="Nenhum produto encontrado"
						/>
					)}
				</>
			)}
			<ConfirmDialog />
		</div>
	);
}
