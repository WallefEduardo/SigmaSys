'use client';

import React from 'react';
import { MessageSquare, ChevronRight } from 'lucide-react';
import type { Block, QuestionBlockData } from '../../../types/flow.types';

interface QuestionBlockProps {
  block: Block;
}

export default function QuestionBlock({ block }: QuestionBlockProps) {
  const data = block.data as QuestionBlockData;

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
          <MessageSquare className="w-4 h-4 text-blue-400" />
        </div>
        
        {/* Question Text */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">
            {data.question || 'Pergunta'}
          </div>
        </div>

        {/* Response Type Indicator */}
        <div className="flex-shrink-0">
          <span className="text-xs text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded">
            {data.responseType || 'single'}
          </span>
        </div>
      </div>

      {/* Output Connection Points (Right Side) */}
      {data.options && data.options.length > 0 ? (
        // Multiple outputs for conditional questions
        data.options.slice(0, 3).map((option, index) => (
          <div 
            key={option.id}
            className="absolute w-3 h-3 rounded-full border-2 border-white bg-green-500 hover:bg-green-600 transition-colors duration-200 cursor-crosshair"
            style={{
              right: '-12px',
              top: `${30 + (index * 20)}%`,
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}
          />
        ))
      ) : (
        // Single output for simple questions
        <div 
          className="absolute w-3 h-3 rounded-full border-2 border-white bg-green-500 hover:bg-green-600 transition-colors duration-200 cursor-crosshair"
          style={{
            right: '-12px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}