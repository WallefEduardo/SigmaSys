"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import type { ClientFormData } from "@/lib/types/shared";
import { ClientForm } from "../../components/client-form";

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
					<div className="h-8 w-64 rounded bg-muted" />
					<div className="h-96 rounded bg-muted" />
				</div>
			</div>
		);
	}

	if (!client) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="font-semibold text-destructive text-lg">
					Cliente não encontrado
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Editar Cliente</h1>
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
