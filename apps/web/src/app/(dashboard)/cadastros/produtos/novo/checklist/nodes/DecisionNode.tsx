import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { HelpCircle } from 'lucide-react';

interface DecisionNodeProps {
  data: {
    label: string;
    question: string;
    options: Array<{
      id: string;
      label: string;
      targetNode?: string;
    }>;
    onDecision?: (optionId: string) => void;
  };
}

export default function DecisionNode({ data }: DecisionNodeProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleDecision = (optionId: string) => {
    setSelected(optionId);
    if (data.onDecision) {
      data.onDecision(optionId);
    }
  };

  return (
    <div className="bg-card border-2 border-border rounded-lg p-3 min-w-[240px] max-w-[300px] shadow-lg dark:shadow-gray-800">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-500" />
        <span className="font-medium text-sm text-foreground truncate">{data.label}</span>
      </div>
      
      <div className="text-sm text-muted-foreground mb-3 line-clamp-2">{data.question}</div>
      
      <div className="space-y-1.5">
        {data.options.map((option, index) => (
          <div key={option.id} className="relative">
            <button
              className={`w-full text-left p-2 rounded-md border transition-all text-sm ${
                selected === option.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/20'
                  : 'border-border hover:border-muted-foreground/50 bg-background/50 dark:bg-muted/20'
              }`}
              onClick={() => handleDecision(option.id)}
            >
              <span className="font-medium text-foreground">{option.label}</span>
            </button>
            <Handle
              type="source"
              position={Position.Right}
              id={`decision-${index}`}
              style={{ top: `${70 + index * 44}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}