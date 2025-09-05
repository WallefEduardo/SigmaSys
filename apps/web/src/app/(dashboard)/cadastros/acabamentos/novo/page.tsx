"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import { FinishForm } from "../components/finish-form";

export default function NovoAcabamentoPage() {
	const router = useRouter();

	const createFinish = api.finishes.create.useMutation({
		onSuccess: (finish) => {
			toast.success("Acabamento criado com sucesso!");
			router.push(`/cadastros/acabamentos/${finish.id}`);
		},
		onError: (error) => {
			toast.error(`Erro ao criar acabamento: ${error.message}`);
		},
	});

	const handleSubmit = async (data: any) => {
		await createFinish.mutateAsync(data);
	};

	return (
		<FinishForm onSubmit={handleSubmit} isLoading={createFinish.isPending} />
	);
}
