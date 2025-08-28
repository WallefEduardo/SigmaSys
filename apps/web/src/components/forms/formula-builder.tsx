"use client";

import { Calculator, Check, Info, Plus, X } from "lucide-react";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getUnitById, mockUnits } from "@/lib/mock-data/units";

interface FormulaBuilderProps {
	value: string;
	onChange: (formula: string) => void;
	targetUnit?: string;
	onTargetUnitChange?: (unit: string) => void;
}

interface ValidationResult {
	valid: boolean;
	error?: string;
	result?: number;
	preview?: string;
}

// Variáveis disponíveis para fórmulas
const availableVariables = [
	{
		name: "largura",
		description: "Largura do produto em metros",
		example: "2.5",
	},
	{
		name: "altura",
		description: "Altura do produto em metros",
		example: "1.8",
	},
	{ name: "quantidade", description: "Quantidade de produtos", example: "10" },
	{ name: "espessura", description: "Espessura em milímetros", example: "3" },
	{
		name: "perimetro",
		description: "Perímetro calculado: 2 * (largura + altura)",
		example: "8.6",
	},
	{
		name: "area",
		description: "Área calculada: largura * altura",
		example: "4.5",
	},
	{
		name: "volume",
		description: "Volume calculado: largura * altura * espessura",
		example: "13.5",
	},
];

// Funções matemáticas disponíveis
const availableFunctions = [
	{
		name: "max",
		description: "Valor máximo entre dois números",
		example: "max(largura, 2)",
	},
	{
		name: "min",
		description: "Valor mínimo entre dois números",
		example: "min(altura, 3)",
	},
	{ name: "round", description: "Arredondamento", example: "round(area, 2)" },
	{
		name: "ceil",
		description: "Arredondamento para cima",
		example: "ceil(largura)",
	},
	{
		name: "floor",
		description: "Arredondamento para baixo",
		example: "floor(altura)",
	},
	{ name: "sqrt", description: "Raiz quadrada", example: "sqrt(area)" },
	{ name: "abs", description: "Valor absoluto", example: "abs(largura - 2)" },
];

// Operadores disponíveis
const availableOperators = [
	{ symbol: "+", description: "Adição" },
	{ symbol: "-", description: "Subtração" },
	{ symbol: "*", description: "Multiplicação" },
	{ symbol: "/", description: "Divisão" },
	{ symbol: "^", description: "Potenciação" },
	{ symbol: "()", description: "Parênteses para agrupamento" },
];

