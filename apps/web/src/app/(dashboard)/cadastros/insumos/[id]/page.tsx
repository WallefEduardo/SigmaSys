"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowLeft,
	Database,
	HelpCircle,
	Loader2,
	Save,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
	unit: z
		.string()
		.min(1, "Unidade é obrigatória")
		.refine(
			(val) => Object.values(ConsumableUnit).includes(val as ConsumableUnit),
			{ message: "Unidade inválida" },
		),
	supplier: z.string().optional(),
	color: z.string().optional(),
	volumeMl: z.number().int().positive().optional(),
	lifespan: z.number().int().positive().optional(),
	currentUse: z.number().int().min(0).optional(),
	material: z.string().optional(),
	diameter: z.number().positive().optional(),
	// Campos específicos para cabeças de impressão
	model: z.string().optional(),
	durationMonths: z.number().int().positive().optional(),
	installationDate: z.preprocess((val) => {
		if (val === "" || val === null || val === undefined) return undefined;
		return val instanceof Date ? val : new Date(val as string);
	}, z.date().optional()),
	optimalSpeedRange: z.string().optional(),
	shotsPerM2: z.number().int().positive().optional(),
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

export default function EditConsumablePage() {
	const router = useRouter();
	const params = useParams();
	const consumableId = params.id as string;
	const [newTag, setNewTag] = React.useState("");
	const [showSpecsModal, setShowSpecsModal] = React.useState(false);

	const updateConsumableMutation = api.consumables.update.useMutation({
		onSuccess: (data) => {
			toast.success("Insumo atualizado com sucesso!");
			router.push("/cadastros/insumos");
		},
		onError: (error) => {
			toast.error(error.message || "Erro ao atualizar insumo");
		},
	});

	const deleteConsumableMutation = api.consumables.delete.useMutation({
		onSuccess: () => {
			toast.success("Insumo excluído com sucesso!");
			router.push("/cadastros/insumos");
		},
		onError: (error) => {
			toast.error(error.message || "Erro ao excluir insumo");
		},
	});

	const {
		data: consumable,
		isLoading,
		error,
	} = api.consumables.byId.useQuery({
		id: consumableId,
	});

	const form = useForm<ConsumableFormData>({
		resolver: zodResolver(consumableSchema),
		defaultValues: React.useMemo(() => {
			if (!consumable) {
				return {
					name: "",
					description: "",
					code: "",
					type: undefined,
					cost: 0,
					unit: "",
					supplier: "",
					color: "",
					volumeMl: undefined,
					lifespan: undefined,
					currentUse: 0,
					material: "",
					diameter: undefined,
					// Campos específicos para cabeças de impressão
					model: "",
					durationMonths: undefined,
					installationDate: undefined,
					optimalSpeedRange: "",
					shotsPerM2: undefined,
					// Campos de estoque
					minStock: 0,
					maxStock: 0,
					currentStock: 0,
					alertThreshold: 0,
					autoReorder: false,
					active: true,
					tags: [],
					notes: "",
				};
			}

			console.log("🔄 Criando defaultValues com:", {
				type: consumable.type,
				unit: consumable.unit,
			});

			return {
				name: consumable.name,
				description: consumable.description || "",
				code: consumable.code || "",
				type: consumable.type as any,
				cost: Number(consumable.cost),
				unit: consumable.type === "ink" ? "L" : consumable.unit,
				supplier: consumable.supplier || "",
				color: consumable.color || "",
				volumeMl: consumable.volumeMl || undefined,
				lifespan: consumable.lifespan || undefined,
				currentUse: consumable.currentUse || 0,
				material: consumable.material || "",
				diameter: consumable.diameter ? Number(consumable.diameter) : undefined,
				// Campos específicos para cabeças de impressão
				model: consumable.model || "",
				durationMonths: consumable.durationMonths || undefined,
				installationDate: consumable.installationDate
					? consumable.installationDate instanceof Date
						? consumable.installationDate
						: new Date(consumable.installationDate)
					: undefined,
				optimalSpeedRange: consumable.optimalSpeedRange || "",
				shotsPerM2: consumable.shotsPerM2 || undefined,
				// Campos de estoque
				minStock: consumable.minStock,
				maxStock: consumable.maxStock,
				currentStock: consumable.currentStock,
				alertThreshold: consumable.alertThreshold,
				autoReorder: consumable.autoReorder,
				active: consumable.active,
				tags: consumable.tags || [],
				notes: consumable.notes || "",
			};
		}, [consumable]),
	});

	// Log de debug para verificar se defaultValues funcionam
	React.useEffect(() => {
		if (consumable) {
			console.log("✅ Valores atuais no form:", {
				type: form.getValues("type"),
				unit: form.getValues("unit"),
			});
		}
	}, [consumable, form]);

	const watchedType = form.watch("type");
	const watchedUnit = form.watch("unit");

	// Automaticamente definir unidade como "L" para tintas
	React.useEffect(() => {
		if (watchedType === "ink") {
			form.setValue("unit", "L");
		}
	}, [watchedType, form]);

	// DEBUG: Log sempre que os valores mudarem
	React.useEffect(() => {
		console.log("👀 watchedType mudou:", watchedType);
	}, [watchedType]);

	React.useEffect(() => {
		console.log("👀 watchedUnit mudou:", watchedUnit);
	}, [watchedUnit]);

	const onSubmit = async (data: ConsumableFormData) => {
		updateConsumableMutation.mutate({
			id: consumableId,
			data,
		});
	};

	const handleDelete = async () => {
		if (confirm("Tem certeza que deseja excluir este insumo?")) {
			deleteConsumableMutation.mutate({ id: consumableId });
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
		lifespan: number;
		shotsPerM2?: number;
		optimalSpeedRange: string;
		unit?: string;
		durationMonths?: number;
	}) => {
		// Preencher os campos do formulário com as especificações selecionadas
		form.setValue("model", spec.model);

		if (spec.shotsPerM2) {
			form.setValue("shotsPerM2", spec.shotsPerM2);
			form.setValue("unit", "SHOTS_M2"); // Definir unidade como DISPAROS/M²
			form.setValue("lifespan", spec.lifespan);
		} else if (spec.unit === "PCS") {
			form.setValue("unit", "PCS"); // Usar unidade PCS
			// Para PCS, usar duração em meses ao invés de disparos
			if (spec.durationMonths) {
				form.setValue("durationMonths", spec.durationMonths);
			}
		} else {
			// Para DISPAROS normais
			form.setValue("lifespan", spec.lifespan);
			form.setValue("unit", "SHOTS");
		}

		form.setValue("optimalSpeedRange", spec.optimalSpeedRange);

		const unitText = spec.shotsPerM2
			? "DISPAROS/M²"
			: spec.unit === "PCS"
				? "PCS"
				: "DISPAROS";
		toast.success(
			`Especificações do ${spec.model} aplicadas como ${unitText}!`,
		);
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex min-h-[400px] items-center justify-center">
					<div className="text-center">
						<Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground">Carregando insumo...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div className="flex min-h-[400px] items-center justify-center">
					<div className="text-center">
						<div className="mb-4 text-destructive">Erro ao carregar insumo</div>
						<p className="mb-4 text-muted-foreground">{error.message}</p>
						<Button
							onClick={() => router.push("/cadastros/insumos")}
							variant="outline"
						>
							Voltar para lista
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!consumable) {
		return (
			<div className="space-y-6">
				<div className="flex min-h-[400px] items-center justify-center">
					<div className="text-center">
						<div className="mb-4 text-muted-foreground">
							Insumo não encontrado
						</div>
						<Button
							onClick={() => router.push("/cadastros/insumos")}
							variant="outline"
						>
							Voltar para lista
						</Button>
					</div>
				</div>
			</div>
		);
	}

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
					<div className="flex-1">
						<h1 className="font-bold text-3xl">Editar Insumo</h1>
						<p className="text-muted-foreground">
							Modifique as informações do insumo
						</p>
					</div>
					<Button
						variant="destructive"
						onClick={handleDelete}
						className="ml-auto"
						disabled={
							updateConsumableMutation.isPending ||
							deleteConsumableMutation.isPending
						}
					>
						{deleteConsumableMutation.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Excluindo...
							</>
						) : (
							<>
								<Trash2 className="mr-2 h-4 w-4" />
								Excluir
							</>
						)}
					</Button>
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
												<FormLabel>
													{watchedType === "ink"
														? "Custo por Litro *"
														: "Custo *"}
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
									{watchedType !== "ink" && (
										<FormField
											control={form.control}
											name="unit"
											render={({ field }) => {
												// Usar tipo mais recente (do form ou do consumable como fallback)
												const currentType =
													watchedType || consumable?.type || "other";

												let recommendedUnits =
													currentType && currentType !== "other"
														? getRecommendedUnitsForType(currentType)
														: Object.values(ConsumableUnit);

												// SEMPRE incluir a unidade atual nas opções para evitar que o Select a remova
												if (
													field.value &&
													!recommendedUnits.includes(
														field.value as ConsumableUnit,
													)
												) {
													recommendedUnits = [
														...recommendedUnits,
														field.value as ConsumableUnit,
													];
													console.log(
														"🔧 Adicionando unidade atual às opções:",
														field.value,
													);
												}

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
														<FormDescription className="text-xs">
															Insumo disponível para uso
														</FormDescription>
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
														<FormDescription>
															Código hexadecimal ou nome da cor
														</FormDescription>
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
																onChange={(e) =>
																	field.onChange(
																		Number.parseInt(e.target.value) ||
																			undefined,
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
											{/* Botão Consultar Especificações */}
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
														25+ modelos
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

												{watchedUnit === "PCS" && (
													<FormField
														control={form.control}
														name="durationMonths"
														render={({ field }) => (
															<FormItem>
																<FormLabel className="flex items-center gap-2">
																	Duração (meses)
																	<Tooltip>
																		<TooltipTrigger asChild>
																			<HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
																		</TooltipTrigger>
																		<TooltipContent className="max-w-xs">
																			<div className="space-y-2 text-xs">
																				<p>
																					<strong>
																						Para cálculo de custo fixo mensal:
																					</strong>
																				</p>
																				<p>
																					Tempo estimado de vida útil da cabeça
																					baseado na experiência operacional
																				</p>
																			</div>
																		</TooltipContent>
																	</Tooltip>
																</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		placeholder="12"
																		value={field.value || ""}
																		onChange={(e) =>
																			field.onChange(
																				e.target.value
																					? Number.parseInt(e.target.value)
																					: undefined,
																			)
																		}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}

												{watchedUnit !== "PCS" && (
													<FormField
														control={form.control}
														name="lifespan"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Vida Útil (disparos)</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		placeholder="5000000"
																		{...field}
																		value={field.value || ""}
																		onChange={(e) =>
																			field.onChange(
																				e.target.value
																					? Number.parseInt(e.target.value)
																					: undefined,
																			)
																		}
																	/>
																</FormControl>
																<FormDescription>
																	Número total de disparos estimados
																</FormDescription>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}
											</div>

											<div className="space-y-4">
												{watchedUnit !== "PCS" && (
													<FormField
														control={form.control}
														name="currentUse"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Uso Atual (disparos)</FormLabel>
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
												)}

												{watchedUnit === "SHOTS_M2" && (
													<FormField
														control={form.control}
														name="shotsPerM2"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Disparos por m²</FormLabel>
																<FormControl>
																	<Input
																		type="number"
																		placeholder="50000"
																		{...field}
																		value={field.value || ""}
																		onChange={(e) =>
																			field.onChange(
																				e.target.value
																					? Number.parseInt(e.target.value)
																					: undefined,
																			)
																		}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}
											</div>

											<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
												<FormField
													control={form.control}
													name="optimalSpeedRange"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Faixa de Velocidade Ideal</FormLabel>
															<FormControl>
																<Input
																	placeholder="Ex: 30-60 m²/h"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="installationDate"
													render={({ field }) => {
														// Converter Date para string no formato correto
														const dateValue =
															field.value instanceof Date
																? field.value.toISOString().split("T")[0]
																: field.value || "";

														return (
															<FormItem>
																<FormLabel>Data de Instalação</FormLabel>
																<FormControl>
																	<Input
																		type="date"
																		value={dateValue}
																		onChange={(e) => {
																			const dateStr = e.target.value;
																			field.onChange(
																				dateStr ? new Date(dateStr) : undefined,
																			);
																		}}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														);
													}}
												/>
											</div>
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
																onChange={(e) =>
																	field.onChange(
																		Number.parseFloat(e.target.value) ||
																			undefined,
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
						<div className="flex gap-4">
							<Button
								type="submit"
								className="flex-1"
								disabled={updateConsumableMutation.isPending}
							>
								{updateConsumableMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Salvando...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Salvar Alterações
									</>
								)}
							</Button>
							<Button
								type="button"
								variant="outline"
								asChild
								disabled={
									updateConsumableMutation.isPending ||
									deleteConsumableMutation.isPending
								}
							>
								<Link href="/cadastros/insumos">Cancelar</Link>
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
