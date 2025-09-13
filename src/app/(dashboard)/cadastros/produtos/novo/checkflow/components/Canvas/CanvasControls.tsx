'use client';

import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2,
  Grid,
  Hand,
  MousePointer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Viewport } from '../../types/flow.types';

interface CanvasControlsProps {
  viewport: Viewport;
  onFitToBlocks: () => void;
  onResetViewport: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  className?: string;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  panMode?: boolean;
  onTogglePanMode?: () => void;
}

export default function CanvasControls({
  viewport,
  onFitToBlocks,
  onResetViewport,
  onZoomIn,
  onZoomOut,
  className = "",
  showGrid = true,
  onToggleGrid,
  panMode = false,
  onTogglePanMode,
}: CanvasControlsProps) {
  const zoomPercentage = Math.round(viewport.zoom * 100);

  return (
    <TooltipProvider>
      <div className={`flex flex-col bg-white dark:bg-gray-800 rounded-lg border shadow-sm ${className}`}>
        {/* Zoom Controls */}
        <div className="flex flex-col p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomIn || (() => {})}
                disabled={viewport.zoom >= 3}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom In (Ctrl + Scroll)</p>
            </TooltipContent>
          </Tooltip>

          {/* Zoom Percentage */}
          <div className="flex items-center justify-center h-8 px-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {zoomPercentage}%
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomOut || (() => {})}
                disabled={viewport.zoom <= 0.1}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom Out (Ctrl + Scroll)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator />

        {/* View Controls */}
        <div className="flex flex-col p-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onFitToBlocks}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Fit to Blocks</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetViewport}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Reset View</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Optional Controls */}
        {(onToggleGrid || onTogglePanMode) && (
          <>
            <Separator />
            <div className="flex flex-col p-1">
              {onToggleGrid && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showGrid ? "default" : "ghost"}
                      size="sm"
                      onClick={onToggleGrid}
                      className="h-8 w-8 p-0"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Toggle Grid</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {onTogglePanMode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={panMode ? "default" : "ghost"}
                      size="sm"
                      onClick={onTogglePanMode}
                      className="h-8 w-8 p-0"
                    >
                      {panMode ? (
                        <Hand className="h-4 w-4" />
                      ) : (
                        <MousePointer className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{panMode ? 'Pan Mode' : 'Select Mode'}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </>
        )}

        {/* Position Info (Debug) */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Separator />
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400">
              <div>X: {Math.round(viewport.x)}</div>
              <div>Y: {Math.round(viewport.y)}</div>
              <div>Z: {viewport.zoom.toFixed(2)}</div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}