"use client";

import {
	ArrowLeft,
	Calendar,
	Edit,
	MapPin,
	Package,
	Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	getStockStatus,
	mockMaterials,
	stockStatusColors,
	stockStatusLabels,
} from "@/lib/mock-data/materials";
import { getUnitById } from "@/lib/mock-data/units";
import { formatCurrency } from "@/lib/utils/currency";

export default function MaterialDetailsPage() {
	const params = useParams();
	const materialId = params.id as string;

	const material = mockMaterials.find((m) => m.id === materialId);

	if (!material) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" asChild>
						<Link href="/cadastros/materias-primas">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Voltar
						</Link>
					</Button>
				</div>
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						Material não encontrado
					</div>
					<Button asChild variant="outline">
						<Link href="/cadastros/materias-primas">
							Voltar para lista de materiais
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const stockStatus = getStockStatus(material);
	const stockBadgeVariant = stockStatusColors[stockStatus];
	const stockLabel = stockStatusLabels[stockStatus];
	const unit = getUnitById(material.unit);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" asChild>
						<Link href="/cadastros/materias-primas">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Voltar
						</Link>
					</Button>
				</div>
				<Button asChild>
					<Link href={`/cadastros/materias-primas/${material.id}/editar`}>
						<Edit className="mr-2 h-4 w-4" />
						Editar
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Informações Principais */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="text-2xl">{material.name}</CardTitle>
								<CardDescription className="mt-2 flex items-center gap-2">
									<span>{material.code}</span>
									{material.category && (
										<Badge variant="outline">{material.category}</Badge>
									)}
								</CardDescription>
							</div>
							<Badge
								variant={material.active ? "default" : "secondary"}
								className="ml-4"
							>
								{material.active ? "Ativo" : "Inativo"}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{material.description && (
							<div>
								<h4 className="mb-2 font-medium">Descrição</h4>
								<p className="text-muted-foreground">{material.description}</p>
							</div>
						)}

						<Separator />

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<h4 className="mb-2 font-medium">Informações Básicas</h4>
								<div className="space-y-2 text-sm">
									{material.brand && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">Marca:</span>
											<span>{material.brand}</span>
										</div>
									)}
									{material.color && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">Cor:</span>
											<span>{material.color}</span>
										</div>
									)}
									{material.barcode && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Código de Barras:
											</span>
											<span className="font-mono">{material.barcode}</span>
										</div>
									)}
								</div>
							</div>

							{material.dimensions && (
								<div>
									<h4 className="mb-2 font-medium">Dimensões</h4>
									<div className="space-y-2 text-sm">
										{material.dimensions.width && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Largura:</span>
												<span>{material.dimensions.width} m</span>
											</div>
										)}
										{material.dimensions.height && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Altura:</span>
												<span>{material.dimensions.height} m</span>
											</div>
										)}
										{material.dimensions.thickness && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													Espessura:
												</span>
												<span>{material.dimensions.thickness} mm</span>
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						{material.tags && material.tags.length > 0 && (
							<>
								<Separator />
								<div>
									<h4 className="mb-2 font-medium">Tags</h4>
									<div className="flex flex-wrap gap-2">
										{material.tags.map((tag) => (
											<Badge key={tag} variant="outline">
												{tag}
											</Badge>
										))}
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Preço e Estoque */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								Preço & Unidade
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/20">
								<div className="font-bold text-2xl text-green-600 dark:text-green-400">
									{formatCurrency(material.cost)}
								</div>
								<div className="text-muted-foreground text-sm">
									por {unit?.name} ({unit?.symbol})
								</div>
							</div>

							{material.currentStock !== undefined && (
								<div className="space-y-3">
									<Separator />
									<div>
										<div className="mb-2 flex items-center justify-between">
											<span className="font-medium">Estoque Atual</span>
											<Badge variant={stockBadgeVariant}>{stockLabel}</Badge>
										</div>
										<div className="font-bold text-2xl">
											{material.currentStock} {unit?.symbol}
										</div>
									</div>

									{(material.minStock || material.maxStock) && (
										<div className="grid grid-cols-2 gap-4 text-sm">
											{material.minStock && (
												<div>
													<span className="text-muted-foreground">Mínimo:</span>
													<div className="font-medium">
														{material.minStock} {unit?.symbol}
													</div>
												</div>
											)}
											{material.maxStock && (
												<div>
													<span className="text-muted-foreground">Máximo:</span>
													<div className="font-medium">
														{material.maxStock} {unit?.symbol}
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							)}

							{material.location && (
								<>
									<Separator />
									<div className="flex items-center gap-2 text-sm">
										<MapPin className="h-4 w-4 text-muted-foreground" />
										<span className="text-muted-foreground">Localização:</span>
										<span className="font-medium">{material.location}</span>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					{/* Fornecedor */}
					{material.supplier && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Truck className="h-5 w-5" />
									Fornecedor
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<span className="text-muted-foreground text-sm">Nome:</span>
									<div className="font-medium">{material.supplier}</div>
								</div>
								{material.supplierCode && (
									<div>
										<span className="text-muted-foreground text-sm">
											Código do Fornecedor:
										</span>
										<div className="font-medium font-mono">
											{material.supplierCode}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Histórico (mock) */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								Histórico Recente
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3 text-sm">
								<div className="flex items-start justify-between">
									<div>
										<div className="font-medium">Material criado</div>
										<div className="text-muted-foreground">
											{new Date().toLocaleDateString("pt-BR")}
										</div>
									</div>
									<Badge variant="outline">Sistema</Badge>
								</div>
								{material.currentStock && material.currentStock > 0 && (
									<div className="flex items-start justify-between">
										<div>
											<div className="font-medium">Estoque inicial</div>
											<div className="text-muted-foreground">
												+{material.currentStock} {unit?.symbol}
											</div>
										</div>
										<Badge variant="outline">Entrada</Badge>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
