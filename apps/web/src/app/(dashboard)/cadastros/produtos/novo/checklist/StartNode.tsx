import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

interface StartNodeProps {
  data: {
    label?: string;
  };
}

export default React.memo(function StartNode({ data }: StartNodeProps) {
  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg px-6 py-3 shadow-lg min-w-[120px] text-center">
      <div className="flex items-center justify-center gap-2">
        <Play className="h-5 w-5" />
        <span className="font-semibold text-sm">{data.label || 'Início'}</span>
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3"
      />
    </div>
  );
});