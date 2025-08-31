"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import { ClientForm } from "../../components/client-form";
import type { ClientFormData } from "@/lib/types/shared";

export default function EditarClientePage() {
	const params = useParams();
	const router = useRouter();
	const clientId = params.id as string;

	const { data: client, isLoading } = api.clients.getById.useQuery({
		id: clientId,
	});

	const updateClient = api.clients.update.useMutation({
		onSuccess: () => {
			toast.success("Cliente atualizado com sucesso!");
			router.push(`/cadastros/clientes/${clientId}`);
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar cliente: ${error.message}`);
		},
	});

	const handleSubmit = async (data: ClientFormData) => {
		await updateClient.mutateAsync({
			id: clientId,
			...data,
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 w-64 bg-muted rounded" />
					<div className="h-96 bg-muted rounded" />
				</div>
			</div>
		);
	}

	if (!client) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-lg font-semibold text-destructive">Cliente não encontrado</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Editar Cliente</h1>
					<p className="text-muted-foreground">
						Atualize as informações de {client.name}
					</p>
				</div>
			</div>

			<ClientForm 
				client={client}
				onSubmit={handleSubmit}
				isLoading={updateClient.isPending}
			/>
		</div>
	);
}