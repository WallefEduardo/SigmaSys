/**
 * Utilitários para estruturação e validação de checklist
 */

export interface ChecklistNode {
  id: string;
  type: string;
  position?: { x: number; y: number };
  data?: any;
}

export interface ChecklistEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  type?: string;
  data?: any;
}

export interface ChecklistStructure {
  nodes: ChecklistNode[];
  edges: ChecklistEdge[];
  selections?: any;
  metadata?: {
    version: string;
    createdAt: string;
    questionCount: number;
    hasConnections: boolean;
    questionSequence: Array<{
      id: string;
      question: string;
      position?: { x: number; y: number };
    }>;
    flowPath?: Array<{
      fromNodeId: string;
      toNodeId: string;
      connectionType: 'direct' | 'sequential' | 'conditional';
    }>;
  };
}

/**
 * Analisa e estrutura o checklist para garantir navegação sequencial robusta
 */
export function structureChecklistForSequentialFlow(
  nodes: ChecklistNode[],
  edges: ChecklistEdge[]
): ChecklistStructure {
  // Filtrar e ordenar perguntas por posição Y
  const questionNodes = nodes
    .filter(n => n.type === 'question')
    .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));

  const startNode = nodes.find(n => n.type === 'start');

  // Criar sequência lógica das perguntas
  const questionSequence = questionNodes.map(node => ({
    id: node.id,
    question: node.data?.question || '',
    position: node.position
  }));

  // Analisar conexões existentes
  const flowPath = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    let connectionType: 'direct' | 'sequential' | 'conditional' = 'direct';
    
    // Se tem sourceHandle, é uma conexão condicional (baseada em resposta específica)
    if (edge.sourceHandle) {
      connectionType = 'conditional';
    }
    // Se são nós sequenciais por posição, é sequencial
    else if (sourceNode && targetNode) {
      const sourceIndex = questionNodes.findIndex(n => n.id === sourceNode.id);
      const targetIndex = questionNodes.findIndex(n => n.id === targetNode.id);
      if (targetIndex === sourceIndex + 1) {
        connectionType = 'sequential';
      }
    }

    return {
      fromNodeId: edge.source,
      toNodeId: edge.target,
      connectionType
    };
  });

  return {
    nodes,
    edges,
    metadata: {
      version: "1.0",
      createdAt: new Date().toISOString(),
      questionCount: questionNodes.length,
      hasConnections: edges.length > 0,
      questionSequence,
      flowPath
    }
  };
}

/**
 * Encontra o próximo nó na sequência baseado na resposta atual
 */
export function findNextNodeInSequence(
  currentNodeId: string,
  optionId: string | null,
  checklistStructure: ChecklistStructure
): string | null {
  const { nodes, edges, metadata } = checklistStructure;

  // 1. Primeiro, procurar por conexão condicional específica (baseada na opção selecionada)
  if (optionId) {
    const conditionalEdge = edges.find(
      edge => edge.source === currentNodeId && edge.sourceHandle === optionId
    );
    if (conditionalEdge) {
      return conditionalEdge.target;
    }
  }

  // 2. Procurar por conexão direta do nó atual
  const directEdge = edges.find(edge => edge.source === currentNodeId);
  if (directEdge) {
    return directEdge.target;
  }

  // 3. Fallback: usar sequência baseada em posição Y (ordem visual)
  if (metadata?.questionSequence) {
    const currentIndex = metadata.questionSequence.findIndex(q => q.id === currentNodeId);
    if (currentIndex >= 0 && currentIndex < metadata.questionSequence.length - 1) {
      return metadata.questionSequence[currentIndex + 1].id;
    }
  }

  // 4. Se não há próximo nó, retornar null (fim do fluxo)
  return null;
}

/**
 * Valida se o checklist está bem estruturado para uso em ordem de serviço
 */
export function validateChecklistStructure(structure: ChecklistStructure): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Verificar se há perguntas
  if (!structure.metadata?.questionCount || structure.metadata.questionCount === 0) {
    issues.push("Checklist não possui perguntas");
  }

  // Verificar se há nó start
  const hasStartNode = structure.nodes.some(n => n.type === 'start');
  if (!hasStartNode) {
    suggestions.push("Adicione um nó de início para clareza do fluxo");
  }

  // Verificar se perguntas têm opções de resposta
  const questionNodes = structure.nodes.filter(n => n.type === 'question');
  questionNodes.forEach(node => {
    if (!node.data?.options || node.data.options.length === 0) {
      issues.push(`Pergunta "${node.data?.question || node.id}" não possui opções de resposta`);
    }
  });

  // Verificar conectividade
  if (structure.metadata?.hasConnections === false && questionNodes.length > 1) {
    suggestions.push("Conecte as perguntas para definir a sequência do fluxo");
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Gera um preview textual do fluxo do checklist
 */
export function generateFlowPreview(structure: ChecklistStructure): string {
  if (!structure.metadata?.questionSequence?.length) {
    return "Checklist vazio";
  }

  const preview = structure.metadata.questionSequence
    .map((q, index) => `${index + 1}. ${q.question}`)
    .join('\n');

  return preview;
}