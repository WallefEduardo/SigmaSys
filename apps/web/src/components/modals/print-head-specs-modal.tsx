"use client";

import {
	Check,
	Clock,
	Copy,
	DollarSign,
	Filter,
	Info,
	Search,
	Star,
	TrendingUp,
	Zap,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	getApplications,
	getManufacturers,
	getPrintHeadsByApplication,
	getPrintHeadsByManufacturer,
	POPULAR_PRINT_HEADS,
	type PrintHeadSpec,
	searchPrintHeads,
} from "@/lib/data/print-head-specs";
import { formatCurrency } from "@/lib/utils/currency";

interface PrintHeadSpecsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectSpec: (spec: {
		model: string;
		lifespanM2: number;
		optimalSpeedRange: string;
		cost: number;
		costPerM2: number;
	}) => void;
}

export function PrintHeadSpecsModal({
	open,
	onOpenChange,
	onSelectSpec,
}: PrintHeadSpecsModalProps) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [selectedManufacturer, setSelectedManufacturer] =
		React.useState<string>("all");
	const [selectedApplication, setSelectedApplication] =
		React.useState<string>("all");
	const [copiedField, setCopiedField] = React.useState<string | null>(null);

	const filteredHeads = React.useMemo(() => {
		let heads = POPULAR_PRINT_HEADS;

		// Filtrar por busca
		if (searchQuery.trim()) {
			heads = searchPrintHeads(searchQuery);
		}

		// Filtrar por fabricante
		if (selectedManufacturer !== "all") {
			heads = heads.filter(
				(head) => head.manufacturer === selectedManufacturer,
			);
		}

		// Filtrar por aplicação
		if (selectedApplication !== "all") {
			heads = heads.filter((head) =>
				head.applications.some(
					(app) => app.toLowerCase() === selectedApplication.toLowerCase(),
				),
			);
		}

		return heads;
	}, [searchQuery, selectedManufacturer, selectedApplication]);

	const copyToClipboard = (text: string, fieldName: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(fieldName);
		setTimeout(() => setCopiedField(null), 2000);
	};

	const handleSelectSpec = (spec: PrintHeadSpec) => {
		const cost = (spec.estimatedCost.min + spec.estimatedCost.max) / 2; // usar custo médio
		const costPerM2 = cost / spec.lifespanM2;

		onSelectSpec({
			model: spec.model,
			lifespanM2: spec.lifespanM2,
			optimalSpeedRange: spec.optimalSpeedRange,
			cost,
			costPerM2,
		});
		onOpenChange(false);
	};

	const getPopularityBadge = (model: string) => {
		const popularModels = ["DX5", "DX7", "I3200-A1"];
		if (popularModels.includes(model)) {
			return (
				<Badge variant="secondary" className="text-xs">
					<Star className="mr-1 h-3 w-3" />
					Popular
				</Badge>
			);
		}
		return null;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Info className="h-5 w-5" />
						Especificações de Cabeças de Impressão
					</DialogTitle>
					<DialogDescription>
						Base de dados com especificações técnicas das cabeças mais usadas no
						mercado. Clique em qualquer especificação para copiar ou usar no
						formulário.
					</DialogDescription>
				</DialogHeader>

				{/* Filtros */}
				<div className="flex flex-shrink-0 flex-wrap gap-3 rounded-lg border bg-muted/30 p-4">
					<div className="min-w-[200px] flex-1">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input
								placeholder="Buscar por modelo, fabricante ou aplicação..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>

					<Select
						value={selectedManufacturer}
						onValueChange={setSelectedManufacturer}
					>
						<SelectTrigger className="w-[160px]">
							<SelectValue placeholder="Fabricante" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos fabricantes</SelectItem>
							{getManufacturers().map((manufacturer) => (
								<SelectItem key={manufacturer} value={manufacturer}>
									{manufacturer}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={selectedApplication}
						onValueChange={setSelectedApplication}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Aplicação" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todas aplicações</SelectItem>
							{getApplications().map((application) => (
								<SelectItem key={application} value={application}>
									{application}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setSearchQuery("");
							setSelectedManufacturer("all");
							setSelectedApplication("all");
						}}
					>
						<Filter className="mr-2 h-4 w-4" />
						Limpar
					</Button>
				</div>

				{/* Lista de Cabeças */}
				<div
					className="flex-1 overflow-y-auto pr-2"
					style={{
						scrollbarWidth: "thin",
						scrollbarColor: "rgb(156 163 175) transparent",
					}}
				>
					{filteredHeads.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							<Info className="mx-auto mb-2 h-8 w-8" />
							<p>Nenhuma cabeça encontrada com os filtros aplicados.</p>
						</div>
					) : (
						<div className="space-y-4">
							{filteredHeads.map((spec) => (
								<Card
									key={spec.id}
									className="border-2 transition-colors hover:border-primary/50"
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between">
											<div>
												<CardTitle className="flex items-center gap-2">
													{spec.model}
													{getPopularityBadge(spec.model)}
													<Badge variant="outline" className="text-xs">
														{spec.manufacturer}
													</Badge>
												</CardTitle>
												<CardDescription className="mt-1">
													{spec.description}
												</CardDescription>
											</div>
											<div className="text-right">
												<p className="font-medium text-sm">
													{formatCurrency(spec.estimatedCost.min)} -{" "}
													{formatCurrency(spec.estimatedCost.max)}
												</p>
												{spec.releaseYear && (
													<p className="text-muted-foreground text-xs">
														Lançamento: {spec.releaseYear}
													</p>
												)}
											</div>
										</div>
									</CardHeader>

									<CardContent className="space-y-4">
										{/* Especificações Técnicas */}
										<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
											{/* Vida Útil */}
											<div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
												<Clock className="h-4 w-4 text-blue-500" />
												<div className="flex-1">
													<p className="text-muted-foreground text-xs">
														Vida Útil
													</p>
													<p className="font-medium">
														{(spec.lifespanM2 / 1000).toFixed(0)}K m² (
														{spec.lifespanM2.toLocaleString()} m²)
													</p>
												</div>
												<Button
													size="sm"
													variant="ghost"
													onClick={() =>
														copyToClipboard(
															spec.lifespanM2.toString(),
															`${spec.id}-lifespanM2`,
														)
													}
												>
													{copiedField === `${spec.id}-lifespanM2` ? (
														<Check className="h-3 w-3" />
													) : (
														<Copy className="h-3 w-3" />
													)}
												</Button>
											</div>

											{/* Velocidade */}
											<div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
												<Zap className="h-4 w-4 text-green-500" />
												<div className="flex-1">
													<p className="text-muted-foreground text-xs">
														Velocidade Ideal
													</p>
													<p className="font-medium">
														{spec.optimalSpeedRange}
													</p>
												</div>
												<Button
													size="sm"
													variant="ghost"
													onClick={() =>
														copyToClipboard(
															spec.optimalSpeedRange,
															`${spec.id}-speed`,
														)
													}
												>
													{copiedField === `${spec.id}-speed` ? (
														<Check className="h-3 w-3" />
													) : (
														<Copy className="h-3 w-3" />
													)}
												</Button>
											</div>

											{/* Custo por m² */}
											<div className="flex items-center gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
												<TrendingUp className="h-4 w-4 text-green-500" />
												<div className="flex-1">
													<p className="text-muted-foreground text-xs">
														Custo de Desgaste
													</p>
													<p className="font-medium text-green-600">
														R${" "}
														{(
															(spec.estimatedCost.min +
																spec.estimatedCost.max) /
															2 /
															spec.lifespanM2
														).toFixed(4)}
														/m²
													</p>
												</div>
												<Button
													size="sm"
													variant="ghost"
													onClick={() =>
														copyToClipboard(
															(
																(spec.estimatedCost.min +
																	spec.estimatedCost.max) /
																2 /
																spec.lifespanM2
															).toFixed(4),
															`${spec.id}-costPerM2`,
														)
													}
												>
													{copiedField === `${spec.id}-costPerM2` ? (
														<Check className="h-3 w-3" />
													) : (
														<Copy className="h-3 w-3" />
													)}
												</Button>
											</div>
										</div>

										{/* Aplicações */}
										<div>
											<p className="mb-2 font-medium text-sm">Aplicações:</p>
											<div className="flex flex-wrap gap-1">
												{spec.applications.map((app) => (
													<Badge
														key={app}
														variant="outline"
														className="text-xs"
													>
														{app}
													</Badge>
												))}
											</div>
										</div>

										{/* Observações */}
										{spec.notes.length > 0 && (
											<div>
												<p className="mb-2 font-medium text-sm">Observações:</p>
												<ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
													{spec.notes.map((note, index) => (
														<li key={index}>{note}</li>
													))}
												</ul>
											</div>
										)}

										{/* Faixa de Preços */}
										<div className="rounded-lg bg-muted/50 p-3">
											<p className="mb-2 font-medium text-xs">
												💰 Faixa de Preços:
											</p>
											<div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
												<div className="rounded bg-blue-50 p-2 dark:bg-blue-950/30">
													<p className="font-medium text-blue-800 dark:text-blue-200">
														Custo da Cabeça:
													</p>
													<p className="text-blue-600 dark:text-blue-400">
														{formatCurrency(spec.estimatedCost.min)} -{" "}
														{formatCurrency(spec.estimatedCost.max)}
													</p>
												</div>
												<div className="rounded bg-green-50 p-2 dark:bg-green-950/30">
													<p className="font-medium text-green-800 dark:text-green-200">
														Desgaste por m²:
													</p>
													<p className="text-green-600 dark:text-green-400">
														R${" "}
														{(spec.estimatedCost.min / spec.lifespanM2).toFixed(
															4,
														)}{" "}
														- R${" "}
														{(spec.estimatedCost.max / spec.lifespanM2).toFixed(
															4,
														)}
													</p>
												</div>
											</div>
										</div>

										{/* Botão de Ação Simplificado */}
										<div className="border-t pt-2">
											<Button
												size="sm"
												onClick={() => handleSelectSpec(spec)}
												className="w-full text-sm"
											>
												✅ Usar Esta Cabeça
											</Button>
											<p className="mt-2 text-center text-muted-foreground text-xs">
												Custo por m²: R${" "}
												{(
													(spec.estimatedCost.min + spec.estimatedCost.max) /
													2 /
													spec.lifespanM2
												).toFixed(4)}
											</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>

				{/* Footer com informações */}
				<div className="flex-shrink-0 border-t pt-3">
					<p className="text-center text-muted-foreground text-xs">
						💡 <strong>Dica:</strong> Os valores são baseados em especificações
						oficiais dos fabricantes. Sempre consulte o manual específico da sua
						impressora para valores exatos. ({filteredHeads.length} de{" "}
						{POPULAR_PRINT_HEADS.length} cabeças exibidas)
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
