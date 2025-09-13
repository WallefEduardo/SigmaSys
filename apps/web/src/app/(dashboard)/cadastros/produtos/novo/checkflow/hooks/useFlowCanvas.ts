'use client';

import { useCallback, useRef, useState } from 'react';
import { useFlowStore } from '../store/flowStore';
import type { Position, Viewport } from '../types/flow.types';

export interface CanvasInteraction {
  isPanning: boolean;
  isZooming: boolean;
  isDragging: boolean;
  lastPanPoint: Position | null;
  startPanPoint: Position | null;
}

export const useFlowCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { viewport, setViewport, blocks, connections } = useFlowStore();
  
  const [interaction, setInteraction] = useState<CanvasInteraction>({
    isPanning: false,
    isZooming: false,
    isDragging: false,
    lastPanPoint: null,
    startPanPoint: null,
  });

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenPos: Position): Position => {
    if (!canvasRef.current) return screenPos;
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenPos.x - rect.left - viewport.x) / viewport.zoom,
      y: (screenPos.y - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasPos: Position): Position => {
    if (!canvasRef.current) return canvasPos;
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: canvasPos.x * viewport.zoom + viewport.x + rect.left,
      y: canvasPos.y * viewport.zoom + viewport.y + rect.top,
    };
  }, [viewport]);

  // Pan the canvas
  const panCanvas = useCallback((delta: Position) => {
    setViewport({
      x: viewport.x + delta.x,
      y: viewport.y + delta.y,
    });
  }, [viewport, setViewport]);

  // Zoom the canvas
  const zoomCanvas = useCallback((zoomDelta: number, center?: Position) => {
    const newZoom = Math.max(0.1, Math.min(3, viewport.zoom + zoomDelta));
    
    if (center && canvasRef.current) {
      // Zoom towards the center point
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = center.x - rect.left;
      const centerY = center.y - rect.top;
      
      const scaleFactor = newZoom / viewport.zoom;
      const newX = centerX - (centerX - viewport.x) * scaleFactor;
      const newY = centerY - (centerY - viewport.y) * scaleFactor;
      
      setViewport({
        x: newX,
        y: newY,
        zoom: newZoom,
      });
    } else {
      setViewport({ zoom: newZoom });
    }
  }, [viewport, setViewport]);

  // Reset viewport to center
  const resetViewport = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);

  // Fit canvas to show all blocks
  const fitToBlocks = useCallback(() => {
    if (blocks.length === 0) {
      resetViewport();
      return;
    }

    // Calculate bounding box of all blocks
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    blocks.forEach(block => {
      const width = block.dimensions?.width || 200;
      const height = block.dimensions?.height || 100;
      
      minX = Math.min(minX, block.position.x);
      minY = Math.min(minY, block.position.y);
      maxX = Math.max(maxX, block.position.x + width);
      maxY = Math.max(maxY, block.position.y + height);
    });

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 50;
    
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    
    const scaleX = rect.width / contentWidth;
    const scaleY = rect.height / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const x = rect.width / 2 - centerX * scale;
    const y = rect.height / 2 - centerY * scale;

    setViewport({ x, y, zoom: scale });
  }, [blocks, setViewport, resetViewport]);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return; // Only handle left mouse button
    
    const point = { x: event.clientX, y: event.clientY };
    
    // Check if we should start panning (space key or middle mouse button)
    if (event.button === 1 || event.ctrlKey || event.metaKey) {
      setInteraction(prev => ({
        ...prev,
        isPanning: true,
        lastPanPoint: point,
        startPanPoint: point,
      }));
      event.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const point = { x: event.clientX, y: event.clientY };
    
    if (interaction.isPanning && interaction.lastPanPoint) {
      const delta = {
        x: point.x - interaction.lastPanPoint.x,
        y: point.y - interaction.lastPanPoint.y,
      };
      
      panCanvas(delta);
      
      setInteraction(prev => ({
        ...prev,
        lastPanPoint: point,
      }));
    }
  }, [interaction.isPanning, interaction.lastPanPoint, panCanvas]);

  const handleMouseUp = useCallback(() => {
    setInteraction(prev => ({
      ...prev,
      isPanning: false,
      isDragging: false,
      lastPanPoint: null,
      startPanPoint: null,
    }));
  }, []);

  // Wheel event for zooming
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Zoom
      event.preventDefault();
      const zoomDelta = -event.deltaY * 0.01;
      const center = { x: event.clientX, y: event.clientY };
      zoomCanvas(zoomDelta, center);
    } else {
      // Pan
      const delta = {
        x: -event.deltaX,
        y: -event.deltaY,
      };
      panCanvas(delta);
    }
  }, [zoomCanvas, panCanvas]);

  // Get transform style for canvas content
  const getTransformStyle = useCallback((): React.CSSProperties => ({
    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    transformOrigin: '0 0',
  }), [viewport]);

  return {
    canvasRef,
    viewport,
    interaction,
    
    // Coordinate conversion
    screenToCanvas,
    canvasToScreen,
    
    // Canvas manipulation
    panCanvas,
    zoomCanvas,
    resetViewport,
    fitToBlocks,
    
    // Event handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    
    // Utilities
    getTransformStyle,
  };
};