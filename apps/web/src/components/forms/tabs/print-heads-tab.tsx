"use client";

import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Cpu,
	Info,
	Plus,
	Settings,
	Trash2,
} from "lucide-react";
import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import type { EquipmentFormData } from "../equipment-form-types";

interface PrintHeadConfiguration {
	id: string;
	consumableId: string;
	position: string;
	installationDate: string;
	notes?: string;
}

interface PrintHeadsTabProps {
	form: UseFormReturn<EquipmentFormData>;
	equipmentId?: string; // ID do equipamento para buscar cabeças instaladas (no modo edição)
}

export function PrintHeadsTab({ form, equipmentId }: PrintHeadsTabProps) {
	const {
		setValue,
		watch,
		formState: { errors },
	} = form;

	// Buscar cabeças de impressão disponíveis na empresa (para o dropdown)
	const { data: availablePrintHeads = [], isLoading: loadingPrintHeads } =
		api.consumables.getPrintHeadsForEquipment.useQuery({});

	// Buscar cabeças já instaladas no equipamento (apenas no modo edição)
	const { data: installedConsumables = [], isLoading: loadingInstalled } =
		api.equipments.getInstalledConsumables.useQuery(
			{ equipmentId: equipmentId! },
			{ enabled: !!equipmentId }
		);

	// Usar estado local do formulário em vez de depender do backend
	const watchedPrintHeads = watch("printHeads") || {};

	// Controle para carregar apenas uma vez
	const [headsLoaded, setHeadsLoaded] = React.useState(false);

	// Carregar cabeças instaladas quando dados chegarem do backend
	React.useEffect(() => {
		if (equipmentId && installedConsumables.length > 0 && !headsLoaded) {
			console.log("🔄 Carregando cabeças instaladas do backend:", installedConsumables);
			
			const headsFromBackend = installedConsumables.reduce((acc: any, ec: any) => {
				const headId = `head_${ec.id}`;
				acc[headId] = {
					id: headId,
					consumableId: ec.consumableId,
					position: ec.position || "",
					installationDate: ec.installationDate ? 
						new Date(ec.installationDate).toISOString().split('T')[0] : 
						new Date().toISOString().split('T')[0],
					notes: ec.notes || ""
				};
				return acc;
			}, {});
			
			setValue("printHeads", headsFromBackend);
			setHeadsLoaded(true);
			console.log("✅ Cabeças carregadas:", headsFromBackend);
		}
	}, [equipmentId, installedConsumables, headsLoaded, setValue]);

	// Log para debug
	React.useEffect(() => {
		console.log("🔍 Estado das cabeças:");
		console.log("  📋 Cabeças disponíveis da API:", availablePrintHeads);
		console.log("  📦 Loading disponíveis:", loadingPrintHeads);
		console.log("  🔧 Cabeças instaladas do backend:", installedConsumables);
		console.log("  📦 Loading instaladas:", loadingInstalled);
		console.log("  🖨️ Cabeças no formulário (watchedPrintHeads):", watchedPrintHeads);
		console.log("  📊 Número de cabeças no formulário:", Object.keys(watchedPrintHeads).length);
	}, [availablePrintHeads, loadingPrintHeads, installedConsumables, loadingInstalled, watchedPrintHeads]);

	// Estado para formulário de nova cabeça
	const [showNewHeadForm, setShowNewHeadForm] = React.useState(false);
	const [newHeadData, setNewHeadData] = React.useState({
		consumableId: "",
		position: "",
		notes: "",
	});

	// Funções para gerenciar estado local
	const addNewPrintHead = () => {
		console.log("🔍 Tentando adicionar cabeça:");
		console.log("  📋 Dados do formulário:", newHeadData);
		console.log("  🔧 Cabeças disponíveis:", availablePrintHeads);
		console.log("  📦 Cabeças já instaladas:", watchedPrintHeads);

		if (!newHeadData.consumableId || !newHeadData.position) {
			console.log("❌ Campos obrigatórios faltando:");
			console.log("  - consumableId:", newHeadData.consumableId || "VAZIO");
			console.log("  - position:", newHeadData.position || "VAZIO");
			toast.error("Selecione o insumo e a posição");
			return;
		}

		const selectedConsumable = availablePrintHeads.find(
			(h) => h.id === newHeadData.consumableId,
		);
		console.log("  ✅ Consumível selecionado:", selectedConsumable);

		if (!selectedConsumable) {
			console.error("❌ Consumível não encontrado no array");
			toast.error("Cabeça selecionada não encontrada");
			return;
		}

		const newHeadId = `head_${Date.now()}`;
		const newHead: PrintHeadConfiguration = {
			id: newHeadId,
			consumableId: newHeadData.consumableId,
			position: newHeadData.position,
			installationDate: new Date().toISOString().split("T")[0],
			notes: newHeadData.notes || undefined,
		};

		console.log("  🆕 Nova cabeça criada:", newHead);

		const updatedHeads = {
			...watchedPrintHeads,
			[newHeadId]: newHead,
		};

		console.log("  📝 Atualizando cabeças para:", updatedHeads);
		setValue("printHeads", updatedHeads);

		// Reset form
		setNewHeadData({
			consumableId: "",
			position: "",
			notes: "",
		});
		setShowNewHeadForm(false);
		toast.success("Cabeça adicionada com sucesso!");
		console.log("✅ Cabeça adicionada com sucesso!");
	};

	const removePrintHead = (headId: string) => {
		const updatedHeads = { ...watchedPrintHeads };
		delete updatedHeads[headId];
		setValue("printHeads", updatedHeads);
		toast.success("Cabeça removida com sucesso!");
	};

	const updatePrintHead = (
		headId: string,
		field: keyof PrintHeadConfiguration,
		value: any,
	) => {
		setValue("printHeads", {
			...watchedPrintHeads,
			[headId]: {
				...watchedPrintHeads[headId],
				[field]: value,
			},
		});
	};

	const getLifePercentage = (
		currentUse: number,
		lifespanM2: number,
	): number => {
		return Math.min((currentUse / lifespanM2) * 100, 100);
	};

	const getStatusFromUsage = (
		currentUse: number,
		lifespanM2: number,
	): "active" | "warning" | "critical" => {
		const percentage = getLifePercentage(currentUse, lifespanM2);
		if (percentage >= 95) return "critical";
		if (percentage >= 80) return "warning";
		return "active";
	};

	const calculateCostPerM2 = (cost: number, lifespanM2: number): number => {
		return cost / lifespanM2;
	};

	const getStatusInfo = (status: "active" | "warning" | "critical") => {
		switch (status) {
			case "active":
				return { color: "bg-green-500", icon: CheckCircle, label: "Ativa" };
			case "warning":
				return { color: "bg-yellow-500", icon: Clock, label: "Atenção" };
			case "critical":
				return { color: "bg-red-500", icon: AlertTriangle, label: "Crítica" };
		}
	};

	// Criar lista de cabeças instaladas com dados dos consumíveis
	const installedHeads = Object.entries(watchedPrintHeads).map(
		([headId, headConfig]) => {
			const consumable = availablePrintHeads.find(
				(c) => c.id === headConfig.consumableId,
			);
			const lifespanM2 = consumable?.lifespanM2 || 300000; // 300k m² padrão
			const currentUse = 0; // Para simplificar, sempre começar em 0 - usuário atualiza depois
			const status = getStatusFromUsage(currentUse, lifespanM2);
			const costPerM2 = calculateCostPerM2(
				Number(consumable?.cost || 1000),
				lifespanM2,
			);

			return {
				...headConfig,
				name: consumable?.name || "Cabeça não encontrada",
				model: consumable?.model || "N/A",
				lifespanM2,
				currentUse,
				status,
				cost: Number(consumable?.cost || 1000),
				costPerM2,
			};
		},
	);

	return (
		<div className="space-y-6">
			{/* Header e informações */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg">Gerenciamento de Cabeças</h3>
					<p className="text-muted-foreground text-sm">
						Configure cabeças de impressão e monitore a vida útil
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						size="sm"
						onClick={() => setShowNewHeadForm(true)}
						disabled={showNewHeadForm}
					>
						<Plus className="mr-2 h-4 w-4" />
						Adicionar Cabeça
					</Button>
				</div>
			</div>

			{/* Informações sobre cabeças */}
			<Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-300">
						<Info className="h-4 w-4" />
						Sobre Cabeças de Impressão
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-blue-700 text-sm dark:text-blue-400">
					<p>
						<strong>Vida Útil:</strong> Total de metros quadrados que a cabeça
						imprime antes da troca
					</p>
					<p>
						<strong>Custo por m²:</strong> Custo da cabeça ÷ Vida útil em m² =
						Desgaste por metro quadrado
					</p>
					<p>
						<strong>Status:</strong> Verde (saudável), Amarelo (atenção),
						Vermelho (crítico)
					</p>
					<p>
						<strong>Posição:</strong> Localização da cabeça no equipamento (ex:
						A1, B2, etc.)
					</p>
				</CardContent>
			</Card>

			{/* Estatísticas rápidas */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-green-500" />
							<div>
								<p className="font-medium text-sm">Cabeças Ativas</p>
								<p className="font-bold text-2xl">
									{installedHeads.filter((h) => h.status === "active").length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-yellow-500" />
							<div>
								<p className="font-medium text-sm">Precisam Atenção</p>
								<p className="font-bold text-2xl">
									{
										installedHeads.filter(
											(h) => h.status === "warning" || h.status === "critical",
										).length
									}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Settings className="h-5 w-5 text-blue-500" />
							<div>
								<p className="font-medium text-sm">Total Configuradas</p>
								<p className="font-bold text-2xl">{installedHeads.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Formulário de Nova Cabeça */}
			{showNewHeadForm && (
				<Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base text-green-800 dark:text-green-300">
							<Plus className="h-4 w-4" />
							Adicionar Nova Cabeça de Impressão
						</CardTitle>
						<CardDescription className="text-green-600 dark:text-green-400">
							Selecione um consumível do tipo cabeça já cadastrado
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<Label>
									Consumível (Cabeça de Impressão){" "}
									<span className="text-red-500">*</span>
								</Label>
								<Select
									value={newHeadData.consumableId}
									onValueChange={(value) => {
										console.log("📋 Cabeça selecionada:", value);
										setNewHeadData((prev) => ({
											...prev,
											consumableId: value,
										}));
									}}
								>
									<SelectTrigger
										className={`mt-1 ${!newHeadData.consumableId ? "border-red-500" : ""}`}
									>
										<SelectValue placeholder="Selecione a cabeça" />
									</SelectTrigger>
									<SelectContent>
										{loadingPrintHeads ? (
											<SelectItem value="loading" disabled>
												Carregando...
											</SelectItem>
										) : availablePrintHeads.length === 0 ? (
											<SelectItem value="empty" disabled>
												Nenhuma cabeça cadastrada
											</SelectItem>
										) : (
											availablePrintHeads.map((head) => (
												<SelectItem key={head.id} value={head.id}>
													{head.name} - {head.model || "N/A"}
													{head.lifespanM2 &&
														` (${(head.lifespanM2 / 1000).toFixed(0)}K m² • R$ ${(Number(head.cost) / head.lifespanM2).toFixed(4)}/m²)`}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>

								{/* Informações da cabeça selecionada */}
								{newHeadData.consumableId && (
									<div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:bg-blue-950/20">
										{(() => {
											const selectedHead = availablePrintHeads.find(
												(h) => h.id === newHeadData.consumableId,
											);
											if (!selectedHead) return null;

											const lifespanM2 = selectedHead.lifespanM2 || 300000;
											const cost = Number(selectedHead.cost || 1000);
											const costPerM2 = calculateCostPerM2(cost, lifespanM2);

											return (
												<div className="space-y-2">
													<h5 className="font-medium text-blue-800 text-sm dark:text-blue-200">
														Informações da Cabeça Selecionada
													</h5>
													<div className="grid grid-cols-2 gap-3 text-xs">
														<div>
															<span className="font-medium">Modelo:</span>{" "}
															{selectedHead.model || "N/A"}
														</div>
														<div>
															<span className="font-medium">Custo:</span> R${" "}
															{cost.toLocaleString("pt-BR", {
																minimumFractionDigits: 2,
															})}
														</div>
														<div>
															<span className="font-medium">Vida útil:</span>{" "}
															{(lifespanM2 / 1000).toFixed(0)}K m²
														</div>
														<div>
															<span className="font-medium">Custo por m²:</span>{" "}
															R$ {costPerM2.toFixed(4)}
														</div>
													</div>
													<div className="mt-2 rounded border border-green-200 bg-green-100 p-2 dark:bg-green-900/20">
														<div className="flex items-center justify-between">
															<span className="font-medium text-green-800 text-xs dark:text-green-300">
																💡 Desgaste por m² impressos:
															</span>
															<span className="font-bold text-green-900 text-sm dark:text-green-200">
																R$ {costPerM2.toFixed(4)}
															</span>
														</div>
													</div>
												</div>
											);
										})()}
									</div>
								)}
							</div>

							<div>
								<Label>
									Posição no Equipamento <span className="text-red-500">*</span>
								</Label>
								<Input
									placeholder="Ex: A1, B2, Frontal, etc."
									value={newHeadData.position}
									onChange={(e) => {
										console.log("📍 Posição digitada:", e.target.value);
										setNewHeadData((prev) => ({
											...prev,
											position: e.target.value,
										}));
									}}
									className={`mt-1 ${!newHeadData.position ? "border-red-500" : ""}`}
								/>
							</div>
						</div>

						<div>
							<Label>Observações</Label>
							<Textarea
								placeholder="Observações sobre a cabeça..."
								value={newHeadData.notes}
								onChange={(e) =>
									setNewHeadData((prev) => ({ ...prev, notes: e.target.value }))
								}
								className="mt-1"
								rows={2}
							/>
						</div>

						<div className="flex gap-2">
							<Button
								onClick={addNewPrintHead}
								disabled={!newHeadData.consumableId || !newHeadData.position}
								title={
									!newHeadData.consumableId
										? "Selecione uma cabeça"
										: !newHeadData.position
											? "Informe a posição"
											: ""
								}
							>
								<Plus className="mr-2 h-4 w-4" />
								Adicionar
							</Button>
							<Button
								variant="outline"
								onClick={() => setShowNewHeadForm(false)}
							>
								Cancelar
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Lista de Cabeças Configuradas */}
			<Card>
				<CardHeader>
					<CardTitle>Cabeças Configuradas</CardTitle>
					<CardDescription>
						Gerencie as cabeças de impressão configuradas para este equipamento
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{installedHeads.length === 0 ? (
							<div className="py-8 text-center text-muted-foreground">
								<Cpu className="mx-auto mb-4 h-12 w-12 opacity-50" />
								<p className="font-medium">Nenhuma cabeça configurada</p>
								<p className="text-sm">
									Adicione cabeças para monitorar o desgaste
								</p>
							</div>
						) : (
							installedHeads.map((head) => {
								const statusInfo = getStatusInfo(head.status);
								const lifePercentage = getLifePercentage(
									head.currentUse,
									head.lifespan,
								);

								return (
									<Card key={head.id} className="p-4">
										<div className="flex items-start justify-between">
											<div className="flex-1 space-y-3">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<div
															className={`h-3 w-3 rounded-full ${statusInfo.color}`}
														/>
														<div>
															<h4 className="font-medium">{head.name}</h4>
															<p className="text-muted-foreground text-sm">
																{head.model} • Posição: {head.position}
															</p>
														</div>
														<Badge
															variant={
																head.status === "critical"
																	? "destructive"
																	: head.status === "warning"
																		? "secondary"
																		: "default"
															}
														>
															{statusInfo.label}
														</Badge>
													</div>
													<div className="text-right">
														<div className="font-bold text-green-600 text-lg">
															R$ {head.costPerM2.toFixed(4)}
														</div>
														<div className="text-muted-foreground text-xs">
															por m²
														</div>
													</div>
												</div>

												<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
													<div>
														<Label className="text-xs">Vida Útil Total</Label>
														<Input
															type="text"
															value={`${(head.lifespanM2 / 1000).toFixed(0)}K m²`}
															disabled
															className="mt-1 bg-muted"
														/>
														<p className="mt-1 text-muted-foreground text-xs">
															{head.lifespanM2.toLocaleString()} metros
															quadrados
														</p>
													</div>
													<div>
														<Label className="text-xs">
															Posição no Equipamento
														</Label>
														<Input
															value={head.position}
															onChange={(e) =>
																updatePrintHead(
																	head.id,
																	"position",
																	e.target.value,
																)
															}
															className="mt-1"
															placeholder="Ex: A1, B2, Central..."
														/>
													</div>
												</div>

												<div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
													<div className="flex items-center justify-between">
														<div>
															<div className="font-medium text-sm">
																Resumo da Cabeça
															</div>
															<div className="mt-1 text-muted-foreground text-xs">
																Custo: R$ {head.cost.toFixed(2)} • Vida útil:{" "}
																{(head.lifespanM2 / 1000).toFixed(0)}K m²
															</div>
														</div>
														<div className="text-right">
															<div className="font-bold text-blue-600 text-sm">
																R$ {head.costPerM2.toFixed(4)} /m²
															</div>
															<div className="text-muted-foreground text-xs">
																Desgaste
															</div>
														</div>
													</div>
												</div>

												{head.notes && (
													<div>
														<Label className="text-xs">Observações</Label>
														<Textarea
															value={head.notes}
															onChange={(e) =>
																updatePrintHead(
																	head.id,
																	"notes",
																	e.target.value,
																)
															}
															className="mt-1"
															rows={2}
														/>
													</div>
												)}
											</div>

											<Button
												variant="ghost"
												size="sm"
												onClick={() => removePrintHead(head.id)}
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</Card>
								);
							})
						)}
					</div>
				</CardContent>
			</Card>

			{/* Resumo de custos */}
			{installedHeads.length > 0 && (
				<Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
							<Info className="h-5 w-5" />
							Resumo de Custos das Cabeças
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div>
								<div className="font-medium text-sm">Total de Cabeças</div>
								<div className="font-bold text-2xl text-green-600">
									{installedHeads.length}
								</div>
							</div>
							<div>
								<div className="font-medium text-sm">Custo Médio por m²</div>
								<div className="font-bold text-2xl text-green-600">
									R${" "}
									{installedHeads.length > 0
										? (
												installedHeads.reduce(
													(sum, head) => sum + head.costPerM2,
													0,
												) / installedHeads.length
											).toFixed(4)
										: "0.0000"}
								</div>
							</div>
							<div>
								<div className="font-medium text-sm">Investimento Total</div>
								<div className="font-bold text-2xl text-green-600">
									R${" "}
									{installedHeads
										.reduce((sum, head) => sum + head.cost, 0)
										.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{loadingPrintHeads && (
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:bg-blue-950/20">
					<div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
						<Info className="h-4 w-4" />
						<span className="font-medium text-sm">
							Carregando cabeças disponíveis...
						</span>
					</div>
				</div>
			)}

			{!loadingPrintHeads && availablePrintHeads.length === 0 && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:bg-yellow-950/20">
					<div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
						<Info className="h-4 w-4" />
						<span className="font-medium text-sm">
							Nenhuma cabeça cadastrada
						</span>
					</div>
					<p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
						Cadastre cabeças de impressão na seção de insumos para poder
						configurá-las aqui
					</p>
				</div>
			)}
		</div>
	);
}
