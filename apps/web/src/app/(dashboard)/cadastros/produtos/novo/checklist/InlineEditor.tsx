"use client";

import { Check, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface InlineEditorProps {
	value: string;
	isEditing: boolean;
	onSave: (value: string) => void;
	onCancel: () => void;
	multiline?: boolean;
	placeholder?: string;
	className?: string;
}

export default function InlineEditor({
	value,
	isEditing,
	onSave,
	onCancel,
	multiline = false,
	placeholder = "Digite aqui...",
	className = "",
}: InlineEditorProps) {
	const [editValue, setEditValue] = useState(value);
	const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

	useEffect(() => {
		if (isEditing) {
			setEditValue(value);
			// Focus após render
			setTimeout(() => {
				inputRef.current?.focus();
				inputRef.current?.select();
			}, 0);
		}
	}, [isEditing, value]);

	const handleSave = () => {
		if (editValue.trim() !== value) {
			onSave(editValue.trim());
		} else {
			onCancel();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey && !multiline) {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCancel();
		} else if (e.key === "Enter" && e.ctrlKey && multiline) {
			e.preventDefault();
			handleSave();
		}
	};

	if (!isEditing) {
		return (
			<span className={className} onClick={onCancel}>
				{value || placeholder}
			</span>
		);
	}

	return (
		<div className="flex items-center gap-1">
			{multiline ? (
				<textarea
					ref={inputRef as React.RefObject<HTMLTextAreaElement>}
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleSave}
					placeholder={placeholder}
					className={`min-h-[60px] flex-1 resize-none rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none ${className}`}
					rows={2}
				/>
			) : (
				<input
					ref={inputRef as React.RefObject<HTMLInputElement>}
					type="text"
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleSave}
					placeholder={placeholder}
					className={`flex-1 rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none ${className}`}
				/>
			)}
			
			<button
				type="button"
				onClick={handleSave}
				className="flex h-6 w-6 items-center justify-center rounded bg-green-500 text-white hover:bg-green-600"
				title="Salvar (Enter)"
			>
				<Check className="h-3 w-3" />
			</button>
			
			<button
				type="button"
				onClick={onCancel}
				className="flex h-6 w-6 items-center justify-center rounded bg-red-500 text-white hover:bg-red-600"
				title="Cancelar (Esc)"
			>
				<X className="h-3 w-3" />
			</button>
		</div>
	);
}