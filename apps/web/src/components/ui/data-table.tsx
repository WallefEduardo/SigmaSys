"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface Column<T> {
	key: keyof T | string;
	label: string;
	render?: (value: any, item: T) => React.ReactNode;
	sortable?: boolean;
}

interface DataTableProps<T> {
	data: T[];
	columns: Column<T>[];
	onEdit?: (item: T) => void;
	onView?: (item: T) => void;
	onDelete?: (item: T) => void;
	emptyMessage?: string;
	isDeleting?: boolean;
}

export function DataTable<T extends { id: string }>({
	data,
	columns,
	onEdit,
	onView,
	onDelete,
	emptyMessage = "Nenhum item encontrado",
	isDeleting = false,
}: DataTableProps<T>) {
	const getValue = (item: T, key: string) => {
		return key.split(".").reduce((obj, k) => obj?.[k], item as any);
	};

	if (data.length === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				{emptyMessage}
			</div>
		);
	}

	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((column) => (
							<TableHead key={column.key as string}>{column.label}</TableHead>
						))}
						{(onEdit || onView || onDelete) && <TableHead>Ações</TableHead>}
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((item) => (
						<TableRow key={item.id}>
							{columns.map((column) => (
								<TableCell key={column.key as string}>
									{column.render
										? column.render(getValue(item, column.key as string), item)
										: getValue(item, column.key as string)}
								</TableCell>
							))}
							{(onEdit || onView || onDelete) && (
								<TableCell>
									<div className="flex gap-2">
										{onView && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => onView(item)}
											>
												Ver
											</Button>
										)}
										{onEdit && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => onEdit(item)}
											>
												Editar
											</Button>
										)}
										{onDelete && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => onDelete(item)}
												disabled={isDeleting}
												className="text-destructive hover:text-destructive hover:bg-destructive/10"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
