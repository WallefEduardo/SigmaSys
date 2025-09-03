import { Node, Edge, MarkerType } from 'reactflow';

export const initialNodes: Node[] = [
  {
    id: '1',
    type: 'start',
    position: { x: 250, y: 0 },
    data: { label: 'Iniciar Configuração' },
  },
  {
    id: '2',
    type: 'decision',
    position: { x: 200, y: 100 },
    data: {
      label: 'Tipo de Produto',
      question: 'Qual tipo de produto você deseja criar?',
      options: [
        { id: 'placa', label: 'Placa/Painel', targetNode: '3' },
        { id: 'banner', label: 'Banner/Lona', targetNode: '4' },
        { id: 'adesivo', label: 'Adesivo', targetNode: '5' },
      ],
    },
  },
  // Fluxo para Placas
  {
    id: '3',
    type: 'material',
    position: { x: 0, y: 250 },
    data: {
      label: 'Material da Placa',
      description: 'Selecione o material base',
      options: [
        { id: 'acrilico', name: 'Acrílico 3mm', cost: 120.00 },
        { id: 'pvc', name: 'PVC 5mm', cost: 85.00 },
        { id: 'ps', name: 'PS 2mm', cost: 65.00 },
        { id: 'mdf', name: 'MDF 15mm', cost: 45.00 },
      ],
    },
  },
  // Fluxo para Banners
  {
    id: '4',
    type: 'material',
    position: { x: 250, y: 250 },
    data: {
      label: 'Material do Banner',
      description: 'Selecione o tipo de lona',
      options: [
        { id: 'lona440', name: 'Lona 440g', cost: 28.00 },
        { id: 'lona380', name: 'Lona 380g', cost: 22.00 },
        { id: 'lonabrilho', name: 'Lona com Brilho', cost: 35.00 },
      ],
    },
  },
  // Fluxo para Adesivos
  {
    id: '5',
    type: 'material',
    position: { x: 500, y: 250 },
    data: {
      label: 'Material do Adesivo',
      description: 'Selecione o tipo de vinil',
      options: [
        { id: 'vinilbranco', name: 'Vinil Branco Brilho', cost: 18.00 },
        { id: 'vinilfosco', name: 'Vinil Branco Fosco', cost: 22.00 },
        { id: 'viniltrans', name: 'Vinil Transparente', cost: 25.00 },
        { id: 'vinilperf', name: 'Vinil Perfurado', cost: 32.00 },
      ],
    },
  },
  // Processos para Placas
  {
    id: '6',
    type: 'process',
    position: { x: 0, y: 400 },
    data: {
      label: 'Processo de Impressão',
      description: 'Como será aplicada a arte?',
      options: [
        { id: 'uv', name: 'Impressão UV', time: '2h', cost: 150.00 },
        { id: 'adesivacao', name: 'Adesivação', time: '1h', cost: 80.00 },
        { id: 'recorte', name: 'Recorte Vinil', time: '1.5h', cost: 60.00 },
      ],
    },
  },
  // Processos para Banners
  {
    id: '7',
    type: 'process',
    position: { x: 250, y: 400 },
    data: {
      label: 'Acabamento do Banner',
      description: 'Selecione o acabamento',
      options: [
        { id: 'ilhos', name: 'Ilhós', time: '30min', cost: 15.00 },
        { id: 'bastao', name: 'Bastão e Corda', time: '20min', cost: 25.00 },
        { id: 'solda', name: 'Solda Reforçada', time: '40min', cost: 35.00 },
      ],
    },
  },
  // Processos para Adesivos
  {
    id: '8',
    type: 'process',
    position: { x: 500, y: 400 },
    data: {
      label: 'Acabamento do Adesivo',
      description: 'Tipo de corte',
      options: [
        { id: 'reto', name: 'Corte Reto', time: '15min', cost: 10.00 },
        { id: 'especial', name: 'Corte Especial', time: '45min', cost: 40.00 },
        { id: 'meio-corte', name: 'Meio Corte', time: '30min', cost: 25.00 },
      ],
    },
  },
  // Node final
  {
    id: '9',
    type: 'end',
    position: { x: 250, y: 550 },
    data: {
      label: 'Configuração Completa',
      summary: {
        materials: [],
        processes: [],
        totalCost: 0,
      },
    },
  },
];

export const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
  },
  // Conexões do Decision Node
  {
    id: 'e2-3',
    source: '2',
    sourceHandle: 'decision-0',
    target: '3',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#10b981' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#10b981',
    },
  },
  {
    id: 'e2-4',
    source: '2',
    sourceHandle: 'decision-1',
    target: '4',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#3b82f6' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#3b82f6',
    },
  },
  {
    id: 'e2-5',
    source: '2',
    sourceHandle: 'decision-2',
    target: '5',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#f59e0b' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#f59e0b',
    },
  },
  // Conexões para processos
  {
    id: 'e3-6',
    source: '3',
    target: '6',
    type: 'smoothstep',
  },
  {
    id: 'e4-7',
    source: '4',
    target: '7',
    type: 'smoothstep',
  },
  {
    id: 'e5-8',
    source: '5',
    target: '8',
    type: 'smoothstep',
  },
  // Conexões para o fim
  {
    id: 'e6-9',
    source: '6',
    target: '9',
    type: 'smoothstep',
  },
  {
    id: 'e7-9',
    source: '7',
    target: '9',
    type: 'smoothstep',
  },
  {
    id: 'e8-9',
    source: '8',
    target: '9',
    type: 'smoothstep',
  },
];