"use client";

import { Calendar, Edit, MapPin, Settings, Trash2, Zap } from "lucide-react";
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
import type { Equipment } from "@/lib/mock-data/equipments";
import { formatCurrency } from "@/lib/utils/currency";

interface EquipmentCardProps {
	equipment: Equipment;
	onDelete?: (equipment: Equipment) => void;
}

export const EquipmentCard = React.memo<EquipmentCardProps>(
	function EquipmentCard({ equipment, onDelete }) {
		// Usando utility function de formatação

		const getStatusInfo = (status: string) => {
			const variants = {
				available: {
					variant: "default" as const,
					label: "Disponível",
					color: "text-green-600",
				},
				maintenance: {
					variant: "secondary" as const,
					label: "Manutenção",
					color: "text-yellow-600",
				},
				in_use: {
					variant: "destructive" as const,
					label: "Em Uso",
					color: "text-blue-600",
				},
				broken: {
					variant: "destructive" as const,
					label: "Quebrado",
					color: "text-red-600",
				},
			};
			return variants[status as keyof typeof variants] || variants.available;
		};

		const getTypeInfo = (type: string) => {
			return type === "printing"
				? {
						label: "Impressão",
						color:
							"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
					}
				: {
						label: "Usinagem",
						color:
							"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
					};
		};

		const statusInfo = getStatusInfo(equipment.status);
		const typeInfo = getTypeInfo(equipment.type);

		const formatDate = (dateString: string) => {
			return new Date(dateString).toLocaleDateString("pt-BR");
		};

		const isMaintenanceDue = () => {
			if (!equipment.nextMaintenance) return false;
			return new Date(equipment.nextMaintenance) <= new Date();
		};

		return (
			<Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0 flex-1">
							<CardTitle className="line-clamp-2 text-lg leading-tight">
								{equipment.name}
							</CardTitle>
							<CardDescription className="mt-1 flex items-center gap-2">
								<span>{equipment.code}</span>
								<Badge className={typeInfo.color}>{typeInfo.label}</Badge>
							</CardDescription>
						</div>
						<Badge variant={statusInfo.variant} className="shrink-0">
							{statusInfo.label}
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="flex-1 space-y-3">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								{equipment.costUnit === "PER_HOUR" ? "Custo/hora:" : "Custo/m²:"}
							</span>
							<span className="font-semibold text-green-600">
								{equipment.calculatedCostPerM2 ? `${formatCurrency(equipment.calculatedCostPerM2)}/m²` :
								 equipment.calculatedCostPerHour ? `${formatCurrency(equipment.calculatedCostPerHour)}/h` :
								 "Não calculado"}
							</span>
						</div>

						{equipment.manufacturer && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">
									Fabricante:
								</span>
								<span className="font-medium text-sm">
									{equipment.manufacturer}
								</span>
							</div>
						)}

						{equipment.model && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Modelo:</span>
								<span className="font-medium text-sm">{equipment.model}</span>
							</div>
						)}

						{equipment.year && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Ano:</span>
								<span className="font-medium text-sm">{equipment.year}</span>
							</div>
						)}
					</div>

					{/* Especificações Técnicas */}
					<div className="space-y-1 rounded bg-muted/50 p-3 text-sm">
						<div className="mb-2 font-medium text-muted-foreground">
							Especificações
						</div>
						{equipment.maxWidth && equipment.maxHeight && (
							<div className="flex justify-between">
								<span>Área máx:</span>
								<span>
									{equipment.maxWidth} × {equipment.maxHeight} mm
								</span>
							</div>
						)}
						{equipment.maxThickness && (
							<div className="flex justify-between">
								<span>Espessura máx:</span>
								<span>{equipment.maxThickness} mm</span>
							</div>
						)}
						{equipment.energyCostPerHour && (
							<div className="flex justify-between">
								<span className="flex items-center gap-1">
									<Zap className="h-3 w-3" />
									Energia/h:
								</span>
								<span>{formatCurrency(equipment.energyCostPerHour)}</span>
							</div>
						)}
					</div>

					{equipment.location && (
						<div className="flex items-center gap-2 rounded bg-muted/50 p-2 text-muted-foreground text-sm">
							<MapPin className="h-3 w-3 shrink-0" />
							<span className="truncate">{equipment.location}</span>
						</div>
					)}

					{/* Manutenção */}
					{equipment.nextMaintenance && (
						<div className="flex items-center gap-2 rounded bg-muted/50 p-2 text-sm">
							<Calendar className="h-3 w-3 shrink-0" />
							<div className="flex-1">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Próxima manutenção:
									</span>
									<span
										className={
											isMaintenanceDue() ? "font-medium text-red-600" : ""
										}
									>
										{formatDate(equipment.nextMaintenance)}
									</span>
								</div>
								{isMaintenanceDue() && (
									<div className="font-medium text-red-600 text-xs">
										Manutenção em atraso!
									</div>
								)}
							</div>
						</div>
					)}

					{equipment.tags && equipment.tags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{equipment.tags.slice(0, 3).map((tag) => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
							{equipment.tags.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{equipment.tags.length - 3}
								</Badge>
							)}
						</div>
					)}
				</CardContent>

				<CardFooter className="pt-3">
					<div className="flex w-full gap-2">
						<Button variant="outline" size="sm" asChild className="flex-1">
							<Link href={`/cadastros/equipamentos/${equipment.id}`}>
								<Settings className="mr-1 h-4 w-4" />
								Detalhes
							</Link>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link href={`/cadastros/equipamentos/${equipment.id}/editar`}>
								<Edit className="h-4 w-4" />
							</Link>
						</Button>
						{onDelete && (
							<Button 
								variant="outline" 
								size="sm"
								onClick={() => onDelete(equipment)}
								className="text-destructive hover:text-destructive hover:bg-destructive/10"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						)}
					</div>
				</CardFooter>
			</Card>
		);
	},
);
