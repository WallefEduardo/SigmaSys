"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Database, HelpCircle, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PrintHeadSpecsModal } from "@/components/modals/print-head-specs-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
	Form,
	FormControl,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/trpc";
import {
	ConsumableUnit,
	formatUnit,
	getRecommendedUnitsForType,
	getUnitDescription,
} from "@/lib/utils/consumable-units";

const consumableSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	description: z.string().optional(),
	code: z.string().optional(),
	type: z.enum(["ink", "printHead", "tool", "material", "other"], {
		required_error: "Tipo é obrigatório",
	}),
	cost: z.number().min(0, "Custo deve ser positivo"),
	unit: z.nativeEnum(ConsumableUnit, {
		errorMap: () => ({ message: "Unidade é obrigatória" }),
	}),
	supplier: z.string().optional(),
	color: z.string().optional(),
	// Converter string vazia para undefined nos campos numéricos
	volumeMl: z.preprocess((val) => {
		if (val === "" || val === null) return undefined;
		return val;
	}, z.number().int().positive().optional()),
	material: z.string().optional(),
	diameter: z.preprocess((val) => {
		if (val === "" || val === null) return undefined;
		return val;
	}, z.number().positive().optional()),
	// Campos específicos para cabeças de impressão - SIMPLIFICADO
	model: z.string().optional(),
	lifespanM2: z.preprocess((val) => {
		if (val === "" || val === null) return undefined;
		return val;
	}, z.number().int().positive().optional()),
	// Campos de estoque
	minStock: z.number().int().min(0).default(0),
	maxStock: z.number().int().min(0).default(0),
	currentStock: z.number().int().min(0).default(0),
	alertThreshold: z.number().int().min(0).default(0),
	autoReorder: z.boolean().default(false),
	active: z.boolean().default(true),
	tags: z.array(z.string()).default([]),
	notes: z.string().optional(),
});

type ConsumableFormData = z.infer<typeof consumableSchema>;

