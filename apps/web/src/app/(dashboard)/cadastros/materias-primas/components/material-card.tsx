"use client";

import { Edit, MapPin, Package } from "lucide-react";
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
import type { Material } from "@/lib/mock-data/materials";
import {
	getStockStatus,
	stockStatusColors,
	stockStatusLabels,
} from "@/lib/mock-data/materials";
import { formatCurrency } from "@/lib/utils/currency";

interface MaterialCardProps {
	material: Material;
}

export const MaterialCard = React.memo<MaterialCardProps>(
	function MaterialCard({ material }) {
		const stockStatus = getStockStatus(material);
		const stockBadgeVariant = stockStatusColors[stockStatus];
		const stockLabel = stockStatusLabels[stockStatus];

		return (
			<Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0 flex-1">
							<CardTitle className="line-clamp-2 text-lg leading-tight">
								{material.name}
							</CardTitle>
							<CardDescription className="mt-1 flex items-center gap-2">
								<span>{material.code}</span>
								{material.category && (
									<Badge variant="outline" className="text-xs">
										{material.category}
									</Badge>
								)}
							</CardDescription>
						</div>
						<Badge
							variant={material.active ? "default" : "secondary"}
							className="shrink-0"
						>
							{material.active ? "Ativo" : "Inativo"}
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="flex-1 space-y-3">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Custo:</span>
							<span className="font-semibold text-green-600">
								{formatCurrency(material.cost)} / {material.unit}
							</span>
						</div>

						{material.currentStock !== undefined && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Estoque:</span>
								<div className="flex items-center gap-2">
									<span className="font-medium">
										{material.currentStock} {material.unit}
									</span>
									<Badge variant={stockBadgeVariant} className="text-xs">
										{stockLabel}
									</Badge>
								</div>
							</div>
						)}

						{material.brand && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Marca:</span>
								<span className="font-medium text-sm">{material.brand}</span>
							</div>
						)}

						{material.supplier && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">
									Fornecedor:
								</span>
								<span
									className="ml-2 truncate font-medium text-sm"
									title={material.supplier}
								>
									{material.supplier}
								</span>
							</div>
						)}
					</div>

					{material.location && (
						<div className="flex items-center gap-2 rounded bg-muted/50 p-2 text-muted-foreground text-sm">
							<MapPin className="h-3 w-3 shrink-0" />
							<span className="truncate">{material.location}</span>
						</div>
					)}

					{material.tags && material.tags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{material.tags.slice(0, 3).map((tag) => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
							{material.tags.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{material.tags.length - 3}
								</Badge>
							)}
						</div>
					)}
				</CardContent>

				<CardFooter className="pt-3">
					<div className="flex w-full gap-2">
						<Button variant="outline" size="sm" asChild className="flex-1">
							<Link href={`/cadastros/materias-primas/${material.id}`}>
								<Package className="mr-1 h-4 w-4" />
								Detalhes
							</Link>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link href={`/cadastros/materias-primas/${material.id}/editar`}>
								<Edit className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</CardFooter>
			</Card>
		);
	},
);
