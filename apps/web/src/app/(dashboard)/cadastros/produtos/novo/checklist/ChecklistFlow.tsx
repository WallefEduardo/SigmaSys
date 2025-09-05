"use client";

import React, { useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

import QuestionNode from './QuestionNode';
import StartNode from './StartNode';
import EndNode from './EndNode';
import QuestionModal from './QuestionModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { ChecklistProvider, useChecklist } from './ChecklistProvider';
import { SimpleAutoSaveIndicator } from './AutoSaveIndicator';

import 'reactflow/dist/style.css';

const nodeTypes = {
  start: StartNode,
  question: QuestionNode,
  end: EndNode,
};

interface ChecklistConfiguration {
  nodes: Node[];
  edges: Edge[];
  selections: {
    productType: string | null;
    materials: string[];
    processes: string[];
    equipment: string[];
    finishes: string[];
  };
}

interface ChecklistFlowProps {
  onComplete?: (data: ChecklistConfiguration) => void;
  initialData?: ChecklistConfiguration;
  onAddQuestion?: () => void;
  productId?: string;
  forceInitialData?: boolean;
}

interface ChecklistFlowRef {
  openAddQuestionModal: () => void;
}

const ChecklistFlow = forwardRef<ChecklistFlowRef, ChecklistFlowProps>(
  function ChecklistFlow({ onComplete, initialData, onAddQuestion, productId, forceInitialData }, ref) {
    return (
      <ChecklistProvider 
        onConfigurationChange={onComplete} 
        initialData={initialData}
        enableAutoSave={true} // 🚀 Habilitar auto-save
        productId={productId || "temp_draft"} // 🆔 Use ID específico ou fallback para drafts
        forceInitialData={forceInitialData} // 🎯 Force usar initialData quando editando produto existente
      >
        <ReactFlowProvider>
          <ChecklistFlowInternal ref={ref} onComplete={onComplete} initialData={initialData} onAddQuestion={onAddQuestion} />
        </ReactFlowProvider>
      </ChecklistProvider>
    );
  }
);

function ChecklistFlowInternal({ onComplete, initialData, onAddQuestion, ref }: ChecklistFlowProps & { ref: React.Ref<ChecklistFlowRef> }) {
  const { state, addNode, updateNode, removeNode, updateEdges, dispatch } = useChecklist();
  const { nodes, edges, nextNodeId, viewport } = state;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
  const [isDeletingNode, setIsDeletingNode] = useState(false);

  // Expor função de adicionar pergunta via ref
  const handleOpenAddQuestionModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({
    openAddQuestionModal: handleOpenAddQuestionModal
  }), [handleOpenAddQuestionModal]);

  const handleEditNode = useCallback((nodeId: string) => {
    const nodeToEdit = nodes.find(node => node.id === nodeId);
    if (nodeToEdit && nodeToEdit.type === 'question') {
      setEditingNode(nodeToEdit);
      setIsModalOpen(true);
    }
  }, [nodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setDeleteNodeId(nodeId);
  }, []);

  const confirmDeleteNode = useCallback(async () => {
    if (!deleteNodeId) return;
    
    setIsDeletingNode(true);
    
    try {
      // Simular um pequeno delay para UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Deletar o node e suas conexões
      removeNode(deleteNodeId);
      
      // Fechar modal
      setDeleteNodeId(null);
    } catch (error) {
      console.error('Erro ao deletar pergunta:', error);
    } finally {
      setIsDeletingNode(false);
    }
  }, [deleteNodeId, removeNode]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    dispatch({ type: 'UPDATE_NODES', payload: updatedNodes });
  }, [nodes, dispatch]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const updatedEdges = applyEdgeChanges(changes, edges);
    updateEdges(updatedEdges);
  }, [edges, updateEdges]);

  const onConnect = useCallback((params: Edge | Connection) => {
    const newEdges = addEdge(params, edges);
    updateEdges(newEdges);
  }, [edges, updateEdges]);

  // 🔍 Capturar mudanças de viewport (zoom, pan) 
  const onMove = useCallback((event: any, viewport: { x: number; y: number; zoom: number }) => {
    dispatch({ type: 'UPDATE_VIEWPORT', payload: viewport });
  }, [dispatch]);

  interface QuestionData {
    question: string;
    description?: string;
    responseType: 'single' | 'multiple' | 'conditional';
    options: Array<{
      id: string;
      label: string;
      actions: Array<{
        type: string;
        itemName: string;
        quantity?: number;
      }>;
    }>;
  }

  const handleAddQuestion = (questionData: QuestionData) => {
    if (editingNode) {
      // Editando node existente
      updateNode(editingNode.id, {
        ...questionData,
        onSelect: (optionId: string) => {
          // Option selected callback
        },
        onEdit: () => handleEditNode(editingNode.id),
        onDelete: () => handleDeleteNode(editingNode.id),
      });
      setEditingNode(null);
    } else {
      // Criando novo node
      const nodeId = `node-${nextNodeId}`;
      const newNode: Node = {
        id: nodeId,
        type: 'question',
        position: { x: 250, y: nodes.length * 200 + 50 },
        data: {
          ...questionData,
          onSelect: (optionId: string) => {
            // Option selected callback
          },
          onEdit: () => handleEditNode(nodeId),
          onDelete: () => handleDeleteNode(nodeId),
        },
      };

      // Se não há nodes, adicionar também um start node
      if (nodes.length === 0) {
        const startNode: Node = {
          id: 'start',
          type: 'start',
          position: { x: 250, y: 0 },
          data: { label: 'Início' },
        };
        
        addNode(startNode);
        addNode(newNode);
        
        // Conectar start ao primeiro question
        const edge: Edge = {
          id: 'e-start-1',
          source: 'start',
          target: newNode.id,
        };
        
        updateEdges([edge]);
      } else {
        addNode(newNode);
      }
      
      // ✅ INCREMENT_NODE_ID já é chamado dentro do addNode() no ChecklistProvider
      // Remoção da duplicação que causava pulo de IDs
    }
  };

  // Adicionar callbacks aos nodes (SEM LOGS para evitar spam)
  const nodesWithCallbacks = React.useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: node.type === 'question' 
        ? {
            ...node.data,
            onEdit: () => handleEditNode(node.id),
            onDelete: () => handleDeleteNode(node.id),
          }
        : node.data,
    }));
  }, [nodes, handleEditNode, handleDeleteNode]);

  // Debug removido para produção

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
      
      <DeleteConfirmModal
        isOpen={!!deleteNodeId}
        onClose={() => setDeleteNodeId(null)}
        onConfirm={confirmDeleteNode}
        title="Deletar Pergunta"
        description="Tem certeza que deseja deletar esta pergunta? Esta ação não pode ser desfeita e todas as conexões relacionadas serão removidas."
        isDeleting={isDeletingNode}
      />
      
      <div className="relative w-full h-[600px] border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
        {/* 💾 Auto-Save Indicator */}
        <div className="absolute top-3 right-3 z-10">
          <SimpleAutoSaveIndicator />
        </div>
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          viewport={viewport}
          onMove={onMove}
          fitView={nodes.length === 0}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
          defaultEdgeOptions={{
            style: { stroke: '#6366f1', strokeWidth: 2 },
            type: 'smoothstep',
          }}
          connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
          style={{ 
            width: '100%', 
            height: '100%',
            backgroundColor: '#111827'
          }}
        >
          <Background 
            color="#374151" 
            gap={20} 
            size={1}
            variant="dots"
          />
          <MiniMap 
            style={{
              height: 120,
              width: 180,
              backgroundColor: '#1f2937',
              border: '1px solid #374151'
            }}
            maskColor="rgba(0, 0, 0, 0.6)"
            nodeColor="#60a5fa"
            zoomable
            pannable
          />
          <Controls 
            style={{
              button: {
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                color: '#f3f4f6'
              }
            }}
          />
        </ReactFlow>
      </div>
    </>
  );
}

export default ChecklistFlow;
export type { ChecklistFlowRef };