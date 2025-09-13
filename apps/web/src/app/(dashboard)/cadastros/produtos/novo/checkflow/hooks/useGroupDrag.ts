'use client';

import { useRef, useState, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { useFlowStore } from '../store/flowStore';
import type { Group, Position } from '../types/flow.types';

interface GroupCoordinates {
  x: number;
  y: number;
}

export const useGroupDrag = (group: Group) => {
  const { selectGroup, moveGroup, viewport } = useFlowStore();
  const groupRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Separate coordinates for visual positioning (like Typebot)
  const [groupCoordinates, setGroupCoordinates] = useState<GroupCoordinates>({
    x: group.position.x,
    y: group.position.y,
  });

  // Sync coordinates when group position changes externally
  useEffect(() => {
    if (!isDragging) {
      setGroupCoordinates({
        x: group.position.x,
        y: group.position.y,
      });
    }
  }, [group.position.x, group.position.y, isDragging]);

  const bind = useDrag(
    ({
      first,
      last,
      movement: [mx, my], // Use movement like Typebot (not delta)
      event,
      target,
      cancel,
    }) => {
      // Prevent drag on elements with .prevent-group-drag class (like Typebot)
      if (target && (target as Element).closest('.prevent-group-drag')) {
        cancel();
        return;
      }

      if (first) {
        // Start drag: select group and focus element (like Typebot)
        setIsDragging(true);
        selectGroup(group.id);
        
        // Initialize coordinates to current position
        setGroupCoordinates({
          x: group.position.x,
          y: group.position.y,
        });
      }

      // Move focused elements (like Typebot's moveFocusedElements)
      const scaledMovement = {
        x: mx / viewport.zoom,
        y: my / viewport.zoom,
      };

      const newCoordinates = {
        x: group.position.x + scaledMovement.x,
        y: group.position.y + scaledMovement.y,
      };

      // Update visual coordinates during drag (not store yet)
      setGroupCoordinates(newCoordinates);

      if (last) {
        // End drag: update store coordinates (like Typebot's updateGroupsCoordinates)
        setIsDragging(false);
        
        const finalPosition: Position = {
          x: Math.round(newCoordinates.x * 100) / 100, // Round like Typebot
          y: Math.round(newCoordinates.y * 100) / 100,
        };

        // Update store with final position
        moveGroup(group.id, finalPosition);
        
        // Sync coordinates with final position
        setGroupCoordinates(finalPosition);
      }
    },
    {
      // Typebot-like configuration for smooth dragging
      filterTaps: true, // Prevent accidental drags
      threshold: 5, // Minimum distance to start drag (like Typebot)
      pointer: { 
        keys: false,
      },
    }
  );

  // Style exactly like Typebot - always transform, never left/top
  const style: React.CSSProperties = {
    position: 'absolute',
    transform: `translate(${groupCoordinates?.x ?? 0}px, ${groupCoordinates?.y ?? 0}px)`,
    touchAction: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return {
    groupRef,
    bind,
    style,
    isDragging,
  };
};