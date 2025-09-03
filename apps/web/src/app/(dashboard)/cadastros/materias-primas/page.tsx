"use client";

import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";

export default function MateriasPage() {
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		code: "",
		category: "",
		unit: "",
		cost: "",
		supplier: "",
		minStock: ""
	});

	// QUERY SIMPLES - sem cache complexo
	const { 
		data: materialsData, 
		isLoading, 
		refetch 
	} = api.materials.list.useQuery({
		search: search || undefined
	});



	// MUTATION SIMPLES - sem cache management
	const utils = api.useUtils();
	const createMutation = api.materials.create.useMutation({
		onSuccess: (data) => {
			console.log("Material created successfully:", data);
			refetch(); // SIMPLES: só recarregar
			setShowForm(false);
			setFormData({ 
				name: "", 
				description: "", 
				code: "", 
				category: "", 
				unit: "", 
				cost: "", 
				supplier: "", 
				minStock: ""
			});
			alert("Material criado com sucesso!");
		},
		onError: (error) => {
			console.error("Error creating material:", error);
			let errorMessage = error.message;
			
			// Tratar erro de código duplicado
			if (error.message.includes("Unique constraint failed") && error.message.includes("code")) {
				errorMessage = "Já existe um material com este código. Use um código diferente ou deixe em branco para gerar automaticamente.";
			}
			
			alert(`Erro ao criar material: ${errorMessage}`);
		}
	});

	const deleteMutation = api.materials.delete.useMutation({
		onSuccess: () => {
			refetch(); // SIMPLES: só recarregar
		}
	});

	const materials = materialsData?.materials || [];

	const getUnitName = (unit: string) => {
		switch (unit) {
			case "m2": return "Metro Quadrado (m²)";
			case "ml": return "Metro Linear (ml)";
			case "un": return "Unidade (un)";
			default: return unit;
		}
	};


	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		console.log("Form submitted with data:", formData);
		
		// Validações
		if (!formData.name.trim()) {
			alert("Nome do material é obrigatório");
			return;
		}
		
		if (!formData.unit) {
			alert("Selecione uma unidade");
			return;
		}
		
		if (!formData.cost || isNaN(parseFloat(formData.cost))) {
			alert("Custo é obrigatório e deve ser um número válido");
			return;
		}

		const dataToSend = {
			name: formData.name.trim(),
			description: formData.description?.trim() || undefined,
			code: formData.code?.trim() || undefined,
			category: formData.category?.trim() || undefined,
			unit: formData.unit as "m2" | "ml" | "un",
			cost: parseFloat(formData.cost),
			supplier: formData.supplier?.trim() || undefined,
			minStock: formData.minStock ? parseFloat(formData.minStock) : undefined,
		};
		
		console.log("Sending data to API:", dataToSend);
		createMutation.mutate(dataToSend);
	};

	const handleDelete = (id: string) => {
		if (confirm("Deletar material?")) {
			deleteMutation.mutate({ id });
		}
	};

	if (isLoading) {
		return <div className="p-6">Carregando...</div>;
	}

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Matérias-Primas</h1>
					<p className="text-muted-foreground">Gerencie seus materiais</p>
				</div>
				<Button onClick={() => setShowForm(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Novo Material
				</Button>
			</div>

			{/* Busca */}
			<div className="flex items-center space-x-2">
				<Search className="h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Buscar materiais..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-sm"
				/>
			</div>

			{/* Formulário */}
			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>Novo Material</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<Input
								placeholder="Nome do material *"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								required
							/>
							
							<Textarea
								placeholder="Descrição do material"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								rows={2}
							/>
							
							<div>
								<Input
									placeholder="Código do material (opcional)"
									value={formData.code}
									onChange={(e) => setFormData({ ...formData, code: e.target.value })}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Deixe em branco para gerar automaticamente (MAT-001, MAT-002...)
								</p>
							</div>
							
							<Input
								placeholder="Categoria"
								value={formData.category}
								onChange={(e) => setFormData({ ...formData, category: e.target.value })}
							/>
							
							<Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
								<SelectTrigger>
									<SelectValue placeholder="Selecione a unidade *" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="m2">Metro Quadrado (m²)</SelectItem>
									<SelectItem value="ml">Metro Linear (ml)</SelectItem>
									<SelectItem value="un">Unidade (un)</SelectItem>
								</SelectContent>
							</Select>
							
							<Input
								placeholder="Custo por unidade *"
								type="number"
								step="0.01"
								value={formData.cost}
								onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
								required
							/>
							
							<Input
								placeholder="Fornecedor"
								value={formData.supplier}
								onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
							/>
							
							<Input
								placeholder="Estoque mínimo"
								type="number"
								step="0.01"
								value={formData.minStock}
								onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
							/>
							
							<div className="flex space-x-2">
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending ? "Salvando..." : "Salvar"}
								</Button>
								<Button type="button" variant="outline" onClick={() => setShowForm(false)}>
									Cancelar
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{/* Lista */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{materials.map((material) => (
					<Card key={material.id}>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								{material.name}
								<Button
									size="sm"
									variant="destructive"
									onClick={() => handleDelete(material.id)}
									disabled={deleteMutation.isPending}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2 text-sm">
								{material.description && (
									<div>
										<strong>Descrição:</strong> {material.description}
									</div>
								)}
								{material.code && (
									<div>
										<strong>Código:</strong> {material.code}
									</div>
								)}
								{material.category && (
									<div>
										<strong>Categoria:</strong> {material.category}
									</div>
								)}
								
								<div>
									<strong>Unidade:</strong> {getUnitName(material.unit)}
								</div>
								
								<div>
									<strong>Custo:</strong> R$ {Number(material.cost).toFixed(2)}
								</div>
								{material.supplier && (
									<div>
										<strong>Fornecedor:</strong> {material.supplier}
									</div>
								)}
								{material.minStock && (
									<div>
										<strong>Estoque Mín.:</strong> {Number(material.minStock).toFixed(2)}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{materials.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">Nenhum material encontrado</p>
				</div>
			)}
		</div>
	);
}