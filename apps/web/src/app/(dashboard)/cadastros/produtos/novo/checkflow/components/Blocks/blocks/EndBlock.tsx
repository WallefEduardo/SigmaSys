'use client';

import React from 'react';
import { Square, CheckCircle } from 'lucide-react';
import type { Block, EndBlockData } from '../../../types/flow.types';

interface EndBlockProps {
  block: Block;
}

export default function EndBlock({ block }: EndBlockProps) {
  const data = block.data as EndBlockData;

  return (
    <div className="relative w-full h-full p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white">
          <Square className="w-4 h-4" />
        </div>
        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
          Fim
        </span>
      </div>

      {/* Content */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {data.label}
        </div>
        
        {data.summary && (
          <div className="flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            <span>Com resumo</span>
          </div>
        )}
      </div>

      {/* Indicator */}
      <div className="absolute bottom-2 right-2">
        <div className="w-2 h-2 rounded-full bg-gray-500" />
      </div>
    </div>
  );
}