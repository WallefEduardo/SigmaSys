"use client";

import {
	ArrowLeft,
	CheckSquare,
	DollarSign,
	FileText,
	Play,
	Plus,
	Receipt,
	Save,
	TrendingUp,
	Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormulaBuilder } from "@/components/forms/formula-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import ChecklistFlow from "../../novo/checklist/ChecklistFlow";
import FlowTestModal from "../../novo/checklist/FlowTestModal";

type TabType =
	| "general"
	| "pricing"
	| "checklist"
	| "fiscal"
	| "market"
	| "outsourced";

export default function EditarProdutoPage() {
	const router = useRouter();
	const params = useParams();
	const productId = params?.id as string;

	const [activeTab, setActiveTab] = useState<TabType>("general");
	const [isTestFlowModalOpen, setIsTestFlowModalOpen] = useState(false);
	const [formData, setFormData] = useState<any>({
		name: "",
		description: "",
		code: "",
		category: "",
		formula: "",
		targetUnit: "m2",
		markup: 2.5,
		complexidade: "medium",
		checklist: undefined,
	});

	// Buscar dados do produto
	const { data: productData, isLoading: isLoadingProduct } =
		api.products.getById.useQuery({ id: productId }, { enabled: !!productId });

	// Carregar dados do produto quando chegar da API
	useEffect(() => {
		if (productData) {
			setFormData({
				name: productData.name || "",
				description: productData.description || "",
				code: productData.code || "",
				category: productData.category || "",
				formula: productData.formula || "",
				targetUnit: "m2", // default
				markup: productData.margin?.markup || 2.5,
				complexidade: "medium", // default
				checklist: productData.checklist || undefined,
			});
		}
	}, [productData]);

	const updateProductMutation = api.products.update.useMutation({
		onSuccess: () => {
			toast.success("Produto atualizado com sucesso!");
			// Limpar localStorage do checklist
			localStorage.removeItem("checklist-flow-data");
			router.push("/cadastros/produtos");
		},
		onError: (error) => {
			toast.error(error.message || "Erro ao atualizar produto");
			console.error("Error updating product:", error);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validações básicas
		if (!formData.name?.trim()) {
			toast.error("Nome do produto é obrigatório");
			return;
		}

		// Preparar dados do checklist para o backend
		const checklistData = formData.checklist
			? {
					nodes: formData.checklist.nodes || [],
					edges: formData.checklist.edges || [],
					selections: formData.checklist.selections || {},
				}
			: undefined;

		// Preparar dados do produto
		const productData = {
			id: productId,
			name: formData.name.trim(),
			description: formData.description?.trim() || undefined,
			code: formData.code?.trim() || undefined,
			category: formData.category || undefined,
			formula: formData.formula?.trim() || undefined,
			checklist: checklistData,
			margin: {
				markup: formData.markup || 2.5,
			},
			// Por enquanto arrays vazios - futuramente virão do checklist
			materials: [],
			equipments: [],
			processes: [],
			finishes: [],
		};

		updateProductMutation.mutate(productData);
	};

	const categories = [
		"Placas",
		"Banners",
		"Letreiros",
		"Adesivos",
		"Outdoor",
		"Fachadas",
		"Totens",
		"Displays",
	];

	const tabs = [
		{
			id: "general" as TabType,
			label: "Informações Gerais",
			icon: FileText,
		},
		{
			id: "pricing" as TabType,
			label: "Preços",
			icon: DollarSign,
		},
		{
			id: "checklist" as TabType,
			label: "Checklist",
			icon: CheckSquare,
		},
		{
			id: "fiscal" as TabType,
			label: "Fiscal",
			icon: Receipt,
		},
		{
			id: "market" as TabType,
			label: "Mercado de Produtos",
			icon: TrendingUp,
		},
		{
			id: "outsourced" as TabType,
			label: "Terceirizado",
			icon: Users,
		},
	];

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
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
				<div>
					<h1 className="font-bold text-3xl">🔥 Editar Produto - TABS HORIZONTAIS</h1>
					<p className="text-muted-foreground">
						Altere as configurações do produto "{productData.name}"
					</p>
				</div>
			</div>

			{/* Tabs Horizontais */}
			<div className="border-border border-b">
				<nav className="scrollbar-hide flex space-x-8 overflow-x-auto">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={cn(
									"flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 font-medium text-sm transition-colors",
									"hover:border-primary/50 hover:text-primary",
									activeTab === tab.id
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground",
								)}
							>
								<Icon className="h-4 w-4" />
								{tab.label}
							</button>
						);
					})}
				</nav>
			</div>

			{/* Content Area */}
			<div className="space-y-6">
				{/* Tab: Informações Gerais */}
				{activeTab === "general" && (
					<Card>
						<CardHeader>
							<CardTitle>Informações Básicas</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="md:col-span-2">
									<label className="font-medium text-sm">
										Nome do Produto *
									</label>
									<Input
										value={formData.name}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, name: e.target.value }))
										}
										placeholder="Ex: Placa de Acrílico Personalizada"
										required
										className="mt-1"
									/>
								</div>

								<div>
									<label className="font-medium text-sm">Código</label>
									<Input
										value={formData.code}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, code: e.target.value }))
										}
										placeholder="Ex: PRD-ACR-001"
										className="mt-1"
									/>
								</div>

								<div>
									<label className="font-medium text-sm">Categoria</label>
									<Select
										value={formData.category}
										onValueChange={(value) =>
											setFormData((prev) => ({ ...prev, category: value }))
										}
									>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="Selecione uma categoria" />
										</SelectTrigger>
										<SelectContent>
											{categories.map((category) => (
												<SelectItem key={category} value={category}>
													{category}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<label className="font-medium text-sm">Descrição</label>
								<Textarea
									value={formData.description}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
									placeholder="Descreva as características e especificações do produto..."
									rows={4}
									className="mt-1"
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Tab: Preços */}
				{activeTab === "pricing" && (
					<>
						{/* Fórmula de Cálculo */}
						<FormulaBuilder
							value={formData.formula}
							onChange={(formula) =>
								setFormData((prev) => ({ ...prev, formula }))
							}
							targetUnit={formData.targetUnit}
							onTargetUnitChange={(unit) =>
								setFormData((prev) => ({ ...prev, targetUnit: unit }))
							}
						/>

						{/* Configuração de Preços */}
						<Card>
							<CardHeader>
								<CardTitle>Configuração de Preços</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label className="font-medium text-sm">Markup Padrão</label>
									<Input
										type="number"
										step="0.1"
										value={formData.markup}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												markup: Number.parseFloat(e.target.value),
											}))
										}
										placeholder="2.5"
										className="mt-1 w-32"
									/>
									<p className="mt-1 text-muted-foreground text-xs">
										Multiplicador aplicado sobre o custo base
									</p>
								</div>
							</CardContent>
						</Card>
					</>
				)}

				{/* Tab: Checklist */}
				{activeTab === "checklist" && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Configuração por Checklist</CardTitle>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											// Abrir modal de adicionar pergunta
											if ((window as any).openAddQuestionModal) {
												(window as any).openAddQuestionModal();
											}
										}}
									>
										<Plus className="mr-1 h-4 w-4" />
										Adicionar Pergunta
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setIsTestFlowModalOpen(true)}
										disabled={!formData.checklist?.nodes?.length}
									>
										<Play className="mr-1 h-4 w-4" />
										Testar Fluxo
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<ChecklistFlow
								onComplete={(config) => {
									setFormData((prev) => ({
										...prev,
										checklist: config,
									}));
								}}
								initialData={formData.checklist}
								productId={productId} // Use o ID específico do produto
								forceInitialData={true} // Force usar initialData em vez do localStorage
							/>
						</CardContent>
					</Card>
				)}

				{/* Tab: Fiscal */}
				{activeTab === "fiscal" && (
					<Card>
						<CardHeader>
							<CardTitle>Informações Fiscais</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<label className="font-medium text-sm">NCM</label>
									<Input placeholder="Ex: 48159000" className="mt-1" />
								</div>
								<div>
									<label className="font-medium text-sm">CEST</label>
									<Input placeholder="Ex: 0123456" className="mt-1" />
								</div>
								<div>
									<label className="font-medium text-sm">CFOP</label>
									<Input placeholder="Ex: 5102" className="mt-1" />
								</div>
								<div>
									<label className="font-medium text-sm">CST</label>
									<Input placeholder="Ex: 000" className="mt-1" />
								</div>
							</div>
							<div>
								<label className="font-medium text-sm">
									Observações Fiscais
								</label>
								<Textarea
									placeholder="Observações adicionais para emissão de NF..."
									rows={3}
									className="mt-1"
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Tab: Mercado de Produtos */}
				{activeTab === "market" && (
					<Card>
						<CardHeader>
							<CardTitle>Análise de Mercado</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div>
									<label className="font-medium text-sm">
										Preço Médio Mercado
									</label>
									<Input
										type="number"
										step="0.01"
										placeholder="R$ 0,00"
										className="mt-1"
									/>
								</div>
								<div>
									<label className="font-medium text-sm">
										Margem Competitiva
									</label>
									<Input
										type="number"
										step="0.1"
										placeholder="% 0.0"
										className="mt-1"
									/>
								</div>
								<div>
									<label className="font-medium text-sm">Posicionamento</label>
									<Select>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="Selecione" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="premium">Premium</SelectItem>
											<SelectItem value="medio">Médio</SelectItem>
											<SelectItem value="economico">Econômico</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div>
								<label className="font-medium text-sm">Concorrentes</label>
								<Textarea
									placeholder="Liste os principais concorrentes e suas características..."
									rows={4}
									className="mt-1"
								/>
							</div>
							<div>
								<label className="font-medium text-sm">Público-alvo</label>
								<Textarea
									placeholder="Descreva o perfil do cliente ideal para este produto..."
									rows={3}
									className="mt-1"
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Tab: Terceirizado */}
				{activeTab === "outsourced" && (
					<Card>
						<CardHeader>
							<CardTitle>Serviços Terceirizados</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-4">
								<div>
									<label className="font-medium text-sm">
										Fornecedor Padrão
									</label>
									<Select>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="Selecione um fornecedor" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="fornecedor1">Gráfica ABC</SelectItem>
											<SelectItem value="fornecedor2">
												Serigrafia XYZ
											</SelectItem>
											<SelectItem value="fornecedor3">
												Print Solutions
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<label className="font-medium text-sm">
											Prazo Padrão (dias)
										</label>
										<Input type="number" placeholder="0" className="mt-1" />
									</div>
									<div>
										<label className="font-medium text-sm">
											Custo Base Terceirização
										</label>
										<Input
											type="number"
											step="0.01"
											placeholder="R$ 0,00"
											className="mt-1"
										/>
									</div>
								</div>
							</div>
							<div>
								<label className="font-medium text-sm">
									Especificações Técnicas
								</label>
								<Textarea
									placeholder="Especificações detalhadas para o fornecedor..."
									rows={4}
									className="mt-1"
								/>
							</div>
							<div>
								<label className="font-medium text-sm">
									Observações de Terceirização
								</label>
								<Textarea
									placeholder="Instruções especiais, cuidados, prazos específicos..."
									rows={3}
									className="mt-1"
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Botões de Ação */}
				<div className="flex justify-end gap-4 pt-6">
					<Button variant="outline" onClick={() => router.back()}>
						Cancelar
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={updateProductMutation.isPending}
					>
						<Save className="mr-2 h-4 w-4" />
						{updateProductMutation.isPending
							? "Salvando..."
							: "Salvar Alterações"}
					</Button>
				</div>
			</div>

			{/* Modal de Teste do Fluxo */}
			<FlowTestModal
				isOpen={isTestFlowModalOpen}
				onClose={() => setIsTestFlowModalOpen(false)}
				checklistData={formData.checklist}
			/>
		</div>
	);
}
/* Cache bust Fri Sep  5 01:18:41 -03 2025 */
