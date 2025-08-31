"use client";

import { Grid, List } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
	view: "card" | "table";
	onViewChange: (view: "card" | "table") => void;
	className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
	return (
		<div className={cn("flex rounded-md border", className)}>
			<Button
				variant={view === "card" ? "default" : "ghost"}
				size="sm"
				onClick={() => onViewChange("card")}
				className="rounded-r-none border-0"
				aria-label="Visualização em cards"
			>
				<Grid className="h-4 w-4" />
			</Button>
			<Button
				variant={view === "table" ? "default" : "ghost"}
				size="sm"
				onClick={() => onViewChange("table")}
				className="rounded-l-none border-0"
				aria-label="Visualização em tabela"
			>
				<List className="h-4 w-4" />
			</Button>
		</div>
	);
}
