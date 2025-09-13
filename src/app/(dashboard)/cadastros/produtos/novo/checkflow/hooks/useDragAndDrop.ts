'use client';

import { useCallback, useState } from 'react';
import { 
  DndContext, 
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragCancelEvent,
} from '@dnd-kit/core';
import { useFlowStore } from '../store/flowStore';
import { createBlock } from '../utils/blockFactory';
import type { BlockType, Position, Block } from '../types/flow.types';

export interface DragState {
  isDragging: boolean;
  draggedBlockType: BlockType | null;
  draggedBlockId: string | null;
  dragOverPosition: Position | null;
  isValidDropZone: boolean;
}

export const useDragAndDrop = () => {
  const { addBlock, moveBlock, blocks, selectedBlocks, selectBlock } = useFlowStore();
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBlockType: null,
    draggedBlockId: null,
    dragOverPosition: null,
    isValidDropZone: false,
  });

  // Configure sensors for better touch/mouse support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.blockType) {
      // Dragging from palette
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        draggedBlockType: activeData.blockType,
        draggedBlockId: null,
      }));
    } else if (activeData?.blockId) {
      // Dragging existing block
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        draggedBlockType: null,
        draggedBlockId: activeData.blockId,
      }));
      
      // Select the block being dragged
      selectBlock(activeData.blockId);
    }
  }, [selectBlock]);

  // Handle drag move
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { delta } = event;
    
    setDragState(prev => ({
      ...prev,
      dragOverPosition: delta ? { x: delta.x, y: delta.y } : null,
    }));
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    
    setDragState(prev => ({
      ...prev,
      isValidDropZone: over?.id === 'canvas-drop-zone',
    }));
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    const activeData = active.data.current;

    if (over?.id === 'canvas-drop-zone' && delta) {
      if (activeData?.blockType) {
        // Create new block from palette
        const position: Position = {
          x: delta.x,
          y: delta.y,
        };

        const newBlock = createBlock(activeData.blockType, position, activeData.defaultData);
        addBlock(newBlock);
        
      } else if (activeData?.blockId) {
        // Move existing block
        const existingBlock = blocks.find(b => b.id === activeData.blockId);
        if (existingBlock) {
          const newPosition: Position = {
            x: existingBlock.position.x + delta.x,
            y: existingBlock.position.y + delta.y,
          };
          moveBlock(activeData.blockId, newPosition);
        }
      }
    }

    // Reset drag state
    setDragState({
      isDragging: false,
      draggedBlockType: null,
      draggedBlockId: null,
      dragOverPosition: null,
      isValidDropZone: false,
    });
  }, [addBlock, moveBlock, blocks]);

  // Handle drag cancel
  const handleDragCancel = useCallback((event: DragCancelEvent) => {
    setDragState({
      isDragging: false,
      draggedBlockType: null,
      draggedBlockId: null,
      dragOverPosition: null,
      isValidDropZone: false,
    });
  }, []);

  return {
    dragState,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
};

// Hook for making blocks draggable
export const useDraggableBlock = (blockId: string, block: Block) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: blockId,
    data: {
      blockId,
      blockType: block.type,
    },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return {
    setNodeRef,
    attributes,
    listeners,
    style,
    isDragging,
  };
};

// Hook for making palette items draggable
export const useDraggablePaletteItem = (blockType: BlockType, defaultData?: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `palette-${blockType}`,
    data: {
      blockType,
      defaultData,
    },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.7 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return {
    setNodeRef,
    attributes,
    listeners,
    style,
    isDragging,
  };
};

// Hook for canvas drop zone
export const useCanvasDroppable = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return {
    setNodeRef,
    isOver,
  };
};