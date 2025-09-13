'use client';

import React from 'react';
import { Play } from 'lucide-react';
import type { Block, StartBlockData } from '../../../types/flow.types';

interface StartBlockProps {
  block: Block;
}

export default function StartBlock({ block }: StartBlockProps) {
  const data = block.data as StartBlockData;

  return (
    <div className="relative">
      {/* Main Block Content */}
      <div className="relative w-full h-12 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 flex items-center gap-3 min-w-[140px] transition-colors duration-200">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Play className="w-4 h-4 text-white" />
        </div>
        
        {/* Label */}
        <div className="flex-1 text-white text-sm font-medium">
          Start
        </div>
      </div>

      {/* Output Connection Point (Right Side) - Following Typebot pattern */}
      <div 
        className="absolute w-3 h-3 rounded-full border-2 border-white bg-green-500 hover:bg-green-600 transition-colors duration-200 cursor-crosshair"
        style={{
          right: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      />
    </div>
  );
}