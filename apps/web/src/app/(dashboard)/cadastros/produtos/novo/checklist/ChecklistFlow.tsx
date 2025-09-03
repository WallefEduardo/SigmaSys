"use client";

import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useOnViewportChange,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
} from 'reactflow';

import { initialNodes, initialEdges } from './initial-elements';
import StartNode from './nodes/StartNode';
import MaterialNode from './nodes/MaterialNode';
import ProcessNode from './nodes/ProcessNode';
import DecisionNode from './nodes/DecisionNode';
import EndNode from './nodes/EndNode';
import QuestionNode from './nodes/QuestionNode';
import QuestionModal from './QuestionModal';
import { ChecklistProvider, useChecklist } from './ChecklistProvider';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

import 'reactflow/dist/style.css';
import './checklist-flow.css';

const nodeTypes = {
  start: StartNode,
  material: MaterialNode,
  process: ProcessNode,
  decision: DecisionNode,
  end: EndNode,
  question: QuestionNode,
};

interface ChecklistFlowProps {
  onComplete?: (data: any) => void;
  initialData?: any; // Para carregar dados existentes ao editar
  onAddQuestion?: () => void;
}

function ChecklistFlowContent({ onComplete, initialData, onAddQuestion }: ChecklistFlowProps) {
  const { state, updateNode, addNode, updateEdges, dispatch } = useChecklist();
  const { nodes, edges, selections, nextNodeId, viewport } = state;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const viewportTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expor função de adicionar pergunta para o componente pai
  useEffect(() => {
    if (onAddQuestion) {
      // Esta é uma forma de expor a função - pode ser melhorada com useImperativeHandle se necessário
      (window as any).openAddQuestionModal = () => setIsModalOpen(true);
    }
  }, [onAddQuestion]);

  const handleEditNode = useCallback((nodeId: string) => {
    const nodeToEdit = nodes.find(node => node.id === nodeId);
    if (nodeToEdit && nodeToEdit.type === 'question') {
      setEditingNode(nodeToEdit);
      setIsModalOpen(true);
    }
  }, [nodes]);

  // Adicionar callbacks aos nodes quando necessário
  const addCallbacksToNodes = useCallback((nodesList: Node[]) => {
    return nodesList.map((node: any) => ({
      ...node,
      data: node.type === 'question' ? {
        ...node.data,
        onSelect: (optionId: string) => {
          console.log('Option selected:', optionId);
        },
        onEdit: () => handleEditNode(node.id),
      } : node.data
    }));
  }, [handleEditNode]);

  const onConnect = useCallback((params: Edge | Connection) => {
    const updatedEdges = addEdge(params, edges);
    updateEdges(updatedEdges);
    console.log('🔄 CHECKLISTFLOW - Edge conectada:', params);
  }, [edges, updateEdges]);

  // Handler para mudanças nos nodes (posição, remoção, etc)
  const handleNodesChange = useCallback((changes: any) => {
    const updatedNodes = nodes.map((node: Node) => {
      for (const change of changes) {
        if (change.id === node.id) {
          switch (change.type) {
            case 'position':
              if (!change.dragging) { // Só atualizar quando parar de arrastar
                return { ...node, position: change.position };
              }
              break;
            case 'remove':
              return null; // Será filtrado depois
            case 'select':
              return { ...node, selected: change.selected };
          }
        }
      }
      return node;
    }).filter(Boolean) as Node[];

    // Se houve mudanças reais, atualizar o estado
    if (JSON.stringify(updatedNodes) !== JSON.stringify(nodes)) {
      dispatch({ type: 'UPDATE_NODES', payload: updatedNodes });
      console.log('🔄 CHECKLISTFLOW - Nodes atualizados:', changes);
    }
  }, [nodes, dispatch]);

  // Handler para mudanças nas edges (remoção, etc)
  const handleEdgesChange = useCallback((changes: any) => {
    const updatedEdges = edges.filter((edge: Edge) => {
      for (const change of changes) {
        if (change.id === edge.id && change.type === 'remove') {
          return false;
        }
      }
      return true;
    });

    // Se houve remoções, atualizar o estado
    if (updatedEdges.length !== edges.length) {
      updateEdges(updatedEdges);
      console.log('🔄 CHECKLISTFLOW - Edges atualizadas:', changes);
    }
  }, [edges, updateEdges]);

  // Hook para detectar mudanças de viewport
  useOnViewportChange({
    onStart: (viewport) => {
      // Cancelar timeout anterior se existir
      if (viewportTimeoutRef.current) {
        clearTimeout(viewportTimeoutRef.current);
      }
    },
    onEnd: (viewport) => {
      // Debounce para evitar muitos updates durante drag/zoom
      viewportTimeoutRef.current = setTimeout(() => {
        dispatch({ type: 'UPDATE_VIEWPORT', payload: viewport });
        console.log('🔄 CHECKLISTFLOW - Viewport atualizado:', viewport);
        viewportTimeoutRef.current = null;
      }, 300); // 300ms de delay
    },
  });

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    
    // Update selections based on node type and data
    if (node.type === 'material' && node.data.onSelect) {
      const newSelections = {
        ...selections,
        materials: [...selections.materials, node.id],
      };
      dispatch({ type: 'UPDATE_SELECTIONS', payload: newSelections });
    } else if (node.type === 'process' && node.data.onSelect) {
      const newSelections = {
        ...selections,
        processes: [...selections.processes, node.id],
      };
      dispatch({ type: 'UPDATE_SELECTIONS', payload: newSelections });
    }
  }, [selections, dispatch]);

  const handleAddQuestion = (questionData: any) => {
    if (editingNode) {
      // Editando node existente
      console.log('🔍 CHECKLISTFLOW - Editando node existente:', editingNode.id);
      
      // Processar os dados para garantir compatibilidade com QuestionNode
      const processedQuestionData = {
        ...questionData,
        options: questionData.options.map((option: any) => ({
          ...option,
          actions: option.actions.map((action: any) => ({
            ...action,
            // Garantir que itemName sempre existe para o QuestionNode
            itemName: action.itemName || action.itemId || 'Item não definido'
          }))
        })),
        onSelect: (optionId: string) => {
          console.log('Option selected:', optionId);
        },
        onEdit: () => handleEditNode(editingNode.id),
        // Adicionar timestamp para forçar re-render
        __timestamp: Date.now(),
      };
      
      console.log('🔍 CHECKLISTFLOW - Dados processados:', processedQuestionData);
      updateNode(editingNode.id, processedQuestionData);
      
      setEditingNode(null);
    } else {
      // Criando novo node
      console.log('🔍 CHECKLISTFLOW - Criando novo node');
      const nodeId = `node-${nextNodeId}`;
      const newNode: Node = {
        id: nodeId,
        type: 'question',
        position: { x: 250, y: nodes.length * 150 },
        data: {
          ...questionData,
          onSelect: (optionId: string) => {
            console.log('Option selected:', optionId);
          },
          onEdit: () => handleEditNode(nodeId),
        },
      };

      // If this is the first node, make it the start node
      if (nodes.length === 0) {
        const startNode: Node = {
          id: 'start',
          type: 'start',
          position: { x: 250, y: 0 },
          data: { label: 'Início' },
        };
        
        // Adicionar ambos os nodes
        addNode(startNode);
        addNode(newNode);
        
        // Connect start to first question
        const edge: Edge = {
          id: 'e-start-1',
          source: 'start',
          target: newNode.id,
          type: 'smoothstep',
        };
        updateEdges([edge]);
      } else {
        addNode(newNode);
      }
      
      dispatch({ type: 'INCREMENT_NODE_ID' });
    }
  };

  return (
    <>
      <QuestionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNode(null);
        }}
        onSave={handleAddQuestion}
        initialData={editingNode?.data}
        isEditing={!!editingNode}
      />
      
      <div className="w-full h-[600px] border rounded-lg overflow-hidden relative">
      <ReactFlow
        nodes={addCallbacksToNodes(nodes)}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        defaultViewport={viewport}
        nodeTypes={nodeTypes}
        fitView={nodes.length === 0} // Só fit view se não houver dados salvos
        attributionPosition="bottom-left"
      >
        <Background color="#e5e7eb" gap={16} />
        <MiniMap 
          style={{
            height: 100,
            width: 150,
          }}
          zoomable
          pannable
        />
        <Controls />
      </ReactFlow>
      </div>
    </>
  );
}

export default function ChecklistFlow({ onComplete, initialData, onAddQuestion }: ChecklistFlowProps) {
  return (
    <ChecklistProvider onConfigurationChange={onComplete} initialData={initialData}>
      <ReactFlowProvider>
        <ChecklistFlowContent onComplete={onComplete} initialData={initialData} onAddQuestion={onAddQuestion} />
      </ReactFlowProvider>
    </ChecklistProvider>
  );
}