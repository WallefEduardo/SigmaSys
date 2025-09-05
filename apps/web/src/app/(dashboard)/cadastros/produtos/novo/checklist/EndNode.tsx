import { CheckCircle } from "lucide-react";
import React from "react";
import { Handle, Position } from "reactflow";

interface EndNodeProps {
	data: {
		label?: string;
	};
}

export default React.memo(function EndNode({ data }: EndNodeProps) {
	return (
		<div className="min-w-[120px] rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 text-center text-white shadow-lg">
			<div className="flex items-center justify-center gap-2">
				<CheckCircle className="h-5 w-5" />
				<span className="font-semibold text-sm">{data.label || "Fim"}</span>
			</div>
			<Handle
				type="target"
				position={Position.Top}
				className="h-6 w-6 border-4 border-purple-500 bg-white shadow-lg transition-colors hover:bg-gray-100"
			/>
		</div>
	);
});
