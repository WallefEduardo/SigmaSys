'use client';

import { useRef, useState, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { useFlowStore } from '../store/flowStore';
import type { Block, Position } from '../types/flow.types';

interface BlockCoordinates {
  x: number;
  y: number;
}

export const useBlockDrag = (block: Block) => {
  const { selectBlock, moveBlock, viewport } = useFlowStore();
  const blockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Separate coordinates for visual positioning (like Typebot)
  const [blockCoordinates, setBlockCoordinates] = useState<BlockCoordinates>({
    x: block.position.x,
    y: block.position.y,
  });

  // Sync coordinates when block position changes externally
  useEffect(() => {
    if (!isDragging) {
      setBlockCoordinates({
        x: block.position.x,
        y: block.position.y,
      });
    }
  }, [block.position.x, block.position.y, isDragging]);

  const bind = useDrag(
    ({
      first,
      last,
      movement: [mx, my], // Use movement like Typebot (not delta)
      event,
      target,
      cancel,
    }) => {
      // Prevent drag on connection points
      if (target && (target as Element).closest('.cursor-crosshair')) {
        cancel();
        return;
      }

      if (first) {
        // Start drag: select block and focus element (like Typebot)
        setIsDragging(true);
        selectBlock(block.id);
        
        // Initialize coordinates to current position
        setBlockCoordinates({
          x: block.position.x,
          y: block.position.y,
        });
      }

      // Update coordinates on EVERY movement (exactly like groups)
      const scaledMovement = {
        x: mx / viewport.zoom,
        y: my / viewport.zoom,
      };

      const newCoordinates = {
        x: block.position.x + scaledMovement.x,
        y: block.position.y + scaledMovement.y,
      };

      // Update visual coordinates during drag (not store yet)
      setBlockCoordinates(newCoordinates);

      if (last) {
        // End drag: update store coordinates (like Typebot's updateBlocksCoordinates)
        setIsDragging(false);
        
        const finalPosition: Position = {
          x: Math.round(newCoordinates.x * 100) / 100, // Round like Typebot
          y: Math.round(newCoordinates.y * 100) / 100,
        };

        // Update store with final position
        moveBlock(block.id, finalPosition);
        
        // Sync coordinates with final position
        setBlockCoordinates(finalPosition);
      }
    },
    {
      // EXACT same configuration as groups
      filterTaps: true,
      threshold: 5,
      pointer: { 
        keys: false,
      },
    }
  );

  // Style exactly like Groups - smooth transform positioning
  const style: React.CSSProperties = {
    position: 'absolute',
    transform: `translate(${blockCoordinates?.x ?? 0}px, ${blockCoordinates?.y ?? 0}px)`,
    touchAction: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 1,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    willChange: isDragging ? 'transform' : 'auto', // Performance optimization
  };

  return {
    blockRef,
    bind,
    style,
    isDragging,
  };
};