"use client";

import { AlertTriangle, Calculator, Info, TrendingDown } from "lucide-react";
import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type EquipmentFormData,
	validateDepreciation,
} from "../equipment-form-types";

interface DepreciationTabProps {
	form: UseFormReturn<EquipmentFormData>;
}

export function DepreciationTab({ form }: DepreciationTabProps) {
	const {
		register,
		setValue,
		watch,
		formState: { errors },
	} = form;

	const watchedValues = {
		acquisitionValue: watch("acquisitionValue"),
		residualValue: watch("residualValue"),
		depreciationMethod: watch("depreciationMethod"),
		usefulLifeHours: watch("usefulLifeHours"),
		usefulLifeYears: watch("usefulLifeYears"),
	};

	// Calcular valores de depreciação em tempo real
	const calculateDepreciation = React.useMemo(() => {
		if (!watchedValues.acquisitionValue || !watchedValues.residualValue) {
			return null;
		}

		const depreciableValue =
			watchedValues.acquisitionValue - watchedValues.residualValue;
		let annualDepreciation = 0;
		let hourlyDepreciation = 0;

		if (watchedValues.usefulLifeYears) {
			annualDepreciation = depreciableValue / watchedValues.usefulLifeYears;
		}

		if (watchedValues.usefulLifeHours) {
			hourlyDepreciation = depreciableValue / watchedValues.usefulLifeHours;
		}

		return {
			depreciableValue,
			annualDepreciation,
			hourlyDepreciation,
			depreciationRate:
				watchedValues.acquisitionValue > 0
					? (depreciableValue / watchedValues.acquisitionValue) * 100
					: 0,
		};
	}, [watchedValues]);

	// Validar consistência dos dados
	const validationErrors = React.useMemo(() => {
		return validateDepreciation(watchedValues);
	}, [watchedValues]);

	const depreciationMethods = [
		{
			value: "linear",
			label: "Linear (Uniforme)",
			description: "Depreciação constante ao longo do tempo",
		},
		{
			value: "accelerated",
			label: "Acelerada",
			description: "Maior depreciação nos primeiros anos",
		},
	];

	return (
		<div className="space-y-6">
			{/* Validação */}
			{validationErrors.length > 0 && (
				<Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-2">
							<AlertTriangle className="h-4 w-4 text-yellow-600" />
							<CardTitle className="text-sm text-yellow-800 dark:text-yellow-300">
								Atenção aos Dados de Depreciação
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="pt-0">
						<ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
							{validationErrors.map((error, index) => (
								<li key={index} className="flex items-center gap-2">
									<div className="h-1 w-1 rounded-full bg-current" />
									{error}
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Valores Base */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Calculator className="h-4 w-4" />
							Valores Base
						</CardTitle>
						<CardDescription>
							Configure os valores iniciais para o cálculo de depreciação
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="acquisitionValue">Valor de Aquisição</Label>
							<CurrencyInput
								id="acquisitionValue"
								placeholder="R$ 0,00"
								value={watchedValues.acquisitionValue || 0}
								onChange={(value) => setValue("acquisitionValue", value)}
							/>
							{errors.acquisitionValue && (
								<p className="text-destructive text-sm">
									{errors.acquisitionValue.message}
								</p>
							)}
							<p className="text-muted-foreground text-xs">
								Valor total pago pelo equipamento (incluindo instalação)
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="residualValue">Valor Residual</Label>
							<CurrencyInput
								id="residualValue"
								placeholder="R$ 0,00"
								value={watchedValues.residualValue || 0}
								onChange={(value) => setValue("residualValue", value)}
							/>
							{errors.residualValue && (
								<p className="text-destructive text-sm">
									{errors.residualValue.message}
								</p>
							)}
							<p className="text-muted-foreground text-xs">
								Valor estimado do equipamento ao final da vida útil
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="depreciationMethod">Método de Depreciação</Label>
							<Select
								value={watchedValues.depreciationMethod}
								onValueChange={(value) =>
									setValue(
										"depreciationMethod",
										value as "linear" | "accelerated",
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecione o método" />
								</SelectTrigger>
								<SelectContent>
									{depreciationMethods.map((method) => (
										<SelectItem key={method.value} value={method.value}>
											<div>
												<div>{method.label}</div>
												<div className="text-muted-foreground text-xs">
													{method.description}
												</div>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.depreciationMethod && (
								<p className="text-destructive text-sm">
									{errors.depreciationMethod.message}
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Vida Útil */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<TrendingDown className="h-4 w-4" />
							Vida Útil
						</CardTitle>
						<CardDescription>
							Defina a vida útil esperada do equipamento
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="usefulLifeYears">Vida Útil (Anos)</Label>
							<Input
								id="usefulLifeYears"
								type="number"
								placeholder="Ex: 10"
								min="1"
								max="50"
								{...register("usefulLifeYears", { valueAsNumber: true })}
							/>
							{errors.usefulLifeYears && (
								<p className="text-destructive text-sm">
									{errors.usefulLifeYears.message}
								</p>
							)}
							<p className="text-muted-foreground text-xs">
								Tempo esperado de uso em anos
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="usefulLifeHours">Vida Útil (Horas)</Label>
							<Input
								id="usefulLifeHours"
								type="number"
								placeholder="Ex: 20000"
								min="1"
								{...register("usefulLifeHours", { valueAsNumber: true })}
							/>
							{errors.usefulLifeHours && (
								<p className="text-destructive text-sm">
									{errors.usefulLifeHours.message}
								</p>
							)}
							<p className="text-muted-foreground text-xs">
								Total de horas de operação esperadas
							</p>
						</div>

						{/* Indicador de consistência */}
						{watchedValues.usefulLifeHours && watchedValues.usefulLifeYears && (
							<div className="rounded-md bg-muted p-3">
								<div className="flex items-center gap-2 text-sm">
									<Info className="h-4 w-4" />
									<span className="font-medium">Análise de Consistência:</span>
								</div>
								<div className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
									<span>
										{Math.round(
											watchedValues.usefulLifeHours /
												watchedValues.usefulLifeYears,
										)}
										{" horas/ano "}
									</span>
									<Badge
										variant={
											Math.abs(
												watchedValues.usefulLifeHours /
													watchedValues.usefulLifeYears -
													2000,
											) < 500
												? "default"
												: "secondary"
										}
									>
										{Math.abs(
											watchedValues.usefulLifeHours /
												watchedValues.usefulLifeYears -
												2000,
										) < 500
											? "Consistente"
											: "Verificar"}
									</Badge>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Cálculos em Tempo Real */}
			{calculateDepreciation && (
				<Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base text-green-800 dark:text-green-300">
							<Calculator className="h-4 w-4" />
							Cálculos de Depreciação
						</CardTitle>
						<CardDescription className="text-green-600 dark:text-green-400">
							Valores calculados automaticamente com base nos dados informados
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="font-medium text-sm">
										Valor Depreciável:
									</span>
									<span className="text-sm">
										{new Intl.NumberFormat("pt-BR", {
											style: "currency",
											currency: "BRL",
										}).format(calculateDepreciation.depreciableValue)}
									</span>
								</div>

								<div className="flex justify-between">
									<span className="font-medium text-sm">
										Taxa de Depreciação:
									</span>
									<span className="text-sm">
										{calculateDepreciation.depreciationRate.toFixed(1)}%
									</span>
								</div>
							</div>

							<div className="space-y-3">
								{calculateDepreciation.annualDepreciation > 0 && (
									<div className="flex justify-between">
										<span className="font-medium text-sm">
											Depreciação Anual:
										</span>
										<span className="text-sm">
											{new Intl.NumberFormat("pt-BR", {
												style: "currency",
												currency: "BRL",
											}).format(calculateDepreciation.annualDepreciation)}
										</span>
									</div>
								)}

								{calculateDepreciation.hourlyDepreciation > 0 && (
									<div className="flex justify-between">
										<span className="font-medium text-sm">
											Depreciação/Hora:
										</span>
										<span className="font-mono text-sm">
											{new Intl.NumberFormat("pt-BR", {
												style: "currency",
												currency: "BRL",
											}).format(calculateDepreciation.hourlyDepreciation)}
										</span>
									</div>
								)}
							</div>
						</div>

						{calculateDepreciation.hourlyDepreciation > 0 && (
							<div className="mt-4 rounded border bg-white p-3 dark:bg-gray-800">
								<div className="flex items-center gap-2 font-medium text-green-700 text-sm dark:text-green-300">
									<Info className="h-4 w-4" />
									Impacto no Custo/Hora
								</div>
								<p className="mt-1 text-muted-foreground text-sm">
									Este valor será automaticamente adicionado ao custo
									operacional do equipamento
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Informações Adicionais */}
			<Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-300">
						<Info className="h-4 w-4" />
						Informações sobre Depreciação
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-blue-700 text-sm dark:text-blue-400">
					<p>
						<strong>Método Linear:</strong> A depreciação é uniforme durante
						toda a vida útil. Ideal para equipamentos com uso constante.
					</p>
					<p>
						<strong>Método Acelerado:</strong> Maior depreciação nos primeiros
						anos (60% nos primeiros 30% da vida útil). Adequado para
						equipamentos com alta obsolescência tecnológica.
					</p>
					<p>
						<strong>Vida Útil Recomendada:</strong> Impressoras industriais:
						8-12 anos (16.000-24.000h). Equipamentos de usinagem: 15-20 anos
						(30.000-40.000h).
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
