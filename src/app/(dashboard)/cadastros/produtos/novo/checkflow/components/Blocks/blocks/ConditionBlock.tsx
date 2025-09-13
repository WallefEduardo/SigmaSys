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
    <div className="relative w-full h-full p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white">
          <GitBranch className="w-4 h-4" />
        </div>
        <span className="font-medium text-red-800 dark:text-red-200 text-sm">
          Condição
        </span>
      </div>

      {/* Content */}
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {data.condition || 'Nova condição'}
        </div>
      </div>

      {/* Paths */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs bg-green-100 dark:bg-green-800/20 rounded px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-700 dark:text-green-300">
            {data.trueLabel || 'Verdadeiro'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs bg-red-100 dark:bg-red-800/20 rounded px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-red-700 dark:text-red-300">
            {data.falseLabel || 'Falso'}
          </span>
        </div>
      </div>

      {/* Indicator */}
      <div className="absolute bottom-2 right-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
      </div>
    </div>
  );
}