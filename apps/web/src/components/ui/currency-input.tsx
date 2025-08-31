"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"onChange" | "value"
	> {
	value?: number;
	onChange?: (value: number | undefined) => void;
	currency?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
	({ className, currency = "BRL", value, onChange, ...props }, ref) => {
		// Filtrar propriedades que não devem ir para o input HTML
		const { onValueChange, ...inputProps } = props as any;
		const [displayValue, setDisplayValue] = React.useState("");

		// Função para formatar valor para exibição
		const formatCurrency = (value: number): string => {
			return new Intl.NumberFormat("pt-BR", {
				style: "currency",
				currency: "BRL",
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(value);
		};

		// Função para converter display para número
		const parseValue = (displayValue: string): number | undefined => {
			const cleanValue = displayValue.replace(/[^\d,]/g, "").replace(",", ".");

			const parsed = Number.parseFloat(cleanValue);
			return isNaN(parsed) ? undefined : parsed;
		};

		// Função para formatar durante a digitação
		const formatDisplay = (rawValue: string): string => {
			// Remove tudo que não é número
			const numbers = rawValue.replace(/\D/g, "");

			if (!numbers) return "";

			// Converte para centavos
			const valueInCents = Number.parseInt(numbers, 10);
			const valueInReais = valueInCents / 100;

			return formatCurrency(valueInReais);
		};

		// Atualiza display quando value prop muda
		React.useEffect(() => {
			if (value !== undefined) {
				setDisplayValue(formatCurrency(value));
			} else {
				setDisplayValue("");
			}
		}, [value]);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const rawValue = e.target.value;
			const formattedValue = formatDisplay(rawValue);

			setDisplayValue(formattedValue);

			// Converte para número e chama onChange
			const numericValue = parseValue(formattedValue);
			onChange?.(numericValue);
		};

		const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			// Permitir apenas números, backspace, delete, tab, escape, enter
			if (
				![8, 9, 27, 13, 46, 110, 190].includes(e.keyCode) &&
				// Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
				(e.keyCode < 65 || e.keyCode > 90 || (!e.ctrlKey && !e.metaKey)) &&
				// Permitir números do teclado principal e numérico
				(e.keyCode < 48 || e.keyCode > 57) &&
				(e.keyCode < 96 || e.keyCode > 105)
			) {
				e.preventDefault();
			}
		};

		return (
			<input
				type="text"
				className={cn(
					"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				value={displayValue}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				placeholder="R$ 0,00"
				{...inputProps}
			/>
		);
	},
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
