"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import type { ClientFormData } from "@/lib/types/shared";
import { ClientForm } from "../components/client-form";

export default function NovoClientePage() {
	const router = useRouter();

	const createClient = api.clients.create.useMutation({
		onSuccess: (client) => {
			toast.success("Cliente criado com sucesso!");
			router.push(`/cadastros/clientes/${client.id}`);
		},
		onError: (error) => {
			toast.error(`Erro ao criar cliente: ${error.message}`);
		},
	});

	const handleSubmit = async (data: ClientFormData) => {
		await createClient.mutateAsync(data);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Novo Cliente</h1>
					<p className="text-muted-foreground">
						Cadastre um novo cliente ou empresa
					</p>
				</div>
			</div>

			<ClientForm onSubmit={handleSubmit} isLoading={createClient.isPending} />
		</div>
	);
}
