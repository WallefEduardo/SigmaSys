"use client";

import { ArrowLeft, Save, FileText, DollarSign, CheckSquare, Plus, Play } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
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
import { cn } from "@/lib/utils";
import ChecklistFlow from "../../novo/checklist/ChecklistFlow";
import FlowTestModal from "../../novo/checklist/FlowTestModal";

type TabType = "general" | "pricing" | "checklist";

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
		checklist: null,
	});

	// Buscar dados do produto
	const { data: productData, isLoading: isLoadingProduct } = api.products.getById.useQuery(
		{ id: productId },
		{ enabled: !!productId }
	);

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
				checklist: productData.checklist || null,
			});
		}
	}, [productData]);

	const updateProductMutation = api.products.update.useMutation({
		onSuccess: () => {
			toast.success("Produto atualizado com sucesso!");
			// Limpar localStorage do checklist
			localStorage.removeItem('checklist-flow-data');
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
		console.log("FormData.checklist:", formData.checklist);
		const checklistData = formData.checklist ? {
			nodes: formData.checklist.nodes || [],
			edges: formData.checklist.edges || [],
			selections: formData.checklist.selections || {}
		} : null;
		console.log("ChecklistData preparado:", checklistData);

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

		console.log("Atualizando produto:", productData);
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
			description: "Dados básicos do produto"
		},
		{
			id: "pricing" as TabType,
			label: "Preços",
			icon: DollarSign,
			description: "Configuração de custos e markup"
		},
		{
			id: "checklist" as TabType,
			label: "Checklist",
			icon: CheckSquare,
			description: "Configuração por checklist"
		},
	];

	if (isLoadingProduct) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Carregando produto...</p>
				</div>
			</div>
		);
	}

	if (!productData) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">Produto não encontrado</p>
					<Button onClick={() => router.back()} variant="outline" className="mt-4">
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
					<h1 className="font-bold text-3xl">Editar Produto</h1>
					<p className="text-muted-foreground">
						Altere as configurações do produto "{productData.name}"
					</p>
				</div>
			</div>

			{/* Main Container */}
			<div className="flex gap-6">
					{/* Sidebar com Tabs */}
					<Card className="w-80 h-fit sticky top-4">
						<CardHeader>
							<CardTitle className="text-lg">Seções</CardTitle>
						</CardHeader>
						<CardContent className="p-2">
							<nav className="space-y-1">
								{tabs.map((tab) => {
									const Icon = tab.icon;
									return (
										<button
											key={tab.id}
											type="button"
											onClick={() => setActiveTab(tab.id)}
											className={cn(
												"w-full flex items-start gap-3 px-3 py-3 text-left rounded-lg transition-colors",
												"hover:bg-accent hover:text-accent-foreground",
												activeTab === tab.id 
													? "bg-primary/10 text-primary border-l-4 border-primary" 
													: "text-muted-foreground"
											)}
										>
											<Icon className={cn(
												"h-5 w-5 mt-0.5 shrink-0",
												activeTab === tab.id && "text-primary"
											)} />
											<div className="space-y-0.5">
												<div className="font-medium text-sm">{tab.label}</div>
												<div className="text-xs text-muted-foreground">
													{tab.description}
												</div>
											</div>
										</button>
									);
								})}
							</nav>
						</CardContent>
					</Card>

					{/* Content Area */}
					<div className="flex-1 space-y-6">
						{/* Tab: Informações Gerais */}
						{activeTab === "general" && (
							<Card>
								<CardHeader>
									<CardTitle>Informações Básicas</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div className="md:col-span-2">
											<label className="font-medium text-sm">Nome do Produto *</label>
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
									onChange={(formula) => setFormData((prev) => ({ ...prev, formula }))}
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
											<p className="text-muted-foreground text-xs mt-1">
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
												<Plus className="h-4 w-4 mr-1" />
												Adicionar Pergunta
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => setIsTestFlowModalOpen(true)}
												disabled={!formData.checklist?.nodes?.length}
											>
												<Play className="h-4 w-4 mr-1" />
												Testar Fluxo
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<ChecklistFlow 
										onComplete={(config) => {
											console.log("🔄 FRONTEND - ChecklistFlow onComplete chamado:", config);
											setFormData(prev => {
												const updated = { 
													...prev, 
													checklist: config 
												};
												console.log("🔄 FRONTEND - FormData atualizado:", updated.checklist);
												return updated;
											});
										}}
										initialData={formData.checklist}
									/>
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
								{updateProductMutation.isPending ? "Salvando..." : "Salvar Alterações"}
							</Button>
						</div>
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