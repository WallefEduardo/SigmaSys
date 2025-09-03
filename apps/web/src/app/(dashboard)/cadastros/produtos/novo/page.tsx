"use client";

import { ArrowLeft, Save, FileText, DollarSign, CheckSquare, Plus, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

// Import the ChecklistFlow component directly instead of lazy loading to avoid chunk issues
import ChecklistFlow from './checklist/ChecklistFlow';
import FlowTestModal from './checklist/FlowTestModal';

function ChecklistCard({ 
	onComplete, 
	checklistData,
	onTestFlow 
}: { 
	onComplete: (config: any) => void;
	checklistData?: any;
	onTestFlow: () => void;
}) {
	return (
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
							onClick={onTestFlow}
							disabled={!checklistData?.nodes?.length}
						>
							<Play className="h-4 w-4 mr-1" />
							Testar Fluxo
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ChecklistFlow onComplete={onComplete} />
			</CardContent>
		</Card>
	);
}

type TabType = "general" | "pricing" | "checklist";

export default function NovoProdutoPage() {
	const router = useRouter();
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

	const createProductMutation = api.products.create.useMutation({
		onSuccess: () => {
			toast.success("Produto criado com sucesso!");
			// Limpar localStorage do checklist
			localStorage.removeItem('checklist-flow-data');
			router.push("/cadastros/produtos");
		},
		onError: (error) => {
			toast.error(error.message || "Erro ao criar produto");
			console.error("Error creating product:", error);
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

		console.log("Enviando dados do produto:", productData);
		createProductMutation.mutate(productData);
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

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
				<div>
					<h1 className="font-bold text-3xl">Novo Produto</h1>
					<p className="text-muted-foreground">
						Cadastre um novo produto com configuração completa
					</p>
				</div>
			</div>

			{/* Main Container */}
			<div className="flex gap-6">
					{/* Sidebar com Tabs */}
					<Card className="w-80 h-fit sticky top-4">
						<CardHeader>
							<CardTitle className="text-lg">Etapas do Cadastro</CardTitle>
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

									<div>
										<label className="font-medium text-sm">Complexidade</label>
										<Select
											value={formData.complexidade}
											onValueChange={(value) =>
												setFormData((prev) => ({ ...prev, complexidade: value }))
											}
										>
											<SelectTrigger className="mt-1">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="simple">Simples</SelectItem>
												<SelectItem value="medium">Médio</SelectItem>
												<SelectItem value="complex">Complexo</SelectItem>
											</SelectContent>
										</Select>
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

										<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
											<h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
												Como funciona o cálculo?
											</h4>
											<div className="space-y-1 text-blue-800 text-sm dark:text-blue-200">
												<p>
													1. <strong>Custo Base:</strong> Resultado da fórmula criada
													acima
												</p>
												<p>
													2. <strong>Markup:</strong> Multiplicador aplicado sobre o
													custo base
												</p>
												<p>
													3. <strong>Preço Final:</strong> Custo Base × Markup
												</p>
												<p>
													4. <strong>Margem Líquida:</strong> (Preço Final - Custo Base)
													/ Preço Final × 100
												</p>
											</div>
										</div>

										{formData.formula && (
											<div className="rounded bg-muted/50 p-4">
												<h4 className="mb-2 font-medium">Exemplo de Cálculo</h4>
												<div className="space-y-1 text-sm">
													<div>
														Fórmula:{" "}
														<code className="rounded bg-background px-1">
															{formData.formula}
														</code>
													</div>
													<div>Para largura=2m, altura=1.5m:</div>
													<div className="ml-4 text-muted-foreground">
														• Custo Base: R$ 150,00 (exemplo)
													</div>
													<div className="ml-4 text-muted-foreground">
														• Markup: {formData.markup}x
													</div>
													<div className="ml-4 font-medium text-green-600">
														• Preço Final: R$ {(150 * formData.markup).toFixed(2)}
													</div>
													<div className="ml-4 text-muted-foreground">
														• Margem: {Math.round((1 - 1 / formData.markup) * 100)}%
													</div>
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							</>
						)}

						{/* Tab: Checklist */}
						{activeTab === "checklist" && (
							<ChecklistCard 
								onComplete={(config) => {
									console.log("Checklist configuration updated:", config);
									setFormData(prev => ({ 
										...prev, 
										checklist: config 
									}));
								}}
								checklistData={formData.checklist}
								onTestFlow={() => setIsTestFlowModalOpen(true)}
							/>
						)}

						{/* Botões de Ação */}
						<div className="flex justify-end gap-4 pt-6">
							<Button variant="outline" onClick={() => router.back()}>
								Cancelar
							</Button>
							<Button 
								onClick={handleSubmit} 
								disabled={createProductMutation.isPending}
							>
								<Save className="mr-2 h-4 w-4" />
								{createProductMutation.isPending ? "Salvando..." : "Salvar Produto"}
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