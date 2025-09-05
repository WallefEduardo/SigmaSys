"use client";

import { Calculator, Ruler } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MeasurementData {
	largura?: number;
	altura?: number;
	espessura?: number;
	comprimento?: number;
	area?: number;
	perimetro?: number;
	volume?: number;
	peso?: number;
	quantidade?: number;
	[key: string]: number | undefined;
}

interface MeasurementCollectorProps {
	formulaText?: string;
	measurementText?: string;
	onMeasurementsChange: (measurements: MeasurementData) => void;
	requiredVariables?: string[];
}

// Função para extrair variáveis da fórmula
const extractVariablesFromFormula = (formula: string): string[] => {
	if (!formula) return [];

	// Regex para encontrar variáveis (letras seguidas de letras/números/underscore)
	const matches = formula.match(/\b[a-zA-Z][a-zA-Z0-9_]*\b/g) || [];

	// Filtrar palavras reservadas matemáticas
	const reservedWords = [
		"sin",
		"cos",
		"tan",
		"log",
		"ln",
		"sqrt",
		"abs",
		"min",
		"max",
		"floor",
		"ceil",
		"round",
		"pi",
		"e",
	];

	return matches.filter(
		(match) => !reservedWords.includes(match.toLowerCase()),
	);
};

// Mapear variáveis comuns para labels em português
const getVariableLabel = (variable: string): string => {
	const labelMap: { [key: string]: string } = {
		largura: "Largura (m)",
		altura: "Altura (m)",
		espessura: "Espessura (mm)",
		comprimento: "Comprimento (m)",
		area: "Área (m²)",
		perimetro: "Perímetro (m)",
		volume: "Volume (m³)",
		peso: "Peso (kg)",
		quantidade: "Quantidade (un)",
		l: "Largura (m)",
		h: "Altura (m)",
		w: "Largura (m)",
		c: "Comprimento (m)",
		a: "Área (m²)",
		p: "Perímetro (m)",
		v: "Volume (m³)",
		q: "Quantidade (un)",
	};

	return (
		labelMap[variable.toLowerCase()] ||
		`${variable.charAt(0).toUpperCase() + variable.slice(1)}`
	);
};

const MeasurementCollector: React.FC<MeasurementCollectorProps> = ({
	formulaText,
	measurementText,
	onMeasurementsChange,
	requiredVariables,
}) => {
	const [measurements, setMeasurements] = useState<MeasurementData>({});

	// Determinar quais variáveis coletar
	const variablesToCollect =
		requiredVariables || extractVariablesFromFormula(formulaText || "");

	const handleMeasurementChange = (variable: string, value: string) => {
		const numericValue = Number.parseFloat(value) || undefined;
		const newMeasurements = {
			...measurements,
			[variable]: numericValue,
		};

		setMeasurements(newMeasurements);
		// NÃO chama onMeasurementsChange automaticamente aqui
		// Só vai chamar quando o usuário confirmar
	};

	const handleConfirm = () => {
		// Só confirma se todos os campos obrigatórios estiverem preenchidos
		const allFieldsFilled = variablesToCollect.every(
			(variable) => measurements[variable] && measurements[variable] > 0,
		);

		if (allFieldsFilled) {
			onMeasurementsChange(measurements);
		}
	};

	if (variablesToCollect.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4 rounded-lg border bg-blue-50/50 p-4 dark:bg-blue-950/20">
			<div className="flex items-center gap-2">
				<Ruler className="h-5 w-5 text-blue-600" />
				<h3 className="font-medium text-sm">
					{measurementText || "Informe as medidas necessárias para o cálculo"}
				</h3>
			</div>

			{formulaText && (
				<div className="rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
					<div className="mb-1 flex items-center gap-1">
						<Calculator className="h-3 w-3" />
						<span className="font-medium">Fórmula:</span>
					</div>
					<code className="font-mono">{formulaText}</code>
				</div>
			)}

			<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
				{variablesToCollect.map((variable) => (
					<div key={variable}>
						<Label
							htmlFor={`measure-${variable}`}
							className="font-medium text-xs"
						>
							{getVariableLabel(variable)}
						</Label>
						<Input
							id={`measure-${variable}`}
							type="number"
							step="0.01"
							min="0"
							value={measurements[variable] || ""}
							onChange={(e) =>
								handleMeasurementChange(variable, e.target.value)
							}
							placeholder="0.00"
							className="mt-1 h-8 text-sm"
						/>
					</div>
				))}
			</div>

			<p className="mb-3 text-gray-600 text-xs dark:text-gray-400">
				* Preencha todas as medidas necessárias para o cálculo automático dos
				custos
			</p>

			<div className="flex gap-2 pt-2">
				<Button
					onClick={handleConfirm}
					className="flex-1"
					disabled={
						!variablesToCollect.every(
							(variable) =>
								measurements[variable] && measurements[variable] > 0,
						)
					}
				>
					Confirmar Medidas e Continuar
				</Button>
			</div>
		</div>
	);
};

export default MeasurementCollector;
