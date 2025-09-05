"use client";

import {
	ArrowRight,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Cpu,
	DollarSign,
	Package,
	RotateCcw,
	Settings,
	X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/trpc";
import MeasurementCollector from "./MeasurementCollector";

interface FlowTestModalProps {
	isOpen: boolean;
	onClose: () => void;
	checklistData: {
		nodes: any[];
		edges: any[];
		selections?: any;
	} | null;
}

export default function FlowTestModal({
	isOpen,
	onClose,
	checklistData,
}: FlowTestModalProps) {
	const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [isCompleted, setIsCompleted] = useState(false);
	const [flowPath, setFlowPath] = useState<string[]>([]);
	const [showMeasurements, setShowMeasurements] = useState(false);
	const [pendingAnswer, setPendingAnswer] = useState<{
		optionId: string;
		optionText: string;
	} | null>(null);
	const [measurements, setMeasurements] = useState<Record<string, number>>({});
	const [selectedItems, setSelectedItems] = useState<
		{
			nodeId: string;
			optionText: string;
			materials: any[];
			processes: any[];
			equipments: any[];
			measurements: Record<string, number>;
		}[]
	>([]);

	// Reset quando modal abre
	useEffect(() => {
		if (isOpen && checklistData?.nodes?.length) {
			// Encontrar o nó inicial (start ou primeiro question)
			const startNode = checklistData.nodes.find(
				(node) => node.type === "start",
			);
			const firstQuestionNode = checklistData.nodes.find(
				(node) => node.type === "question",
			);

			if (startNode) {
				// Se há um nó start, encontrar a próxima pergunta conectada
				const startEdge = checklistData.edges?.find(
					(edge) => edge.source === startNode.id,
				);
				const nextNodeId = startEdge?.target || firstQuestionNode?.id;
				setCurrentNodeId(nextNodeId || null);
			} else if (firstQuestionNode) {
				setCurrentNodeId(firstQuestionNode.id);
			}

			setAnswers({});
			setIsCompleted(false);
			setFlowPath([]);
			setShowMeasurements(false);
			setPendingAnswer(null);
			setMeasurements({});
			setSelectedItems([]);
		}
	}, [isOpen, checklistData]);

	// Função para verificar se uma opção requer coleta de medidas
	const optionRequiresMeasurements = (option: any) => {
		if (!option.actions) return false;

		return option.actions.some((action: any) => {
			if (action.type === "add_material" && action.materials) {
				return action.materials.some(
					(material: any) =>
						material.calculationType === "formula" &&
						material.calculationRuleFormula,
				);
			}
			if (action.type === "add_process" && action.processes) {
				return action.processes.some(
					(process: any) =>
						process.calculationType === "formula" &&
						process.calculationRuleFormula,
				);
			}
			if (action.type === "add_equipment" && action.equipments) {
				return action.equipments.some(
					(equipment: any) =>
						equipment.calculationType === "formula" &&
						equipment.calculationRuleFormula,
				);
			}
			return false;
		});
	};

	// Função para extrair textos de medidas e fórmulas de uma opção
	const extractMeasurementInfo = (option: any) => {
		const formulas: string[] = [];
		const measurementTexts: string[] = [];

		if (!option || !option.actions) {
			return { formulas, measurementTexts };
		}

		option.actions.forEach((action: any) => {
			if (action.type === "add_material" && action.materials) {
				action.materials.forEach((material: any) => {
					if (
						material.calculationType === "formula" &&
						material.calculationRuleFormula
					) {
						formulas.push(material.calculationRuleFormula);
						if (material.measurementText) {
							measurementTexts.push(material.measurementText);
						}
					}
				});
			}
			if (action.type === "add_process" && action.processes) {
				action.processes.forEach((process: any) => {
					if (
						process.calculationType === "formula" &&
						process.calculationRuleFormula
					) {
						formulas.push(process.calculationRuleFormula);
						if (process.measurementText) {
							measurementTexts.push(process.measurementText);
						}
					}
				});
			}
			if (action.type === "add_equipment" && action.equipments) {
				action.equipments.forEach((equipment: any) => {
					if (
						equipment.calculationType === "formula" &&
						equipment.calculationRuleFormula
					) {
						formulas.push(equipment.calculationRuleFormula);
						if (equipment.measurementText) {
							measurementTexts.push(equipment.measurementText);
						}
					}
				});
			}
		});

		return { formulas, measurementTexts };
	};

	const getCurrentNode = () => {
		if (!currentNodeId || !checklistData?.nodes) return null;
		return checklistData.nodes.find((node) => node.id === currentNodeId);
	};

	const handleAnswer = (optionId: string, optionText: string) => {
		if (!currentNodeId) return;

		const currentNode = getCurrentNode();

		let selectedOption = currentNode?.data?.question?.options?.find(
			(opt: any) => opt.id === optionId,
		);

		// Se não encontrou no caminho padrão, tentar caminho alternativo
		if (!selectedOption) {
			selectedOption = currentNode?.data?.options?.find(
				(opt: any) => opt.id === optionId,
			);

			if (selectedOption && optionRequiresMeasurements(selectedOption)) {
				setPendingAnswer({ optionId, optionText });
				setShowMeasurements(true);
				return;
			}
		}

		// Verificar se esta opção requer coleta de medidas
		if (selectedOption && optionRequiresMeasurements(selectedOption)) {
			setPendingAnswer({ optionId, optionText });
			setShowMeasurements(true);
			return;
		}

		processAnswer(optionId, optionText);
	};

	const processAnswerWithMeasurements = (
		optionId: string,
		optionText: string,
		measurementsToUse: Record<string, number>,
	) => {
		if (!currentNodeId) return;

		const newAnswers = { ...answers, [currentNodeId]: optionText };
		setAnswers(newAnswers);
		setFlowPath((prev) => [...prev, currentNodeId]);

		// Coletar itens da opção selecionada
		const currentNode = getCurrentNode();
		let selectedOption = currentNode?.data?.question?.options?.find(
			(opt: any) => opt.id === optionId,
		);

		// Se não encontrou no caminho padrão, tentar caminho alternativo
		if (!selectedOption) {
			selectedOption = currentNode?.data?.options?.find(
				(opt: any) => opt.id === optionId,
			);
		}

		if (selectedOption && selectedOption.actions) {
			const materials: any[] = [];
			const processes: any[] = [];
			const equipments: any[] = [];

			selectedOption.actions.forEach((action: any) => {
				if (action.type === "add_material" && action.materials) {
					materials.push(...action.materials);

					// IMPORTANTE: Extrair equipamentos dos materiais
					action.materials.forEach((material: any) => {
						if (material.equipmentId && material.equipmentName) {
							equipments.push({
								id: `eq-from-mat-${material.id || Date.now()}-${Math.random()}`, // ID único
								equipmentId: material.equipmentId,
								equipmentName: material.equipmentName,
								calculationType: material.calculationType,
								calculationRuleFormula: material.calculationRuleFormula,
								unitCost: material.equipmentCost || 0,
								multiplier: material.multiplier || 1,
							});
						}
					});
				}
				if (action.type === "add_process" && action.processes) {
					processes.push(...action.processes);

					// Extrair equipamentos dos processos
					action.processes.forEach((process: any) => {
						if (process.equipmentId && process.equipmentName) {
							equipments.push({
								id: `eq-from-proc-${process.id || Date.now()}-${Math.random()}`, // ID único
								equipmentId: process.equipmentId,
								equipmentName: process.equipmentName,
								calculationType: process.calculationType,
								calculationRuleFormula: process.calculationRuleFormula,
								unitCost: process.equipmentCost || 0,
								multiplier: process.multiplier || 1,
							});
						}
					});
				}
				if (action.type === "add_equipment" && action.equipments) {
					equipments.push(...action.equipments);
				}
			});

			if (
				materials.length > 0 ||
				processes.length > 0 ||
				equipments.length > 0
			) {
				setSelectedItems((prev) => [
					...prev,
					{
						nodeId: currentNodeId,
						optionText,
						materials,
						processes,
						equipments,
						measurements: { ...measurementsToUse },
					},
				]);
			}
		}

		// Encontrar próximo nó baseado na resposta
		const nextEdge = checklistData?.edges?.find(
			(edge) => edge.source === currentNodeId && edge.sourceHandle === optionId,
		);

		if (nextEdge) {
			const nextNode = checklistData?.nodes?.find(
				(node) => node.id === nextEdge.target,
			);

			if (nextNode?.type === "end") {
				setIsCompleted(true);
				setCurrentNodeId(null);
			} else {
				setCurrentNodeId(nextEdge.target);
			}
		} else {
			// Se não há próximo nó, finalizar o teste
			setIsCompleted(true);
			setCurrentNodeId(null);
		}
	};

	const handleMeasurementsComplete = (
		measurementData: Record<string, number>,
	) => {
		const newMeasurements = { ...measurements, ...measurementData };
		setMeasurements(newMeasurements);
		setShowMeasurements(false);

		if (pendingAnswer) {
			processAnswerWithMeasurements(
				pendingAnswer.optionId,
				pendingAnswer.optionText,
				newMeasurements,
			);
			setPendingAnswer(null);
		}
	};

	const processAnswer = (optionId: string, optionText: string) => {
		processAnswerWithMeasurements(optionId, optionText, measurements);
	};

	const resetTest = () => {
		setAnswers({});
		setIsCompleted(false);
		setFlowPath([]);
		setSelectedItems([]);
		setMeasurements({});
		setShowMeasurements(false);
		setPendingAnswer(null);

		// Reiniciar do primeiro nó
		const startNode = checklistData?.nodes?.find(
			(node) => node.type === "start",
		);
		const firstQuestionNode = checklistData?.nodes?.find(
			(node) => node.type === "question",
		);

		if (startNode) {
			const startEdge = checklistData?.edges?.find(
				(edge) => edge.source === startNode.id,
			);
			const nextNodeId = startEdge?.target || firstQuestionNode?.id;
			setCurrentNodeId(nextNodeId || null);
		} else if (firstQuestionNode) {
			setCurrentNodeId(firstQuestionNode.id);
		}
	};

	// Hook para calcular custos usando o novo endpoint
	const [calculatedCosts, setCalculatedCosts] = useState<any>(null);
	const [isCalculating, setIsCalculating] = useState(false);
	const [isReportOpen, setIsReportOpen] = useState(false);

	const calculateCostsMutation =
		api.calculations.calculateProductCost.useMutation({
			onSuccess: (data) => {
				console.log("🎯 [FRONTEND] Dados recebidos do backend:", data);
				console.log(
					"🔍 [FRONTEND] Equipamentos recebidos:",
					data?.equipments?.items,
				);
				if (data?.equipments?.items?.[0]) {
					console.log(
						"🧮 [FRONTEND] Primeiro equipamento costBreakdown:",
						data.equipments.items[0].costBreakdown,
					);
				}
				setCalculatedCosts(data);
				setIsCalculating(false);
			},
			onError: (error) => {
				console.error("Erro ao calcular custos:", error);
				setIsCalculating(false);
			},
		});

	// Função para calcular custos usando dados reais do backend
	// Função para renderizar o conteúdo do relatório de custos
	const renderCostReport = () => {
		if (!calculatedCosts) return null;

		return (
			<>
				{/* Materiais */}
				{calculatedCosts.materials.items.length > 0 && (
					<div>
						<h4 className="mb-2 flex items-center gap-2 font-medium">
							<Package className="h-4 w-4" />
							Materiais - R$ {calculatedCosts.materials.subtotal.toFixed(2)}
						</h4>
						<div className="ml-6 space-y-1">
							{calculatedCosts.materials.items.map((item: any, idx: number) => (
								<div key={idx} className="flex justify-between text-sm">
									<div className="flex flex-col">
										<span>{item.name}</span>
										<span className="text-muted-foreground text-xs">
											{item.calculatedQuantity.toFixed(2)}{" "}
											{item.unitCost ? `x R$ ${item.unitCost.toFixed(2)}` : ""}
											{item.formula && ` (${item.formula})`}
										</span>
									</div>
									<span className="font-mono">
										R$ {item.totalCost.toFixed(2)}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Processos */}
				{calculatedCosts.processes.items.length > 0 && (
					<div>
						<h4 className="mb-2 flex items-center gap-2 font-medium">
							<Cpu className="h-4 w-4" />
							Processos - R$ {calculatedCosts.processes.subtotal.toFixed(2)}
						</h4>
						<div className="ml-6 space-y-1">
							{calculatedCosts.processes.items.map((item: any, idx: number) => (
								<div key={idx} className="flex justify-between text-sm">
									<div className="flex flex-col">
										<span>{item.name}</span>
										<span className="text-muted-foreground text-xs">
											{item.timeRequired.toFixed(2)}h x R${" "}
											{item.costPerHour.toFixed(2)}/h
										</span>
									</div>
									<span className="font-mono">
										R$ {item.totalCost.toFixed(2)}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Equipamentos */}
				{calculatedCosts.equipments.items.length > 0 && (
					<div>
						<h4 className="mb-2 flex items-center gap-2 font-medium">
							<Settings className="h-4 w-4" />
							Equipamentos - R$ {calculatedCosts.equipments.subtotal.toFixed(2)}
						</h4>
						<div className="ml-6 space-y-1">
							{calculatedCosts.equipments.items.map(
								(item: any, idx: number) => (
									<div key={idx} className="flex justify-between text-sm">
										<div className="flex flex-col">
											<span>{item.name}</span>
											<span className="text-muted-foreground text-xs">
												{item.areaProcessed.toFixed(2)}m² x R${" "}
												{item.costPerM2.toFixed(2)}/m²
											</span>
											{item.costBreakdown && (
												<div className="mt-2 space-y-3 text-muted-foreground text-xs">
													{/* Custos Fixos */}
													<div>
														<div className="mb-1 font-medium text-blue-600 text-sm dark:text-blue-400">
															Custos Fixos (R${" "}
															{(
																item.costBreakdown.depreciation +
																item.costBreakdown.energy +
																item.costBreakdown.maintenance
															).toFixed(2)}
															/m²):
														</div>
														<div className="ml-3 space-y-1 rounded bg-blue-50 p-2 dark:bg-blue-950/20">
															<div className="flex justify-between">
																<span>Depreciação:</span>
																<span>
																	R${" "}
																	{item.costBreakdown.depreciation.toFixed(2)}
																</span>
															</div>
															<div className="flex justify-between">
																<span>Energia:</span>
																<span>
																	R$ {item.costBreakdown.energy.toFixed(2)}
																</span>
															</div>
															<div className="flex justify-between">
																<span>Manutenção:</span>
																<span>
																	R$ {item.costBreakdown.maintenance.toFixed(2)}
																</span>
															</div>
														</div>
														<div className="mt-1 text-blue-700 text-xs italic dark:text-blue-300">
															* Custos fixos: Não dependem da passada escolhida
														</div>
													</div>

													{/* Custos Variáveis */}
													{(item.costBreakdown.inkCosts > 0 ||
														item.costBreakdown.printHeadCosts > 0) && (
														<div>
															<div className="mb-1 font-medium text-green-600 text-sm dark:text-green-400">
																Custos Variáveis (R${" "}
																{(
																	item.costBreakdown.inkCosts +
																	item.costBreakdown.printHeadCosts
																).toFixed(2)}
																/m²):
															</div>
															<div className="ml-3 space-y-2">
																{/* Tintas */}
																{item.costBreakdown.inkCosts > 0 && (
																	<div className="rounded bg-green-50 p-2 dark:bg-green-950/20">
																		<div className="mb-1 font-medium text-sm">
																			Tintas:
																		</div>
																		<div className="flex justify-between">
																			<span>Consumo total</span>
																			<span>
																				R${" "}
																				{item.costBreakdown.inkCosts.toFixed(2)}
																				/m²
																			</span>
																		</div>
																	</div>
																)}

																{/* Cabeças */}
																{item.costBreakdown.printHeadCosts > 0 && (
																	<div className="rounded bg-green-50 p-2 dark:bg-green-950/20">
																		<div className="mb-1 font-medium text-sm">
																			Cabeças de Impressão:
																		</div>
																		<div className="flex justify-between">
																			<span>Desgaste calculado</span>
																			<span>
																				R${" "}
																				{item.costBreakdown.printHeadCosts.toFixed(
																					2,
																				)}
																				/m²
																			</span>
																		</div>
																	</div>
																)}
															</div>
															<div className="mt-1 text-green-700 text-xs italic dark:text-green-300">
																* Custos variáveis: Dependem da
																passada/velocidade escolhida
															</div>
														</div>
													)}
												</div>
											)}
										</div>
										<span className="font-mono">
											R$ {item.totalCost.toFixed(2)}
										</span>
									</div>
								),
							)}
						</div>
					</div>
				)}

				{/* Total Geral */}
				<div className="mt-4 border-t pt-3">
					<div className="flex justify-between font-bold text-lg">
						<span>TOTAL GERAL:</span>
						<span className="font-mono text-green-600">
							R$ {calculatedCosts.grandTotal.toFixed(2)}
						</span>
					</div>
				</div>

				{/* Resumo das Medidas Utilizadas */}
				<div className="mt-4 rounded bg-gray-50 p-3 dark:bg-gray-700">
					<h5 className="mb-2 font-medium text-sm">
						Medidas Utilizadas nos Cálculos:
					</h5>
					<div className="flex flex-wrap gap-2">
						{Object.entries(calculatedCosts.calculations.measurements).map(
							([key, value]) => (
								<Badge key={key} variant="secondary" className="text-xs">
									{key}: {value}
								</Badge>
							),
						)}
					</div>
				</div>
			</>
		);
	};

	const calculateCosts = async () => {
		if (selectedItems.length === 0 || Object.keys(measurements).length === 0) {
			return null;
		}

		console.log("🧮 Iniciando cálculo de custos...");
		console.log("📊 SelectedItems antes da consolidação:", selectedItems);
		console.log("📏 Measurements:", measurements);

		setIsCalculating(true);

		try {
			// Consolidar todos os itens selecionados
			const materials: any[] = [];
			const processes: any[] = [];
			const equipments: any[] = [];

			selectedItems.forEach((selection) => {
				// Materiais
				selection.materials.forEach((material: any) => {
					materials.push({
						id: material.id || `mat-${Date.now()}-${Math.random()}`, // Garantir ID único
						materialId: material.materialId,
						materialName: material.materialName,
						calculationType: material.calculationType || "fixed",
						fixedQuantity: material.fixedQuantity,
						calculationRuleId: material.calculationRuleId,
						calculationRuleFormula: material.calculationRuleFormula,
						multiplier: material.multiplier || 1,
						unit: material.unit,
					});
				});

				// Processos
				selection.processes.forEach((process: any) => {
					processes.push({
						id: process.id || `proc-${Date.now()}-${Math.random()}`, // Garantir ID único
						processId: process.processId,
						processName: process.processName,
						calculationType: process.calculationType || "fixed",
						fixedQuantity: process.fixedQuantity,
						calculationRuleId: process.calculationRuleId,
						calculationRuleFormula: process.calculationRuleFormula,
						multiplier: process.multiplier || 1,
					});
				});

				// Equipamentos
				selection.equipments.forEach((equipment: any) => {
					equipments.push({
						id: equipment.id || `eq-${Date.now()}-${Math.random()}`, // Garantir ID único
						equipmentId: equipment.equipmentId,
						equipmentName: equipment.equipmentName,
						calculationType: equipment.calculationType || "fixed",
						fixedQuantity: equipment.fixedQuantity,
						calculationRuleId: equipment.calculationRuleId,
						calculationRuleFormula: equipment.calculationRuleFormula,
						multiplier: equipment.multiplier || 1,
					});
				});
			});

			// Mapear medidas para formato esperado pelo backend
			const mappedMeasurements: Record<string, number> = {};
			Object.entries(measurements).forEach(([key, value]) => {
				// Manter nome original e também mapear para formato padrão
				mappedMeasurements[key] = value;

				// Mapear para variáveis padrão de fórmulas
				if (key === "largura" || key === "L") mappedMeasurements.L = value;
				if (key === "altura" || key === "A") mappedMeasurements.A = value;
				if (key === "comprimento" || key === "C") mappedMeasurements.C = value;
			});

			console.log("📤 Dados sendo enviados para o backend:", {
				materials,
				processes,
				equipments,
				mappedMeasurements,
			});

			// Chamar o endpoint com dados estruturados
			await calculateCostsMutation.mutateAsync({
				checklistItems: {
					materials,
					processes,
					equipments,
				},
				measurements: mappedMeasurements,
			});
		} catch (error) {
			console.error("Erro ao calcular custos:", error);
			setIsCalculating(false);
		}
	};

	// Calcular automaticamente quando houver dados
	useEffect(() => {
		if (
			isCompleted &&
			selectedItems.length > 0 &&
			Object.keys(measurements).length > 0
		) {
			calculateCosts();
		}
	}, [isCompleted, selectedItems, measurements]);

	const currentNode = getCurrentNode();

	if (!checklistData?.nodes?.length) {
		return (
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Testar Fluxo</DialogTitle>
					</DialogHeader>
					<div className="py-8 text-center text-muted-foreground">
						<p>Nenhum fluxo configurado para testar.</p>
						<p className="mt-2 text-sm">
							Adicione perguntas ao checklist primeiro.
						</p>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>Testar Fluxo do Checklist</DialogTitle>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={resetTest}>
								<RotateCcw className="mr-1 h-4 w-4" />
								Reiniciar
							</Button>
							<Button variant="outline" size="sm" onClick={onClose}>
								<X className="mr-1 h-4 w-4" />
								Fechar
							</Button>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6">
					{/* Progresso */}
					<div className="rounded-lg bg-muted/30 p-4">
						<div className="mb-2 flex items-center justify-between text-sm">
							<span className="font-medium">Progresso do Teste</span>
							<span className="text-muted-foreground">
								{flowPath.length} de{" "}
								{
									checklistData.nodes.filter((n) => n.type === "question")
										.length
								}{" "}
								perguntas
							</span>
						</div>
						<div className="h-2 w-full rounded-full bg-muted">
							<div
								className="h-2 rounded-full bg-primary transition-all duration-300"
								style={{
									width: `${(flowPath.length / Math.max(checklistData.nodes.filter((n) => n.type === "question").length, 1)) * 100}%`,
								}}
							/>
						</div>
					</div>

					{/* Respostas anteriores */}
					{flowPath.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									Respostas Anteriores
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{flowPath.map((nodeId, index) => {
									const node = checklistData.nodes.find((n) => n.id === nodeId);
									const answer = answers[nodeId];

									return (
										<div
											key={nodeId}
											className="flex items-center gap-3 text-sm"
										>
											<Badge variant="outline">{index + 1}</Badge>
											<span className="font-medium">
												{node?.data?.question}
											</span>
											<ArrowRight className="h-3 w-3 text-muted-foreground" />
											<Badge variant="secondary">{answer}</Badge>
										</div>
									);
								})}
							</CardContent>
						</Card>
					)}

					{/* Pergunta atual - só mostra se NÃO estiver coletando medidas */}
					{currentNode && !isCompleted && !showMeasurements && (
						<Card className="border-2 border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
										{flowPath.length + 1}
									</div>
									{currentNode.data.question}
								</CardTitle>
								{currentNode.data.description && (
									<p className="text-muted-foreground text-sm">
										{currentNode.data.description}
									</p>
								)}
							</CardHeader>
							<CardContent>
								<div className="grid gap-2">
									{currentNode.data.options?.map(
										(option: any, index: number) => (
											<Button
												key={option.id}
												variant="outline"
												className="h-auto justify-start p-4 text-left hover:border-primary hover:bg-primary/5"
												onClick={() =>
													handleAnswer(option.id, option.label || option.text)
												}
											>
												<div className="flex items-center gap-3">
													<div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-medium text-xs">
														{String.fromCharCode(65 + index)}
													</div>
													<div>
														<div className="font-medium">
															{option.label || option.text}
														</div>
														{option.description && (
															<div className="mt-1 text-muted-foreground text-sm">
																{option.description}
															</div>
														)}
													</div>
												</div>
											</Button>
										),
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Mostrar itens coletados durante o quiz */}
					{selectedItems.length > 0 && !isCompleted && (
						<Card className="border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/50">
							<CardHeader>
								<CardTitle className="font-medium text-gray-700 text-sm dark:text-gray-300">
									Itens Coletados no Quiz
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{selectedItems.map((item, index) => (
									<div
										key={index}
										className="rounded border bg-white p-3 dark:bg-gray-800"
									>
										<div className="mb-2 font-medium text-sm">
											{item.optionText}
										</div>

										{/* Mostrar medidas coletadas */}
										{Object.keys(item.measurements).length > 0 && (
											<div className="mb-2">
												<div className="mb-1 text-gray-600 text-xs dark:text-gray-400">
													Medidas coletadas:
												</div>
												<div className="flex flex-wrap gap-2">
													{Object.entries(item.measurements).map(
														([key, value]) => (
															<Badge
																key={key}
																variant="secondary"
																className="text-xs"
															>
																{key}: {value}
															</Badge>
														),
													)}
												</div>
											</div>
										)}

										{/* Mostrar itens */}
										<div className="flex flex-wrap gap-2 text-xs">
											{item.materials.map((mat, idx) => (
												<Badge
													key={`mat-${idx}`}
													variant="outline"
													className="flex items-center gap-1"
												>
													<Package className="h-3 w-3" />
													{mat.materialName}
												</Badge>
											))}
											{item.processes.map((proc, idx) => (
												<Badge
													key={`proc-${idx}`}
													variant="outline"
													className="flex items-center gap-1"
												>
													<Cpu className="h-3 w-3" />
													{proc.processName}
												</Badge>
											))}
											{item.equipments.map((eq, idx) => (
												<Badge
													key={`eq-${idx}`}
													variant="outline"
													className="flex items-center gap-1"
												>
													<Settings className="h-3 w-3" />
													{eq.equipmentName}
												</Badge>
											))}
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					)}

					{/* Relatório de Custos Durante o Quiz */}
					{selectedItems.length > 0 && !isCompleted && (
						<div className="mt-6">
							{/* Header Collapsible */}
							<div
								onClick={() => setIsReportOpen(!isReportOpen)}
								className="flex cursor-pointer items-center justify-between rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
							>
								<h3 className="flex items-center gap-2 font-semibold text-lg">
									<DollarSign className="h-5 w-5 text-green-600" />
									Prévia de Custos
									{calculatedCosts && !isReportOpen && (
										<Badge
											variant="secondary"
											className="ml-2 font-mono text-green-600"
										>
											R$ {calculatedCosts.grandTotal.toFixed(2)}
										</Badge>
									)}
								</h3>
								<div className="flex items-center gap-2">
									{calculatedCosts && isReportOpen && (
										<Badge
											variant="secondary"
											className="font-mono text-green-600"
										>
											Total: R$ {calculatedCosts.grandTotal.toFixed(2)}
										</Badge>
									)}
									{isReportOpen ? (
										<ChevronDown className="h-5 w-5 text-muted-foreground" />
									) : (
										<ChevronRight className="h-5 w-5 text-muted-foreground" />
									)}
								</div>
							</div>

							{/* Content Collapsible */}
							{isReportOpen && (
								<div className="rounded-b-lg border-x border-b bg-white dark:bg-gray-800">
									<div className="p-4">
										{isCalculating ? (
											<div className="flex items-center justify-center py-8">
												<div className="text-center">
													<div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
													<p className="text-muted-foreground text-sm">
														Calculando custos...
													</p>
												</div>
											</div>
										) : calculatedCosts ? (
											<div className="space-y-4">
												{/* Renderizar conteúdo igual ao relatório final */}
												{renderCostReport()}
											</div>
										) : (
											<div className="py-4 text-center">
												<p className="text-muted-foreground text-sm">
													Clique em "Calcular Custos" para ver os valores
													detalhados.
												</p>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Coleta de Medidas */}
					{showMeasurements && pendingAnswer && (
						<Card className="border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
									Medidas Necessárias
								</CardTitle>
							</CardHeader>
							<CardContent>
								{(() => {
									const currentNode = getCurrentNode();

									let selectedOption =
										currentNode?.data?.question?.options?.find(
											(opt: any) => opt.id === pendingAnswer.optionId,
										);

									// Se não encontrou no caminho padrão, tentar caminho alternativo
									if (!selectedOption) {
										selectedOption = currentNode?.data?.options?.find(
											(opt: any) => opt.id === pendingAnswer.optionId,
										);
									}

									const { formulas, measurementTexts } =
										extractMeasurementInfo(selectedOption);

									return (
										<MeasurementCollector
											formulaText={formulas[0]}
											measurementText={
												measurementTexts[0] ||
												"Informe as medidas necessárias para esta opção"
											}
											onMeasurementsChange={handleMeasurementsComplete}
										/>
									);
								})()}
							</CardContent>
						</Card>
					)}

					{/* Resultado final */}
					{isCompleted && (
						<Card className="border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
									<CheckCircle className="h-5 w-5" />
									Teste Concluído!
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-green-700 text-sm dark:text-green-300">
									Você completou o fluxo do checklist com sucesso. Todas as
									perguntas foram respondidas conforme a configuração.
								</p>

								{/* Relatório de Custos Final - Collapsible */}
								{selectedItems.length > 0 && (
									<div className="mt-6">
										{/* Header Collapsible */}
										<div
											onClick={() => setIsReportOpen(!isReportOpen)}
											className="flex cursor-pointer items-center justify-between rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
										>
											<h3 className="flex items-center gap-2 font-semibold text-lg">
												<DollarSign className="h-5 w-5 text-green-600" />
												Relatório de Custos
												{calculatedCosts && !isReportOpen && (
													<Badge
														variant="secondary"
														className="ml-2 font-mono text-green-600"
													>
														R$ {calculatedCosts.grandTotal.toFixed(2)}
													</Badge>
												)}
											</h3>
											<div className="flex items-center gap-2">
												{calculatedCosts && isReportOpen && (
													<Badge
														variant="secondary"
														className="font-mono text-green-600"
													>
														Total: R$ {calculatedCosts.grandTotal.toFixed(2)}
													</Badge>
												)}
												{isReportOpen ? (
													<ChevronDown className="h-5 w-5 text-muted-foreground" />
												) : (
													<ChevronRight className="h-5 w-5 text-muted-foreground" />
												)}
											</div>
										</div>

										{/* Content Collapsible */}
										{isReportOpen && (
											<div className="rounded-b-lg border-x border-b bg-white dark:bg-gray-800">
												<div className="p-4">
													{isCalculating ? (
														<div className="flex items-center justify-center py-8">
															<div className="text-center">
																<div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
																<p className="text-muted-foreground text-sm">
																	Calculando custos...
																</p>
															</div>
														</div>
													) : calculatedCosts ? (
														<div className="space-y-4">
															{renderCostReport()}
														</div>
													) : (
														<div className="py-4 text-center">
															<p className="text-muted-foreground text-sm">
																Clique em "Calcular Custos" para ver os valores
																detalhados.
															</p>
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								)}

								<div className="mt-6 flex gap-2">
									<Button onClick={resetTest} variant="outline">
										<RotateCcw className="mr-2 h-4 w-4" />
										Testar Novamente
									</Button>
									<Button onClick={onClose}>Finalizar Teste</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
