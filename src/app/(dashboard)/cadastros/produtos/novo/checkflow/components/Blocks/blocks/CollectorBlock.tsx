'use client';

import React from 'react';
import { Calculator, Ruler } from 'lucide-react';
import type { Block, CollectorBlockData } from '../../../types/flow.types';

interface CollectorBlockProps {
  block: Block;
}

export default function CollectorBlock({ block }: CollectorBlockProps) {
  const data = block.data as CollectorBlockData;

  return (
    <div className="relative w-full h-full p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white">
          <Calculator className="w-4 h-4" />
        </div>
        <span className="font-medium text-amber-800 dark:text-amber-200 text-sm">
          Coletor
        </span>
      </div>

      {/* Content */}
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Coletar {data.collectorType === 'measurements' ? 'Medidas' : 'Dados'}
        </div>
      </div>

      {/* Fields Preview */}
      <div className="space-y-1">
        {data.fields?.slice(0, 3).map((field, index) => (
          <div 
            key={field.id}
            className="flex items-center gap-2 text-xs bg-white dark:bg-gray-700 rounded px-2 py-1"
          >
            <Ruler className="w-3 h-3 text-amber-500" />
            <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
              {field.name}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {field.type}
            </span>
            {field.required && (
              <span className="text-red-500 text-xs">*</span>
            )}
          </div>
        ))}
        
        {data.fields && data.fields.length > 3 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            +{data.fields.length - 3} mais campos
          </div>
        )}
      </div>

      {/* Indicator */}
      <div className="absolute bottom-2 right-2">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
      </div>
    </div>
  );
}