"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { EquipmentTabs } from "@/components/forms/equipment-tabs";
import { equipmentFormSchema, type EquipmentFormData, getDefaultCostUnit } from "@/components/forms/equipment-form-types";
import type { Equipment } from "@/lib/mock-data/equipments";

interface EquipmentFormProps {
	equipment?: Equipment;
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
			costUnit: equipment?.costUnit || getDefaultCostUnit("printing"),
			description: equipment?.description || "",
			manufacturer: equipment?.manufacturer || "",
			model: equipment?.model || "",
			year: equipment?.year || undefined,
			energyCostPerHour: equipment?.energyCostPerHour || 0,
			maintenanceCostPerHour: equipment?.maintenanceCostPerHour || 0,
			location: equipment?.location || "",
			maxWidth: equipment?.maxWidth || undefined,
			maxHeight: equipment?.maxHeight || undefined,
			maxThickness: equipment?.maxThickness || undefined,
			acquisitionValue: undefined,
			residualValue: undefined,
			depreciationMethod: "linear",
			usefulLifeHours: undefined,
			usefulLifeYears: undefined,
			passes: {},
			consumables: {},
			maintenanceInterval: undefined,
			maintenanceNotes: "",
			manualUrl: "",
			images: [],
			documents: [],
			notes: equipment?.description || "",
			tags: equipment?.tags || [],
		},
	});

	const handleSubmit = (values: EquipmentFormData) => {
		console.log("🔍 Dados do formulário antes da conversão:", {
			passes: values.passes,
			consumables: values.consumables,
			manualUrl: values.manualUrl
		});

		// Converter para o formato esperado pela API com nova lógica
		const formData: any = {
			name: values.name,
			code: values.code,
			type: values.type,
			costUnit: values.costUnit,
			description: values.description,
			manufacturer: values.manufacturer,
			model: values.model,
			year: values.year,
			energyCostPerHour: values.energyCostPerHour,
			maintenanceCostPerHour: values.maintenanceCostPerHour,
			status: "available", // Valor padrão
			location: values.location,
			maxWidth: values.maxWidth,
			maxHeight: values.maxHeight,
			maxThickness: values.maxThickness,
			tags: values.tags,
			// Campos de depreciação
			acquisitionValue: values.acquisitionValue,
			residualValue: values.residualValue,
			depreciationMethod: values.depreciationMethod,
			usefulLifeHours: values.usefulLifeHours,
			usefulLifeYears: values.usefulLifeYears,
			// Corrigir consumables: converter object para array vazio se necessário
			consumables: values.consumables && typeof values.consumables === 'object' && !Array.isArray(values.consumables) 
				? [] 
				: values.consumables,
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

		// TEMPORARIAMENTE REMOVENDO PASSES PARA TESTAR
		console.log("🚫 TEMPORARIAMENTE IGNORANDO PASSES PARA TESTE");
		// if (values.passes && Object.keys(values.passes).length > 0) {
		//   formData.passes = cleanedPasses;
		// }

		console.log("📤 Dados sendo enviados para API:");
		console.log("passes completo:", JSON.stringify(formData.passes, null, 2));
		console.log("consumables:", JSON.stringify(formData.consumables, null, 2));
		console.log("manualUrl:", JSON.stringify(formData.manualUrl, null, 2));
		console.log("formData completo:", JSON.stringify(formData, null, 2));

		// Medida de segurança: se passes ainda tem problemas, removê-las
		try {
			JSON.stringify(formData.passes);
		} catch (error) {
			console.warn("⚠️ Problema com passes, removendo do envio:", error);
			formData.passes = undefined;
		}

		onSubmit(formData);
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
						onClick={form.handleSubmit(handleSubmit)}
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
