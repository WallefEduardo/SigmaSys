"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/trpc";
import { MaterialForm } from "../components/material-form";

export default function NewMaterialPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const { mutateAsync: createMaterial } = api.materials.create.useMutation();

	const handleSubmit = async (data: any) => {
		setIsLoading(true);
		try {
			await createMaterial(data);
			router.push("/cadastros/materias-primas");
		} catch (error) {
			console.error("Erro ao criar material:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl">Nova Matéria-Prima</h1>
				<p className="text-muted-foreground">
					Cadastre uma nova matéria-prima no sistema
				</p>
			</div>

			<MaterialForm onSubmit={handleSubmit} isLoading={isLoading} />
		</div>
	);
}
