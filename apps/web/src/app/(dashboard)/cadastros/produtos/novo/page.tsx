"use client";

import {
	ArrowLeft,
	CheckSquare,
	DollarSign,
	FileText,
	Play,
	Plus,
	Save,
	Receipt,
	TrendingUp,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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

// Import the new ChecklistFlow component
import ChecklistFlow, {
	type ChecklistFlowRef,
} from "./checklist/ChecklistFlow";
import ChecklistStorage from "./checklist/checklist-storage";
import FlowTestModal from "./checklist/FlowTestModal";

function ChecklistCard({
	onComplete,
	checklistData,
	onTestFlow,
}: {
	onComplete: (config: any) => void;
	checklistData?: any;
	onTestFlow: () => void;
}) {
	const checklistRef = useRef<ChecklistFlowRef>(null);
	return (
		<Card className="border-gray-700 bg-gray-900">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-gray-100">
						Configuração por Checklist
					</CardTitle>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
							onClick={() => {
								checklistRef.current?.openAddQuestionModal();
							}}
						>
							<Plus className="mr-1 h-4 w-4" />
							Adicionar Pergunta
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50"
							onClick={onTestFlow}
							disabled={!checklistData?.nodes?.length}
						>
							<Play className="mr-1 h-4 w-4" />
							Testar Fluxo
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="bg-gray-900">
				<ChecklistFlow
					ref={checklistRef}
					onComplete={onComplete}
					onAddQuestion={() => {}}
				/>
			</CardContent>
		</Card>
	);
}

type TabType = "general" | "pricing" | "checklist" | "fiscal" | "market" | "outsourced";

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
		checklist: undefined,
	});

	const createProductMutation = api.products.create.useMutation({
		onSuccess: () => {
			toast.success("Produto criado com sucesso!");
			// ✅ Limpar localStorage do checklist com a chave correta
			ChecklistStorage.clear();
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
		const checklistData = formData.checklist
			? {
					nodes: formData.checklist.nodes || [],
					edges: formData.checklist.edges || [],
					selections: formData.checklist.selections || {},
				}
			: undefined;

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

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
				<div>
					<h1 className="font-bold text-3xl">🚀 Novo Produto - TABS HORIZONTAIS</h1>
					<p className="text-muted-foreground">
						Cadastre um novo produto com configuração completa
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
												setFormData((prev) => ({
													...prev,
													name: e.target.value,
												}))
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
												setFormData((prev) => ({
													...prev,
													code: e.target.value,
												}))
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

									<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
										<h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
											Como funciona o cálculo?
										</h4>
										<div className="space-y-1 text-blue-800 text-sm dark:text-blue-200">
											<p>
												1. <strong>Custo Base:</strong> Resultado da fórmula
												criada acima
											</p>
											<p>
												2. <strong>Markup:</strong> Multiplicador aplicado sobre
												o custo base
											</p>
											<p>
												3. <strong>Preço Final:</strong> Custo Base × Markup
											</p>
											<p>
												4. <strong>Margem Líquida:</strong> (Preço Final - Custo
												Base) / Preço Final × 100
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
													• Margem:{" "}
													{Math.round((1 - 1 / formData.markup) * 100)}%
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
								setFormData((prev) => ({
									...prev,
									checklist: config,
								}));
							}}
							checklistData={formData.checklist}
							onTestFlow={() => setIsTestFlowModalOpen(true)}
						/>
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
										<Input
											placeholder="Ex: 48159000"
											className="mt-1"
										/>
									</div>
									<div>
										<label className="font-medium text-sm">CEST</label>
										<Input
											placeholder="Ex: 0123456"
											className="mt-1"
										/>
									</div>
									<div>
										<label className="font-medium text-sm">CFOP</label>
										<Input
											placeholder="Ex: 5102"
											className="mt-1"
										/>
									</div>
									<div>
										<label className="font-medium text-sm">CST</label>
										<Input
											placeholder="Ex: 000"
											className="mt-1"
										/>
									</div>
								</div>
								<div>
									<label className="font-medium text-sm">Observações Fiscais</label>
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
										<label className="font-medium text-sm">Preço Médio Mercado</label>
										<Input
											type="number"
											step="0.01"
											placeholder="R$ 0,00"
											className="mt-1"
										/>
									</div>
									<div>
										<label className="font-medium text-sm">Margem Competitiva</label>
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
										<label className="font-medium text-sm">Fornecedor Padrão</label>
										<Select>
											<SelectTrigger className="mt-1">
												<SelectValue placeholder="Selecione um fornecedor" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="fornecedor1">Gráfica ABC</SelectItem>
												<SelectItem value="fornecedor2">Serigrafia XYZ</SelectItem>
												<SelectItem value="fornecedor3">Print Solutions</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<label className="font-medium text-sm">Prazo Padrão (dias)</label>
											<Input
												type="number"
												placeholder="0"
												className="mt-1"
											/>
										</div>
										<div>
											<label className="font-medium text-sm">Custo Base Terceirização</label>
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
									<label className="font-medium text-sm">Especificações Técnicas</label>
									<Textarea
										placeholder="Especificações detalhadas para o fornecedor..."
										rows={4}
										className="mt-1"
									/>
								</div>
								<div>
									<label className="font-medium text-sm">Observações de Terceirização</label>
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
						disabled={createProductMutation.isPending}
					>
						<Save className="mr-2 h-4 w-4" />
						{createProductMutation.isPending
							? "Salvando..."
							: "Salvar Produto"}
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
