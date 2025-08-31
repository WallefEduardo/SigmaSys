"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Clock, DollarSign, Save, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200, "Nome não pode ter mais que 200 caracteres"),
	description: z.string().optional(),
	costPerHour: z.coerce.number().min(0, "Custo deve ser maior ou igual a zero"),
	sector: z.string().optional(),
	timeUnit: z.string().default("hour"),
	defaultTime: z.coerce.number().min(0).optional(),
});

const sectors = [
	"Impressão",
	"Usinagem", 
	"Metalurgia",
	"Montagem",
	"Acabamento",
	"Pintura",
	"Instalação",
	"Outros"
];

const timeUnits = [
	{ value: "hour", label: "Hora" },
	{ value: "m2", label: "Metro Quadrado (m²)" },
	{ value: "m", label: "Metro Linear (m)" },
	{ value: "L", label: "Litro (L)" },
	{ value: "kg", label: "Quilograma (kg)" },
	{ value: "un", label: "Unidade" },
];

interface ProcessFormProps {
	process?: any;
	onSubmit: (data: any) => void;
	isLoading?: boolean;
}

export function ProcessForm({ process, onSubmit, isLoading }: ProcessFormProps) {
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: process?.name ?? "",
			description: process?.description ?? "",
			costPerHour: process?.costPerHour ?? 0,
			sector: process?.sector ?? "none",
			timeUnit: process?.timeUnit ?? "hour",
			defaultTime: process?.defaultTime ?? 0,
		},
	});

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		const formData = {
			...values,
			// Converter strings vazias para undefined
			description: values.description || undefined,
			sector: values.sector && values.sector !== "none" ? values.sector : undefined,
			defaultTime: values.defaultTime && values.defaultTime > 0 ? values.defaultTime : undefined,
		};

		onSubmit(formData);
	};

	const selectedTimeUnit = timeUnits.find(unit => unit.value === form.watch("timeUnit"));

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
									<Settings className="h-5 w-5" />
									Informações Básicas
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nome do Processo *</FormLabel>
											<FormControl>
												<Input 
													placeholder="Ex: Impressão Digital, Corte a Laser..."
													{...field} 
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Descrição</FormLabel>
											<FormControl>
												<Textarea 
													placeholder="Descreva as características e especificações do processo..."
													rows={3}
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Informações adicionais sobre o processo (opcional)
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="sector"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Setor</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione um setor" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="none">Nenhum setor</SelectItem>
														{sectors.map((sector) => (
															<SelectItem key={sector} value={sector}>
																{sector}
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
										name="timeUnit"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Unidade de Tempo/Medida</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Selecione a unidade" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{timeUnits.map((unit) => (
															<SelectItem key={unit.value} value={unit.value}>
																{unit.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormDescription>
													Como o processo é cobrado (por hora, m², etc.)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Sidebar - Custos e Tempos */}
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<DollarSign className="h-5 w-5" />
										Custos e Tempos
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<FormField
										control={form.control}
										name="costPerHour"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Custo por {selectedTimeUnit?.label || "Unidade"} *</FormLabel>
												<FormControl>
													<div className="relative">
														<span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
														<Input 
															type="number"
															step="0.01"
															min="0"
															placeholder="0,00"
															className="pl-8"
															{...field}
														/>
													</div>
												</FormControl>
												<FormDescription>
													Custo do processo por {selectedTimeUnit?.label?.toLowerCase() || "unidade"}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="defaultTime"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Tempo Padrão {selectedTimeUnit?.value !== 'hour' ? `(por ${selectedTimeUnit?.label})` : ''}
												</FormLabel>
												<FormControl>
													<div className="relative">
														<Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
														<Input 
															type="number"
															step="0.01"
															min="0"
															placeholder="0"
															className="pl-10"
															{...field}
														/>
													</div>
												</FormControl>
												<FormDescription>
													{selectedTimeUnit?.value === 'hour' 
														? "Tempo padrão em horas para este processo (opcional)"
														: `Tempo padrão para processar uma ${selectedTimeUnit?.label?.toLowerCase()} (opcional)`
													}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Preview de custo */}
									{form.watch("costPerHour") > 0 && form.watch("defaultTime") > 0 && (
										<div className="rounded-lg bg-muted/50 p-4">
											<h4 className="font-medium text-sm">Visualização de Custo</h4>
											<div className="mt-2 space-y-1 text-sm">
												<div className="flex justify-between">
													<span className="text-muted-foreground">
														Custo por {selectedTimeUnit?.label?.toLowerCase()}:
													</span>
													<span className="font-medium">
														R$ {form.watch("costPerHour")?.toFixed(2) || "0,00"}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">
														Tempo padrão:
													</span>
													<span className="font-medium">
														{form.watch("defaultTime")} {selectedTimeUnit?.value === 'hour' ? 'h' : selectedTimeUnit?.label}
													</span>
												</div>
												<hr className="my-2" />
												<div className="flex justify-between font-semibold">
													<span>Custo total padrão:</span>
													<span className="text-primary">
														R$ {((form.watch("costPerHour") || 0) * (form.watch("defaultTime") || 0)).toFixed(2)}
													</span>
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>

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
							{isLoading ? "Salvando..." : process ? "Atualizar" : "Salvar"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}