export default function NewConsumablePage() {
	const router = useRouter();
	const [newTag, setNewTag] = React.useState("");
	const [showSpecsModal, setShowSpecsModal] = React.useState(false);

	const createConsumableMutation = api.consumables.create.useMutation({
		onSuccess: (data) => {
			console.log("✅ Insumo criado com sucesso:", data);
			toast.success("Insumo criado com sucesso!");
			router.push("/cadastros/insumos");
		},
		onError: (error) => {
			console.error("❌ Erro ao criar insumo:", error);
			console.error("Detalhes do erro:", {
				message: error.message,
				data: error.data,
				shape: error.shape,
			});
			toast.error(error.message || "Erro ao criar insumo");
		},
	});

	const form = useForm<ConsumableFormData>({
		resolver: zodResolver(consumableSchema),
		defaultValues: {
			name: "",
			description: "",
			code: "",
			type: undefined,
			cost: 0,
			unit: undefined,
			supplier: "",
			color: "",
			volumeMl: "" as any,
			material: "",
			diameter: "" as any,
			model: "",
			lifespanM2: "" as any,
			// Campos de estoque
			minStock: 0,
			maxStock: 0,
			currentStock: 0,
			alertThreshold: 0,
			autoReorder: false,
			active: true,
			tags: [],
			notes: "",
		},
	});

	const watchedType = form.watch("type");
	const watchedUnit = form.watch("unit");

	// Automaticamente definir unidade para tipos específicos
	React.useEffect(() => {
		if (watchedType === "ink") {
			form.setValue("unit", "L");
		} else if (watchedType === "printHead") {
			form.setValue("unit", "PCS");
		}
	}, [watchedType, form]);

	const onSubmit = async (data: ConsumableFormData) => {
		console.log("🚀 Função onSubmit foi chamada!");
		console.log("📝 Dados do formulário:", data);
		console.log("🔍 Errors do form:", form.formState.errors);
		console.log("📋 Campos críticos:", {
			type: data.type,
			unit: data.unit,
			name: data.name,
			cost: data.cost,
		});

		// Verificar se há erros de validação
		const isValid = await form.trigger();
		console.log("✅ Formulário válido?", isValid);

		if (!isValid) {
			console.log("❌ Formulário inválido - não enviando");
			console.log("🚫 Erros específicos:", form.formState.errors);
			return;
		}

		// Os dados já foram processados pelo schema com z.preprocess
		const submitData = data;

		console.log("📤 Dados processados para envio:", submitData);
		console.log("🔗 Iniciando mutation...");

		try {
			createConsumableMutation.mutate(submitData);
		} catch (error) {
			console.error("💥 Erro ao chamar mutation:", error);
		}
	};

	const addTag = () => {
		if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
			const currentTags = form.getValues("tags");
			form.setValue("tags", [...currentTags, newTag.trim()]);
			setNewTag("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		const currentTags = form.getValues("tags");
		form.setValue(
			"tags",
			currentTags.filter((tag) => tag !== tagToRemove),
		);
	};

	const getTypeLabel = (type: string) => {
		const types = {
			ink: "Tinta",
			printHead: "Cabeça de Impressão",
			tool: "Ferramenta",
			material: "Material",
			other: "Outro",
		};
		return types[type as keyof typeof types] || type;
	};

	const handleSpecSelect = (spec: {
		model: string;
		lifespanM2: number;
		optimalSpeedRange: string;
		cost: number;
		costPerM2: number;
	}) => {
		// Preencher os campos do formulário com as especificações selecionadas
		form.setValue("model", spec.model);
		form.setValue("lifespanM2", spec.lifespanM2);
		form.setValue("cost", spec.cost);
		form.setValue("unit", "PCS"); // Sempre PCS para cabeças simplificadas

		toast.success(
			`Especificações do ${spec.model} aplicadas! Vida útil: ${(spec.lifespanM2 / 1000).toFixed(0)}K m² • Custo por m²: R$ ${spec.costPerM2.toFixed(4)}`,
		);
	};

	return (
		<TooltipProvider>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center gap-4">
					<Button variant="outline" size="icon" asChild>
						<Link href="/cadastros/insumos">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-3xl">Novo Insumo</h1>
						<p className="text-muted-foreground">
							Cadastre tintas, cabeças de impressão, ferramentas e materiais
						</p>
					</div>
				</div>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Dados Básicos */}
						<Card>
							<CardHeader>
								<CardTitle>Dados Básicos</CardTitle>
								<CardDescription>
									Informações fundamentais do insumo
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nome *</FormLabel>
												<FormControl>
													<Input
														placeholder="Ex: Tinta Eco-Solvente Magenta"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="code"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Código</FormLabel>
												<FormControl>
													<Input placeholder="Ex: TINT-ECO-MAG-1L" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
									<FormField
										control={form.control}
										name="type"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Tipo *</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value || ""}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione o tipo" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="ink">Tinta</SelectItem>
														<SelectItem value="printHead">
															Cabeça de Impressão
														</SelectItem>
														<SelectItem value="tool">Ferramenta</SelectItem>
														<SelectItem value="material">Material</SelectItem>
														<SelectItem value="other">Outro</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="cost"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="flex items-center gap-2">
													{watchedType === "ink"
														? "Custo por Litro *"
														: "Custo *"}
													<Tooltip>
														<TooltipTrigger asChild>
															<HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
														</TooltipTrigger>
														<TooltipContent className="max-w-md p-4">
															{watchedType === "ink" ? (
																<div className="space-y-3">
																	<h4 className="font-semibold text-sm">
																		💡 Custo por Litro para Tintas:
																	</h4>

																	<div className="space-y-2 text-xs">
																		<div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
																			<span className="font-medium text-blue-800 dark:text-blue-200">
																				🎨 Sempre em Litros
																			</span>
																			<p className="mt-1 text-blue-700 dark:text-blue-300">
																				Para tintas, sempre cadastramos o valor
																				por litro, independente do tamanho da
																				embalagem.
																			</p>
																		</div>

																		<div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
																			<span className="font-medium text-green-800 dark:text-green-200">
																				💡 Exemplos:
																			</span>
																			<div className="mt-1 text-green-700 dark:text-green-300">
																				<p>
																					• Tinta 1L custa R$ 89,90 →{" "}
																					<strong>R$ 89,90</strong>
																				</p>
																				<p>
																					• Tinta 500ml custa R$ 45 →{" "}
																					<strong>R$ 90,00</strong> (R$ 45 ÷
																					0,5L)
																				</p>
																			</div>
																		</div>
																	</div>

																	<div className="rounded bg-amber-50 p-2 text-xs dark:bg-amber-950/20">
																		<strong>🎯 Dica:</strong> O consumo por m²
																		será configurado depois no equipamento
																	</div>
																</div>
															) : (
																<div className="space-y-3">
																	<h4 className="font-semibold text-sm">
																		Como preencher o custo:
																	</h4>

																	<div className="space-y-2 text-xs">
																		<div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
																			<span className="font-medium text-blue-800 dark:text-blue-200">
																				💡 Custo unitário:
																			</span>
																			<p className="mt-1 text-blue-700 dark:text-blue-300">
																				Informe o custo por unidade (conforme a
																				unidade selecionada)
																			</p>
																		</div>
																	</div>
																</div>
															)}
														</TooltipContent>
													</Tooltip>
												</FormLabel>
												<FormControl>
													<CurrencyInput
														value={field.value}
														onChange={(value) => field.onChange(value || 0)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Para tintas, mostrar informação de que unidade é sempre L */}
									{watchedType === "ink" && (
										<div className="flex items-center gap-2 rounded-lg border bg-blue-50 px-3 py-2 dark:bg-blue-950/20">
											<div className="text-blue-600 dark:text-blue-400">🎨</div>
											<div className="flex-1">
												<p className="font-medium text-blue-900 text-sm dark:text-blue-100">
													Unidade: Litros (L)
												</p>
												<p className="text-blue-700 text-xs dark:text-blue-300">
													Tintas sempre são cadastradas por litro
												</p>
											</div>
										</div>
									)}

									{/* Para tintas, não mostrar campo de unidade - sempre será L */}
									{/* Para cabeças de impressão, sempre usar PCS */}
									{watchedType === "printHead" && (
										<div className="flex items-center gap-2 rounded-lg border bg-green-50 px-3 py-2 dark:bg-green-950/20">
											<div className="text-green-600 dark:text-green-400">
												🔧
											</div>
											<div className="flex-1">
												<p className="font-medium text-green-900 text-sm dark:text-green-100">
													Unidade: PCS (Peças)
												</p>
												<p className="text-green-700 text-xs dark:text-green-300">
													Cabeças sempre são cadastradas por peça
												</p>
											</div>
										</div>
									)}

									{/* Para outros tipos, mostrar seletor de unidade */}
									{watchedType !== "ink" && watchedType !== "printHead" && (
										<FormField
											control={form.control}
											name="unit"
											render={({ field }) => {
												const recommendedUnits = watchedType
													? getRecommendedUnitsForType(watchedType)
													: Object.values(ConsumableUnit);

												return (
													<FormItem>
														<FormLabel>Unidade *</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value || ""}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Selecione a unidade" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{recommendedUnits.map((unit) => (
																	<SelectItem key={unit} value={unit}>
																		<div className="flex flex-col">
																			<span className="font-medium">
																				{formatUnit(unit)}
																			</span>
																			<span className="text-muted-foreground text-xs">
																				{getUnitDescription(unit)}
																			</span>
																		</div>
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
									)}
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="supplier"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Fornecedor</FormLabel>
												<FormControl>
													<Input placeholder="Nome do fornecedor" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="flex items-center space-x-4">
										<FormField
											control={form.control}
											name="active"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3">
													<div className="space-y-0.5">
														<FormLabel>Ativo</FormLabel>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									</div>
								</div>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Descrição</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Descrição detalhada do insumo..."
													className="min-h-[80px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Especificações por Tipo */}
						{watchedType && (
							<Card>
								<CardHeader>
									<CardTitle>
										Especificações - {getTypeLabel(watchedType)}
									</CardTitle>
									<CardDescription>
										Informações específicas para{" "}
										{getTypeLabel(watchedType).toLowerCase()}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{watchedType === "ink" && (
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="color"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Cor</FormLabel>
														<FormControl>
															<Input
																placeholder="Ex: #FF0080 ou Magenta"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="volumeMl"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Volume (ml)</FormLabel>
														<FormControl>
															<Input
																type="number"
																placeholder="1000"
																{...field}
																value={field.value || ""}
																onChange={(e) =>
																	field.onChange(
																		e.target.value
																			? Number.parseInt(e.target.value)
																			: "",
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									)}

									{watchedType === "printHead" && (
										<div className="space-y-4">
											{/* Botão para abrir banco de especificações */}
											<div className="flex justify-center">
												<Button
													type="button"
													variant="outline"
													onClick={() => setShowSpecsModal(true)}
													className="flex items-center gap-2 border-2 border-primary/50 border-dashed hover:border-primary"
												>
													<Database className="h-4 w-4" />
													Consultar Especificações Técnicas
													<Badge variant="secondary" className="text-xs">
														9 modelos populares
													</Badge>
												</Button>
											</div>

											<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
												<FormField
													control={form.control}
													name="model"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Modelo</FormLabel>
															<FormControl>
																<Input
																	placeholder="Ex: DX5, DX7, I3200"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="lifespanM2"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="flex items-center gap-2">
																Vida Útil (m²)
																<Tooltip>
																	<TooltipTrigger asChild>
																		<HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
																	</TooltipTrigger>
																	<TooltipContent className="max-w-xs">
																		<div className="space-y-2 text-xs">
																			<p>
																				<strong>
																					Quantos m² a cabeça imprime antes da
																					troca:
																				</strong>
																			</p>
																			<div className="mt-2 rounded bg-green-50 p-2 dark:bg-green-950/20">
																				<strong>💡 Exemplos reais:</strong>
																				<br />• DX5: 150.000 m²
																				<br />• DX7: 300.000 m²
																				<br />• I3200: 500.000 m²
																			</div>
																			<p className="mt-2">
																				<strong>Como descobrir:</strong>{" "}
																				Consulte o banco de especificações
																				técnicas acima!
																			</p>
																		</div>
																	</TooltipContent>
																</Tooltip>
															</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	placeholder="150000"
																	{...field}
																	value={field.value || ""}
																	onChange={(e) =>
																		field.onChange(
																			e.target.value
																				? Number.parseInt(e.target.value)
																				: "",
																		)
																	}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											{/* Preview de custo por m² */}
											{form.watch("cost") && form.watch("lifespanM2") && (
												<div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:bg-green-950/20">
													<div className="flex items-center justify-between">
														<div>
															<div className="font-medium text-green-900 text-sm dark:text-green-100">
																💡 Custo de Desgaste por m²:
															</div>
															<div className="text-green-700 text-xs dark:text-green-300">
																R$ {form.watch("cost")} ÷{" "}
																{form.watch("lifespanM2")?.toLocaleString()} m²
															</div>
														</div>
														<div className="font-bold text-green-600 text-lg">
															R${" "}
															{(
																form.watch("cost") / form.watch("lifespanM2")
															).toFixed(4)}
														</div>
													</div>
												</div>
											)}

											{/* Card de instrução simples */}
											<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
												<CardContent className="p-4">
													<h5 className="mb-2 flex items-center gap-2 font-medium text-blue-900 dark:text-blue-100">
														<HelpCircle className="h-4 w-4" />
														Novo Cálculo Simplificado
													</h5>
													<div className="space-y-2 text-blue-800 text-xs dark:text-blue-200">
														<div className="rounded bg-blue-100 p-3 dark:bg-blue-900/50">
															<p className="font-medium">🎯 Fórmula simples:</p>
															<p>
																Custo por m² = Custo da cabeça ÷ Vida útil total
																em m²
															</p>
														</div>
														<div className="rounded bg-green-100 p-3 dark:bg-green-900/50">
															<p className="font-medium">✅ Mais fácil:</p>
															<p>
																Apenas 2 campos: modelo + quantos m² a cabeça
																imprime na vida útil
															</p>
														</div>
													</div>
												</CardContent>
											</Card>
										</div>
									)}

									{watchedType === "tool" && (
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<FormField
												control={form.control}
												name="material"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Material</FormLabel>
														<FormControl>
															<Input
																placeholder="Ex: Tungstênio, Aço, Carbono"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="diameter"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Diâmetro (mm)</FormLabel>
														<FormControl>
															<Input
																type="number"
																step="0.1"
																placeholder="6.0"
																{...field}
																value={field.value || ""}
																onChange={(e) =>
																	field.onChange(
																		e.target.value
																			? Number.parseFloat(e.target.value)
																			: "",
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Controle de Estoque */}
						<Card>
							<CardHeader>
								<CardTitle>Controle de Estoque</CardTitle>
								<CardDescription>
									Configurações de estoque e alertas
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="currentStock"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Estoque Atual</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="0"
														{...field}
														onChange={(e) =>
															field.onChange(
																Number.parseInt(e.target.value) || 0,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="alertThreshold"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nível de Alerta</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="5"
														{...field}
														onChange={(e) =>
															field.onChange(
																Number.parseInt(e.target.value) || 0,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="minStock"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Estoque Mínimo</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="0"
														{...field}
														onChange={(e) =>
															field.onChange(
																Number.parseInt(e.target.value) || 0,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="maxStock"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Estoque Máximo</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="100"
														{...field}
														onChange={(e) =>
															field.onChange(
																Number.parseInt(e.target.value) || 0,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="autoReorder"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3">
											<div className="space-y-0.5">
												<FormLabel>Reposição Automática</FormLabel>
												<div className="text-muted-foreground text-sm">
													Gerar alertas automáticos quando atingir o nível
													mínimo
												</div>
											</div>
											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Tags e Observações */}
						<Card>
							<CardHeader>
								<CardTitle>Tags e Observações</CardTitle>
								<CardDescription>
									Informações adicionais e categorização
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<FormLabel>Tags</FormLabel>
									<div className="flex gap-2">
										<Input
											placeholder="Adicionar tag..."
											value={newTag}
											onChange={(e) => setNewTag(e.target.value)}
											onKeyPress={(e) =>
												e.key === "Enter" && (e.preventDefault(), addTag())
											}
										/>
										<Button type="button" variant="outline" onClick={addTag}>
											Adicionar
										</Button>
									</div>
									<div className="flex flex-wrap gap-2">
										{form.watch("tags").map((tag, index) => (
											<Badge
												key={index}
												variant="secondary"
												className="cursor-pointer"
												onClick={() => removeTag(tag)}
											>
												{tag} ×
											</Badge>
										))}
									</div>
								</div>

								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Observações</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Observações adicionais..."
													className="min-h-[100px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Botões de Ação */}
						<div className="flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								asChild
								disabled={createConsumableMutation.isPending}
							>
								<Link href="/cadastros/insumos">Cancelar</Link>
							</Button>
							<Button
								type="submit"
								disabled={createConsumableMutation.isPending}
								onClick={() => {
									console.log("🖱️ Botão Submit foi clicado!");
									console.log("📋 Valores atuais do form:", form.getValues());
									console.log("🚫 Erros atuais:", form.formState.errors);
									console.log("🔍 Form state:", {
										isValid: form.formState.isValid,
										isSubmitting: form.formState.isSubmitting,
										isDirty: form.formState.isDirty,
									});
								}}
							>
								{createConsumableMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Salvando...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Salvar
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>

				{/* Modal de Especificações */}
				<PrintHeadSpecsModal
					open={showSpecsModal}
					onOpenChange={setShowSpecsModal}
					onSelectSpec={handleSpecSelect}
				/>
			</div>
		</TooltipProvider>
	);
}
