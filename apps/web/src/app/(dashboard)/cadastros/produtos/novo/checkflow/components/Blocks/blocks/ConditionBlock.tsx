'use client';

import React from 'react';
import { GitBranch } from 'lucide-react';
import type { Block } from '../../../types/flow.types';

interface ConditionBlockProps {
  block: Block;
}

export default function ConditionBlock({ block }: ConditionBlockProps) {
  const data = block.data;

  return (
    <div className="relative">
      {/* Input Connection Point (Left Side) */}
      <div 
        className="absolute w-3 h-3 rounded-full border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors duration-200 cursor-crosshair"
        style={{
          left: '-12px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      />

      {/* Main Block Content */}
      <div className="relative w-full h-12 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 flex items-center gap-3 min-w-[200px] transition-colors duration-200">
        {/* Icon */}
        <div className="flex-shrink-0">
          <GitBranch className="w-4 h-4 text-orange-400" />
        </div>
        
        {/* Condition Text */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">
            {data.condition || 'Condição'}
          </div>
        </div>

        {/* Branch Indicator */}
        <div className="flex-shrink-0 flex gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" title="Verdadeiro" />
          <div className="w-2 h-2 rounded-full bg-red-500" title="Falso" />
        </div>
      </div>

      {/* Output Connection Points (Right Side) - Two outputs for True/False */}
      {/* True Output (Top) */}
      <div 
        className="absolute w-3 h-3 rounded-full border-2 border-white bg-green-500 hover:bg-green-600 transition-colors duration-200 cursor-crosshair"
        style={{
          right: '-12px',
          top: '25%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
        title={data.trueLabel || 'Verdadeiro'}
      />
      
      {/* False Output (Bottom) */}
      <div 
        className="absolute w-3 h-3 rounded-full border-2 border-white bg-red-500 hover:bg-red-600 transition-colors duration-200 cursor-crosshair"
        style={{
          right: '-12px',
          top: '75%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
        title={data.falseLabel || 'Falso'}
      />
    </div>
  );
}