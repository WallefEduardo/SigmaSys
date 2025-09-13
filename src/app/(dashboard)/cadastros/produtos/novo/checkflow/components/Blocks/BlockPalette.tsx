'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  Play,
  MessageSquare,
  Zap,
  Calculator,
  GitBranch,
  Square,
  Package,
  Cpu,
  Settings,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDraggablePaletteItem } from '../../hooks/useDragAndDrop';
import { createBlock } from '../../utils/blockFactory';
import type { BlockType } from '../../types/flow.types';

interface BlockPaletteProps {
  className?: string;
}

interface PaletteCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  blocks: PaletteBlock[];
}

interface PaletteBlock {
  type: BlockType;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultData?: any;
}

export default function BlockPalette({ className = "" }: BlockPaletteProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const categories: PaletteCategory[] = [
    {
      id: 'flow',
      name: 'Fluxo',
      icon: <Play className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      blocks: [
        {
          type: 'start',
          name: 'Início',
          description: 'Ponto de partida do fluxo',
          icon: <Play className="h-4 w-4" />,
          defaultData: { label: 'Início do Checklist' },
        },
        {
          type: 'end',
          name: 'Fim',
          description: 'Finaliza o fluxo',
          icon: <Square className="h-4 w-4" />,
          defaultData: { label: 'Fim do Checklist', summary: true },
        },
      ],
    },
    {
      id: 'input',
      name: 'Entrada',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      blocks: [
        {
          type: 'question',
          name: 'Pergunta',
          description: 'Pergunta para o usuário',
          icon: <MessageSquare className="h-4 w-4" />,
          defaultData: {
            question: 'Qual o tipo de material?',
            responseType: 'single',
            options: [
              { id: '1', label: 'ACM', actions: [] },
              { id: '2', label: 'PVC', actions: [] },
            ],
          },
        },
        {
          type: 'collector',
          name: 'Coletor',
          description: 'Coleta dados específicos',
          icon: <Calculator className="h-4 w-4" />,
          defaultData: {
            collectorType: 'measurements',
            fields: [
              { id: '1', name: 'Largura', type: 'number', required: true },
              { id: '2', name: 'Altura', type: 'number', required: true },
            ],
          },
        },
      ],
    },
    {
      id: 'logic',
      name: 'Lógica',
      icon: <GitBranch className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      blocks: [
        {
          type: 'condition',
          name: 'Condição',
          description: 'Decisão condicional',
          icon: <GitBranch className="h-4 w-4" />,
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
      name: 'Ações',
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      blocks: [
        {
          type: 'action',
          name: 'Material',
          description: 'Adicionar material',
          icon: <Package className="h-4 w-4" />,
          defaultData: {
            actionType: 'add_material',
            name: 'Adicionar Material',
            items: [],
          },
        },
        {
          type: 'action',
          name: 'Processo',
          description: 'Adicionar processo',
          icon: <Cpu className="h-4 w-4" />,
          defaultData: {
            actionType: 'add_process',
            name: 'Adicionar Processo',
            items: [],
          },
        },
        {
          type: 'action',
          name: 'Equipamento',
          description: 'Adicionar equipamento',
          icon: <Settings className="h-4 w-4" />,
          defaultData: {
            actionType: 'add_equipment',
            name: 'Adicionar Equipamento',
            items: [],
          },
        },
        {
          type: 'action',
          name: 'Acabamento',
          description: 'Adicionar acabamento',
          icon: <Palette className="h-4 w-4" />,
          defaultData: {
            actionType: 'add_finish',
            name: 'Adicionar Acabamento',
            items: [],
          },
        },
      ],
    },
  ];

  return (
    <div className={`w-80 h-full border-r bg-white dark:bg-gray-900 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Blocos de CheckFlow
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Arraste os blocos para o canvas
        </p>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {categories.map((category) => {
            const isCollapsed = collapsedCategories.has(category.id);

            return (
              <div key={category.id} className="space-y-2">
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <Badge className={category.color} variant="secondary">
                      {category.icon}
                      <span className="ml-1">{category.name}</span>
                    </Badge>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>

                {/* Category Blocks */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      {category.blocks.map((block) => (
                        <PaletteBlockItem
                          key={`${category.id}-${block.type}`}
                          block={block}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          💡 Dica: Clique e arraste para adicionar
        </div>
      </div>
    </div>
  );
}

// Individual palette block item
function PaletteBlockItem({ block }: { block: PaletteBlock }) {
  const { setNodeRef, attributes, listeners, style, isDragging } = useDraggablePaletteItem(
    block.type,
    block.defaultData
  );

  return (
    <Card
      ref={setNodeRef}
      className={`cursor-grab border-gray-200 transition-all hover:border-primary hover:shadow-sm dark:border-gray-700 ${
        isDragging ? 'opacity-50 cursor-grabbing' : ''
      }`}
      style={style}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 rounded-md bg-gray-100 p-1.5 dark:bg-gray-700">
            {block.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="truncate font-medium text-gray-900 text-sm dark:text-gray-100">
              {block.name}
            </h4>
            <p className="mt-1 text-gray-600 text-xs dark:text-gray-400 line-clamp-2">
              {block.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}