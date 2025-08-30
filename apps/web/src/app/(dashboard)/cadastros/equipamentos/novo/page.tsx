"use client";

import { useRouter } from "next/navigation";
import { EquipmentForm } from "../components/equipment-form";
import { toast } from "@/hooks/use-toast";
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
        console.log(`Conflita com: ${conflictWith?.name} (ID: ${conflictWith?.id})`);
      } else {
        // Erro genérico
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar equipamento",
          variant: "destructive",
        });
      }
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