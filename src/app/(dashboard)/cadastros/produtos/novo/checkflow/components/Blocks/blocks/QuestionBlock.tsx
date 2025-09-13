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
    <div className="relative w-full h-full p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white">
          <MessageSquare className="w-4 h-4" />
        </div>
        <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
          Pergunta
        </span>
        <div className="ml-auto">
          <span className="text-xs text-blue-600 dark:text-blue-300 bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
            {data.responseType}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
          {data.question}
        </div>
        {data.description && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
            {data.description}
          </div>
        )}
      </div>

      {/* Options Preview */}
      <div className="space-y-1">
        {data.options?.slice(0, 2).map((option, index) => (
          <div 
            key={option.id}
            className="flex items-center gap-2 text-xs bg-white dark:bg-gray-700 rounded px-2 py-1"
          >
            <div className="w-1 h-1 rounded-full bg-blue-500" />
            <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
              {option.label}
            </span>
            {data.responseType === 'conditional' && (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </div>
        ))}
        
        {data.options && data.options.length > 2 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            +{data.options.length - 2} mais opções
          </div>
        )}
      </div>

      {/* Indicator */}
      <div className="absolute bottom-2 right-2">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
      </div>
    </div>
  );
}