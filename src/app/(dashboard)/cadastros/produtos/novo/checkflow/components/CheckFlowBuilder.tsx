'use client';

import React from 'react';
import FlowCanvas from './Canvas/FlowCanvas';
import BlockPalette from './Blocks/BlockPalette';

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
  return (
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
        />
      </div>
    </div>
  );
}