export const FormulaBuilder = React.memo(function FormulaBuilder({
	value,
	onChange,
	targetUnit,
	onTargetUnitChange,
}: FormulaBuilderProps) {
	const [validation, setValidation] = useState<ValidationResult>({
		valid: true,
	});
	const [previewContext, setPreviewContext] = useState({
		largura: 2.0,
		altura: 1.5,
		quantidade: 1,
		espessura: 3,
	});

	// Calcular variáveis derivadas com memoização
	const calculatedContext = useMemo(
		() => ({
			...previewContext,
			perimetro: 2 * (previewContext.largura + previewContext.altura),
			area: previewContext.largura * previewContext.altura,
			volume:
				previewContext.largura *
				previewContext.altura *
				(previewContext.espessura / 1000), // espessura em metros
		}),
		[previewContext],
	);

	// Simular validação de fórmula (em produção seria via API) - memoizada
	const validateFormula = useCallback(
		(formula: string, context: Record<string, number>): ValidationResult => {
			if (!formula.trim()) {
				return { valid: true, preview: "Digite uma fórmula..." };
			}

			try {
				// Substituir variáveis pelos valores do contexto
				let processedFormula = formula;

				Object.entries(context).forEach(([variable, value]) => {
					const regex = new RegExp(`\\b${variable}\\b`, "g");
					processedFormula = processedFormula.replace(regex, value.toString());
				});

				// Simular cálculo (em produção usaria mathjs no backend)
				// Para demonstração, apenas avalia expressões simples
				try {
					const result = Function(
						`"use strict"; return (${processedFormula})`,
					)();

					if (typeof result !== "number" || isNaN(result)) {
						return { valid: false, error: "Resultado não é um número válido" };
					}

					const unit = targetUnit ? getUnitById(targetUnit) : null;
					const preview = `${result.toFixed(4)}${unit ? ` ${unit.symbol}` : ""}`;

					return { valid: true, result, preview };
				} catch (evalError) {
					return { valid: false, error: "Expressão matemática inválida" };
				}
			} catch (error) {
				return { valid: false, error: "Erro na fórmula" };
			}
		},
		[targetUnit],
	);

	useEffect(() => {
		const result = validateFormula(value, calculatedContext);
		setValidation(result);
	}, [value, calculatedContext, targetUnit, validateFormula]);

	const insertVariable = useCallback(
		(variable: string) => {
			const newFormula = value + (value ? " + " : "") + variable;
			onChange(newFormula);
		},
		[value, onChange],
	);

	const insertFunction = useCallback(
		(func: string) => {
			const newFormula = value + (value ? " + " : "") + func + "()";
			onChange(newFormula);
		},
		[value, onChange],
	);

	const insertOperator = useCallback(
		(operator: string) => {
			if (operator === "()") {
				onChange(value + "()");
			} else {
				onChange(value + ` ${operator} `);
			}
		},
		[value, onChange],
	);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calculator className="h-5 w-5" />
						Construtor de Fórmulas
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Editor de Fórmula */}
					<div className="space-y-2">
						<label className="font-medium text-sm">Fórmula</label>
						<Textarea
							value={value}
							onChange={(e) => onChange(e.target.value)}
							placeholder="Digite sua fórmula... Ex: largura * altura * 1.1"
							className="font-mono"
							rows={3}
						/>

						{/* Seletor de Unidade de Resultado */}
						{onTargetUnitChange && (
							<div className="flex items-center gap-2">
								<label className="font-medium text-sm">
									Unidade do resultado:
								</label>
								<Select value={targetUnit} onValueChange={onTargetUnitChange}>
									<SelectTrigger className="w-48">
										<SelectValue placeholder="Selecione a unidade" />
									</SelectTrigger>
									<SelectContent>
										{mockUnits.map((unit) => (
											<SelectItem key={unit.id} value={unit.id}>
												{unit.name} ({unit.symbol})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</div>

					{/* Status de Validação */}
					<div className="flex items-center gap-2">
						{validation.valid ? (
							<div className="flex items-center gap-2 text-green-600">
								<Check className="h-4 w-4" />
								<span className="text-sm">Fórmula válida</span>
							</div>
						) : (
							<div className="flex items-center gap-2 text-red-600">
								<X className="h-4 w-4" />
								<span className="text-sm">{validation.error}</span>
							</div>
						)}

						{validation.preview && (
							<div className="ml-auto">
								<Badge variant="outline" className="font-mono">
									Resultado: {validation.preview}
								</Badge>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Painel de Ajudas */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{/* Variáveis */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Variáveis</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{availableVariables.map((variable) => (
							<TooltipProvider key={variable.name}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="w-full justify-start"
											onClick={() => insertVariable(variable.name)}
										>
											<Plus className="mr-1 h-3 w-3" />
											{variable.name}
										</Button>
									</TooltipTrigger>
									<TooltipContent side="right">
										<div className="max-w-xs">
											<div className="font-medium">{variable.name}</div>
											<div className="text-muted-foreground text-xs">
												{variable.description}
											</div>
											<div className="mt-1 text-xs">
												Exemplo: {variable.example}
											</div>
										</div>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						))}
					</CardContent>
				</Card>

				{/* Funções */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Funções</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{availableFunctions.map((func) => (
							<TooltipProvider key={func.name}>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="w-full justify-start"
											onClick={() => insertFunction(func.name)}
										>
											<Plus className="mr-1 h-3 w-3" />
											{func.name}()
										</Button>
									</TooltipTrigger>
									<TooltipContent side="right">
										<div className="max-w-xs">
											<div className="font-medium">{func.name}()</div>
											<div className="text-muted-foreground text-xs">
												{func.description}
											</div>
											<div className="mt-1 font-mono text-xs">
												{func.example}
											</div>
										</div>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						))}
					</CardContent>
				</Card>

				{/* Operadores */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Operadores</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{availableOperators.map((operator) => (
							<Button
								key={operator.symbol}
								variant="ghost"
								size="sm"
								className="w-full justify-start"
								onClick={() => insertOperator(operator.symbol)}
							>
								<Plus className="mr-1 h-3 w-3" />
								{operator.symbol} - {operator.description}
							</Button>
						))}
					</CardContent>
				</Card>
			</div>

			{/* Preview com Contexto */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Info className="h-4 w-4" />
						Teste da Fórmula
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						{Object.entries(previewContext).map(([key, value]) => (
							<div key={key}>
								<label className="font-medium text-sm capitalize">{key}</label>
								<Input
									type="number"
									step="0.01"
									value={value}
									onChange={(e) =>
										setPreviewContext((prev) => ({
											...prev,
											[key]: Number.parseFloat(e.target.value) || 0,
										}))
									}
								/>
							</div>
						))}
					</div>

					{/* Variáveis Calculadas */}
					<div className="rounded bg-muted/50 p-3">
						<div className="mb-2 font-medium text-sm">
							Variáveis Calculadas:
						</div>
						<div className="grid grid-cols-3 gap-4 text-sm">
							<div>Perímetro: {calculatedContext.perimetro.toFixed(2)} m</div>
							<div>Área: {calculatedContext.area.toFixed(2)} m²</div>
							<div>Volume: {calculatedContext.volume.toFixed(4)} m³</div>
						</div>
					</div>

					{/* Resultado Final */}
					{validation.valid && validation.result !== undefined && (
						<div className="rounded border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
							<div className="flex items-center gap-2">
								<Check className="h-5 w-5 text-green-600" />
								<span className="font-medium text-green-600">
									Resultado da Fórmula:
								</span>
								<span className="font-bold font-mono text-green-700 text-lg dark:text-green-400">
									{validation.preview}
								</span>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
});
