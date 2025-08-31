"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, Mail, MapPin, Phone, Plus, Save, Star, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const formSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido").optional().or(z.literal("")),
	phone: z.string().optional(),
	document: z.string().optional(),
	type: z.enum(["person", "company"]),
	status: z.enum(["active", "inactive", "prospect", "lead"]),
	segment: z.string().optional(),
	source: z.string().optional(),
	rating: z.coerce.number().min(0).max(5).optional(),
	creditLimit: z.coerce.number().min(0).optional(),
	paymentTerm: z.coerce.number().min(0).optional(),
	discount: z.coerce.number().min(0).max(100).optional(),
	notes: z.string().optional(),
	birthday: z.string().optional(),
	// Endereço
	address: z.object({
		street: z.string().optional(),
		number: z.string().optional(),
		complement: z.string().optional(),
		neighborhood: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		zipCode: z.string().optional(),
		country: z.string().default("Brasil"),
	}).optional(),
	// Redes sociais
	socialMedia: z.object({
		facebook: z.string().url("URL inválida").optional().or(z.literal("")),
		instagram: z.string().url("URL inválida").optional().or(z.literal("")),
		linkedin: z.string().url("URL inválida").optional().or(z.literal("")),
		twitter: z.string().url("URL inválida").optional().or(z.literal("")),
		website: z.string().url("URL inválida").optional().or(z.literal("")),
	}).optional(),
});

interface ClientFormProps {
	client?: any;
	onSubmit: (data: any) => void;
	isLoading?: boolean;
}

