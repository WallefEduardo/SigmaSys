"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Copy,
	Edit3,
	Plus,
	Settings,
	Trash2,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import EquipmentModal from "./EquipmentModal";
import MaterialModal from "./MaterialModal";
import ProcessModal from "./ProcessModal";

interface QuestionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (question: QuestionData) => void;
	initialData?: any;
	isEditing?: boolean;
	fullScreen?: boolean;
}

interface ResponseOption {
	id: string;
	label: string;
	actions: ResponseAction[];
}

interface ResponseAction {
	id: string;
	type: string;
	itemName: string;
	quantity?: number;
	materials?: any[];
	processes?: any[];
	equipments?: any[];
}

interface QuestionData {
	question: string;
	description: string;
	responseType: "single" | "multiple" | "conditional";
	options: ResponseOption[];
}

const actionTypeLabels: Record<string, string> = {
	add_material: "Adicionar Material",
	add_process: "Adicionar Processo",
	add_equipment: "Adicionar Equipamento",
	add_finish: "Adicionar Acabamento",
};

export default function QuestionModal({
	isOpen,
	onClose,
	onSave,
	initialData,
	isEditing,
	fullScreen = false,
}: QuestionModalProps) {
	const [questionData, setQuestionData] = useState<QuestionData>({
		question: "",
		description: "",
		responseType: "single",
		options: [],
	});

	const [materialModalOpen, setMaterialModalOpen] = useState(false);
	const [processModalOpen, setProcessModalOpen] = useState(false);
	const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
	const [currentEditingAction, setCurrentEditingAction] = useState<{
		optionId: string;
		actionId: string;
	} | null>(null);

	// Memoizar referências de dados para evitar re-renderizações desnecessárias
	const currentActionMaterials = useMemo(() => {
		if (!currentEditingAction) return [];
		return questionData.options
			.find((opt) => opt.id === currentEditingAction.optionId)
			?.actions.find((act) => act.id === currentEditingAction.actionId)
			?.materials || [];
	}, [currentEditingAction, questionData.options]);

	const currentActionProcesses = useMemo(() => {
		if (!currentEditingAction) return [];
		return questionData.options
			.find((opt) => opt.id === currentEditingAction.optionId)
			?.actions.find((act) => act.id === currentEditingAction.actionId)
			?.processes || [];
	}, [currentEditingAction, questionData.options]);

	const currentActionEquipments = useMemo(() => {
		if (!currentEditingAction) return [];
		return questionData.options
			.find((opt) => opt.id === currentEditingAction.optionId)
			?.actions.find((act) => act.id === currentEditingAction.actionId)
			?.equipments || [];
	}, [currentEditingAction, questionData.options]);

	// Carregar dados iniciais quando estiver editando
	useEffect(() => {
		if (isOpen) {
			if (isEditing && initialData) {
				// Fazer uma cópia profunda dos dados para evitar referências
				const dataToLoad = JSON.parse(JSON.stringify(initialData));
				setQuestionData({
					question: dataToLoad.question || "",
					description: dataToLoad.description || "",
					responseType: dataToLoad.responseType || "single",
					options: dataToLoad.options || [],
				});
			} else if (!isEditing) {
				// Reset form para novo
				setQuestionData({
					question: "",
					description: "",
					responseType: "single",
					options: [],
				});
			}
		}
	}, [isOpen, isEditing, JSON.stringify(initialData)]);

	const { data: materials } = api.materials.list.useQuery({
		page: 1,
		limit: 100,
	});

	const { data: processes } = api.processes.list.useQuery({
		page: 1,
		limit: 100,
	});

	const { data: equipment } = api.equipments.list.useQuery({
		page: 1,
		limit: 100,
	});

	const { data: finishes } = api.finishes.list.useQuery({
		page: 1,
		limit: 100,
	});

	const addOption = () => {
		const newOption: ResponseOption = {
			id: `option-${Date.now()}`,
			label: `Opção ${questionData.options.length + 1}`,
			actions: [],
		};
		setQuestionData((prev) => ({
			...prev,
			options: [...prev.options, newOption],
		}));
	};

	const removeOption = (optionId: string) => {
		setQuestionData((prev) => ({
			...prev,
			options: prev.options.filter((opt) => opt.id !== optionId),
		}));
	};

	const duplicateOption = (optionId: string) => {
		const optionToDuplicate = questionData.options.find(
			(opt) => opt.id === optionId
		);
		if (optionToDuplicate) {
			const timestamp = Date.now();
			const randomId = Math.random().toString(36).substr(2, 9);

			const duplicatedOption: ResponseOption = {
				id: `opt-${timestamp}-${randomId}`,
				label: `${optionToDuplicate.label} (cópia)`,
				actions: optionToDuplicate.actions.map((action, index) => ({
					...action,
					id: `act-${timestamp}-${randomId}-${index}`,
					// Fazer deep copy dos materiais se existir
					materials: action.materials
						? JSON.parse(JSON.stringify(action.materials))
						: action.materials,
				})),
			};

			setQuestionData((prev) => ({
				...prev,
				options: [...prev.options, duplicatedOption],
			}));
		}
	};

	const updateOption = (optionId: string, field: string, value: any) => {
		setQuestionData((prev) => ({
			...prev,
			options: prev.options.map((opt) =>
				opt.id === optionId ? { ...opt, [field]: value } : opt
			),
		}));
	};

	const addAction = (optionId: string, actionType: string) => {
		const newAction: ResponseAction = {
			id: `action-${Date.now()}`,
			type: actionType,
			itemName: "",
			quantity: actionType === "add_material" ? 1 : undefined,
		};

		setQuestionData((prev) => ({
			...prev,
			options: prev.options.map((opt) =>
				opt.id === optionId
					? { ...opt, actions: [...opt.actions, newAction] }
					: opt
			),
		}));
	};

	const removeAction = (optionId: string, actionId: string) => {
		setQuestionData((prev) => ({
			...prev,
			options: prev.options.map((opt) =>
				opt.id === optionId
					? {
							...opt,
							actions: opt.actions.filter((act) => act.id !== actionId),
					  }
					: opt
			),
		}));
	};

	const updateAction = (
		optionId: string,
		actionId: string,
		field: string,
		value: any
	) => {
		setQuestionData((prev) => ({
			...prev,
			options: prev.options.map((opt) =>
				opt.id === optionId
					? {
							...opt,
							actions: opt.actions.map((act) =>
								act.id === actionId ? { ...act, [field]: value } : act
							),
					  }
					: opt
			),
		}));
	};

	const handleActionEdit = (optionId: string, actionId: string) => {
		setCurrentEditingAction({ optionId, actionId });
		const action = questionData.options
			.find((opt) => opt.id === optionId)
			?.actions.find((act) => act.id === actionId);

		if (action) {
			switch (action.type) {
				case "add_material":
					setMaterialModalOpen(true);
					break;
				case "add_process":
					setProcessModalOpen(true);
					break;
				case "add_equipment":
					setEquipmentModalOpen(true);
					break;
			}
		}
	};

	const getAvailableItems = (actionType: string) => {
		switch (actionType) {
			case "add_material":
				return materials?.materials || [];
			case "add_process":
				return processes?.processes || [];
			case "add_equipment":
				return equipment?.equipments || [];
			case "add_finish":
				return finishes?.finishes || [];
			default:
				return [];
		}
	};

	const handleSave = () => {
		if (questionData.question && questionData.options.length > 0) {
			onSave(questionData);
			onClose();
			// Só reseta se não estiver editando
			if (!isEditing) {
				setQuestionData({
					question: "",
					description: "",
					responseType: "single",
					options: [],
				});
			}
		} else {
			toast.error("Preencha todos os campos obrigatórios");
		}
	};

	// Renderizar conteúdo do formulário
	const formContent = (
		<div className="space-y-6 py-4">
			{/* Question Fields */}
			<div className="space-y-4">
				<div>
					<Label htmlFor="question">Pergunta *</Label>
					<Input
						id="question"
						value={questionData.question}
						onChange={(e) =>
							setQuestionData((prev) => ({
								...prev,
								question: e.target.value,
							}))
						}
						placeholder="Digite sua pergunta aqui..."
					/>
				</div>

				<div>
					<Label htmlFor="description">Descrição (opcional)</Label>
					<Textarea
						id="description"
						value={questionData.description}
						onChange={(e) =>
							setQuestionData((prev) => ({
								...prev,
								description: e.target.value,
							}))
						}
						placeholder="Descrição adicional ou instruções..."
						rows={2}
					/>
				</div>

				<div>
					<Label htmlFor="responseType">Tipo de Resposta</Label>
					<Select
						value={questionData.responseType}
						onValueChange={(value: "single" | "multiple" | "conditional") =>
							setQuestionData((prev) => ({ ...prev, responseType: value }))
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="single">Única Escolha</SelectItem>
							<SelectItem value="multiple">Múltipla Escolha</SelectItem>
							<SelectItem value="conditional">Condicional</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Response Options */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label>Opções de Resposta *</Label>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addOption}
						className="flex items-center gap-2"
					>
						<Plus className="h-4 w-4" />
						Adicionar Opção
					</Button>
				</div>

				{questionData.options.map((option) => (
					<div key={option.id} className="space-y-4 p-4 border rounded-lg">
						<div className="flex items-center gap-2">
							<Input
								value={option.label}
								onChange={(e) =>
									updateOption(option.id, "label", e.target.value)
								}
								placeholder="Label da opção"
								className="flex-1"
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => duplicateOption(option.id)}
								title="Duplicar opção"
							>
								<Copy className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => removeOption(option.id)}
								className="text-red-600 hover:text-red-700"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* Actions for this option */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label className="text-sm">Ações desta opção:</Label>
								<Select
									onValueChange={(actionType) =>
										addAction(option.id, actionType)
									}
								>
									<SelectTrigger className="w-40">
										<SelectValue placeholder="Adicionar ação..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="add_material">
											+ Material
										</SelectItem>
										<SelectItem value="add_process">+ Processo</SelectItem>
										<SelectItem value="add_equipment">
											+ Equipamento
										</SelectItem>
										<SelectItem value="add_finish">+ Acabamento</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{option.actions.map((action) => (
								<div
									key={action.id}
									className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded"
								>
									<span className="text-sm font-medium text-blue-600">
										{actionTypeLabels[action.type]}
									</span>
									<Select
										value={action.itemName}
										onValueChange={(value) =>
											updateAction(option.id, action.id, "itemName", value)
										}
									>
										<SelectTrigger className="flex-1">
											<SelectValue placeholder="Selecionar item..." />
										</SelectTrigger>
										<SelectContent>
											{(getAvailableItems(action.type) || []).map((item: any) => (
												<SelectItem key={item.id} value={item.name}>
													{item.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									{action.type === "add_material" && (
										<Input
											type="number"
											value={action.quantity || 1}
											onChange={(e) =>
												updateAction(
													option.id,
													action.id,
													"quantity",
													Number.parseFloat(e.target.value) || 1
												)
											}
											className="w-20"
											placeholder="Qtd"
											min="0.1"
											step="0.1"
										/>
									)}

									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => handleActionEdit(option.id, action.id)}
										title="Configurar ação"
									>
										<Settings className="h-4 w-4" />
									</Button>

									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => removeAction(option.id, action.id)}
										className="text-red-600 hover:text-red-700"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			<div className="flex justify-end gap-4 pt-6 border-t">
				<Button variant="outline" onClick={onClose}>
					Cancelar
				</Button>
				<Button
					onClick={handleSave}
					disabled={
						!questionData.question || questionData.options.length === 0
					}
				>
					{isEditing ? "Salvar Alterações" : "Criar Pergunta"}
				</Button>
			</div>
		</div>
	);

	// Se for fullScreen, renderizar como tela dedicada
	if (fullScreen) {
		return (
			<>
				{formContent}

				{/* Modal de Materiais */}
				<MaterialModal
					isOpen={materialModalOpen}
					onClose={() => {
						setMaterialModalOpen(false);
						setCurrentEditingAction(null);
					}}
					onSave={(materials) => {
						if (currentEditingAction) {
							updateAction(
								currentEditingAction.optionId,
								currentEditingAction.actionId,
								"materials",
								materials
							);
						}
						setMaterialModalOpen(false);
						setCurrentEditingAction(null);
					}}
					initialMaterials={currentActionMaterials}
				/>

				{/* Modal de Processos */}
				<ProcessModal
					isOpen={processModalOpen}
					onClose={() => {
						setProcessModalOpen(false);
						setCurrentEditingAction(null);
					}}
					onSave={(processes) => {
						if (currentEditingAction) {
							updateAction(
								currentEditingAction.optionId,
								currentEditingAction.actionId,
								"processes",
								processes
							);
						}
						setProcessModalOpen(false);
						setCurrentEditingAction(null);
					}}
					initialProcesses={currentActionProcesses}
				/>

				{/* Modal de Equipamentos */}
				<EquipmentModal
					isOpen={equipmentModalOpen}
					onClose={() => {
						setEquipmentModalOpen(false);
						setCurrentEditingAction(null);
					}}
					onSave={(equipments) => {
						if (currentEditingAction) {
							updateAction(
								currentEditingAction.optionId,
								currentEditingAction.actionId,
								"equipments",
								equipments
							);
						}
						setEquipmentModalOpen(false);
						setCurrentEditingAction(null);
					}}
					equipments={currentActionEquipments}
				/>
			</>
		);
	}

	// Renderizar como modal tradicional
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Editar Pergunta" : "Criar Nova Pergunta"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Modifique a pergunta e suas opções"
							: "Configure a pergunta e defina as ações para cada resposta"}
					</DialogDescription>
				</DialogHeader>

				{formContent}
			</DialogContent>

			{/* Modal de Materiais */}
			<MaterialModal
				isOpen={materialModalOpen}
				onClose={() => {
					setMaterialModalOpen(false);
					setCurrentEditingAction(null);
				}}
				onSave={(materials) => {
					if (currentEditingAction) {
						updateAction(
							currentEditingAction.optionId,
							currentEditingAction.actionId,
							"materials",
							materials
						);
					}
					setMaterialModalOpen(false);
					setCurrentEditingAction(null);
				}}
				initialMaterials={currentActionMaterials}
			/>

			{/* Modal de Processos */}
			<ProcessModal
				isOpen={processModalOpen}
				onClose={() => {
					setProcessModalOpen(false);
					setCurrentEditingAction(null);
				}}
				onSave={(processes) => {
					if (currentEditingAction) {
						updateAction(
							currentEditingAction.optionId,
							currentEditingAction.actionId,
							"processes",
							processes
						);
					}
					setProcessModalOpen(false);
					setCurrentEditingAction(null);
				}}
				initialProcesses={currentActionProcesses}
			/>

			{/* Modal de Equipamentos */}
			<EquipmentModal
				isOpen={equipmentModalOpen}
				onClose={() => {
					setEquipmentModalOpen(false);
					setCurrentEditingAction(null);
				}}
				onSave={(equipments) => {
					if (currentEditingAction) {
						updateAction(
							currentEditingAction.optionId,
							currentEditingAction.actionId,
							"equipments",
							equipments
						);
					}
					setEquipmentModalOpen(false);
					setCurrentEditingAction(null);
				}}
				equipments={currentActionEquipments}
			/>
		</Dialog>
	);
}