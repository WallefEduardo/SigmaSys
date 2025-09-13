'use client';

import React from 'react';
import { useDraggableBlock } from '../../hooks/useDragAndDrop';
import { useFlowStore } from '../../store/flowStore';
import StartBlock from './blocks/StartBlock';
import QuestionBlock from './blocks/QuestionBlock';
import ActionBlock from './blocks/ActionBlock';
import CollectorBlock from './blocks/CollectorBlock';
import ConditionBlock from './blocks/ConditionBlock';
import EndBlock from './blocks/EndBlock';
import type { Block } from '../../types/flow.types';

interface BlockRendererProps {
  block: Block;
  readOnly?: boolean;
}

export default function BlockRenderer({ block, readOnly = false }: BlockRendererProps) {
  const { selectedBlocks, selectBlock } = useFlowStore();
  const { setNodeRef, attributes, listeners, style, isDragging } = useDraggableBlock(block.id, block);
  
  const isSelected = selectedBlocks.includes(block.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readOnly) {
      selectBlock(block.id);
    }
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'start':
        return <StartBlock block={block} />;
      case 'question':
        return <QuestionBlock block={block} />;
      case 'action':
        return <ActionBlock block={block} />;
      case 'collector':
        return <CollectorBlock block={block} />;
      case 'condition':
        return <ConditionBlock block={block} />;
      case 'end':
        return <EndBlock block={block} />;
      default:
        return (
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500">
              Unknown block type: {block.type}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        relative inline-block cursor-pointer transition-all duration-200
        ${isDragging ? 'opacity-50' : ''}
        ${readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={style}
      onClick={handleClick}
      {...(readOnly ? {} : { ...attributes, ...listeners })}
    >
      {/* Block Content with Selection Indicator */}
      <div 
        className={`
          relative transition-all duration-200
          ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 rounded-lg' : ''}
        `}
      >
        {renderBlockContent()}
      </div>
    </div>
  );
}