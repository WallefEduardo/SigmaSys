import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, Package, Cpu, Settings, Palette, Cog } from 'lucide-react';

interface QuestionNodeProps {
  data: {
    question: string;
    description?: string;
    responseType: 'single' | 'multiple' | 'conditional';
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
  };
}

const actionIcons: Record<string, any> = {
  add_material: Package,
  add_process: Cpu,
  add_equipment: Settings,
  add_finish: Palette,
};

export default function QuestionNode({ data }: QuestionNodeProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (optionId: string) => {
    if (data.responseType === 'single') {
      setSelected([optionId]);
    } else if (data.responseType === 'multiple') {
      setSelected(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
    
    if (data.onSelect) {
      data.onSelect(optionId);
    }
  };

  const handleEdit = () => {
    if (data.onEdit) {
      data.onEdit();
    }
  };

  const handleDoubleClick = () => {
    handleEdit();
  };

  return (
    <div 
      className="bg-card border-2 border-border rounded-lg p-3 min-w-[280px] max-w-[320px] shadow-lg dark:shadow-gray-800 cursor-pointer" 
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium text-sm text-foreground truncate">{data.question}</span>
        </div>
        <button
          onClick={handleEdit}
          className="flex-shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors ml-2"
          title="Editar pergunta"
        >
          <Cog className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      
      {data.description && (
        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{data.description}</div>
      )}
      
      <div className="space-y-1.5">
        {data.options.map((option, index) => (
          <div key={option.id}>
            <button
              className={`w-full text-left p-2.5 rounded-md border transition-all text-sm ${
                selected.includes(option.id)
                  ? 'border-primary bg-primary/10 dark:bg-primary/20'
                  : 'border-border hover:border-muted-foreground/50 bg-background/50 dark:bg-muted/20'
              }`}
              onClick={() => handleSelect(option.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">{option.label}</div>
                  
                  {option.actions.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {option.actions.slice(0, 2).map((action, i) => {
                        const Icon = actionIcons[action.type];
                        return (
                          <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                            {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
                            <span className="truncate">{action.itemName}</span>
                            {action.quantity && (
                              <span className="text-muted-foreground/70 flex-shrink-0">x{action.quantity}</span>
                            )}
                          </div>
                        );
                      })}
                      {option.actions.length > 2 && (
                        <div className="text-xs text-muted-foreground/70">
                          +{option.actions.length - 2} mais
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {data.responseType === 'multiple' && (
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ml-2 ${
                    selected.includes(option.id)
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/30 dark:border-muted-foreground/50'
                  }`}>
                    {selected.includes(option.id) && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </button>
            
            {data.responseType === 'conditional' && (
              <Handle
                type="source"
                position={Position.Right}
                id={`option-${index}`}
                style={{ top: `${120 + index * 80}px` }}
              />
            )}
          </div>
        ))}
      </div>
      
      {data.responseType !== 'conditional' && (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
}