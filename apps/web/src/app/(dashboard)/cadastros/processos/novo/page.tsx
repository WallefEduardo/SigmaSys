"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import { ProcessForm } from "../components/process-form";

export default function NovoProcessoPage() {
	const router = useRouter();

	const createProcess = api.processes.create.useMutation({
		onSuccess: (process) => {
			toast.success("Processo criado com sucesso!");
			router.push(`/cadastros/processos/${process.id}`);
		},
		onError: (error) => {
			toast.error(`Erro ao criar processo: ${error.message}`);
		},
	});

	const handleSubmit = async (data: any) => {
		await createProcess.mutateAsync(data);
	};

	return (
		<ProcessForm 
			onSubmit={handleSubmit} 
			isLoading={createProcess.isPending}
		/>
	);
}