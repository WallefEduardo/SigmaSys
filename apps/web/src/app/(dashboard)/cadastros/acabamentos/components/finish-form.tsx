"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { 
	ArrowLeft, 
	ArrowRight, 
	ChevronLeft, 
	ChevronRight,
	DollarSign, 
	Info,
	Layers, 
	Package, 
	Plus, 
	Save, 
	Settings,
	Trash2, 
	X 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils/currency";

const formSchema = z.object({
	// Aba 1: Informações Básicas
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200, "Nome não pode ter mais que 200 caracteres"),
	description: z.string().optional(),
	type: z.enum(["simple", "composed"]),
	unit: z.string(),
	baseCost: z.coerce.number().min(0, "Custo base deve ser maior ou igual a zero"),
	margin: z.coerce.number().min(1, "Margem deve ser maior que 1"),
	defaultWidth: z.coerce.number().min(0).optional(),
	defaultHeight: z.coerce.number().min(0).optional(),
	tags: z.array(z.string()).default([]),
	
	// Aba 2: Processos
	processes: z.array(z.object({
		processId: z.string(),
		timeNeeded: z.coerce.number().min(0.01),
		unit: z.string(),
	})).default([]),
	
	// Aba 3: Matérias-Primas
	materials: z.array(z.object({
		materialId: z.string(),
		quantity: z.coerce.number().min(0.01),
		unit: z.string(),
	})).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface FinishFormProps {
	finish?: any;
	onSubmit: (data: FormData) => void;
	isLoading?: boolean;
}

const units = [
	{ value: "m2", label: "Metro Quadrado (m²)" },
	{ value: "m", label: "Metro Linear (m)" },
	{ value: "un", label: "Unidade" },
	{ value: "cm2", label: "Centímetro Quadrado (cm²)" },
];

export function FinishForm({ finish, onSubmit, isLoading }: FinishFormProps) {
	const router = useRouter();
	const [currentTab, setCurrentTab] = useState("info");
	const [selectedProcesses, setSelectedProcesses] = useState<any[]>(finish?.composition?.processes || []);
	const [selectedMaterials, setSelectedMaterials] = useState<any[]>(finish?.composition?.materials || []);
	const [tagInput, setTagInput] = useState("");

	// Buscar dados disponíveis
	const { data: materialsData } = api.materials.list.useQuery({});
	const { data: processesData } = api.processes.list.useQuery({});

	const availableMaterials = materialsData?.items || [];
	const availableProcesses = processesData?.processes || [];

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: finish?.name ?? "",
			description: finish?.description ?? "",
			type: finish?.type ?? "simple",
			unit: finish?.unit ?? "m2",
			baseCost: finish?.baseCost ?? 0,
			margin: finish?.margin ?? 2,
			defaultWidth: finish?.defaultWidth ?? 0,
			defaultHeight: finish?.defaultHeight ?? 0,
			tags: finish?.tags ?? [],
			processes: selectedProcesses,
			materials: selectedMaterials,
		},
	});

	const watchType = form.watch("type");
	const watchBaseCost = form.watch("baseCost");
	const watchMargin = form.watch("margin");
	const watchTags = form.watch("tags");

	// Navegação entre tabs
	const tabs = ["info", "processes", "materials"];
	const currentTabIndex = tabs.indexOf(currentTab);
	const isFirstTab = currentTabIndex === 0;
	const isLastTab = currentTabIndex === tabs.length - 1;

	const goToNextTab = () => {
		if (!isLastTab) {
			setCurrentTab(tabs[currentTabIndex + 1]);
		}
	};

	const goToPrevTab = () => {
		if (!isFirstTab) {
			setCurrentTab(tabs[currentTabIndex - 1]);
		}
	};

	// Adicionar processo
	const addProcess = (processId: string) => {
		const process = availableProcesses.find(p => p.id === processId);
		if (process && !selectedProcesses.find(p => p.processId === processId)) {
			const newProcess = {
				processId,
				timeNeeded: 1,
				unit: process.timeUnit || "hour",
			};
			const updated = [...selectedProcesses, newProcess];
			setSelectedProcesses(updated);
			form.setValue("processes", updated);
		}
	};

	// Remover processo
	const removeProcess = (processId: string) => {
		const updated = selectedProcesses.filter(p => p.processId !== processId);
		setSelectedProcesses(updated);
		form.setValue("processes", updated);
	};

	// Adicionar material
	const addMaterial = (materialId: string) => {
		const material = availableMaterials.find(m => m.id === materialId);
		if (material && !selectedMaterials.find(m => m.materialId === materialId)) {
			const newMaterial = {
				materialId,
				quantity: 1,
				unit: material.unit,
			};
			const updated = [...selectedMaterials, newMaterial];
			setSelectedMaterials(updated);
			form.setValue("materials", updated);
		}
	};

	// Remover material
	const removeMaterial = (materialId: string) => {
		const updated = selectedMaterials.filter(m => m.materialId !== materialId);
		setSelectedMaterials(updated);
		form.setValue("materials", updated);
	};

	// Adicionar tag
	const addTag = () => {
		if (tagInput.trim() && !watchTags.includes(tagInput.trim())) {
			const newTags = [...watchTags, tagInput.trim()];
			form.setValue("tags", newTags);
			setTagInput("");
		}
	};

	// Remover tag
	const removeTag = (tag: string) => {
		const newTags = watchTags.filter(t => t !== tag);
		form.setValue("tags", newTags);
	};

	const handleSubmit = (values: FormData) => {
		const formData = {
			...values,
			description: values.description || undefined,
			defaultWidth: values.defaultWidth && values.defaultWidth > 0 ? values.defaultWidth : undefined,
			defaultHeight: values.defaultHeight && values.defaultHeight > 0 ? values.defaultHeight : undefined,
			composition: {
				materials: selectedMaterials.length > 0 ? selectedMaterials : undefined,
				processes: selectedProcesses.length > 0 ? selectedProcesses : undefined,
			},
		};

		onSubmit(formData);
	};

	// Calcular preço final
	const finalPrice = watchBaseCost * watchMargin;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
				<div>
					<h1 className="font-bold text-2xl">
						{finish ? "Editar Acabamento" : "Novo Acabamento"}
					</h1>
					<p className="text-muted-foreground text-sm">
						Configure as informações, processos e materiais do acabamento
					</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
					<Tabs value={currentTab} onValueChange={setCurrentTab}>
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="info" className="flex items-center gap-2">
								<Info className="h-4 w-4" />
								Informações
							</TabsTrigger>
							<TabsTrigger value="processes" className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								Processos
							</TabsTrigger>
							<TabsTrigger value="materials" className="flex items-center gap-2">
								<Package className="h-4 w-4" />
								Matérias-Primas
							</TabsTrigger>
						</TabsList>

						{/* Aba 1: Informações Básicas */}
						<TabsContent value="info" className="space-y-6">
							<div className="grid gap-6 lg:grid-cols-3">
								{/* Dados Básicos */}
								<Card className="lg:col-span-2">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Info className="h-5 w-5" />
											Dados Básicos
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Nome do Acabamento *</FormLabel>
													<FormControl>
														<Input 
															placeholder="Ex: Laminação Brilho, Verniz UV..."
															{...field} 
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="description"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Descrição</FormLabel>
													<FormControl>
														<Textarea 
															placeholder="Descreva as características do acabamento..."
															rows={3}
															{...field}
														/>
													</FormControl>
													<FormDescription>
														Informações adicionais sobre o acabamento (opcional)
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="grid gap-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="type"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Tipo de Acabamento *</FormLabel>
														<Select onValueChange={field.onChange} defaultValue={field.value}>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Selecione o tipo" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="simple">Simples</SelectItem>
																<SelectItem value="composed">Composto</SelectItem>
															</SelectContent>
														</Select>
														<FormDescription>
															{watchType === "simple" ? "Acabamento sem composição de materiais/processos" : "Acabamento com composição personalizada"}
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="unit"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Unidade de Medida *</FormLabel>
														<Select onValueChange={field.onChange} defaultValue={field.value}>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Selecione a unidade" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{units.map((unit) => (
																	<SelectItem key={unit.value} value={unit.value}>
																		{unit.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										{/* Dimensões Padrão */}
										<div className="grid gap-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="defaultWidth"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Largura Padrão (cm)</FormLabel>
														<FormControl>
															<Input 
																type="number"
																step="0.01"
																min="0"
																placeholder="0"
																{...field}
															/>
														</FormControl>
														<FormDescription>
															Largura padrão para cálculos (opcional)
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="defaultHeight"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Altura Padrão (cm)</FormLabel>
														<FormControl>
															<Input 
																type="number"
																step="0.01"
																min="0"
																placeholder="0"
																{...field}
															/>
														</FormControl>
														<FormDescription>
															Altura padrão para cálculos (opcional)
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										{/* Tags */}
										<div className="space-y-3">
											<FormLabel>Tags</FormLabel>
											<div className="flex gap-2">
												<Input
													value={tagInput}
													onChange={(e) => setTagInput(e.target.value)}
													placeholder="Digite uma tag..."
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault();
															addTag();
														}
													}}
												/>
												<Button type="button" onClick={addTag} size="sm">
													<Plus className="h-4 w-4" />
												</Button>
											</div>
											{watchTags.length > 0 && (
												<div className="flex flex-wrap gap-2">
													{watchTags.map((tag) => (
														<Badge key={tag} variant="secondary" className="flex items-center gap-1">
															{tag}
															<X 
																className="h-3 w-3 cursor-pointer hover:text-destructive" 
																onClick={() => removeTag(tag)}
															/>
														</Badge>
													))}
												</div>
											)}
										</div>
									</CardContent>
								</Card>

								{/* Custos e Preços */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<DollarSign className="h-5 w-5" />
											Custos e Preços
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<FormField
											control={form.control}
											name="baseCost"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Custo Base *</FormLabel>
													<FormControl>
														<div className="relative">
															<span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
															<Input 
																type="number"
																step="0.01"
																min="0"
																placeholder="0,00"
																className="pl-8"
																{...field}
															/>
														</div>
													</FormControl>
													<FormDescription>
														Custo do acabamento por unidade
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="margin"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Margem de Lucro *</FormLabel>
													<FormControl>
														<div className="relative">
															<Input 
																type="number"
																step="0.1"
																min="1"
																placeholder="2.0"
																className="pr-8"
																{...field}
															/>
															<span className="absolute right-3 top-2.5 text-muted-foreground">x</span>
														</div>
													</FormControl>
													<FormDescription>
														Multiplicador do custo base
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										{/* Preview de Preço */}
										{watchBaseCost > 0 && watchMargin >= 1 && (
											<div className="rounded-lg bg-muted/50 p-4">
												<h4 className="font-medium text-sm mb-3">Preview de Preço</h4>
												<div className="space-y-2 text-sm">
													<div className="flex justify-between">
														<span className="text-muted-foreground">Custo base:</span>
														<span>{formatCurrency(watchBaseCost)}</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">Margem:</span>
														<span>{watchMargin}x</span>
													</div>
													<Separator />
													<div className="flex justify-between font-semibold">
														<span>Preço final:</span>
														<span className="text-primary">{formatCurrency(finalPrice)}</span>
													</div>
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Aba 2: Processos */}
						<TabsContent value="processes" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Settings className="h-5 w-5" />
										Processos do Acabamento
									</CardTitle>
									<p className="text-muted-foreground text-sm">
										{watchType === "simple" ? "Acabamentos simples não usam composição de processos" : "Selecione os processos necessários para este acabamento"}
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									{watchType === "composed" && (
										<>
											{/* Adicionar Processo */}
											<div className="flex gap-2">
												<Select onValueChange={addProcess}>
													<SelectTrigger className="flex-1">
														<SelectValue placeholder="Selecione um processo para adicionar..." />
													</SelectTrigger>
													<SelectContent>
														{availableProcesses
															.filter(process => !selectedProcesses.find(p => p.processId === process.id))
															.map((process) => (
																<SelectItem key={process.id} value={process.id}>
																	{process.name} - {formatCurrency(process.costPerHour)}/{process.timeUnit}
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</div>

											{/* Lista de Processos Selecionados */}
											{selectedProcesses.length > 0 && (
												<div className="space-y-3">
													<h4 className="font-medium">Processos Selecionados:</h4>
													{selectedProcesses.map((selectedProcess, index) => {
														const process = availableProcesses.find(p => p.id === selectedProcess.processId);
														return (
															<Card key={selectedProcess.processId} className="p-4">
																<div className="flex items-center justify-between gap-4">
																	<div className="flex-1">
																		<h5 className="font-medium">{process?.name}</h5>
																		<p className="text-muted-foreground text-sm">
																			{formatCurrency(process?.costPerHour || 0)} / {process?.timeUnit}
																		</p>
																	</div>
																	<div className="flex items-center gap-2">
																		<Input
																			type="number"
																			step="0.01"
																			min="0.01"
																			placeholder="Tempo"
																			className="w-24"
																			value={selectedProcess.timeNeeded}
																			onChange={(e) => {
																				const updated = [...selectedProcesses];
																				updated[index].timeNeeded = parseFloat(e.target.value) || 0;
																				setSelectedProcesses(updated);
																				form.setValue("processes", updated);
																			}}
																		/>
																		<span className="text-muted-foreground text-sm">
																			{selectedProcess.unit}
																		</span>
																		<Button
																			type="button"
																			variant="outline"
																			size="sm"
																			onClick={() => removeProcess(selectedProcess.processId)}
																		>
																			<Trash2 className="h-4 w-4" />
																		</Button>
																	</div>
																</div>
															</Card>
														);
													})}
												</div>
											)}
										</>
									)}

									{watchType === "simple" && (
										<div className="rounded-lg bg-muted/50 p-6 text-center">
											<Settings className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
											<p className="text-muted-foreground">
												Acabamentos simples não requerem configuração de processos.
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* Aba 3: Matérias-Primas */}
						<TabsContent value="materials" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Package className="h-5 w-5" />
										Matérias-Primas do Acabamento
									</CardTitle>
									<p className="text-muted-foreground text-sm">
										{watchType === "simple" ? "Acabamentos simples não usam composição de materiais" : "Selecione as matérias-primas necessárias para este acabamento"}
									</p>
								</CardHeader>
								<CardContent className="space-y-4">
									{watchType === "composed" && (
										<>
											{/* Adicionar Material */}
											<div className="flex gap-2">
												<Select onValueChange={addMaterial}>
													<SelectTrigger className="flex-1">
														<SelectValue placeholder="Selecione uma matéria-prima para adicionar..." />
													</SelectTrigger>
													<SelectContent>
														{availableMaterials
															.filter(material => !selectedMaterials.find(m => m.materialId === material.id))
															.map((material) => (
																<SelectItem key={material.id} value={material.id}>
																	{material.name} - {formatCurrency(material.cost)}/{material.unit}
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</div>

											{/* Lista de Materiais Selecionados */}
											{selectedMaterials.length > 0 && (
												<div className="space-y-3">
													<h4 className="font-medium">Matérias-Primas Selecionadas:</h4>
													{selectedMaterials.map((selectedMaterial, index) => {
														const material = availableMaterials.find(m => m.id === selectedMaterial.materialId);
														return (
															<Card key={selectedMaterial.materialId} className="p-4">
																<div className="flex items-center justify-between gap-4">
																	<div className="flex-1">
																		<h5 className="font-medium">{material?.name}</h5>
																		<p className="text-muted-foreground text-sm">
																			{formatCurrency(material?.cost || 0)} / {material?.unit}
																		</p>
																	</div>
																	<div className="flex items-center gap-2">
																		<Input
																			type="number"
																			step="0.01"
																			min="0.01"
																			placeholder="Qtd"
																			className="w-24"
																			value={selectedMaterial.quantity}
																			onChange={(e) => {
																				const updated = [...selectedMaterials];
																				updated[index].quantity = parseFloat(e.target.value) || 0;
																				setSelectedMaterials(updated);
																				form.setValue("materials", updated);
																			}}
																		/>
																		<span className="text-muted-foreground text-sm">
																			{selectedMaterial.unit}
																		</span>
																		<Button
																			type="button"
																			variant="outline"
																			size="sm"
																			onClick={() => removeMaterial(selectedMaterial.materialId)}
																		>
																			<Trash2 className="h-4 w-4" />
																		</Button>
																	</div>
																</div>
															</Card>
														);
													})}
												</div>
											)}
										</>
									)}

									{watchType === "simple" && (
										<div className="rounded-lg bg-muted/50 p-6 text-center">
											<Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
											<p className="text-muted-foreground">
												Acabamentos simples não requerem configuração de matérias-primas.
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>

					{/* Botões de Navegação */}
					<div className="flex justify-between items-center pt-6 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
						>
							Cancelar
						</Button>

						<div className="flex gap-2">
							{!isFirstTab && (
								<Button
									type="button"
									variant="outline"
									onClick={goToPrevTab}
								>
									<ChevronLeft className="mr-2 h-4 w-4" />
									Anterior
								</Button>
							)}

							{!isLastTab && (
								<Button
									type="button"
									onClick={goToNextTab}
								>
									Avançar
									<ChevronRight className="ml-2 h-4 w-4" />
								</Button>
							)}

							{isLastTab && (
								<Button type="submit" disabled={isLoading}>
									<Save className="mr-2 h-4 w-4" />
									{isLoading ? "Salvando..." : (finish ? "Atualizar" : "Salvar")}
								</Button>
							)}
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
}