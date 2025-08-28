"use client";

import { Package, Edit, AlertTriangle, Droplet, Settings, Wrench } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";

interface ConsumableCardProps {
	consumable: any;
}

export const ConsumableCard = React.memo<ConsumableCardProps>(
	function ConsumableCard({ consumable }) {
		
		const getStockStatus = (consumable: any) => {
			if (consumable.currentStock <= consumable.alertThreshold) {
				return { label: "Estoque Baixo", variant: "destructive" as const, color: "text-red-600" };
			} else if (consumable.currentStock <= consumable.minStock) {
				return { label: "Estoque Mínimo", variant: "secondary" as const, color: "text-yellow-600" };
			}
			return { label: "Estoque OK", variant: "default" as const, color: "text-green-600" };
		};

		const getTypeInfo = (type: string) => {
			const types = {
				ink: {
					label: "Tinta",
					color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
					icon: Droplet,
				},
				printHead: {
					label: "Cabeça",
					color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
					icon: Settings,
				},
				tool: {
					label: "Ferramenta",
					color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
					icon: Wrench,
				},
				material: {
					label: "Material",
					color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
					icon: Package,
				},
				other: {
					label: "Outro",
					color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
					icon: Package,
				},
			};
			return types[type as keyof typeof types] || types.other;
		};

		const stockStatus = getStockStatus(consumable);
		const typeInfo = getTypeInfo(consumable.type);
		const TypeIcon = typeInfo.icon;

		const calculateStockPercentage = () => {
			if (consumable.maxStock <= 0) return 0;
			return Math.min((consumable.currentStock / consumable.maxStock) * 100, 100);
		};

		const getUsagePercentage = () => {
			if (consumable.type === "printHead" && consumable.lifespan && consumable.currentUse) {
				return Math.min((consumable.currentUse / consumable.lifespan) * 100, 100);
			}
			return null;
		};

		const stockPercentage = calculateStockPercentage();
		const usagePercentage = getUsagePercentage();

		return (
			<Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0 flex-1">
							<CardTitle className="line-clamp-2 text-lg leading-tight">
								{consumable.name}
							</CardTitle>
							<CardDescription className="mt-1 flex items-center gap-2">
								<span>{consumable.code || "Sem código"}</span>
								<Badge className={typeInfo.color}>
									<TypeIcon className="h-3 w-3 mr-1" />
									{typeInfo.label}
								</Badge>
							</CardDescription>
						</div>
						<Badge variant={stockStatus.variant} className="shrink-0">
							{stockStatus.label}
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="flex-1 space-y-3">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Custo:</span>
							<span className="font-semibold text-green-600">
								{formatCurrency(Number(consumable.cost))}/{consumable.unit}
							</span>
						</div>

						{/* Custo por m² para cabeças de impressão */}
						{consumable.type === 'printHead' && consumable.costPerM2 && (
							<div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 -mx-3 -my-1 px-3 py-2 rounded">
								<span className="text-blue-700 dark:text-blue-300 text-sm font-medium">Desgaste/m²:</span>
								<span className="font-bold text-blue-600">
									{formatCurrency(Number(consumable.costPerM2))}
								</span>
							</div>
						)}

						{consumable.supplier && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">
									Fornecedor:
								</span>
								<span className="font-medium text-sm">
									{consumable.supplier}
								</span>
							</div>
						)}
					</div>

					{/* Especificações por Tipo */}
					{(consumable.color || consumable.volumeMl || consumable.material || consumable.diameter) && (
						<div className="space-y-1 rounded bg-muted/50 p-3 text-sm">
							<div className="mb-2 font-medium text-muted-foreground">
								Especificações
							</div>
							
							{consumable.color && (
								<div className="flex items-center justify-between">
									<span>Cor:</span>
									<div className="flex items-center gap-2">
										<div 
											className="w-4 h-4 rounded border border-gray-300"
											style={{ backgroundColor: consumable.color }}
										/>
										<span>{consumable.color}</span>
									</div>
								</div>
							)}
							
							{consumable.volumeMl && (
								<div className="flex justify-between">
									<span>Volume:</span>
									<span>{consumable.volumeMl} ml</span>
								</div>
							)}
							
							{consumable.material && (
								<div className="flex justify-between">
									<span>Material:</span>
									<span>{consumable.material}</span>
								</div>
							)}
							
							{consumable.diameter && (
								<div className="flex justify-between">
									<span>Diâmetro:</span>
									<span>{consumable.diameter} mm</span>
								</div>
							)}
						</div>
					)}

					{/* Vida Útil para Cabeças de Impressão */}
					{consumable.type === "printHead" && consumable.lifespan && (
						<div className="space-y-2 rounded bg-muted/50 p-3 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Vida útil:</span>
								<span>{(consumable.lifespan / 1000000).toFixed(1)}M disparos</span>
							</div>
							{consumable.currentUse && (
								<>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Uso atual:</span>
										<span>{(consumable.currentUse / 1000000).toFixed(1)}M disparos</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div 
											className={`h-2 rounded-full ${
												usagePercentage && usagePercentage > 80 ? "bg-red-600" :
												usagePercentage && usagePercentage > 60 ? "bg-yellow-600" : "bg-blue-600"
											}`}
											style={{ width: `${usagePercentage}%` }}
										/>
									</div>
									<div className="text-xs text-muted-foreground text-center">
										{usagePercentage?.toFixed(1)}% utilizado
									</div>
								</>
							)}
						</div>
					)}

					{/* Controle de Estoque */}
					<div className="space-y-2 rounded bg-muted/50 p-3 text-sm">
						<div className="flex items-center gap-2 mb-2">
							<Package className="h-4 w-4" />
							<span className="font-medium text-muted-foreground">Estoque</span>
						</div>
						
						<div className="flex justify-between">
							<span className="text-muted-foreground">Atual:</span>
							<span className={`font-medium ${stockStatus.color}`}>
								{consumable.currentStock} {consumable.unit}
							</span>
						</div>
						
						<div className="flex justify-between">
							<span className="text-muted-foreground">Mínimo:</span>
							<span>{consumable.minStock} {consumable.unit}</span>
						</div>
						
						{consumable.maxStock > 0 && (
							<>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Máximo:</span>
									<span>{consumable.maxStock} {consumable.unit}</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div 
										className={`h-2 rounded-full ${
											stockPercentage <= 25 ? "bg-red-600" :
											stockPercentage <= 50 ? "bg-yellow-600" : "bg-green-600"
										}`}
										style={{ width: `${stockPercentage}%` }}
									/>
								</div>
								<div className="text-xs text-muted-foreground text-center">
									{stockPercentage.toFixed(1)}% do máximo
								</div>
							</>
						)}
						
						{consumable.currentStock <= consumable.alertThreshold && (
							<div className="flex items-center gap-2 text-red-600 text-xs">
								<AlertTriangle className="h-3 w-3" />
								<span>Estoque abaixo do limite de alerta!</span>
							</div>
						)}
					</div>

					{/* Tags */}
					{consumable.tags && consumable.tags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{consumable.tags.slice(0, 3).map((tag: string) => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
							{consumable.tags.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{consumable.tags.length - 3}
								</Badge>
							)}
						</div>
					)}

					{/* Status Ativo/Inativo */}
					{!consumable.active && (
						<div className="rounded bg-red-50 p-2 text-red-600 text-sm dark:bg-red-950/20">
							Insumo inativo
						</div>
					)}
				</CardContent>

				<CardFooter className="pt-3">
					<div className="flex w-full gap-2">
						<Button variant="outline" size="sm" asChild className="flex-1">
							<Link href={`/cadastros/insumos/${consumable.id}`}>
								<Settings className="mr-1 h-4 w-4" />
								Detalhes
							</Link>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link href={`/cadastros/insumos/${consumable.id}`}>
								<Edit className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</CardFooter>
			</Card>
		);
	},
);