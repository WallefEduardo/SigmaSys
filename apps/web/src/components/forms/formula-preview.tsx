"use client";

import { Calculator, Info, TrendingUp } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getUnitById } from "@/lib/mock-data/units";
import { formatCurrency } from "@/lib/utils/currency";

export interface FormulaPreviewProps {
	formula: string;
	context: Record<string, number>;
	targetUnit?: string;
	showCostBreakdown?: boolean;
	className?: string;
}

interface FormulaResult {
	value: number;
	unit?: string;
	breakdown?: Array<{
		step: string;
		value: number;
		description: string;
	}>;
	variables: Array<{
		name: string;
		value: number;
		unit?: string;
	}>;
}

export function FormulaPreview({
	formula,
	context,
	targetUnit,
	showCostBreakdown = false,
	className,
}: FormulaPreviewProps) {
	const [result, setResult] = React.useState<FormulaResult | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	// Simular cálculo da fórmula
	const calculateFormula = React.useCallback(
		(
			formulaText: string,
			variables: Record<string, number>,
		): FormulaResult | null => {
			try {
				if (!formulaText.trim()) return null;

				// Calcular variáveis derivadas comuns
				const extendedContext = {
					...variables,
					perimetro:
						variables.largura && variables.altura
							? 2 * (variables.largura + variables.altura)
							: 0,
					area:
						variables.largura && variables.altura
							? variables.largura * variables.altura
							: 0,
					volume:
						variables.largura && variables.altura && variables.espessura
							? variables.largura *
								variables.altura *
								(variables.espessura / 1000)
							: 0,
				};

				// Substituir variáveis na fórmula
				let processedFormula = formulaText;
				const usedVariables: Array<{
					name: string;
					value: number;
					unit?: string;
				}> = [];

				Object.entries(extendedContext).forEach(([variable, value]) => {
					const regex = new RegExp(`\\b${variable}\\b`, "g");
					if (regex.test(processedFormula)) {
						processedFormula = processedFormula.replace(
							regex,
							value.toString(),
						);
						usedVariables.push({
							name: variable,
							value,
							unit: getVariableUnit(variable),
						});
					}
				});

				// Simular cálculo (em produção seria via API)
				const calculatedValue = Function(
					`"use strict"; return (${processedFormula})`,
				)();

				if (typeof calculatedValue !== "number" || isNaN(calculatedValue)) {
					throw new Error("Resultado inválido");
				}

				const unit = targetUnit ? getUnitById(targetUnit) : undefined;

				return {
					value: calculatedValue,
					unit: unit?.symbol,
					variables: usedVariables,
					breakdown: generateBreakdown(
						formulaText,
						extendedContext,
						calculatedValue,
					),
				};
			} catch (err) {
				return null;
			}
		},
		[targetUnit],
	);

	// Obter unidade padrão para variáveis
	const getVariableUnit = (variableName: string): string | undefined => {
		const unitMap: Record<string, string> = {
			largura: "m",
			altura: "m",
			comprimento: "m",
			espessura: "mm",
			perimetro: "m",
			area: "m²",
			volume: "m³",
			peso: "kg",
			quantidade: "un",
		};
		return unitMap[variableName];
	};

	// Gerar breakdown dos cálculos
	const generateBreakdown = (
		formulaText: string,
		variables: Record<string, number>,
		finalResult: number,
	): Array<{ step: string; value: number; description: string }> => {
		// Simulação simples de breakdown
		const steps = [];

		// Identificar operações principais
		if (formulaText.includes("*")) {
			steps.push({
				step: "Multiplicação",
				value: finalResult * 0.8,
				description: "Cálculo base da fórmula",
			});
		}

		if (formulaText.includes("+")) {
			steps.push({
				step: "Adição",
				value: finalResult * 0.2,
				description: "Valores adicionais",
			});
		}

		steps.push({
			step: "Total",
			value: finalResult,
			description: "Resultado final da fórmula",
		});

		return steps;
	};

	// Recalcular quando fórmula ou contexto mudarem
	React.useEffect(() => {
		try {
			setError(null);
			const calculatedResult = calculateFormula(formula, context);
			setResult(calculatedResult);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro no cálculo");
			setResult(null);
		}
	}, [formula, context, calculateFormula]);

	if (error) {
		return (
			<Card className={className}>
				<CardContent className="p-4">
					<div className="flex items-center gap-2 text-red-600">
						<Info className="h-4 w-4" />
						<span className="text-sm">{error}</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!result) {
		return (
			<Card className={className}>
				<CardContent className="p-4">
					<div className="flex items-center gap-2 text-muted-foreground">
						<Calculator className="h-4 w-4" />
						<span className="text-sm">
							Digite uma fórmula para ver o resultado
						</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<Calculator className="h-4 w-4" />
					Resultado da Fórmula
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Resultado principal */}
				<div className="flex items-center justify-between rounded-lg border bg-primary/5 p-4">
					<span className="font-medium">Resultado:</span>
					<div className="flex items-center gap-2">
						<span className="font-bold text-2xl">
							{result.value.toFixed(4)}
						</span>
						{result.unit && (
							<Badge variant="outline" className="text-sm">
								{result.unit}
							</Badge>
						)}
					</div>
				</div>

				{/* Variáveis utilizadas */}
				{result.variables.length > 0 && (
					<div className="space-y-2">
						<h4 className="font-medium text-sm">Variáveis Utilizadas:</h4>
						<div className="grid grid-cols-2 gap-2 md:grid-cols-3">
							{result.variables.map((variable, index) => (
								<div
									key={index}
									className="flex items-center justify-between rounded bg-muted/50 p-2 text-sm"
								>
									<span className="font-medium capitalize">
										{variable.name}:
									</span>
									<div className="flex items-center gap-1">
										<span>{variable.value.toFixed(2)}</span>
										{variable.unit && (
											<span className="text-muted-foreground text-xs">
												{variable.unit}
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Breakdown de custos */}
				{showCostBreakdown && result.breakdown && (
					<>
						<Separator />
						<div className="space-y-2">
							<h4 className="flex items-center gap-2 font-medium text-sm">
								<TrendingUp className="h-4 w-4" />
								Breakdown do Cálculo:
							</h4>
							<div className="space-y-1">
								{result.breakdown.map((step, index) => (
									<div
										key={index}
										className="flex items-center justify-between rounded p-2 text-sm"
									>
										<div className="flex flex-col">
											<span className="font-medium">{step.step}</span>
											<span className="text-muted-foreground text-xs">
												{step.description}
											</span>
										</div>
										<span className="font-mono">
											{formatCurrency(step.value)}
										</span>
									</div>
								))}
							</div>
						</div>
					</>
				)}

				{/* Fórmula processada (debug) */}
				{process.env.NODE_ENV === "development" && (
					<details className="text-muted-foreground text-xs">
						<summary className="cursor-pointer">Debug (dev only)</summary>
						<pre className="mt-2 overflow-x-auto rounded bg-muted p-2">
							{JSON.stringify(
								{
									formula,
									context,
									result: result.value,
								},
								null,
								2,
							)}
						</pre>
					</details>
				)}
			</CardContent>
		</Card>
	);
}
