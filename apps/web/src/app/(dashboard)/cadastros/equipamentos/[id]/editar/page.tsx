"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EquipmentForm } from "../../components/equipment-form";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";

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
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar equipamento",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      await updateEquipment.mutateAsync({
        id: equipmentId,
        ...data,
      });
    } catch (error) {
      console.error("Erro ao atualizar equipamento:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
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
          <p className="text-lg font-semibold text-destructive">
            Equipamento não encontrado
          </p>
          <Button onClick={() => router.push("/cadastros/equipamentos")} variant="outline" className="mt-4">
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
          Editando: {equipment.name} - Configure todas as funcionalidades avançadas
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