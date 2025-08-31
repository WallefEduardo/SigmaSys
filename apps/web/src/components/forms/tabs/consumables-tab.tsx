"use client";

import {
	AlertTriangle,
	Droplet,
	Info,
	Package,
	Palette,
	Plus,
	ShoppingCart,
	Trash2,
	TrendingUp,
	Wrench,
} from "lucide-react";
import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { Consumable, EquipmentFormData } from "../equipment-form-types";

interface ConsumablesTabProps {
	form: UseFormReturn<EquipmentFormData>;
	equipmentType?: string;
}

export function ConsumablesTab({ form, equipmentType }: ConsumablesTabProps) {
	const {
		setValue,
		watch,
		formState: { errors },
	} = form;

	const watchedConsumables = watch("consumables") || {};

	// Não adicionar consumíveis padrão - usuário adiciona manualmente conforme necessário

	const addNewConsumable = (type: Consumable["type"]) => {
		const newConsumableId = `${type}_${Date.now()}`;
		const newConsumable: Consumable = {
			id: newConsumableId,
			name: `Novo ${getConsumableTypeLabel(type)}`,
			type,
			cost: 0,
			unit: getDefaultUnitForType(type),
			minStock: 1,
			maxStock: 100,
			currentStock: 0,
			alertThreshold: 10,
			autoReorder: false,
		};

		setValue("consumables", {
			...watchedConsumables,
			[newConsumableId]: newConsumable,
		});
	};

	const removeConsumable = (consumableId: string) => {
		const updatedConsumables = { ...watchedConsumables };
		delete updatedConsumables[consumableId];
		setValue("consumables", updatedConsumables);
	};

	const updateConsumable = (
		consumableId: string,
		field: keyof Consumable,
		value: any,
	) => {
		setValue("consumables", {
			...watchedConsumables,
			[consumableId]: {
				...watchedConsumables[consumableId],
				[field]: value,
			},
		});
	};

	const getConsumableTypeLabel = (type: Consumable["type"]) => {
		switch (type) {
			case "ink":
				return "Tinta";
			case "printHead":
				return "Cabeça de Impressão";
			case "tool":
				return "Ferramenta";
			case "material":
				return "Material";
			case "other":
				return "Outro";
			default:
				return "Consumível";
		}
	};

	const getConsumableTypeIcon = (type: Consumable["type"]) => {
		switch (type) {
			case "ink":
				return Droplet;
			case "printHead":
				return Package;
			case "tool":
				return Wrench;
			case "material":
				return Package;
			case "other":
				return Package;
			default:
				return Package;
		}
	};

	const getDefaultUnitForType = (type: Consumable["type"]) => {
		switch (type) {
			case "ink":
				return "ml";
			case "printHead":
				return "pcs";
			case "tool":
				return "pcs";
			case "material":
				return "kg";
			case "other":
				return "pcs";
			default:
				return "pcs";
		}
	};

	const getConsumableTypeColor = (type: Consumable["type"]) => {
		switch (type) {
			case "ink":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
			case "printHead":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
			case "tool":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
			case "material":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			case "other":
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
		}
	};

	const getStockStatus = (consumable: Consumable) => {
		if (consumable.currentStock <= consumable.alertThreshold) {
			return {
				status: "critical",
				label: "Crítico",
				color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
			};
		}
		if (consumable.currentStock <= consumable.minStock) {
			return {
				status: "low",
				label: "Baixo",
				color:
					"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
			};
		}
		if (consumable.currentStock >= consumable.maxStock) {
			return {
				status: "high",
				label: "Alto",
				color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
			};
		}
		return {
			status: "normal",
			label: "Normal",
			color:
				"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
		};
	};

	const consumablesByType = React.useMemo(() => {
		const grouped = Object.entries(watchedConsumables).reduce(
			(acc, [id, consumable]) => {
				if (!acc[consumable.type]) acc[consumable.type] = [];
				acc[consumable.type].push([id, consumable] as [string, Consumable]);
				return acc;
			},
			{} as Record<string, [string, Consumable][]>,
		);
		return grouped;
	}, [watchedConsumables]);

	const consumableTypes: Consumable["type"][] =
		equipmentType === "printing"
			? ["ink", "printHead", "material", "other"]
			: ["tool", "material", "other"];

	return (
		<div className="space-y-6">
			{/* Header com ações */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg">Gestão de Consumíveis</h3>
					<p className="text-muted-foreground text-sm">
						Configure insumos, estoque e alertas de reposição
					</p>
				</div>
			</div>

			{/* Resumo do estoque */}
			{Object.keys(watchedConsumables).length > 0 && (
				<Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-300">
							<TrendingUp className="h-4 w-4" />
							Resumo do Estoque
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-4">
							<div className="text-center">
								<div className="font-bold text-2xl text-blue-800 dark:text-blue-300">
									{Object.keys(watchedConsumables).length}
								</div>
								<div className="text-muted-foreground text-sm">
									Total de Itens
								</div>
							</div>
							<div className="text-center">
								<div className="font-bold text-2xl text-red-600">
									{
										Object.values(watchedConsumables).filter(
											(c) => c.currentStock <= c.alertThreshold,
										).length
									}
								</div>
								<div className="text-muted-foreground text-sm">
									Alertas Críticos
								</div>
							</div>
							<div className="text-center">
								<div className="font-bold text-2xl text-yellow-600">
									{
										Object.values(watchedConsumables).filter(
											(c) =>
												c.currentStock <= c.minStock &&
												c.currentStock > c.alertThreshold,
										).length
									}
								</div>
								<div className="text-muted-foreground text-sm">
									Estoque Baixo
								</div>
							</div>
							<div className="text-center">
								<div className="font-bold text-2xl text-green-600">
									{
										Object.values(watchedConsumables).filter(
											(c) => c.autoReorder,
										).length
									}
								</div>
								<div className="text-muted-foreground text-sm">
									Auto-Reposição
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Adicionar novos consumíveis por tipo */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Plus className="h-4 w-4" />
						Adicionar Consumível
					</CardTitle>
					<CardDescription>
						Adicione novos consumíveis por categoria
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{consumableTypes.map((type) => (
							<Button
								key={type}
								variant="outline"
								size="sm"
								onClick={() => addNewConsumable(type)}
								className="flex items-center gap-2"
							>
								{React.createElement(getConsumableTypeIcon(type), {
									className: "h-4 w-4",
								})}
								{getConsumableTypeLabel(type)}
							</Button>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Lista de consumíveis por tipo */}
			{consumableTypes.map((type) => {
				const consumablesOfType = consumablesByType[type] || [];
				if (consumablesOfType.length === 0) return null;

				return (
					<Card key={type}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								{React.createElement(getConsumableTypeIcon(type), {
									className: "h-4 w-4",
								})}
								{getConsumableTypeLabel(type)}s
								<Badge className={getConsumableTypeColor(type)}>
									{consumablesOfType.length}
								</Badge>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{consumablesOfType.map(([consumableId, consumable]) => {
								const stockStatus = getStockStatus(consumable);
								const Icon = getConsumableTypeIcon(consumable.type);

								return (
									<Card key={consumableId} className="relative">
										<CardHeader className="pb-3">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<Icon className="h-4 w-4 text-muted-foreground" />
													<div>
														<CardTitle className="text-sm">
															{consumable.name}
														</CardTitle>
														<CardDescription className="flex items-center gap-2">
															Estoque: {consumable.currentStock}{" "}
															{consumable.unit}
															<Badge className={stockStatus.color}>
																{stockStatus.label}
															</Badge>
														</CardDescription>
													</div>
												</div>

												<Button
													variant="ghost"
													size="sm"
													onClick={() => removeConsumable(consumableId)}
													className="text-destructive hover:text-destructive"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</CardHeader>

										<CardContent className="space-y-4">
											<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
												<div className="space-y-2">
													<Label>Nome</Label>
													<Input
														value={consumable.name}
														onChange={(e) =>
															updateConsumable(
																consumableId,
																"name",
																e.target.value,
															)
														}
													/>
												</div>

												<div className="space-y-2">
													<Label>Custo por unidade</Label>
													<Input
														type="number"
														min="0"
														step="0.01"
														value={consumable.cost}
														onChange={(e) =>
															updateConsumable(
																consumableId,
																"cost",
																Number.parseFloat(e.target.value) || 0,
															)
														}
													/>
												</div>

												<div className="space-y-2">
													<Label>Unidade</Label>
													<Select
														value={consumable.unit}
														onValueChange={(value) =>
															updateConsumable(consumableId, "unit", value)
														}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="ml">
																ml (mililitros)
															</SelectItem>
															<SelectItem value="pcs">pcs (peças)</SelectItem>
															<SelectItem value="kg">
																kg (quilogramas)
															</SelectItem>
															<SelectItem value="m">m (metros)</SelectItem>
															<SelectItem value="m²">
																m² (metros quadrados)
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>

											{/* Campos específicos por tipo */}
											{consumable.type === "ink" && (
												<div className="grid gap-4 md:grid-cols-2">
													<div className="space-y-2">
														<Label>Cor</Label>
														<Input
															value={consumable.color || ""}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"color",
																	e.target.value,
																)
															}
															placeholder="Ex: Ciano, Magenta..."
														/>
													</div>
													<div className="space-y-2">
														<Label>Volume (ml)</Label>
														<Input
															type="number"
															min="0"
															value={consumable.volumeMl || 0}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"volumeMl",
																	Number.parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>
												</div>
											)}

											{(consumable.type === "printHead" ||
												consumable.type === "tool") && (
												<div className="grid gap-4 md:grid-cols-2">
													<div className="space-y-2">
														<Label>Vida Útil (horas ou m²)</Label>
														<Input
															type="number"
															min="0"
															value={consumable.lifespan || 0}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"lifespan",
																	Number.parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>
													<div className="space-y-2">
														<Label>Uso Atual</Label>
														<Input
															type="number"
															min="0"
															value={consumable.currentUse || 0}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"currentUse",
																	Number.parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>
												</div>
											)}

											{consumable.type === "tool" && (
												<div className="grid gap-4 md:grid-cols-2">
													<div className="space-y-2">
														<Label>Material</Label>
														<Input
															value={consumable.material || ""}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"material",
																	e.target.value,
																)
															}
															placeholder="Ex: Alumínio, Aço..."
														/>
													</div>
													<div className="space-y-2">
														<Label>Diâmetro (mm)</Label>
														<Input
															type="number"
															min="0"
															step="0.1"
															value={consumable.diameter || 0}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"diameter",
																	Number.parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>
												</div>
											)}

											<Separator />

											{/* Controle de estoque */}
											<div>
												<h5 className="mb-3 font-medium text-sm">
													Controle de Estoque
												</h5>
												<div className="grid gap-4 md:grid-cols-4">
													<div className="space-y-2">
														<Label>Estoque Atual</Label>
														<Input
															type="number"
															min="0"
															value={consumable.currentStock}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"currentStock",
																	Number.parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>

													<div className="space-y-2">
														<Label>Estoque Mínimo</Label>
														<Input
															type="number"
															min="0"
															value={consumable.minStock}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"minStock",
																	Number.parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>

													<div className="space-y-2">
														<Label>Estoque Máximo</Label>
														<Input
															type="number"
															min="0"
															value={consumable.maxStock}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"maxStock",
																	Number.parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>

													<div className="space-y-2">
														<Label>Alerta em</Label>
														<Input
															type="number"
															min="0"
															value={consumable.alertThreshold}
															onChange={(e) =>
																updateConsumable(
																	consumableId,
																	"alertThreshold",
																	Number.parseFloat(e.target.value) || 0,
																)
															}
														/>
													</div>
												</div>

												<div className="mt-4 flex items-center space-x-2">
													<Switch
														checked={consumable.autoReorder}
														onCheckedChange={(checked) =>
															updateConsumable(
																consumableId,
																"autoReorder",
																checked,
															)
														}
													/>
													<Label className="text-sm">
														Reposição automática quando atingir o estoque mínimo
													</Label>
												</div>
											</div>

											{/* Alertas de estoque */}
											{stockStatus.status !== "normal" && (
												<div
													className={`rounded-lg border p-3 ${
														stockStatus.status === "critical"
															? "border-red-200 bg-red-50 dark:bg-red-950/20"
															: "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
													}`}
												>
													<div className="flex items-center gap-2 text-sm">
														<AlertTriangle
															className={`h-4 w-4 ${
																stockStatus.status === "critical"
																	? "text-red-600"
																	: "text-yellow-600"
															}`}
														/>
														<span className="font-medium">
															{stockStatus.status === "critical"
																? "Estoque Crítico!"
																: "Estoque Baixo"}
														</span>
													</div>
													<p className="mt-1 text-muted-foreground text-sm">
														{stockStatus.status === "critical"
															? "Repor imediatamente para não interromper a produção"
															: "Considere repor o estoque em breve"}
													</p>
												</div>
											)}
										</CardContent>
									</Card>
								);
							})}
						</CardContent>
					</Card>
				);
			})}

			{Object.keys(watchedConsumables).length === 0 && (
				<Card className="border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-8">
						<Package className="mb-4 h-12 w-12 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg">
							Nenhum Consumível Configurado
						</h3>
						<p className="mb-4 text-center text-muted-foreground text-sm">
							Configure consumíveis específicos para este equipamento conforme
							necessário
						</p>
						<div className="flex flex-wrap justify-center gap-2">
							{consumableTypes.map((type) => (
								<Button
									key={type}
									variant="outline"
									size="sm"
									onClick={() => addNewConsumable(type)}
								>
									<Plus className="mr-2 h-4 w-4" />
									{getConsumableTypeLabel(type)}
								</Button>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Informações sobre gestão de consumíveis */}
			<Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-300">
						<Info className="h-4 w-4" />
						Dicas de Gestão de Consumíveis
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-blue-700 text-sm dark:text-blue-400">
					<p>
						<strong>Estoque Mínimo:</strong> Quantidade mínima para manter a
						produção sem interrupções.
					</p>
					<p>
						<strong>Alerta Crítico:</strong> Notificação urgente quando o
						estoque está muito baixo.
					</p>
					<p>
						<strong>Reposição Automática:</strong> Sistema pode gerar pedidos
						automaticamente.
					</p>
					<p>
						<strong>Vida Útil:</strong> Para cabeças e ferramentas, monitore o
						desgaste baseado no uso.
					</p>
				</CardContent>
			</Card>

			{errors.consumables && (
				<p className="text-destructive text-sm">{errors.consumables.message}</p>
			)}
		</div>
	);
}
