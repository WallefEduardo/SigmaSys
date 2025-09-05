"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/trpc";
import { FinishForm } from "../../components/finish-form";

export default function EditarAcabamentoPage() {
	const router = useRouter();
	const params = useParams();
	const finishId = params.id as string;

	const {
		data: finish,
		isLoading,
		error,
	} = api.finishes.getById.useQuery({ id: finishId });

	const updateFinish = api.finishes.update.useMutation({
		onSuccess: (updatedFinish) => {
			toast.success("Acabamento atualizado com sucesso!");
			router.push(`/cadastros/acabamentos/${updatedFinish.id}`);
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar acabamento: ${error.message}`);
		},
	});

	const handleSubmit = async (data: any) => {
		await updateFinish.mutateAsync({
			id: finishId,
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

	if (error || !finish) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<div className="text-center">
					<p className="font-semibold text-destructive text-lg">
						Acabamento não encontrado
					</p>
					<p className="mt-1 text-muted-foreground text-sm">
						{error?.message ||
							"O acabamento solicitado não existe ou foi removido"}
					</p>
					<div className="mt-4 flex gap-2">
						<button
							onClick={() => router.back()}
							className="rounded border px-4 py-2 hover:bg-gray-50"
						>
							Voltar
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<FinishForm
			finish={finish}
			onSubmit={handleSubmit}
			isLoading={updateFinish.isPending}
		/>
	);
}
