import {
	Cpu,
	Edit3,
	MessageSquare,
	Package,
	Palette,
	Settings,
	Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { Handle, Position } from "reactflow";

interface QuestionNodeProps {
	data: {
		question: string;
		description?: string;
		responseType: "single" | "multiple" | "conditional";
		options: Array<{
			id: string;
			label: string;
			actions: Array<{
				type: string;
				itemName: string;
				quantity?: number;
			}>;
		}>;
		onSelect?: (optionId: string) => void;
		onEdit?: () => void;
		onDelete?: () => void;
	};
}

const actionIcons: Record<string, any> = {
	add_material: Package,
	add_process: Cpu,
	add_equipment: Settings,
	add_finish: Palette,
};

export default React.memo(function QuestionNode({ data }: QuestionNodeProps) {
	const [selected, setSelected] = useState<string[]>([]);

	const handleSelect = (optionId: string) => {
		if (data.responseType === "single") {
			setSelected([optionId]);
		} else if (data.responseType === "multiple") {
			setSelected((prev) =>
				prev.includes(optionId)
					? prev.filter((id) => id !== optionId)
					: [...prev, optionId],
			);
		}

		if (data.onSelect) {
			data.onSelect(optionId);
		}
	};

	return (
		<div className="min-w-[300px] max-w-[350px] rounded-lg border-2 border-blue-400 bg-white p-4 shadow-md">
			{/* 🔵 Handle MAIOR para facilitar conexão */}
			<Handle
				type="target"
				position={Position.Top}
				className="h-6 w-6 border-4 border-white bg-blue-500 shadow-lg transition-colors hover:bg-blue-600"
			/>

			{/* Header */}
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<MessageSquare className="h-5 w-5 flex-shrink-0 text-blue-500" />
					<h3 className="font-semibold text-gray-900 text-sm leading-tight">
						{data.question}
					</h3>
				</div>
				<div className="flex gap-1">
					{data.onEdit && (
						<button
							onClick={data.onEdit}
							className="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-blue-100"
							title="Editar pergunta"
						>
							<Edit3 className="h-4 w-4 text-blue-600 hover:text-blue-700" />
						</button>
					)}
					{data.onDelete && (
						<button
							onClick={data.onDelete}
							className="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-red-100"
							title="Deletar pergunta"
						>
							<Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
						</button>
					)}
				</div>
			</div>

			{/* Description */}
			{data.description && (
				<p className="mb-3 text-gray-600 text-xs">{data.description}</p>
			)}

			{/* Options */}
			<div className="space-y-2">
				{data.options.map((option, index) => (
					<div key={option.id} className="relative">
						<div
							className={`cursor-pointer rounded-md border p-3 transition-colors ${
								selected.includes(option.id)
									? "border-blue-500 bg-blue-50"
									: "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
							}`}
							onClick={() => handleSelect(option.id)}
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="mb-1 font-medium text-gray-900 text-sm">
										{option.label}
									</div>

									{/* Actions preview */}
									{option.actions.length > 0 && (
										<div className="space-y-1">
											{option.actions.slice(0, 2).map((action, i) => {
												const Icon = actionIcons[action.type];
												return (
													<div
														key={i}
														className="flex items-center gap-1.5 text-gray-600 text-xs"
													>
														{Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
														<span className="flex-1">{action.itemName}</span>
														{action.quantity && (
															<span className="text-gray-500">
																x{action.quantity}
															</span>
														)}
													</div>
												);
											})}
											{option.actions.length > 2 && (
												<div className="text-gray-500 text-xs">
													+{option.actions.length - 2} itens
												</div>
											)}
										</div>
									)}
								</div>

								{/* Checkbox for multiple selection */}
								{data.responseType === "multiple" && (
									<div
										className={`mt-1 ml-2 h-4 w-4 flex-shrink-0 rounded border-2 ${
											selected.includes(option.id)
												? "border-blue-500 bg-blue-500"
												: "border-gray-400"
										}`}
									>
										{selected.includes(option.id) && (
											<div className="text-white text-xs leading-none">✓</div>
										)}
									</div>
								)}
							</div>
						</div>

						{/* Conditional handles MAIORES */}
						{data.responseType === "conditional" && (
							<Handle
								type="source"
								position={Position.Right}
								id={`option-${index}`}
								className="h-5 w-5 border-3 border-white bg-green-500 shadow-lg transition-colors hover:bg-green-600"
								style={{
									top: `${30 + index * 50}px`,
									right: "-10px",
								}}
							/>
						)}
					</div>
				))}
			</div>

			{/* Bottom handle MAIOR for non-conditional */}
			{data.responseType !== "conditional" && (
				<Handle
					type="source"
					position={Position.Bottom}
					className="h-6 w-6 border-4 border-white bg-green-500 shadow-lg transition-colors hover:bg-green-600"
				/>
			)}
		</div>
	);
});
