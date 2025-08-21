"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Funções de máscara
const maskCNPJ = (value: string) => {
	return value
		.replace(/\D/g, "") // Remove tudo que não é dígito
		.replace(/^(\d{2})(\d)/, "$1.$2") // Adiciona ponto após os dois primeiros dígitos
		.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3") // Adiciona ponto após o terceiro grupo
		.replace(/\.(\d{3})(\d)/, ".$1/$2") // Adiciona barra antes dos últimos 4 dígitos
		.replace(/(\d{4})(\d)/, "$1-$2") // Adiciona hífen antes dos dois últimos dígitos
		.substring(0, 18); // Limita o tamanho
};

const maskPhone = (value: string) => {
	return value
		.replace(/\D/g, "") // Remove tudo que não é dígito
		.replace(/^(\d{2})(\d)/, "($1) $2") // Adiciona parênteses e espaço após DDD
		.replace(/(\d{5})(\d{4})$/, "$1-$2") // Adiciona hífen antes dos 4 últimos dígitos
		.substring(0, 15); // Limita o tamanho
};

const maskCEP = (value: string) => {
	return value
		.replace(/\D/g, "") // Remove tudo que não é dígito
		.replace(/^(\d{5})(\d)/, "$1-$2") // Adiciona hífen após os 5 primeiros dígitos
		.substring(0, 9); // Limita o tamanho
};

// Remove máscaras para obter apenas os números
const unmaskValue = (value: string) => {
	return value.replace(/\D/g, "");
};

export interface InputMaskProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	mask?: "cnpj" | "phone" | "cep";
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onValueChange?: (value: string, unmaskedValue: string) => void;
}

const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
	({ className, type, mask, onChange, onValueChange, ...props }, ref) => {
		const applyMask = (value: string) => {
			if (!mask) return value;

			switch (mask) {
				case "cnpj":
					return maskCNPJ(value);
				case "phone":
					return maskPhone(value);
				case "cep":
					return maskCEP(value);
				default:
					return value;
			}
		};

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			const maskedValue = applyMask(event.target.value);
			const unmaskedValue = unmaskValue(maskedValue);

			// Atualiza o valor do input com a máscara
			event.target.value = maskedValue;

			// Chama os callbacks
			onChange?.(event);
			onValueChange?.(maskedValue, unmaskedValue);
		};

		return (
			<Input
				type={type}
				className={cn(className)}
				ref={ref}
				onChange={handleChange}
				{...props}
			/>
		);
	},
);
InputMask.displayName = "InputMask";

export { InputMask, unmaskValue };
