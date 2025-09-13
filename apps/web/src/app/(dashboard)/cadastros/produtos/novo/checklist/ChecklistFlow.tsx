"use client";

import React, {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useState,
} from "react";
import ReactFlow, {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	Background,
	type Connection,
	Controls,
	type Edge,
	type EdgeChange,
	MiniMap,
	type Node,
	type NodeChange,
	ReactFlowProvider,
} from "reactflow";
import { SimpleAutoSaveIndicator } from "./AutoSaveIndicator";
import BlockPalette from "./BlockPalette";
import { ChecklistProvider, useChecklist } from "./ChecklistProvider";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EndNode from "./EndNode";
import QuestionModal from "./QuestionModal";
import QuestionNode from "./QuestionNode";
import StartNode from "./StartNode";

import "reactflow/dist/style.css";

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
	function ChecklistFlow(
		{ onComplete, initialData, onAddQuestion, productId, forceInitialData },
		ref,
	) {
		return (
			<ChecklistProvider
				onConfigurationChange={onComplete}
				initialData={initialData}
				enableAutoSave={true} // 🚀 Habilitar auto-save
				productId={productId || "temp_draft"} // 🆔 Use ID específico ou fallback para drafts
				forceInitialData={forceInitialData} // 🎯 Force usar initialData quando editando produto existente
			>
				<ReactFlowProvider>
					<ChecklistFlowInternal
						ref={ref}
						onComplete={onComplete}
						initialData={initialData}
						onAddQuestion={onAddQuestion}
					/>
				</ReactFlowProvider>
			</ChecklistProvider>
		);
	},
);

