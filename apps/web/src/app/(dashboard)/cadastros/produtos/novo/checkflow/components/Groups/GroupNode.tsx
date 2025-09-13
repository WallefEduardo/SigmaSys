'use client';

import React, { useState } from 'react';
import { Play, Copy, Trash2 } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { useGroupDrag } from '../../hooks/useGroupDrag';
import { useGroupDroppable } from '../../hooks/useDragAndDrop';
import BlockRenderer from '../Blocks/BlockRenderer';
import type { Group } from '../../types/flow.types';

interface GroupNodeProps {
  group: Group;
}

export default function GroupNode({ group }: GroupNodeProps) {
  const { selectedGroups, selectGroup, updateGroup, removeGroup, duplicateGroup, moveGroup } = useFlowStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(group.title);
  
  const isSelected = selectedGroups.includes(group.id);
  
  // New @use-gesture drag system for smooth movement
  const { groupRef, bind, style: dragStyle, isDragging } = useGroupDrag(group);
  
  // Keep @dnd-kit for drop zone functionality
  const { setNodeRef: setDropRef, isOver } = useGroupDroppable(group.id);
  
  // Combine refs for drag and drop
  const combinedRef = (node: HTMLDivElement | null) => {
    if (groupRef.current !== node) {
      groupRef.current = node;
    }
    setDropRef(node);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectGroup(group.id);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTitleSubmit = () => {
    if (tempTitle.trim() && tempTitle !== group.title) {
      updateGroup(group.id, { title: tempTitle.trim() });
    } else {
      setTempTitle(group.title);
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTempTitle(group.title);
      setIsEditing(false);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateGroup(group.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeGroup(group.id);
  };

  return (
    <div
      ref={combinedRef}
      className={`
        relative bg-gray-900/90 rounded-lg border backdrop-blur-sm
        min-w-[300px]
        ${isSelected 
          ? 'border-orange-400 shadow-lg shadow-orange-400/20' 
          : 'border-gray-600 hover:border-gray-500'
        }
        ${isDragging ? 'opacity-90 shadow-2xl' : 'group-node-smooth'}
        ${isOver ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
      `}
      style={{
        ...dragStyle,
        userSelect: 'none', // Prevent text selection during drag
        WebkitUserSelect: 'none',
      }}
      onClick={handleClick}
      {...bind()} // Bind @use-gesture events
    >
      {/* Group Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        {/* Editable Title */}
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="bg-transparent text-white font-medium text-sm border-none outline-none focus:ring-1 focus:ring-orange-400 rounded px-1 prevent-group-drag"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className="text-white font-medium text-sm cursor-pointer hover:text-orange-300 transition-colors"
              onClick={handleTitleClick}
            >
              {group.title}
            </h3>
          )}
        </div>

        {/* Group Actions Toolbar */}
        {isSelected && (
          <div className="flex items-center gap-1 ml-2 prevent-group-drag">
            {/* Preview/Play Button */}
            <button
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Preview"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Preview group:', group.id);
              }}
            >
              <Play className="w-3.5 h-3.5" />
            </button>

            {/* Duplicate Button */}
            <button
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Duplicate Group"
              onClick={handleDuplicate}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Delete Button */}
            <button
              className="p-1.5 rounded hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
              title="Delete Group"
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Group Content - Blocks */}
      <div className="p-4 space-y-3">
        {group.blocks.length > 0 ? (
          group.blocks.map((block, index) => (
            <div key={block.id} className="relative">
              <BlockRenderer block={block} />
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-xs">Arraste blocos aqui</div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Points for Groups */}
      {group.blocks.length > 0 && (
        <>
          {/* Input Connection Point (Left) */}
          <div 
            className="absolute w-3 h-3 rounded-full border-2 border-white bg-gray-400 hover:bg-blue-500 transition-colors duration-200 cursor-crosshair"
            style={{
              left: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}
          />

          {/* Output Connection Point (Right) */}
          <div 
            className="absolute w-3 h-3 rounded-full border-2 border-white bg-green-500 hover:bg-green-600 transition-colors duration-200 cursor-crosshair"
            style={{
              right: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}
          />
        </>
      )}
    </div>
  );
}