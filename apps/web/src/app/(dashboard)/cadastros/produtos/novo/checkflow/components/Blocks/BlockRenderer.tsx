'use client';

import React from 'react';
import { useDraggableBlock } from '../../hooks/useDragAndDrop';
import { useBlockDrag } from '../../hooks/useBlockDrag';
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
  
  // Use smooth @use-gesture drag for canvas blocks (like start), old system for group blocks
  const isCanvasBlock = block.groupId === 'canvas';
  
  // Smooth drag system for canvas blocks
  const smoothDrag = useBlockDrag(block);
  
  // Old @dnd-kit system for group blocks (to not break existing functionality)
  const dndKitDrag = useDraggableBlock(block.id, block);
  
  // Choose which system to use
  const { setNodeRef, attributes, listeners, style, isDragging } = isCanvasBlock 
    ? {
        setNodeRef: smoothDrag.blockRef,
        attributes: {},
        listeners: smoothDrag.bind(),
        style: smoothDrag.style,
        isDragging: smoothDrag.isDragging
      }
    : dndKitDrag;
  
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
      ref={isCanvasBlock ? smoothDrag.blockRef : setNodeRef}
      className={`
        relative inline-block cursor-pointer
        ${isCanvasBlock ? '' : 'transition-all duration-200'} 
        ${isDragging ? 'opacity-50' : ''}
        ${readOnly ? 'cursor-default' : (isCanvasBlock ? '' : 'cursor-grab active:cursor-grabbing')}
      `}
      style={style}
      onClick={handleClick}
      {...(readOnly || isCanvasBlock ? {} : { ...attributes, ...listeners })}
      {...(isCanvasBlock && !readOnly ? listeners : {})}
    >
      {/* Block Content with Selection Indicator */}
      <div 
        className={`
          relative 
          ${isCanvasBlock ? '' : 'transition-all duration-200'}
          ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1 rounded-lg' : ''}
        `}
      >
        {renderBlockContent()}
      </div>
    </div>
  );
}