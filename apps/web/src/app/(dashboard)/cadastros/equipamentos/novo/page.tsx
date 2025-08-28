"use client";

import { useRouter } from "next/navigation";
import { EquipmentForm } from "../components/equipment-form";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/trpc";

export default function NovoEquipamentoPage() {
  const router = useRouter();

  // Mutation para criar equipamento
  const createEquipment = api.equipments.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Equipamento criado com sucesso!",
      });
      router.push("/cadastros/equipamentos");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar equipamento",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      await createEquipment.mutateAsync(data);
    } catch (error) {
      // Erro já tratado pelo onError da mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl">Novo Equipamento</h1>
        <p className="text-muted-foreground">
          Configure um novo equipamento com todas as funcionalidades avançadas
        </p>
      </div>

      {/* Formulário com Tabs */}
      <EquipmentForm
        onSubmit={handleSubmit}
        isLoading={createEquipment.isPending}
      />
    </div>
  );
}