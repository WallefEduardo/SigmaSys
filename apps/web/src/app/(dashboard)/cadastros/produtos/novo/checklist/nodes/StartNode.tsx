import React from 'react';
import { Handle, Position } from 'reactflow';
import { PlayCircle } from 'lucide-react';

interface StartNodeProps {
  data: {
    label: string;
  };
}

export default function StartNode({ data }: StartNodeProps) {
  return (
    <div className="react-flow__node-start">
      <div className="flex items-center justify-center gap-2">
        <PlayCircle className="h-5 w-5" />
        <span>{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}