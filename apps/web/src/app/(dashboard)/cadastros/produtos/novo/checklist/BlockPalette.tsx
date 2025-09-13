"use client";

import {
	Calculator,
	ChevronDown,
	ChevronRight,
	Cpu,
	Grip,
	MessageSquare,
	Package,
	Palette,
	Play,
	Settings,
	Square,
} from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface BlockPaletteProps {
	onDragStart: (event: React.DragEvent, blockType: string, blockData: any) => void;
}

interface BlockCategory {
	id: string;
	name: string;
	icon: React.ReactNode;
	color: string;
	blocks: BlockItem[];
}

interface BlockItem {
	id: string;
	name: string;
	description: string;
	icon: React.ReactNode;
	type: string;
	defaultData?: any;
}

export default function BlockPalette({ onDragStart }: BlockPaletteProps) {
	const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
		new Set(),
	);

	const toggleCategory = (categoryId: string) => {
		setCollapsedCategories((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(categoryId)) {
				newSet.delete(categoryId);
			} else {
				newSet.add(categoryId);
			}
			return newSet;
		});
	};

	const categories: BlockCategory[] = [
		{
			id: "flow",
			name: "Fluxo",
			icon: <Play className="h-4 w-4" />,
			color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
			blocks: [
				{
					id: "start",
					name: "Início",
					description: "Ponto de partida do checklist",
					icon: <Play className="h-4 w-4" />,
					type: "start",
					defaultData: { label: "Início" },
				},
				{
					id: "end",
					name: "Fim",
					description: "Finaliza o checklist",
					icon: <Square className="h-4 w-4" />,
					type: "end",
					defaultData: { label: "Fim" },
				},
			],
		},
		{
			id: "questions",
			name: "Perguntas",
			icon: <MessageSquare className="h-4 w-4" />,
			color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
			blocks: [
				{
					id: "question_simple",
					name: "Pergunta Simples",
					description: "Pergunta com uma única resposta",
					icon: <MessageSquare className="h-4 w-4" />,
					type: "question",
					defaultData: {
						question: "Nova pergunta",
						description: "",
						responseType: "single",
						options: [
							{
								id: "opt1",
								label: "Opção 1",
								actions: [],
							},
							{
								id: "opt2",
								label: "Opção 2",
								actions: [],
							},
						],
					},
				},
				{
					id: "question_multiple",
					name: "Múltipla Escolha",
					description: "Pergunta com várias respostas possíveis",
					icon: <MessageSquare className="h-4 w-4" />,
					type: "question",
					defaultData: {
						question: "Nova pergunta múltipla",
						description: "",
						responseType: "multiple",
						options: [
							{
								id: "opt1",
								label: "Opção A",
								actions: [],
							},
							{
								id: "opt2",
								label: "Opção B",
								actions: [],
							},
							{
								id: "opt3",
								label: "Opção C",
								actions: [],
							},
						],
					},
				},
				{
					id: "question_conditional",
					name: "Pergunta Condicional",
					description: "Cada resposta leva a diferentes caminhos",
					icon: <MessageSquare className="h-4 w-4" />,
					type: "question",
					defaultData: {
						question: "Pergunta condicional",
						description: "",
						responseType: "conditional",
						options: [
							{
								id: "opt1",
								label: "Sim",
								actions: [],
							},
							{
								id: "opt2",
								label: "Não",
								actions: [],
							},
						],
					},
				},
			],
		},
		{
			id: "actions",
			name: "Ações",
			icon: <Settings className="h-4 w-4" />,
			color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
			blocks: [
				{
					id: "add_material",
					name: "Adicionar Material",
					description: "Adiciona material ao produto",
					icon: <Package className="h-4 w-4" />,
					type: "action",
					defaultData: {
						actionType: "add_material",
						question: "Selecionar material",
						description: "Escolha o material necessário",
						responseType: "single",
						options: [
							{
								id: "opt1",
								label: "Material padrão",
								actions: [
									{
										type: "add_material",
										itemName: "Material",
										quantity: 1,
									},
								],
							},
						],
					},
				},
				{
					id: "add_process",
					name: "Adicionar Processo",
					description: "Adiciona processo ao produto",
					icon: <Cpu className="h-4 w-4" />,
					type: "action",
					defaultData: {
						actionType: "add_process",
						question: "Selecionar processo",
						description: "Escolha o processo necessário",
						responseType: "single",
						options: [
							{
								id: "opt1",
								label: "Processo padrão",
								actions: [
									{
										type: "add_process",
										itemName: "Processo",
										quantity: 1,
									},
								],
							},
						],
					},
				},
				{
					id: "add_equipment",
					name: "Adicionar Equipamento",
					description: "Adiciona equipamento ao produto",
					icon: <Settings className="h-4 w-4" />,
					type: "action",
					defaultData: {
						actionType: "add_equipment",
						question: "Selecionar equipamento",
						description: "Escolha o equipamento necessário",
						responseType: "single",
						options: [
							{
								id: "opt1",
								label: "Equipamento padrão",
								actions: [
									{
										type: "add_equipment",
										itemName: "Equipamento",
										quantity: 1,
									},
								],
							},
						],
					},
				},
				{
					id: "add_finish",
					name: "Adicionar Acabamento",
					description: "Adiciona acabamento ao produto",
					icon: <Palette className="h-4 w-4" />,
					type: "action",
					defaultData: {
						actionType: "add_finish",
						question: "Selecionar acabamento",
						description: "Escolha o acabamento necessário",
						responseType: "single",
						options: [
							{
								id: "opt1",
								label: "Acabamento padrão",
								actions: [
									{
										type: "add_finish",
										itemName: "Acabamento",
										quantity: 1,
									},
								],
							},
						],
					},
				},
			],
		},
		{
			id: "formulas",
			name: "Cálculos",
			icon: <Calculator className="h-4 w-4" />,
			color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
			blocks: [
				{
					id: "measurement_collector",
					name: "Coletar Medidas",
					description: "Coleta medidas para fórmulas",
					icon: <Calculator className="h-4 w-4" />,
					type: "question",
					defaultData: {
						question: "Informe as medidas",
						description: "Colete as medidas necessárias para o cálculo",
						responseType: "single",
						collectMeasurements: true,
						options: [
							{
								id: "opt1",
								label: "Confirmar medidas",
								actions: [],
							},
						],
					},
				},
			],
		},
	];

	const handleDragStart = (event: React.DragEvent, block: BlockItem) => {
		onDragStart(event, block.type, block.defaultData);
		
		// Visual feedback
		event.currentTarget.classList.add('opacity-50');
		setTimeout(() => {
			event.currentTarget.classList.remove('opacity-50');
		}, 100);
	};

	return (
		<div className="flex h-full w-80 flex-col border-r bg-gray-50 dark:bg-gray-900">
			{/* Header */}
			<div className="border-b bg-white p-4 dark:bg-gray-800">
				<h2 className="font-semibold text-gray-900 dark:text-gray-100">
					Blocos de Checklist
				</h2>
				<p className="mt-1 text-gray-600 text-sm dark:text-gray-400">
					Arraste os blocos para o canvas
				</p>
			</div>

			{/* Categories */}
			<div className="flex-1 overflow-y-auto p-4">
				<div className="space-y-4">
					{categories.map((category) => {
						const isCollapsed = collapsedCategories.has(category.id);

						return (
							<div key={category.id} className="space-y-2">
								{/* Category Header */}
								<button
									type="button"
									onClick={() => toggleCategory(category.id)}
									className="flex w-full items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
								>
									<div className="flex items-center gap-2">
										<Badge className={category.color} variant="secondary">
											{category.icon}
											<span className="ml-1">{category.name}</span>
										</Badge>
									</div>
									{isCollapsed ? (
										<ChevronRight className="h-4 w-4 text-gray-500" />
									) : (
										<ChevronDown className="h-4 w-4 text-gray-500" />
									)}
								</button>

								{/* Category Blocks */}
								{!isCollapsed && (
									<div className="space-y-2">
										{category.blocks.map((block) => (
											<Card
												key={block.id}
												draggable
												onDragStart={(e) => handleDragStart(e, block)}
												className="cursor-grab border-gray-200 transition-all hover:border-primary hover:shadow-sm active:cursor-grabbing active:scale-95"
											>
												<CardContent className="p-3">
													<div className="flex items-start gap-3">
														<div className="mt-0.5 flex-shrink-0 rounded-md bg-gray-100 p-1.5 dark:bg-gray-700">
															{block.icon}
														</div>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2">
																<h4 className="truncate font-medium text-gray-900 text-sm dark:text-gray-100">
																	{block.name}
																</h4>
																<Grip className="h-3 w-3 flex-shrink-0 text-gray-400" />
															</div>
															<p className="mt-1 text-gray-600 text-xs dark:text-gray-400">
																{block.description}
															</p>
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Footer */}
			<div className="border-t bg-white p-4 dark:bg-gray-800">
				<div className="text-center text-gray-500 text-xs dark:text-gray-400">
					💡 Dica: Arraste e solte no canvas
				</div>
			</div>
		</div>
	);
}