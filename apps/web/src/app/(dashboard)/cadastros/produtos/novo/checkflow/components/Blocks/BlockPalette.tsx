'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search,
  Play,
  MessageSquare,
  Zap,
  Calculator,
  GitBranch,
  Square,
  Package,
  Cpu,
  Settings,
  Palette,
  Hash,
  Mail,
  Calendar,
  Phone,
  Star,
  CreditCard,
  FileText,
  Image,
  Video,
  Volume2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDraggablePaletteItem } from '../../hooks/useDragAndDrop';
import { createBlock } from '../../utils/blockFactory';
import type { BlockType } from '../../types/flow.types';

interface BlockPaletteProps {
  className?: string;
}

interface PaletteCategory {
  id: string;
  name: string;
  blocks: PaletteBlock[];
}

interface PaletteBlock {
  type: BlockType;
  name: string;
  icon: React.ReactNode;
  color: string;
  defaultData?: any;
}

export default function BlockPalette({ className = "" }: BlockPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');


  const categories: PaletteCategory[] = [
    {
      id: 'flow',
      name: 'Controle de Fluxo',
      blocks: [
        {
          type: 'start',
          name: 'Início',
          icon: <Play className="h-4 w-4" />,
          color: 'text-green-400',
          defaultData: { label: 'Início do Checklist' },
        },
      ],
    },
    {
      id: 'questions',
      name: 'Perguntas',
      blocks: [
        {
          type: 'question',
          name: 'Pergunta',
          icon: <MessageSquare className="h-4 w-4" />,
          color: 'text-blue-400',
          defaultData: {
            question: 'Qual o tipo de material?',
            responseType: 'single',
            options: [
              { id: '1', label: 'ACM', actions: [] },
              { id: '2', label: 'PVC', actions: [] },
              { id: '3', label: 'Adesivo', actions: [] },
            ],
          },
        },
        {
          type: 'collector',
          name: 'Medidas',
          icon: <Calculator className="h-4 w-4" />,
          color: 'text-yellow-400',
          defaultData: {
            collectorType: 'measurements',
            question: 'Informe as medidas:',
            fields: [
              { id: '1', name: 'Largura', type: 'number', required: true },
              { id: '2', name: 'Altura', type: 'number', required: true },
            ],
          },
        },
        {
          type: 'collector',
          name: 'Quantidade',
          icon: <Hash className="h-4 w-4" />,
          color: 'text-purple-400',
          defaultData: {
            collectorType: 'quantity',
            question: 'Qual a quantidade?',
          },
        },
      ],
    },
    {
      id: 'logic',
      name: 'Lógica',
      blocks: [
        {
          type: 'condition',
          name: 'Condição',
          icon: <GitBranch className="h-4 w-4" />,
          color: 'text-orange-400',
          defaultData: {
            condition: 'largura > 2',
            trueLabel: 'Grande',
            falseLabel: 'Pequeno',
          },
        },
      ],
    },
    {
      id: 'actions',
      name: 'Ações de Produto',
      blocks: [
        {
          type: 'action',
          name: 'Material',
          icon: <Package className="h-4 w-4" />,
          color: 'text-green-400',
          defaultData: {
            actionType: 'add_material',
            name: 'Adicionar Material',
            items: [],
          },
        },
        {
          type: 'action',
          name: 'Processo',
          icon: <Cpu className="h-4 w-4" />,
          color: 'text-blue-400',
          defaultData: {
            actionType: 'add_process',
            name: 'Adicionar Processo',
            items: [],
          },
        },
        {
          type: 'action',
          name: 'Equipamento',
          icon: <Settings className="h-4 w-4" />,
          color: 'text-cyan-400',
          defaultData: {
            actionType: 'add_equipment',
            name: 'Adicionar Equipamento',
            items: [],
          },
        },
        {
          type: 'action',
          name: 'Acabamento',
          icon: <Palette className="h-4 w-4" />,
          color: 'text-pink-400',
          defaultData: {
            actionType: 'add_finish',
            name: 'Adicionar Acabamento',
            items: [],
          },
        },
      ],
    },
  ];

  // Filter blocks based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    
    return categories.map(category => ({
      ...category,
      blocks: category.blocks.filter(block =>
        block.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.blocks.length > 0);
  }, [categories, searchQuery]);

  return (
    <div className={`w-80 h-full border-r bg-gray-900 text-white flex flex-col ${className}`}>
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-gray-600"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredCategories.map((category) => (
          <div key={category.id} className="mb-6">
            {/* Category Header */}
            <h3 className="text-yellow-400 font-medium text-sm mb-3 uppercase tracking-wide">
              {category.name}
            </h3>

            {/* Category Blocks - Grid Layout */}
            <div className="grid grid-cols-2 gap-2">
              {category.blocks.map((block, index) => (
                <TypebotBlockItem
                  key={`${category.id}-${block.type}-${index}`}
                  block={block}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Typebot-style block item (small and compact)
function TypebotBlockItem({ block }: { block: PaletteBlock }) {
  const { setNodeRef, attributes, listeners, style, isDragging } = useDraggablePaletteItem(
    block.type,
    block.defaultData
  );


  return (
    <div
      ref={setNodeRef}
      className={`
        relative cursor-grab rounded-lg bg-gray-800 hover:bg-gray-700 
        transition-all duration-200 border border-gray-700 hover:border-gray-600
        p-3 flex items-center gap-3 min-h-[48px] select-none
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
      `}
      style={style}
      {...attributes}
      {...listeners}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${block.color}`}>
        {block.icon}
      </div>
      
      {/* Block Name */}
      <div className="flex-1 min-w-0">
        <span className="text-white text-sm font-medium truncate">
          {block.name}
        </span>
      </div>

      {/* Drag Indicator (subtle dots) */}
      <div className="flex-shrink-0 opacity-40">
        <svg width="8" height="12" viewBox="0 0 8 12" className="text-gray-400">
          <circle cx="2" cy="2" r="1" fill="currentColor" />
          <circle cx="6" cy="2" r="1" fill="currentColor" />
          <circle cx="2" cy="6" r="1" fill="currentColor" />
          <circle cx="6" cy="6" r="1" fill="currentColor" />
          <circle cx="2" cy="10" r="1" fill="currentColor" />
          <circle cx="6" cy="10" r="1" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}