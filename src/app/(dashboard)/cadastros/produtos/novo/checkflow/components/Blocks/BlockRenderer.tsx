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
        relative w-full h-full cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isDragging ? 'opacity-50' : ''}
        ${readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={style}
      onClick={handleClick}
      {...(readOnly ? {} : { ...attributes, ...listeners })}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -inset-1 rounded-lg border-2 border-blue-500 pointer-events-none" />
      )}

      {/* Block Content */}
      <div 
        className={`
          relative w-full h-full rounded-lg border bg-white dark:bg-gray-800 shadow-sm
          hover:shadow-md transition-shadow duration-200
          ${isSelected ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}
        `}
        style={{ borderColor: isSelected ? '#3B82F6' : undefined }}
      >
        {renderBlockContent()}
      </div>

      {/* Connection Handles */}
      {!readOnly && (
        <>
          {/* Input Handles */}
          {block.inputs?.map((input, index) => (
            <div
              key={`input-${input.id}`}
              className={`
                absolute w-3 h-3 rounded-full border-2 border-white bg-gray-400
                hover:bg-blue-500 transition-colors duration-200 cursor-crosshair
                ${getHandlePosition(input.position, index, 'input')}
              `}
              style={{ 
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            />
          ))}

          {/* Output Handles */}
          {block.outputs?.map((output, index) => (
            <div
              key={`output-${output.id}`}
              className={`
                absolute w-3 h-3 rounded-full border-2 border-white bg-green-500
                hover:bg-green-600 transition-colors duration-200 cursor-crosshair
                ${getHandlePosition(output.position, index, 'output')}
              `}
              style={{ 
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// Helper function to position handles
function getHandlePosition(position: string, index: number, type: 'input' | 'output'): string {
  switch (position) {
    case 'top':
      return 'top-0 left-1/2';
    case 'bottom':
      return 'bottom-0 left-1/2';
    case 'left':
      return 'left-0 top-1/2';
    case 'right':
      return 'right-0 top-1/2';
    default:
      return 'top-1/2 left-1/2';
  }
}