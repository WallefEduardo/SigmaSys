"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	getMaterialCategories,
	type Material,
} from "@/lib/mock-data/materials";
import { getUnitsByCategory, mockUnits } from "@/lib/mock-data/units";

const formSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	description: z.string().optional(),
	code: z.string().optional(),
	unit: z.string().min(1, "Unidade é obrigatória"),
	cost: z.string().min(1, "Custo é obrigatório"),
	category: z.string().optional(),
	brand: z.string().optional(),
	color: z.string().optional(),
	supplier: z.string().optional(),
	supplierCode: z.string().optional(),
	minStock: z.string().optional(),
	maxStock: z.string().optional(),
	location: z.string().optional(),
	barcode: z.string().optional(),
	width: z.string().optional(),
	height: z.string().optional(),
	thickness: z.string().optional(),
});

interface MaterialFormProps {
	material?: Material;
	onSubmit: (data: any) => void;
	isLoading?: boolean;
}

export function MaterialForm({
	material,
	onSubmit,
	isLoading,
}: MaterialFormProps) {
	const router = useRouter();
	const [tags, setTags] = useState<string[]>(material?.tags || []);
	const [newTag, setNewTag] = useState("");

	const categories = getMaterialCategories();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: material?.name || "",
			description: material?.description || "",
			code: material?.code || "",
			unit: material?.unit || "",
			cost: material?.cost?.toString() || "",
			category: material?.category || "",
			brand: material?.brand || "",
			color: material?.color || "",
			supplier: material?.supplier || "",
			supplierCode: material?.supplierCode || "",
			minStock: material?.minStock?.toString() || "",
			maxStock: material?.maxStock?.toString() || "",
			location: material?.location || "",
			barcode: material?.barcode || "",
			width: material?.dimensions?.width?.toString() || "",
			height: material?.dimensions?.height?.toString() || "",
			thickness: material?.dimensions?.thickness?.toString() || "",
		},
	});

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		const formData = {
			...values,
			cost: Number.parseFloat(values.cost),
			minStock: values.minStock
				? Number.parseFloat(values.minStock)
				: undefined,
			maxStock: values.maxStock
				? Number.parseFloat(values.maxStock)
				: undefined,
			dimensions: {
				width: values.width ? Number.parseFloat(values.width) : undefined,
				height: values.height ? Number.parseFloat(values.height) : undefined,
				thickness: values.thickness
					? Number.parseFloat(values.thickness)
					: undefined,
			},
			tags,
		};

		onSubmit(formData);
	};

	const addTag = () => {
		if (newTag.trim() && !tags.includes(newTag.trim())) {
			setTags([...tags, newTag.trim()]);
			setNewTag("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						{/* Informações Básicas */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Informações Básicas</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem className="md:col-span-2">
												<FormLabel>Nome da Matéria-Prima *</FormLabel>
												<FormControl>
													<Input
														placeholder="Ex: Vinil Adesivo Branco"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="code"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Código</FormLabel>
												<FormControl>
													<Input placeholder="Ex: VIN-001" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="category"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Categoria</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione uma categoria" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{categories.map((category) => (
															<SelectItem key={category} value={category}>
																{category}
															</SelectItem>
														))}
														<SelectItem value="Vinil">Vinil</SelectItem>
														<SelectItem value="Acrílico">Acrílico</SelectItem>
														<SelectItem value="Tinta">Tinta</SelectItem>
														<SelectItem value="Fixação">Fixação</SelectItem>
														<SelectItem value="Lona">Lona</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Descrição</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Descreva as características do material..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
									<FormField
										control={form.control}
										name="brand"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Marca</FormLabel>
												<FormControl>
													<Input placeholder="Ex: Avery Dennison" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="color"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Cor</FormLabel>
												<FormControl>
													<Input placeholder="Ex: Branco" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="barcode"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Código de Barras</FormLabel>
												<FormControl>
													<Input placeholder="7891234567890" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Preço e Unidade */}
						<Card>
							<CardHeader>
								<CardTitle>Preço e Unidade</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="unit"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Unidade de Medida *</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione a unidade" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{mockUnits.map((unit) => (
														<SelectItem key={unit.id} value={unit.id}>
															{unit.name} ({unit.symbol})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="cost"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Custo *</FormLabel>
											<FormControl>
												<CurrencyInput
													value={
														field.value ? Number.parseFloat(field.value) : 0
													}
													onValueChange={(value) =>
														field.onChange(value.toString())
													}
													placeholder="R$ 0,00"
												/>
											</FormControl>
											<FormDescription>
												Custo por unidade de medida
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						{/* Fornecedor */}
						<Card>
							<CardHeader>
								<CardTitle>Fornecedor</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="supplier"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nome do Fornecedor</FormLabel>
											<FormControl>
												<Input
													placeholder="Ex: Materiais Gráficos LTDA"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="supplierCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Código do Fornecedor</FormLabel>
											<FormControl>
												<Input
													placeholder="Código no catálogo do fornecedor"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Estoque */}
						<Card>
							<CardHeader>
								<CardTitle>Controle de Estoque</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="minStock"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Estoque Mínimo</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="maxStock"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Estoque Máximo</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.01"
														placeholder="0"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="location"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Localização</FormLabel>
											<FormControl>
												<Input
													placeholder="Ex: Estoque A - Prateleira 1"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Dimensões */}
					<Card>
						<CardHeader>
							<CardTitle>Dimensões (Opcional)</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<FormField
									control={form.control}
									name="width"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Largura (m)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0,00"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="height"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Altura (m)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0,00"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="thickness"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Espessura (mm)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0,00"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Tags */}
					<Card>
						<CardHeader>
							<CardTitle>Tags</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex gap-2">
								<Input
									placeholder="Digite uma tag"
									value={newTag}
									onChange={(e) => setNewTag(e.target.value)}
									onKeyPress={(e) =>
										e.key === "Enter" && (e.preventDefault(), addTag())
									}
								/>
								<Button type="button" variant="outline" onClick={addTag}>
									<Plus className="h-4 w-4" />
								</Button>
							</div>

							{tags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{tags.map((tag) => (
										<Badge key={tag} variant="secondary" className="gap-1">
											{tag}
											<button
												type="button"
												onClick={() => removeTag(tag)}
												className="ml-1 hover:text-destructive"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Botões de Ação */}
					<div className="flex justify-end gap-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isLoading}>
							<Save className="mr-2 h-4 w-4" />
							{isLoading ? "Salvando..." : material ? "Atualizar" : "Salvar"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
