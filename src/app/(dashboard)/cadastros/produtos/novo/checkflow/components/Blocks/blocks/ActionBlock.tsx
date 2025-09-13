'use client';

import React from 'react';
import { Zap, Package, Cpu, Settings, Palette } from 'lucide-react';
import type { Block, ActionBlockData } from '../../../types/flow.types';

interface ActionBlockProps {
  block: Block;
}

const actionIcons = {
  add_material: Package,
  add_process: Cpu,
  add_equipment: Settings,
  add_finish: Palette,
};

export default function ActionBlock({ block }: ActionBlockProps) {
  const data = block.data as ActionBlockData;
  const ActionIcon = actionIcons[data.actionType] || Zap;

  return (
    <div className="relative w-full h-full p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white">
          <ActionIcon className="w-4 h-4" />
        </div>
        <span className="font-medium text-purple-800 dark:text-purple-200 text-sm">
          Ação
        </span>
      </div>

      {/* Content */}
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
          {data.name}
        </div>
        {data.description && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {data.description}
          </div>
        )}
      </div>

      {/* Action Type */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-purple-600 dark:text-purple-300 bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded">
          {data.actionType.replace('add_', '').replace('_', ' ')}
        </span>
        {data.items && data.items.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {data.items.length} itens
          </span>
        )}
      </div>

      {/* Indicator */}
      <div className="absolute bottom-2 right-2">
        <div className="w-2 h-2 rounded-full bg-purple-500" />
      </div>
    </div>
  );
}