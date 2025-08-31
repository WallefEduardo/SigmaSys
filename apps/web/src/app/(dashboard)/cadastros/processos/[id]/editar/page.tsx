"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import { ProcessForm } from "../../components/process-form";

export default function EditarProcessoPage() {
	const router = useRouter();
	const params = useParams();
	const processId = params.id as string;

	const { 
		data: process, 
		isLoading, 
		error 
	} = api.processes.getById.useQuery({ id: processId });

	const updateProcess = api.processes.update.useMutation({
		onSuccess: (updatedProcess) => {
			toast.success("Processo atualizado com sucesso!");
			router.push(`/cadastros/processos/${updatedProcess.id}`);
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar processo: ${error.message}`);
		},
	});

	const handleSubmit = async (data: any) => {
		await updateProcess.mutateAsync({
			id: processId,
			...data,
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-32 items-center justify-center">
				<div className="animate-pulse space-y-4">
					<div className="h-4 w-32 rounded bg-muted" />
					<div className="h-4 w-48 rounded bg-muted" />
				</div>
			</div>
		);
	}

	if (error || !process) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						Processo não encontrado
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						{error?.message || "O processo solicitado não existe ou foi removido"}
					</p>
					<div className="mt-4 flex gap-2">
						<button 
							onClick={() => router.back()}
							className="px-4 py-2 border rounded hover:bg-gray-50"
						>
							Voltar
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<ProcessForm 
			process={process}
			onSubmit={handleSubmit} 
			isLoading={updateProcess.isPending}
		/>
	);
}