'use client';

import React from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlowCanvas } from '../../hooks/useFlowCanvas';
import { useDragAndDrop, useCanvasDroppable } from '../../hooks/useDragAndDrop';
import { useFlowStore } from '../../store/flowStore';
import CanvasGrid from './CanvasGrid';
import CanvasControls from './CanvasControls';
import BlockRenderer from '../Blocks/BlockRenderer';
import ConnectionRenderer from '../Connections/ConnectionRenderer';

interface FlowCanvasProps {
  className?: string;
  showGrid?: boolean;
  showMiniMap?: boolean;
  readOnly?: boolean;
}

export default function FlowCanvas({ 
  className = "",
  showGrid = true,
  showMiniMap = false,
  readOnly = false 
}: FlowCanvasProps) {
  const { blocks, connections } = useFlowStore();
  
  const {
    canvasRef,
    viewport,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    getTransformStyle,
    fitToBlocks,
    resetViewport,
  } = useFlowCanvas();

  const {
    dragState,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop();

  const { setNodeRef: setDropZoneRef, isOver } = useCanvasDroppable();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`relative h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-900 ${className}`}>
        {/* Canvas Controls */}
        <CanvasControls
          onFitToBlocks={fitToBlocks}
          onResetViewport={resetViewport}
          viewport={viewport}
          className="absolute top-4 right-4 z-20"
        />

        {/* Main Canvas */}
        <div
          ref={(el) => {
            if (canvasRef.current) canvasRef.current = el;
            if (setDropZoneRef) setDropZoneRef(el);
          }}
          className={`h-full w-full cursor-grab active:cursor-grabbing ${
            isOver ? 'bg-blue-50 dark:bg-blue-950/20' : ''
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          style={{ 
            cursor: dragState.isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* Grid Background */}
          {showGrid && (
            <CanvasGrid 
              viewport={viewport}
              size={20}
              className="absolute inset-0 pointer-events-none"
            />
          )}

          {/* Canvas Content - Transformed */}
          <div
            className="absolute inset-0 origin-top-left"
            style={getTransformStyle()}
          >
            {/* Connections Layer */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
                overflow: 'visible',
              }}
            >
              <defs>
                {/* Arrow marker for connections */}
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#6366f1"
                    className="fill-blue-500"
                  />
                </marker>
              </defs>

              <AnimatePresence>
                {connections.map((connection) => (
                  <ConnectionRenderer
                    key={connection.id}
                    connection={connection}
                    blocks={blocks}
                  />
                ))}
              </AnimatePresence>
            </svg>

            {/* Blocks Layer */}
            <div className="relative">
              <AnimatePresence>
                {blocks.map((block) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute"
                    style={{
                      left: block.position.x,
                      top: block.position.y,
                      width: block.dimensions?.width || 200,
                      height: block.dimensions?.height || 100,
                    }}
                  >
                    <BlockRenderer 
                      block={block} 
                      readOnly={readOnly}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Drop Zone Indicator */}
            {dragState.isDragging && (
              <div
                className={`absolute inset-0 pointer-events-none transition-colors duration-200 ${
                  dragState.isValidDropZone
                    ? 'bg-blue-500/10 border-2 border-dashed border-blue-500'
                    : 'bg-red-500/10 border-2 border-dashed border-red-500'
                }`}
              />
            )}
          </div>

          {/* Empty State */}
          {blocks.length === 0 && !dragState.isDragging && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Canvas Vazio
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                  Arraste blocos da sidebar para começar a construir seu fluxo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {dragState.draggedBlockType && (
            <div className="transform rotate-3 opacity-90">
              <div className="rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 p-4 shadow-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {dragState.draggedBlockType}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}