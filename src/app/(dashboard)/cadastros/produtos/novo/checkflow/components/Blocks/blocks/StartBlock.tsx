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
    <div className="relative w-full h-full p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
          <Play className="w-4 h-4" />
        </div>
        <span className="font-medium text-green-800 dark:text-green-200 text-sm">
          Início
        </span>
      </div>

      {/* Content */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {data.label}
        </div>
      </div>

      {/* Indicator */}
      <div className="absolute bottom-2 right-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>
    </div>
  );
}