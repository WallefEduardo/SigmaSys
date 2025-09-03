import React from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle } from 'lucide-react';

interface EndNodeProps {
  data: {
    label: string;
    summary?: {
      materials: string[];
      processes: string[];
      totalCost?: number;
    };
  };
}

export default function EndNode({ data }: EndNodeProps) {
  return (
    <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white rounded-full px-4 py-2 shadow-lg min-w-[120px]">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center justify-center gap-2">
        <CheckCircle className="h-4 w-4" />
        <span className="font-medium text-sm">{data.label}</span>
      </div>
      
      {data.summary && (
        <div className="mt-2 text-xs text-white/90 text-center space-y-0.5">
          <div>Materiais: {data.summary.materials.length}</div>
          <div>Processos: {data.summary.processes.length}</div>
          {data.summary.totalCost && (
            <div>Custo: R$ {data.summary.totalCost.toFixed(2)}</div>
          )}
        </div>
      )}
    </div>
  );
}