function ChecklistFlowInternal({
	onComplete,
	initialData,
	onAddQuestion,
	ref,
}: ChecklistFlowProps & { ref: React.Ref<ChecklistFlowRef> }) {
	const { state, addNode, updateNode, removeNode, updateEdges, dispatch } =
		useChecklist();
	const { nodes, edges, nextNodeId, viewport } = state;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingNode, setEditingNode] = useState<Node | null>(null);
	const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
	const [isDeletingNode, setIsDeletingNode] = useState(false);
	const [showAddQuestionScreen, setShowAddQuestionScreen] = useState(false);
	const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
	const [draggedNodeData, setDraggedNodeData] = useState<any>(null);

	// Expor função de adicionar pergunta via ref (agora abre tela dedicada)
	const handleOpenAddQuestionModal = useCallback(() => {
		setEditingNode(null); // Garantir que não está editando quando abrindo modal para nova pergunta
		setShowAddQuestionScreen(true);
	}, []);

	useImperativeHandle(
		ref,
		() => ({
			openAddQuestionModal: handleOpenAddQuestionModal,
		}),
		[handleOpenAddQuestionModal],
	);

	const handleEditNode = useCallback(
		(nodeId: string) => {
			const nodeToEdit = nodes.find((node) => node.id === nodeId);
			if (nodeToEdit && nodeToEdit.type === "question") {
				setEditingNode(nodeToEdit);
				setIsModalOpen(true);
			}
		},
		[nodes],
	);

	const handleDeleteNode = useCallback((nodeId: string) => {
		setDeleteNodeId(nodeId);
	}, []);

	const confirmDeleteNode = useCallback(async () => {
		if (!deleteNodeId) return;

		setIsDeletingNode(true);

		try {
			// Simular um pequeno delay para UX
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Deletar o node e suas conexões
			removeNode(deleteNodeId);

			// Fechar modal
			setDeleteNodeId(null);
		} catch (error) {
			console.error("Erro ao deletar pergunta:", error);
		} finally {
			setIsDeletingNode(false);
		}
	}, [deleteNodeId, removeNode]);

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			const updatedNodes = applyNodeChanges(changes, nodes);
			dispatch({ type: "UPDATE_NODES", payload: updatedNodes });
		},
		[nodes, dispatch],
	);

	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			const updatedEdges = applyEdgeChanges(changes, edges);
			updateEdges(updatedEdges);
		},
		[edges, updateEdges],
	);

	const onConnect = useCallback(
		(params: Edge | Connection) => {
			// Criar edge com ID único e metadados para sequência
			const enhancedParams = {
				...params,
				id: params.id || `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				type: params.type || 'smoothstep',
				// Adicionar metadados para facilitar navegação sequencial
				data: {
					createdAt: new Date().toISOString(),
					sourceNodeType: nodes.find(n => n.id === params.source)?.type,
					targetNodeType: nodes.find(n => n.id === params.target)?.type,
				}
			};
			
			const newEdges = addEdge(enhancedParams, edges);
			updateEdges(newEdges);
		},
		[edges, updateEdges, nodes],
	);

	// 🔍 Capturar mudanças de viewport (zoom, pan)
	const onMove = useCallback(
		(event: any, viewport: { x: number; y: number; zoom: number }) => {
			dispatch({ type: "UPDATE_VIEWPORT", payload: viewport });
		},
		[dispatch],
	);

	// 🎯 Drag & Drop handlers
	const onDragStart = useCallback((event: React.DragEvent, nodeType: string, nodeData: any) => {
		setDraggedNodeType(nodeType);
		setDraggedNodeData(nodeData);
		event.dataTransfer.setData('application/reactflow', nodeType);
		event.dataTransfer.effectAllowed = 'move';
	}, []);

	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();

			if (!draggedNodeType || !draggedNodeData) return;

			// Obter posição do drop no canvas
			const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
			if (!reactFlowBounds) return;

			const position = {
				x: event.clientX - reactFlowBounds.left - 150, // Centralizar o node
				y: event.clientY - reactFlowBounds.top - 50,
			};

			// Criar ID único para o novo node
			const nodeId = `${draggedNodeType}-${nextNodeId}`;
			
			const newNode: Node = {
				id: nodeId,
				type: draggedNodeType,
				position,
				data: {
					...draggedNodeData,
					onEdit: draggedNodeType === 'question' ? () => handleEditNode(nodeId) : undefined,
					onDelete: draggedNodeType === 'question' ? () => handleDeleteNode(nodeId) : undefined,
				},
			};

			addNode(newNode);

			// Reset drag state
			setDraggedNodeType(null);
			setDraggedNodeData(null);
		},
		[draggedNodeType, draggedNodeData, nextNodeId, addNode, handleEditNode, handleDeleteNode],
	);

	interface QuestionData {
		question: string;
		description?: string;
		responseType: "single" | "multiple" | "conditional";
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
			setIsModalOpen(false);
		} else {
			// Criando novo node
			const nodeId = `question-${nextNodeId}`;
			
			// Calcular posição baseada no número de nodes existentes (não incluindo start)
			const questionNodes = nodes.filter(node => node.type === 'question');
			const positionY = questionNodes.length * 220 + 150; // Espaçamento maior entre cards
			
			const newNode: Node = {
				id: nodeId,
				type: "question",
				position: { x: 300, y: positionY },
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
					id: "start",
					type: "start",
					position: { x: 300, y: 50 },
					data: { label: "Início" },
				};

				addNode(startNode);
				addNode(newNode);

				// Conectar start ao primeiro question
				const edge: Edge = {
					id: "e-start-question1",
					source: "start",
					target: newNode.id,
				};

				updateEdges([edge]);
			} else {
				// Verificar se start node existe
				const hasStartNode = nodes.some(node => node.type === 'start' || node.id === 'start');
				
				if (!hasStartNode) {
					const startNode: Node = {
						id: "start",
						type: "start",
						position: { x: 300, y: 50 },
						data: { label: "Início" },
					};
					addNode(startNode);
				}
				
				addNode(newNode);
			}
		}
		
		// Limpar estado de edição
		setEditingNode(null);
		setIsModalOpen(false);
		
		// Fechar a tela de adicionar pergunta após salvar
		setShowAddQuestionScreen(false);
	};

	// 📝 Handle inline update of node data
	const handleUpdateNode = useCallback((nodeId: string, field: string, value: any) => {
		updateNode(nodeId, { [field]: value });
	}, [updateNode]);

	// Adicionar callbacks aos nodes (SEM LOGS para evitar spam)
	const nodesWithCallbacks = React.useMemo(() => {
		return nodes.map((node) => ({
			...node,
			data:
				node.type === "question"
					? {
							...node.data,
							onEdit: () => handleEditNode(node.id),
							onDelete: () => handleDeleteNode(node.id),
							onUpdate: (field: string, value: any) => handleUpdateNode(node.id, field, value),
						}
					: node.data,
		}));
	}, [nodes, handleEditNode, handleDeleteNode, handleUpdateNode]);

	// Debug removido para produção

	// Se estiver na tela de adicionar pergunta, mostrar apenas ela
	if (showAddQuestionScreen) {
		return (
			<div className="space-y-6">
				{/* Header da tela de adicionar pergunta */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={() => setShowAddQuestionScreen(false)}
							className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
						>
							← Voltar ao Checklist
						</button>
						<h2 className="text-xl font-semibold">Nova Pergunta</h2>
					</div>
				</div>
				
				{/* Formulário de pergunta em tela cheia */}
				<QuestionModal
					isOpen={true}
					onClose={() => setShowAddQuestionScreen(false)}
					onSave={handleAddQuestion}
					initialData={null}
					isEditing={false}
					fullScreen={true}
				/>
			</div>
		);
	}

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

			{/* Layout com Sidebar + Canvas */}
			<div className="flex h-[600px] w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
				{/* Sidebar com Blocos */}
				<BlockPalette onDragStart={onDragStart} />
				
				{/* Canvas Area */}
				<div className="relative flex-1 bg-gray-900">
					{/* 💾 Auto-Save Indicator */}
					<div className="absolute top-3 right-3 z-10">
						<SimpleAutoSaveIndicator />
					</div>
					<ReactFlow
						onDragOver={onDragOver}
						onDrop={onDrop}
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
						style: { stroke: "#6366f1", strokeWidth: 2 },
						type: "smoothstep",
					}}
					connectionLineStyle={{ stroke: "#6366f1", strokeWidth: 2 }}
					style={{
						width: "100%",
						height: "100%",
						backgroundColor: "#111827",
					}}
				>
					<Background color="#374151" gap={20} size={1} variant="dots" />
					<MiniMap
						style={{
							height: 120,
							width: 180,
							backgroundColor: "#1f2937",
							border: "1px solid #374151",
						}}
						maskColor="rgba(0, 0, 0, 0.6)"
						nodeColor="#60a5fa"
						zoomable
						pannable
					/>
					<Controls
						style={{
							button: {
								backgroundColor: "#1f2937",
								border: "1px solid #374151",
								color: "#f3f4f6",
							},
						}}
					/>
					</ReactFlow>
				</div>
			</div>
		</>
	);
}

export default ChecklistFlow;
export type { ChecklistFlowRef };
