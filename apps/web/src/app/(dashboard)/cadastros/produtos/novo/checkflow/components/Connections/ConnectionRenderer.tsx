'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getBezierPath, getConnectionPointPosition } from '../../utils/geometry';
import type { Connection, Block } from '../../types/flow.types';

interface ConnectionRendererProps {
  connection: Connection;
  blocks: Block[];
  animated?: boolean;
}

export default function ConnectionRenderer({ 
  connection, 
  blocks, 
  animated = true 
}: ConnectionRendererProps) {
  // Find source and target blocks
  const sourceBlock = blocks.find(b => b.id === connection.source);
  const targetBlock = blocks.find(b => b.id === connection.target);

  if (!sourceBlock || !targetBlock) {
    return null;
  }

  // Calculate connection points
  const sourcePoint = getConnectionPointPosition(sourceBlock, 'bottom');
  const targetPoint = getConnectionPointPosition(targetBlock, 'top');

  // Generate path
  const path = getBezierPath(sourcePoint, targetPoint);

  return (
    <motion.g
      initial={animated ? { pathLength: 0, opacity: 0 } : false}
      animate={{ pathLength: 1, opacity: 1 }}
      exit={{ pathLength: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Main connection path */}
      <motion.path
        d={path}
        stroke="#6366f1"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
        className="drop-shadow-sm"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
        }}
      />
      
      {/* Hover detection path (invisible, wider) */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        className="cursor-pointer hover:stroke-blue-200 transition-colors"
        onClick={() => {
          // Handle connection click/selection
          console.log('Connection clicked:', connection.id);
        }}
      />

      {/* Connection label (if any) */}
      {connection.data?.label && (
        <text
          x={(sourcePoint.x + targetPoint.x) / 2}
          y={(sourcePoint.y + targetPoint.y) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-gray-600 dark:fill-gray-400 pointer-events-none"
          style={{ userSelect: 'none' }}
        >
          {connection.data.label}
        </text>
      )}
    </motion.g>
  );
}