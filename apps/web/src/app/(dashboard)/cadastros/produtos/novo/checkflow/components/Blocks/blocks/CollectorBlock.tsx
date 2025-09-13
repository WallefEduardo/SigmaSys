'use client';

import React from 'react';
import { Calculator, Ruler } from 'lucide-react';
import type { Block, CollectorBlockData } from '../../../types/flow.types';

interface CollectorBlockProps {
  block: Block;
}

export default function CollectorBlock({ block }: CollectorBlockProps) {
  const data = block.data as CollectorBlockData;

  const getCollectorIcon = () => {
    switch (data.collectorType) {
      case 'measurements':
        return <Ruler className="w-4 h-4 text-yellow-400" />;
      case 'quantity':
        return <Calculator className="w-4 h-4 text-purple-400" />;
      default:
        return <Calculator className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getCollectorLabel = () => {
    switch (data.collectorType) {
      case 'measurements':
        return 'Medidas';
      case 'quantity':
        return 'Quantidade';
      default:
        return 'Coletor';
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
          {getCollectorIcon()}
        </div>
        
        {/* Collector Label */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">
            {getCollectorLabel()}
          </div>
        </div>

        {/* Fields Count Indicator */}
        {data.fields && data.fields.length > 0 && (
          <div className="flex-shrink-0">
            <span className="text-xs text-yellow-300 bg-yellow-900/50 px-2 py-0.5 rounded">
              {data.fields.length} campos
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