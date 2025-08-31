"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/trpc";
import { EquipmentForm } from "../../components/equipment-form";

export default function EditarEquipamentoPage() {
	const router = useRouter();
	const params = useParams();
	const equipmentId = params.id as string;

	// Buscar dados do equipamento
	const { data: equipment, isLoading } = api.equipments.getById.useQuery({
		id: equipmentId,
	});

	// Mutation para atualizar equipamento
	const updateEquipment = api.equipments.update.useMutation({
		onSuccess: () => {
			toast({
				title: "Sucesso",
				description: "Equipamento atualizado com sucesso!",
			});
			router.push("/cadastros/equipamentos");
		},
		onError: (error: any) => {
			console.log("Error details:", error);

			// Verificar se é um erro de conflito com informações detalhadas
			if (error.data?.code === "CONFLICT" && error.cause?.field) {
				const { field, value, conflictWith } = error.cause;

				toast({
					title: "Conflito Detectado",
					description: error.message,
					variant: "destructive",
				});

				// TODO: Destacar o campo problemático no formulário
				console.log(`Campo com problema: ${field} = "${value}"`);
				console.log(
					`Conflita com: ${conflictWith?.name} (ID: ${conflictWith?.id})`,
				);
			} else {
				// Erro genérico
				toast({
					title: "Erro",
					description: error.message || "Erro ao atualizar equipamento",
					variant: "destructive",
				});
			}
		},
	});

	const handleSubmit = async (data: any) => {
		console.log("🔄 Iniciando atualização do equipamento...");
		console.log("📋 Dados recebidos do formulário:", data);
		console.log("🆔 ID do equipamento:", equipmentId);
		
		try {
			const result = await updateEquipment.mutateAsync({
				id: equipmentId,
				...data,
			});
			console.log("✅ Equipamento atualizado com sucesso!", result);
		} catch (error) {
			console.error("❌ Erro ao atualizar equipamento:", error);
			// Mostrar erro no toast se não foi mostrado automaticamente
			if (!updateEquipment.isError) {
				toast({
					title: "Erro",
					description: "Erro desconhecido ao atualizar equipamento",
					variant: "destructive",
				});
			}
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="animate-pulse space-y-4">
						<div className="mx-auto h-4 w-32 rounded bg-muted" />
						<div className="mx-auto h-4 w-48 rounded bg-muted" />
					</div>
					<p className="mt-2 text-muted-foreground text-sm">
						Carregando equipamento...
					</p>
				</div>
			</div>
		);
	}

	if (!equipment) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						Equipamento não encontrado
					</p>
					<Button
						onClick={() => router.push("/cadastros/equipamentos")}
						variant="outline"
						className="mt-4"
					>
						Voltar para lista
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="font-bold text-3xl">Editar Equipamento</h1>
				<p className="text-muted-foreground">
					Editando: {equipment.name} - Configure todas as funcionalidades
					avançadas
				</p>
			</div>

			{/* Formulário com Tabs */}
			<EquipmentForm
				equipment={equipment}
				onSubmit={handleSubmit}
				isLoading={updateEquipment.isPending}
			/>
		</div>
	);
}
