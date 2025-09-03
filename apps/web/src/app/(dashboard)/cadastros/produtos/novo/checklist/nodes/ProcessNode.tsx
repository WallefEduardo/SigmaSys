import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Cpu } from 'lucide-react';

interface ProcessNodeProps {
  data: {
    label: string;
    description?: string;
    options: Array<{
      id: string;
      name: string;
      time?: string;
      cost?: number;
    }>;
    onSelect?: (optionId: string) => void;
  };
}

export default function ProcessNode({ data }: ProcessNodeProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
    if (data.onSelect) {
      data.onSelect(optionId);
    }
  };

  return (
    <div className="bg-card border-2 border-border rounded-lg p-3 min-w-[240px] max-w-[280px] shadow-lg dark:shadow-gray-800">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2 mb-2">
        <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-500" />
        <span className="font-medium text-sm text-foreground truncate">{data.label}</span>
      </div>
      
      {data.description && (
        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{data.description}</div>
      )}
      
      <div className="space-y-1.5">
        {data.options.slice(0, 3).map((option) => (
          <button
            key={option.id}
            className={`w-full text-left p-2 rounded-md border transition-all text-sm ${
              selected === option.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20'
                : 'border-border hover:border-muted-foreground/50 bg-background/50 dark:bg-muted/20'
            }`}
            onClick={() => handleSelect(option.id)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground truncate">{option.name}</span>
              <div className="flex gap-2 text-xs text-muted-foreground flex-shrink-0 ml-2">
                {option.time && <span>{option.time}</span>}
                {option.cost && <span>R$ {option.cost.toFixed(2)}</span>}
              </div>
            </div>
          </button>
        ))}
        {data.options.length > 3 && (
          <div className="text-xs text-muted-foreground text-center py-1">
            +{data.options.length - 3} opções
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}