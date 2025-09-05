"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
	type EquipmentFormData,
	equipmentFormSchema,
	getDefaultCostUnit,
} from "@/components/forms/equipment-form-types";
import { EquipmentTabs } from "@/components/forms/equipment-tabs";
import { Button } from "@/components/ui/button";

// Usando any para permitir todos os campos do backend
interface EquipmentFormProps {
	equipment?: any;
	onSubmit: (data: any) => void;
	isLoading?: boolean;
}

export function EquipmentForm({
	equipment,
	onSubmit,
	isLoading,
}: EquipmentFormProps) {
	const router = useRouter();
	const isEditing = !!equipment;

	const form = useForm<EquipmentFormData>({
		resolver: zodResolver(equipmentFormSchema),
		mode: "onChange",
		defaultValues: {
			name: equipment?.name || "",
			code: equipment?.code || "",
			type: equipment?.type || "printing",
			// Removido costUnit - impressoras sempre usam m²
			description: equipment?.description || "",
			manufacturer: equipment?.manufacturer || "",
			model: equipment?.model || "",
			year: equipment?.year || undefined,
			energyCostPerHour: Number(equipment?.energyCostPerHour) || 0,
			maintenanceCostPerHour: Number(equipment?.maintenanceCostPerHour) || 0,
			location: equipment?.location || "",
			maxWidth: equipment?.maxWidth || undefined,
			maxHeight: equipment?.maxHeight || undefined,
			maxThickness: equipment?.maxThickness || undefined,
			// 🎯 CORREÇÃO: Carregar dados de depreciação do equipamento
			acquisitionValue: equipment?.acquisitionValue
				? Number(equipment.acquisitionValue)
				: undefined,
			residualValue: equipment?.residualValue
				? Number(equipment.residualValue)
				: undefined,
			depreciationMethod: equipment?.depreciationMethod || "linear",
			usefulLifeHours: equipment?.usefulLifeHours
				? Number(equipment.usefulLifeHours)
				: undefined,
			usefulLifeYears: equipment?.usefulLifeYears
				? Number(equipment.usefulLifeYears)
				: undefined,
			// 🎯 CORREÇÃO: Carregar passadas e cabeças do equipamento
			passes: equipment?.passes || {},
			// Converter consumables para formato printHeads
			printHeads: equipment?.consumables
				? equipment.consumables.reduce((acc: any, ec: any) => {
						if (ec.consumable?.type === "printHead") {
							const headId = `head_${ec.id}`;
							acc[headId] = {
								id: headId,
								consumableId: ec.consumableId,
								position: ec.position,
								installationDate: ec.installationDate
									? new Date(ec.installationDate).toISOString().split("T")[0]
									: new Date().toISOString().split("T")[0],
								notes: ec.notes || "",
							};
						}
						return acc;
					}, {})
				: {},
			defaultPassKey: equipment?.defaultPassKey || undefined,
			consumables: equipment?.consumables || {},
			// 🎯 CORREÇÃO: Carregar dados de manutenção do equipamento
			maintenanceInterval: equipment?.maintenanceInterval || undefined,
			maintenanceNotes: equipment?.maintenanceNotes || "",
			// 🎯 CORREÇÃO: Carregar outros dados do equipamento
			manualUrl: equipment?.manualUrl || "",
			images: equipment?.images || [],
			documents: equipment?.documents || [],
			notes: equipment?.notes || equipment?.description || "",
			tags: equipment?.tags || [],
		},
	});

	const handleSubmit = (values: EquipmentFormData) => {
		console.log("🎯 handleSubmit foi chamado!");
		console.log("🔍 Dados do formulário antes da conversão:");
		console.log("  📋 Passes:", values.passes);
		console.log("  🖨️ Print Heads:", values.printHeads);
		console.log("  📄 Manual URL:", values.manualUrl);
		console.log("  📊 Dados completos:", JSON.stringify(values, null, 2));

		// Converter para o formato esperado pela API com nova lógica
		const formData: any = {
			name: values.name,
			code: values.code,
			type: values.type,
			// Removido costUnit - impressoras sempre usam m²
			description: values.description,
			manufacturer: values.manufacturer,
			model: values.model,
			year: values.year,
			energyCostPerHour: Number(values.energyCostPerHour) || 0,
			maintenanceCostPerHour: Number(values.maintenanceCostPerHour) || 0,
			status: "available", // Valor padrão
			location: values.location,
			maxWidth: values.maxWidth ? Number(values.maxWidth) : undefined,
			maxHeight: values.maxHeight ? Number(values.maxHeight) : undefined,
			maxThickness: values.maxThickness
				? Number(values.maxThickness)
				: undefined,
			tags: values.tags,
			// Campos de depreciação
			acquisitionValue: values.acquisitionValue
				? Number(values.acquisitionValue)
				: undefined,
			residualValue: values.residualValue
				? Number(values.residualValue)
				: undefined,
			depreciationMethod: values.depreciationMethod,
			usefulLifeHours: values.usefulLifeHours
				? Number(values.usefulLifeHours)
				: undefined,
			usefulLifeYears: values.usefulLifeYears
				? Number(values.usefulLifeYears)
				: undefined,
			// Removido consumables - não é usado no update e causava erro
			maintenanceInterval: values.maintenanceInterval,
			maintenanceNotes: values.maintenanceNotes,
			images: values.images,
			documents: values.documents,
			notes: values.notes,
		};

		// Corrigir manualUrl: string vazia vira undefined, senão incluir
		if (values.manualUrl && values.manualUrl.trim() !== "") {
			formData.manualUrl = values.manualUrl;
		}

		// Incluir passes se existirem
		console.log("🔍 Verificando passes:", values.passes);
		console.log(
			"🔍 Número de passes:",
			values.passes ? Object.keys(values.passes).length : 0,
		);

		if (values.passes && Object.keys(values.passes).length > 0) {
			console.log("✅ Adicionando passes ao formData");
			formData.passes = values.passes;
		} else {
			console.log("⚠️ Nenhuma passada encontrada para salvar");
		}

		// 🎯 CORREÇÃO: Incluir defaultPassKey explicitamente
		if (values.defaultPassKey) {
			console.log("✅ Incluindo defaultPassKey:", values.defaultPassKey);
			formData.defaultPassKey = values.defaultPassKey;
		} else {
			console.log("⚠️ Nenhuma passada padrão definida");
		}

		// Incluir cabeças de impressão se existirem
		console.log("🔍 Verificando print heads:", values.printHeads);
		console.log(
			"🔍 Número de print heads:",
			values.printHeads ? Object.keys(values.printHeads).length : 0,
		);

		if (values.printHeads && Object.keys(values.printHeads).length > 0) {
			console.log("✅ Adicionando print heads ao formData");
			formData.printHeads = values.printHeads;
		} else {
			console.log("⚠️ Nenhuma cabeça encontrada para salvar");
		}

		console.log("📤 Dados sendo enviados para API:");
		console.log(
			"  📋 Passes completo:",
			JSON.stringify(formData.passes, null, 2),
		);
		console.log(
			"  🖨️ Print Heads completo:",
			JSON.stringify(formData.printHeads, null, 2),
		);
		console.log(
			"  📄 Manual URL:",
			JSON.stringify(formData.manualUrl, null, 2),
		);
		console.log("  🚀 FormData COMPLETO:", JSON.stringify(formData, null, 2));

		// Medida de segurança: se passes ainda tem problemas, removê-las
		try {
			JSON.stringify(formData.passes);
		} catch (error) {
			console.warn("⚠️ Problema com passes, removendo do envio:", error);
			formData.passes = undefined;
		}

		// Limpar campos undefined e arrays vazios que podem causar problemas
		const cleanedFormData = Object.entries(formData).reduce(
			(acc, [key, value]) => {
				// Pular valores undefined, null, string vazia
				if (value === undefined || value === null || value === "") {
					return acc;
				}
				// Pular arrays vazios
				if (Array.isArray(value) && value.length === 0) {
					return acc;
				}
				// Pular objetos vazios (exceto passes e printHeads que podem ser objetos válidos)
				if (
					typeof value === "object" &&
					!Array.isArray(value) &&
					key !== "passes" &&
					key !== "printHeads" &&
					Object.keys(value).length === 0
				) {
					return acc;
				}
				// Adicionar valor limpo
				acc[key] = value;
				return acc;
			},
			{} as any,
		);

		console.log(
			"  🧹 FormData limpo:",
			JSON.stringify(cleanedFormData, null, 2),
		);

		onSubmit(cleanedFormData);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Button variant="outline" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>

				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => router.back()}
						disabled={isLoading}
					>
						Cancelar
					</Button>
					<Button
						onClick={() => {
							console.log("🔘 Botão Atualizar/Salvar clicado!");

							// Converter valores string para number antes de validar
							const currentValues = form.getValues();

							// Forçar conversão de campos numéricos
							if (typeof currentValues.energyCostPerHour === "string") {
								form.setValue(
									"energyCostPerHour",
									Number.parseFloat(currentValues.energyCostPerHour) || 0,
								);
							}
							if (typeof currentValues.maintenanceCostPerHour === "string") {
								form.setValue(
									"maintenanceCostPerHour",
									Number.parseFloat(currentValues.maintenanceCostPerHour) || 0,
								);
							}
							if (
								currentValues.maxWidth &&
								typeof currentValues.maxWidth === "string"
							) {
								form.setValue(
									"maxWidth",
									Number.parseFloat(currentValues.maxWidth) || 0,
								);
							}
							if (
								currentValues.maxHeight &&
								typeof currentValues.maxHeight === "string"
							) {
								form.setValue(
									"maxHeight",
									Number.parseFloat(currentValues.maxHeight) || 0,
								);
							}
							if (
								currentValues.maxThickness &&
								typeof currentValues.maxThickness === "string"
							) {
								form.setValue(
									"maxThickness",
									Number.parseFloat(currentValues.maxThickness) || 0,
								);
							}

							console.log("🔢 Valores convertidos:", {
								energyCostPerHour: form.getValues("energyCostPerHour"),
								maintenanceCostPerHour: form.getValues(
									"maintenanceCostPerHour",
								),
								tipos: {
									energy: typeof form.getValues("energyCostPerHour"),
									maintenance: typeof form.getValues("maintenanceCostPerHour"),
								},
							});

							// Agora sim, submeter o formulário
							form.handleSubmit(handleSubmit, (errors) => {
								console.error("❌ Erros de validação:", errors);
							})();
						}}
						disabled={isLoading}
					>
						<Save className="mr-2 h-4 w-4" />
						{isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Salvar"}
					</Button>
				</div>
			</div>

			<EquipmentTabs
				form={form}
				isEditing={isEditing}
				equipmentId={equipment?.id}
			/>
		</div>
	);
}
