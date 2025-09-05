import { Play } from "lucide-react";
import React from "react";
import { Handle, Position } from "reactflow";

interface StartNodeProps {
	data: {
		label?: string;
	};
}

export default React.memo(function StartNode({ data }: StartNodeProps) {
	return (
		<div className="min-w-[120px] rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 text-center text-white shadow-lg">
			<div className="flex items-center justify-center gap-2">
				<Play className="h-5 w-5" />
				<span className="font-semibold text-sm">{data.label || "Início"}</span>
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				className="h-6 w-6 border-4 border-green-500 bg-white shadow-lg transition-colors hover:bg-gray-100"
			/>
		</div>
	);
});
