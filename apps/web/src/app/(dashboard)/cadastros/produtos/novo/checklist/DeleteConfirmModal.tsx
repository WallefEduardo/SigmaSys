"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title?: string;
	description?: string;
	isDeleting?: boolean;
}

export default function DeleteConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title = "Deletar Pergunta",
	description = "Tem certeza que deseja deletar esta pergunta? Esta ação não pode ser desfeita.",
	isDeleting = false,
}: DeleteConfirmModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20">
							<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
						</div>
						<div>
							<DialogTitle className="font-semibold text-gray-900 text-lg dark:text-gray-100">
								{title}
							</DialogTitle>
						</div>
					</div>
					<DialogDescription className="mt-2 text-gray-600 text-sm dark:text-gray-400">
						{description}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex gap-2 sm:gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={isDeleting}
						className="flex-1"
					>
						Cancelar
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={onConfirm}
						disabled={isDeleting}
						className="flex-1"
					>
						{isDeleting ? (
							<>
								<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								Deletando...
							</>
						) : (
							<>
								<Trash2 className="mr-2 h-4 w-4" />
								Deletar
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
