'use client';

import React from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import FlowCanvas from './Canvas/FlowCanvas';
import BlockPalette from './Blocks/BlockPalette';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

interface CheckFlowBuilderProps {
  className?: string;
  readOnly?: boolean;
  showGrid?: boolean;
  showMiniMap?: boolean;
}

export default function CheckFlowBuilder({
  className = "",
  readOnly = false,
  showGrid = true,
  showMiniMap = false,
}: CheckFlowBuilderProps) {
  const {
    dragState,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`flex h-full w-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        {/* Block Palette - Sidebar */}
        {!readOnly && (
          <BlockPalette className="flex-shrink-0" />
        )}
        
        {/* Canvas Area */}
        <div className="flex-1 relative">
          <FlowCanvas
            showGrid={showGrid}
            showMiniMap={showMiniMap}
            readOnly={readOnly}
            className="h-full"
            dragState={dragState}
          />
        </div>

        {/* Drag Overlay - Only show for palette blocks */}
        <DragOverlay>
          {dragState.isDragging && dragState.dragType === 'palette' && (
            <div className="transform rotate-2 opacity-80">
              <div className="rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 p-3 shadow-xl">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Novo Bloco: {dragState.draggedBlockType}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}