export function ClientForm({ client, onSubmit, isLoading }: ClientFormProps) {
	const router = useRouter();
	const [tags, setTags] = useState<string[]>(client?.tags || []);
	const [newTag, setNewTag] = useState("");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: client?.name ?? "",
			email: client?.email ?? "",
			phone: client?.phone ?? "",
			document: client?.document ?? "",
			type: client?.type ?? "person",
			status: client?.status ?? "active",
			segment: client?.segment ?? "",
			source: client?.source ?? "",
			rating: client?.rating ?? 0,
			creditLimit: client?.creditLimit ?? 0,
			paymentTerm: client?.paymentTerm ?? 0,
			discount: client?.discount ?? 0,
			notes: client?.notes ?? "",
			birthday: client?.birthday ? new Date(client.birthday).toISOString().split('T')[0] : "",
			address: {
				street: client?.address?.street ?? "",
				number: client?.address?.number ?? "",
				complement: client?.address?.complement ?? "",
				neighborhood: client?.address?.neighborhood ?? "",
				city: client?.address?.city ?? "",
				state: client?.address?.state ?? "",
				zipCode: client?.address?.zipCode ?? "",
				country: client?.address?.country ?? "Brasil",
			},
			socialMedia: {
				facebook: client?.socialMedia?.facebook ?? "",
				instagram: client?.socialMedia?.instagram ?? "",
				linkedin: client?.socialMedia?.linkedin ?? "",
				twitter: client?.socialMedia?.twitter ?? "",
				website: client?.socialMedia?.website ?? "",
			},
		},
	});

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		const formData = {
			...values,
			tags,
			// Converter strings vazias para undefined
			email: values.email || undefined,
			phone: values.phone || undefined,
			document: values.document || undefined,
			segment: values.segment || undefined,
			source: values.source || undefined,
			notes: values.notes || undefined,
			rating: values.rating && values.rating > 0 ? values.rating : undefined,
			creditLimit: values.creditLimit && values.creditLimit > 0 ? values.creditLimit : undefined,
			paymentTerm: values.paymentTerm && values.paymentTerm > 0 ? values.paymentTerm : undefined,
			discount: values.discount && values.discount > 0 ? values.discount : undefined,
			// Converter data para ISO datetime se preenchida
			birthday: values.birthday ? new Date(values.birthday + "T00:00:00.000Z").toISOString() : undefined,
			// Limpar endereço se todos os campos estiverem vazios
			address: Object.values(values.address || {}).some(v => v && v.trim()) 
				? values.address 
				: undefined,
			// Limpar redes sociais se todos os campos estiverem vazios
			socialMedia: Object.values(values.socialMedia || {}).some(v => v && v.trim()) 
				? values.socialMedia 
				: undefined,
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

	const clientType = form.watch("type");

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
								<CardTitle className="flex items-center gap-2">
									{clientType === "company" ? (
										<Building2 className="h-5 w-5" />
									) : (
										<User className="h-5 w-5" />
									)}
									Informações Básicas
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem className="md:col-span-2">
												<FormLabel>Nome *</FormLabel>
												<FormControl>
													<Input
														placeholder={clientType === "company" ? "Ex: Empresa XYZ Ltda" : "Ex: João da Silva"}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="type"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Tipo *</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione o tipo" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="person">Pessoa Física</SelectItem>
														<SelectItem value="company">Pessoa Jurídica</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="status"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Status *</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione o status" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="active">Ativo</SelectItem>
														<SelectItem value="inactive">Inativo</SelectItem>
														<SelectItem value="prospect">Prospect</SelectItem>
														<SelectItem value="lead">Lead</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														type="email"
														placeholder="email@exemplo.com"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="phone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Telefone</FormLabel>
												<FormControl>
													<Input
														placeholder="(11) 99999-9999"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="document"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{clientType === "company" ? "CNPJ" : "CPF"}
												</FormLabel>
												<FormControl>
													<Input
														placeholder={
															clientType === "company" 
																? "00.000.000/0001-00" 
																: "000.000.000-00"
														}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{clientType === "person" && (
										<FormField
											control={form.control}
											name="birthday"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Data de Nascimento</FormLabel>
													<FormControl>
														<Input
															type="date"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}

									<FormField
										control={form.control}
										name="segment"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Segmento</FormLabel>
												<FormControl>
													<Input
														placeholder="Ex: Varejo, Atacado, Serviços"
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
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Observações</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Informações adicionais sobre o cliente..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Informações Comerciais */}
						<Card>
							<CardHeader>
								<CardTitle>Informações Comerciais</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="rating"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Avaliação</FormLabel>
											<Select 
												onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
												defaultValue={field.value?.toString()}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Avaliar cliente" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="1">⭐ 1 - Ruim</SelectItem>
													<SelectItem value="2">⭐⭐ 2 - Regular</SelectItem>
													<SelectItem value="3">⭐⭐⭐ 3 - Bom</SelectItem>
													<SelectItem value="4">⭐⭐⭐⭐ 4 - Muito Bom</SelectItem>
													<SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Excelente</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="source"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Origem</FormLabel>
											<FormControl>
												<Input
													placeholder="Ex: Indicação, Google, Redes Sociais"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="creditLimit"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Limite de Crédito</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0,00"
													{...field}
													onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
												/>
											</FormControl>
											<FormDescription>Limite em reais (R$)</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="paymentTerm"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Prazo de Pagamento</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="30"
													{...field}
													onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
												/>
											</FormControl>
											<FormDescription>Prazo em dias</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="discount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Desconto Padrão</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													max="100"
													placeholder="0"
													{...field}
													onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
												/>
											</FormControl>
											<FormDescription>Desconto em percentual (%)</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Endereço */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MapPin className="h-5 w-5" />
								Endereço
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<FormField
									control={form.control}
									name="address.street"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Logradouro</FormLabel>
											<FormControl>
												<Input placeholder="Rua, Avenida, etc." {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address.number"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Número</FormLabel>
											<FormControl>
												<Input placeholder="123" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address.complement"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Complemento</FormLabel>
											<FormControl>
												<Input placeholder="Apto, Sala, etc." {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address.neighborhood"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Bairro</FormLabel>
											<FormControl>
												<Input placeholder="Centro" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address.city"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Cidade</FormLabel>
											<FormControl>
												<Input placeholder="São Paulo" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address.state"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Estado</FormLabel>
											<FormControl>
												<Input placeholder="SP" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address.zipCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>CEP</FormLabel>
											<FormControl>
												<Input placeholder="00000-000" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address.country"
									render={({ field }) => (
										<FormItem>
											<FormLabel>País</FormLabel>
											<FormControl>
												<Input placeholder="Brasil" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Redes Sociais */}
					<Card>
						<CardHeader>
							<CardTitle>Redes Sociais</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="socialMedia.website"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Website</FormLabel>
											<FormControl>
												<Input placeholder="https://exemplo.com" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="socialMedia.facebook"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Facebook</FormLabel>
											<FormControl>
												<Input placeholder="https://facebook.com/perfil" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="socialMedia.instagram"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Instagram</FormLabel>
											<FormControl>
												<Input placeholder="https://instagram.com/perfil" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="socialMedia.linkedin"
									render={({ field }) => (
										<FormItem>
											<FormLabel>LinkedIn</FormLabel>
											<FormControl>
												<Input placeholder="https://linkedin.com/in/perfil" {...field} />
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
							{isLoading ? "Salvando..." : client ? "Atualizar" : "Salvar"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}