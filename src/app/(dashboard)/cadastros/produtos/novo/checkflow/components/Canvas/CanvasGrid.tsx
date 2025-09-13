'use client';

import React from 'react';
import type { Viewport } from '../../types/flow.types';

interface CanvasGridProps {
  viewport: Viewport;
  size?: number;
  className?: string;
  dotSize?: number;
  showLines?: boolean;
}

export default function CanvasGrid({ 
  viewport, 
  size = 20, 
  className = "",
  dotSize = 1,
  showLines = false 
}: CanvasGridProps) {
  const actualSize = size * viewport.zoom;
  const offsetX = viewport.x % actualSize;
  const offsetY = viewport.y % actualSize;

  if (showLines) {
    // Line-based grid
    return (
      <div className={`${className}`}>
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ 
            opacity: Math.min(viewport.zoom * 0.5, 0.3),
          }}
        >
          <defs>
            <pattern
              id="grid-lines"
              width={actualSize}
              height={actualSize}
              patternUnits="userSpaceOnUse"
              x={offsetX}
              y={offsetY}
            >
              <path
                d={`M ${actualSize} 0 L 0 0 0 ${actualSize}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-300 dark:text-gray-600"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-lines)" />
        </svg>
      </div>
    );
  }

  // Dot-based grid (default)
  return (
    <div className={`${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ 
          opacity: Math.min(viewport.zoom * 0.8, 0.4),
        }}
      >
        <defs>
          <pattern
            id="grid-dots"
            width={actualSize}
            height={actualSize}
            patternUnits="userSpaceOnUse"
            x={offsetX}
            y={offsetY}
          >
            <circle
              cx={actualSize / 2}
              cy={actualSize / 2}
              r={dotSize}
              fill="currentColor"
              className="text-gray-400 dark:text-gray-600"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dots)" />
      </svg>
    </div>
  );
}