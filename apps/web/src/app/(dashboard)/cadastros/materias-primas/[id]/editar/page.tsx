"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { mockMaterials } from "@/lib/mock-data/materials";
import { MaterialForm } from "../../components/material-form";

export default function EditMaterialPage() {
	const params = useParams();
	const router = useRouter();
	const materialId = params.id as string;
	const [isLoading, setIsLoading] = useState(false);

	const material = mockMaterials.find((m) => m.id === materialId);

	if (!material) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" asChild>
						<Link href="/cadastros/materias-primas">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Voltar
						</Link>
					</Button>
				</div>
				<div className="py-12 text-center">
					<div className="mb-4 text-muted-foreground">
						Material não encontrado
					</div>
					<Button asChild variant="outline">
						<Link href="/cadastros/materias-primas">
							Voltar para lista de materiais
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const handleSubmit = async (data: any) => {
		setIsLoading(true);
		try {
			// Simulação de API call
			console.log("Atualizando material:", data);
			await new Promise((resolve) => setTimeout(resolve, 1000));

			router.push(`/cadastros/materias-primas/${materialId}`);
		} catch (error) {
			console.error("Erro ao atualizar material:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl">Editar Matéria-Prima</h1>
				<p className="text-muted-foreground">
					Atualize as informações da matéria-prima
				</p>
			</div>

			<MaterialForm
				material={material}
				onSubmit={handleSubmit}
				isLoading={isLoading}
			/>
		</div>
	);
}
