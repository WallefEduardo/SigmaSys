"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils/currency";

interface EquipmentCostPreviewModalProps {
	equipmentId: string;
	equipmentName: string;
	isOpen: boolean;
	onClose: () => void;
}

export function EquipmentCostPreviewModal({
	equipmentId,
	equipmentName,
	isOpen,
	onClose,
}: EquipmentCostPreviewModalProps) {
	// Buscar custos organizados da nova tabela
	const {
		data: costBreakdown,
		isLoading,
		error,
	} = api.equipments.getOrganizedCosts.useQuery(
		{ equipmentId },
		{ enabled: isOpen }, // Só busca quando o modal está aberto
	);

	const renderFixedCosts = () => {
		if (!costBreakdown) return null;

		return (
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="font-medium text-sm">Custos Fixos (por m²)</h4>
					<Badge variant="secondary">
						Total: {formatCurrency(Number(costBreakdown.totalFixedPerM2))}/m²
					</Badge>
				</div>

				<div className="space-y-2 rounded bg-muted/50 p-3 text-sm">
					<div className="flex justify-between">
						<span>Depreciação:</span>
						<span>
							{formatCurrency(Number(costBreakdown.depreciationPerM2))}/m²
						</span>
					</div>
					<div className="flex justify-between">
						<span>Energia:</span>
						<span>{formatCurrency(Number(costBreakdown.energyPerM2))}/m²</span>
					</div>
					<div className="flex justify-between">
						<span>Manutenção:</span>
						<span>
							{formatCurrency(Number(costBreakdown.maintenancePerM2))}/m²
						</span>
					</div>
				</div>

				<div className="rounded bg-blue-50 p-2 text-blue-800 text-xs dark:bg-blue-950/20 dark:text-blue-300">
					<strong>Custos fixos:</strong> Não dependem da passada escolhida. Já
					incluídos no cálculo base.
				</div>
			</div>
		);
	};

	const renderPassCosts = () => {
		const passBreakdowns = costBreakdown?.passBreakdowns as any[] | undefined;

		if (!passBreakdowns || passBreakdowns.length === 0) {
			return (
				<div className="rounded bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-300">
					<strong>Nenhuma passada configurada</strong>
					<br />
					Configure passadas no formulário de edição para ver custos variáveis.
				</div>
			);
		}

		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="font-medium text-sm">Custos Variáveis por Passada</h4>
					<Badge variant="outline">{passBreakdowns.length} passadas</Badge>
				</div>

				{passBreakdowns.map((passData) => (
					<div key={passData.passKey} className="space-y-3 rounded border p-3">
						<div className="flex items-center justify-between">
							<div>
								<h5 className="font-medium">{passData.passName}</h5>
								<p className="text-muted-foreground text-xs">
									Velocidade: {passData.speedM2PerHour} m²/h
								</p>
							</div>
							<Badge>
								Total: {formatCurrency(passData.totalPassCostPerM2)}/m²
							</Badge>
						</div>

						{/* Custos de tintas */}
						{passData.inkDetails && passData.inkDetails.length > 0 && (
							<div className="space-y-2">
								<h6 className="font-medium text-sm">Tintas:</h6>
								<div className="space-y-1 rounded bg-muted/30 p-2 text-sm">
									{passData.inkDetails.map((ink: any, idx: number) => (
										<div key={idx} className="flex justify-between">
											<span>{ink.consumableName}</span>
											<span>
												{formatCurrency(ink.costPerM2)}/m²
												<span className="ml-1 text-muted-foreground text-xs">
													({ink.consumptionMlPerM2}ml/m²)
												</span>
											</span>
										</div>
									))}
									<Separator />
									<div className="flex justify-between font-medium">
										<span>Total Tintas:</span>
										<span>{formatCurrency(passData.totalInkCostPerM2)}/m²</span>
									</div>
								</div>
							</div>
						)}

						{/* Custos de cabeças */}
						{passData.headDetails && passData.headDetails.length > 0 && (
							<div className="space-y-2">
								<h6 className="font-medium text-sm">Cabeças de Impressão:</h6>
								<div className="space-y-1 rounded bg-muted/30 p-2 text-sm">
									{passData.headDetails.map((head: any, idx: number) => (
										<div key={idx} className="flex justify-between">
											<span>{head.consumableName}</span>
											<span>
												{formatCurrency(head.costPerM2)}/m²
												<span className="ml-1 text-muted-foreground text-xs">
													(desgaste calculado)
												</span>
											</span>
										</div>
									))}
									<Separator />
									<div className="flex justify-between font-medium">
										<span>Total Cabeças:</span>
										<span>
											{formatCurrency(passData.totalHeadCostPerM2)}/m²
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				))}

				<div className="rounded bg-green-50 p-2 text-green-800 text-xs dark:bg-green-950/20 dark:text-green-300">
					<strong>Como usar:</strong> Some os custos fixos com a passada
					desejada para obter o custo total por m².
				</div>
			</div>
		);
	};

	const renderContent = () => {
		if (isLoading) {
			return (
				<div className="flex items-center justify-center py-12">
					<div className="animate-pulse space-y-4 text-center">
						<div className="mx-auto h-4 w-32 rounded bg-muted" />
						<div className="mx-auto h-4 w-48 rounded bg-muted" />
					</div>
				</div>
			);
		}

		if (error) {
			return (
				<div className="rounded bg-red-50 p-4 text-red-800 dark:bg-red-950/20 dark:text-red-300">
					<p className="font-medium">Erro ao carregar custos</p>
					<p className="text-sm">{error.message}</p>
				</div>
			);
		}

		if (!costBreakdown) {
			return (
				<div className="rounded bg-gray-50 p-4 text-gray-600 dark:bg-gray-950/20 dark:text-gray-400">
					<p>Nenhum dado de custo disponível para este equipamento.</p>
				</div>
			);
		}

		return (
			<div className="max-h-[60vh] space-y-6 overflow-y-auto">
				{renderFixedCosts()}
				<Separator />
				{renderPassCosts()}
			</div>
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Detalhamento de Custos
						<Badge variant="outline">{equipmentName}</Badge>
					</DialogTitle>
					<DialogDescription>
						Análise detalhada dos custos de operação por metro quadrado
					</DialogDescription>
				</DialogHeader>

				{renderContent()}

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						<X className="mr-2 h-4 w-4" />
						Fechar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
