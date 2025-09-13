// Flow Types - Sistema CheckFlow Custom

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface ConnectionPoint {
  id: string;
  type: 'input' | 'output';
  position: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  data?: any;
}

export type BlockType = 
  | 'start'
  | 'question'
  | 'action'
  | 'condition'
  | 'collector'
  | 'end';

export interface BlockData {
  [key: string]: any;
}

// Group interface - Sistema de grupos do Typebot
export interface Group {
  id: string;
  title: string;
  position: Position;
  blocks: Block[];
  graphCoordinates?: Position;
}

export interface Block {
  id: string;
  groupId: string; // Bloco sempre pertence a um grupo
  type: BlockType;
  position: Position;
  dimensions?: Dimensions;
  data: BlockData;
  inputs?: ConnectionPoint[];
  outputs?: ConnectionPoint[];
  ui: {
    color: string;
    icon: string;
    title: string;
    description?: string;
  };
  dragging?: boolean;
  selected?: boolean;
}

export interface FlowState {
  groups: Group[];
  blocks: Block[]; // Mantido para compatibilidade, mas blocos estarão nos grupos
  connections: Connection[];
  viewport: Viewport;
  selectedBlocks: string[];
  selectedGroups: string[];
  draggedBlock: string | null;
  isConnecting: boolean;
  connectionInProgress?: {
    sourceId: string;
    sourceHandle?: string;
    position: Position;
  };
}

export interface FlowActions {
  // Groups
  addGroup: (group: Omit<Group, 'id'>) => string;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  removeGroup: (id: string) => void;
  moveGroup: (id: string, position: Position) => void;
  duplicateGroup: (id: string) => string;
  addBlockToGroup: (groupId: string, block: Omit<Block, 'id' | 'groupId'>) => string;
  
  // Blocks
  addBlock: (block: Omit<Block, 'id'>) => string;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, position: Position) => void;
  
  // Connections
  addConnection: (connection: Omit<Connection, 'id'>) => string;
  removeConnection: (id: string) => void;
  
  // Selection
  selectBlock: (id: string) => void;
  selectMultipleBlocks: (ids: string[]) => void;
  selectGroup: (id: string) => void;
  clearSelection: () => void;
  
  // Viewport
  setViewport: (viewport: Partial<Viewport>) => void;
  
  // Drag & Drop
  startDrag: (blockId: string) => void;
  endDrag: () => void;
  
  // Connection mode
  startConnection: (sourceId: string, sourceHandle?: string) => void;
  endConnection: (targetId?: string, targetHandle?: string) => void;
  
  // Utils
  reset: () => void;
  loadFlow: (flow: { blocks: Block[]; connections: Connection[] }) => void;
  exportFlow: () => { blocks: Block[]; connections: Connection[] };
}

export type FlowStore = FlowState & FlowActions;

// Block-specific types
export interface StartBlockData extends BlockData {
  label: string;
}

export interface QuestionBlockData extends BlockData {
  question: string;
  description?: string;
  responseType: 'single' | 'multiple' | 'conditional';
  options: Array<{
    id: string;
    label: string;
    actions?: Array<{
      type: string;
      itemName: string;
      quantity?: number;
    }>;
  }>;
}

export interface ActionBlockData extends BlockData {
  actionType: 'add_material' | 'add_process' | 'add_equipment' | 'add_finish';
  name: string;
  description?: string;
  items: Array<{
    id: string;
    name: string;
    type: string;
    quantity?: number;
    formula?: string;
  }>;
}

export interface CollectorBlockData extends BlockData {
  collectorType: 'measurements' | 'data';
  fields: Array<{
    id: string;
    name: string;
    type: 'number' | 'text' | 'select';
    required: boolean;
    options?: string[];
  }>;
}

export interface EndBlockData extends BlockData {
  label: string;
  summary?: boolean;
}

// Event types
export interface DragEvent {
  blockId: string;
  position: Position;
  delta: Position;
}

export interface ConnectionEvent {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Utility types
export type BlockFactory = (type: BlockType, position: Position, data?: Partial<BlockData>) => Omit<Block, 'id'>;
export type ValidationResult = { isValid: boolean; errors: string[] };
export type FlowValidator = (flow: { blocks: Block[]; connections: Connection[] }) => ValidationResult;