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
import type { BlockType, Position, Block } from '../types/flow.types';

export interface DragState {
  isDragging: boolean;
  draggedBlockType: BlockType | null;
  draggedBlockId: string | null;
  draggedGroupId: string | null;
  draggedDefaultData: any;
  dragOverPosition: Position | null;
  isValidDropZone: boolean;
  dragType: 'palette' | 'block' | 'group' | null;
  initialPosition: Position | null;
}

export const useDragAndDrop = () => {
  const { addBlock, addGroup, addBlockToGroup, moveBlock, moveGroup, blocks, groups, selectedBlocks, selectBlock, selectGroup, updateGroup, updateBlock } = useFlowStore();
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBlockType: null,
    draggedBlockId: null,
    draggedGroupId: null,
    draggedDefaultData: null,
    dragOverPosition: null,
    isValidDropZone: false,
    dragType: null,
    initialPosition: null,
  });

  // Configure sensors for immediate response like Typebot
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Minimal distance for immediate drag initiation
        delay: 0,    // No delay for immediate response
      },
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    console.log('🚀 Drag Start:', { activeId: active.id, activeData });

    // Check if dragging from palette (ID starts with "palette-")
    const isFromPalette = active.id.toString().startsWith('palette-');
    // Check if dragging a group (ID starts with "group-")
    const isGroup = active.id.toString().startsWith('group-');
    
    if (isFromPalette && activeData?.blockType) {
      // Dragging from palette
      console.log('📦 Dragging block from palette:', activeData.blockType);
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        draggedBlockType: activeData.blockType,
        draggedDefaultData: activeData.defaultData,
        draggedBlockId: null,
        draggedGroupId: null,
        dragType: 'palette',
      }));
    } else if (!isFromPalette && !isGroup) {
      // Dragging existing block (regular block ID)
      console.log('🔄 Moving existing block:', active.id);
      const block = blocks.find(b => b.id === active.id.toString());
      
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        draggedBlockType: null,
        draggedDefaultData: null,
        draggedBlockId: active.id.toString(),
        draggedGroupId: null,
        dragType: 'block',
        initialPosition: block ? { ...block.position } : null,
      }));
      
      // Select the block being dragged
      selectBlock(active.id.toString());
    } else {
      console.log('⚠️ Unknown drag type:', { activeId: active.id, activeData, isFromPalette, isGroup });
    }
  }, [selectBlock, selectGroup]);

  // Handle drag move - Typebot approach: let @dnd-kit handle transforms, no manual updates
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active, delta } = event;
    
    if (delta) {
      // Only update drag state for visual feedback, no position updates
      setDragState(prev => ({
        ...prev,
        dragOverPosition: delta,
      }));
    }
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    
    // All canvas and group areas are valid drop zones
    const isValid = over?.id === 'canvas-drop-zone' || 
                   (over?.id && typeof over.id === 'string' && over.id.startsWith('group-'));
    
    setDragState(prev => ({
      ...prev,
      isValidDropZone: isValid,
    }));
  }, []);

  // Handle drag end - Typebot approach: minimal position calculations, rely on real-time updates
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current;

    console.log('Drag End Event:', { active: active.id, over: over?.id, activeData, dragState });

    // Handle drops on groups (adding blocks to existing groups)
    if (over?.id && typeof over.id === 'string' && over.id.startsWith('group-')) {
      const targetGroupId = over.id.replace('group-', '');
      const blockType = activeData?.blockType || dragState.draggedBlockType;
      
      if (blockType && blockType !== 'start') { // Start blocks can't go into groups
        console.log('📦 Adding block to existing group:', targetGroupId);
        
        addBlockToGroup(targetGroupId, {
          type: blockType,
          position: { x: 0, y: 0 }, // Relative position within group
          data: activeData?.defaultData || dragState.draggedDefaultData,
        });
        
        // Reset drag state and return
        setDragState({
          isDragging: false,
          draggedBlockType: null,
          draggedBlockId: null,
          draggedGroupId: null,
          draggedDefaultData: null,
          dragOverPosition: null,
          isValidDropZone: false,
          dragType: null,
          initialPosition: null,
        });
        return;
      }
    }

    // Handle drops on canvas
    if (over?.id === 'canvas-drop-zone') {
      // Groups are now handled by @use-gesture system, no need for @dnd-kit group logic

      if (dragState.dragType === 'block' && dragState.draggedBlockId) {
        const blockId = dragState.draggedBlockId;
        const existingBlock = blocks.find(b => b.id === blockId);
        if (existingBlock) {
          const canvasRect = over.rect;
          const activeRect = active.rect.current.translated;
          
          const newPosition: Position = {
            x: activeRect ? activeRect.left - canvasRect.left : existingBlock.position.x,
            y: activeRect ? activeRect.top - canvasRect.top : existingBlock.position.y,
          };
          
          console.log('🔄 Moving block to final position:', newPosition);
          moveBlock(blockId, newPosition);
        }
        
        // Reset drag state and return
        setDragState({
          isDragging: false,
          draggedBlockType: null,
          draggedBlockId: null,
          draggedGroupId: null,
          draggedDefaultData: null,
          dragOverPosition: null,
          isValidDropZone: false,
          dragType: null,
          initialPosition: null,
        });
        return;
      }

      // Use dragState data if activeData is empty (fallback)
      const blockType = activeData?.blockType || dragState.draggedBlockType;
      
      if (blockType && dragState.draggedBlockType) {
        const canvasRect = over.rect;
        const activeRect = active.rect.current.translated;
        
        // Calculate drop position
        const dropPosition: Position = {
          x: activeRect ? activeRect.left - canvasRect.left : 100,
          y: activeRect ? activeRect.top - canvasRect.top : 100,
        };

        console.log('🎯 Creating block:', { blockType, dropPosition });

        // Check if Start block already exists (in blocks array, not groups)
        const hasStartBlock = blocks.some(block => block.type === 'start');
        
        // SPECIAL HANDLING FOR START BLOCK (like Typebot)
        if (blockType === 'start') {
          if (hasStartBlock) {
            console.log('⚠️ Start block already exists, cannot add another');
            return; // Don't add another start block
          }
          
          console.log('📍 Creating Start block (NOT in group)');
          // Start block goes directly to canvas, not in a group
          const startId = addBlock({
            type: 'start',
            position: dropPosition,
            data: activeData?.defaultData || dragState.draggedDefaultData,
            groupId: 'canvas', // Special groupId for canvas items
          });
          
          console.log('✅ Start block created:', startId);
          return;
        }

        // FOR OTHER BLOCKS: Auto-create Start if needed
        if (!hasStartBlock) {
          console.log('📍 Auto-creating Start block before other blocks');
          
          // Create Start block directly on canvas (not in group)
          addBlock({
            type: 'start',
            position: { x: 50, y: dropPosition.y }, // To the left
            data: { label: 'Início do Checklist' },
            groupId: 'canvas', // Special groupId for canvas items
          });
          
          console.log('✅ Auto-Start created');
        }

        // Create Group for the regular block (NOT for Start)
        console.log('🎯 Creating Group for block:', blockType);
        const newGroupId = addGroup({
          title: '', // Will auto-generate "Group #X"
          position: dropPosition,
          blocks: [],
        });

        // Add the block to the group
        const newBlockId = addBlockToGroup(newGroupId, {
          type: blockType,
          position: { x: 0, y: 0 }, // Relative position within group
          data: activeData?.defaultData || dragState.draggedDefaultData,
        });

        console.log('🎉 Created Group + Block:', { groupId: newGroupId, blockId: newBlockId });
      }
    }

    // Reset drag state
    setDragState({
      isDragging: false,
      draggedBlockType: null,
      draggedBlockId: null,
      draggedGroupId: null,
      draggedDefaultData: null,
      dragOverPosition: null,
      isValidDropZone: false,
      dragType: null,
      initialPosition: null,
    });
  }, [addBlock, addGroup, addBlockToGroup, blocks, groups, dragState]);

  // Handle drag cancel
  const handleDragCancel = useCallback((event: DragCancelEvent) => {
    setDragState({
      isDragging: false,
      draggedBlockType: null,
      draggedBlockId: null,
      draggedGroupId: null,
      draggedDefaultData: null,
      dragOverPosition: null,
      isValidDropZone: false,
      dragType: null,
      initialPosition: null,
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
    touchAction: 'none',
    willChange: isDragging ? 'transform' : 'auto',
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
  // Generate unique ID using both blockType and a unique identifier from defaultData
  const uniqueId = `palette-${blockType}-${defaultData?.actionType || defaultData?.collectorType || Math.random()}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: uniqueId,
    data: {
      blockType,
      defaultData,
    },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.7 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    willChange: isDragging ? 'transform' : 'auto',
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

// Groups now use @use-gesture/react system via useGroupDrag hook

// Hook for making groups droppable (to receive blocks)
export const useGroupDroppable = (groupId: string) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `group-${groupId}`,
  });

  return {
    setNodeRef,
    isOver,
  };
};