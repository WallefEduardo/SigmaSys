"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	variant?: "destructive" | "default";
	isLoading?: boolean;
}

export function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title = "Tem certeza?",
	description = "Esta ação não pode ser desfeita.",
	confirmText = "Confirmar",
	cancelText = "Cancelar",
	variant = "destructive",
	isLoading = false,
}: ConfirmDialogProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<div className="flex items-center gap-3">
						{variant === "destructive" ? (
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
								<Trash2 className="h-5 w-5 text-red-600" />
							</div>
						) : (
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
								<AlertTriangle className="h-5 w-5 text-amber-600" />
							</div>
						)}
						<div>
							<AlertDialogTitle>{title}</AlertDialogTitle>
							<AlertDialogDescription className="mt-1">
								{description}
							</AlertDialogDescription>
						</div>
					</div>
				</AlertDialogHeader>
				<AlertDialogFooter>
					{cancelText && (
						<AlertDialogCancel onClick={onClose} disabled={isLoading}>
							{cancelText}
						</AlertDialogCancel>
					)}
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isLoading}
						className={
							variant === "destructive"
								? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
								: ""
						}
					>
						{isLoading && variant === "destructive" && (
							<Trash2 className="mr-2 h-4 w-4 animate-pulse" />
						)}
						{isLoading && variant === "destructive"
							? "Deletando..."
							: confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// Hook para usar o dialog de confirmação
export function useConfirmDialog() {
	const [isOpen, setIsOpen] = React.useState(false);
	const [config, setConfig] = React.useState<Partial<ConfirmDialogProps>>({});

	const confirm = (options: Partial<ConfirmDialogProps> = {}) => {
		return new Promise<boolean>((resolve) => {
			setConfig({
				...options,
				onConfirm: () => {
					setIsOpen(false);
					resolve(true);
				},
				onClose: () => {
					setIsOpen(false);
					resolve(false);
				},
			});
			setIsOpen(true);
		});
	};

	const ConfirmDialogComponent = () => (
		<ConfirmDialog
			isOpen={isOpen}
			onClose={() => setIsOpen(false)}
			onConfirm={() => config.onConfirm?.()}
			{...config}
		/>
	);

	return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
