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

  const getActionColor = () => {
    switch (data.actionType) {
      case 'add_material':
        return 'text-green-400';
      case 'add_process':
        return 'text-blue-400';
      case 'add_equipment':
        return 'text-cyan-400';
      case 'add_finish':
        return 'text-pink-400';
      default:
        return 'text-purple-400';
    }
  };

  const getActionName = () => {
    switch (data.actionType) {
      case 'add_material':
        return 'Material';
      case 'add_process':
        return 'Processo';
      case 'add_equipment':
        return 'Equipamento';
      case 'add_finish':
        return 'Acabamento';
      default:
        return 'Ação';
    }
  };

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
      <div className="relative w-full h-12 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 flex items-center gap-3 min-w-[180px] transition-colors duration-200">
        {/* Icon */}
        <div className="flex-shrink-0">
          <ActionIcon className={`w-4 h-4 ${getActionColor()}`} />
        </div>
        
        {/* Action Name */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">
            {getActionName()}
          </div>
        </div>

        {/* Items Count Indicator */}
        {data.items && data.items.length > 0 && (
          <div className="flex-shrink-0">
            <span className="text-xs text-gray-300 bg-gray-700 px-2 py-0.5 rounded">
              {data.items.length} itens
            </span>
          </div>
        )}
      </div>

      {/* Output Connection Point (Right Side) */}
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