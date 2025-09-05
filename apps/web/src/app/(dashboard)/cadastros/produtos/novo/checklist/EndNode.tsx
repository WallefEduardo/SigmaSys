import React from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle } from 'lucide-react';

interface EndNodeProps {
  data: {
    label?: string;
  };
}

export default React.memo(function EndNode({ data }: EndNodeProps) {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg px-6 py-3 shadow-lg min-w-[120px] text-center">
      <div className="flex items-center justify-center gap-2">
        <CheckCircle className="h-5 w-5" />
        <span className="font-semibold text-sm">{data.label || 'Fim'}</span>
      </div>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-6 h-6 bg-white border-4 border-purple-500 shadow-lg hover:bg-gray-100 transition-colors"
      />
    </div>
  );
});