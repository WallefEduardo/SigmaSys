import { nanoid } from 'nanoid';
import type { 
  Block, 
  BlockType, 
  Position, 
  StartBlockData,
  QuestionBlockData, 
  ActionBlockData,
  CollectorBlockData,
  EndBlockData
} from '../types/flow.types';

// Block factory function
export const createBlock = (
  type: BlockType,
  position: Position,
  customData?: Partial<any>
): Omit<Block, 'id'> => {
  const baseBlock = {
    type,
    position,
    dimensions: getDefaultDimensions(type),
    ui: getBlockUI(type),
    inputs: getBlockInputs(type),
    outputs: getBlockOutputs(type),
  };

  switch (type) {
    case 'start':
      return {
        ...baseBlock,
        data: {
          label: 'Início',
          ...customData,
        } as StartBlockData,
      };

    case 'question':
      return {
        ...baseBlock,
        data: {
          question: 'Nova pergunta',
          description: '',
          responseType: 'single',
          options: [
            { id: nanoid(), label: 'Sim', actions: [] },
            { id: nanoid(), label: 'Não', actions: [] },
          ],
          ...customData,
        } as QuestionBlockData,
      };

    case 'action':
      return {
        ...baseBlock,
        data: {
          actionType: 'add_material',
          name: 'Nova ação',
          description: '',
          items: [],
          ...customData,
        } as ActionBlockData,
      };

    case 'collector':
      return {
        ...baseBlock,
        data: {
          collectorType: 'measurements',
          fields: [
            { 
              id: nanoid(), 
              name: 'Largura', 
              type: 'number', 
              required: true 
            },
            { 
              id: nanoid(), 
              name: 'Altura', 
              type: 'number', 
              required: true 
            },
          ],
          ...customData,
        } as CollectorBlockData,
      };

    case 'condition':
      return {
        ...baseBlock,
        data: {
          condition: 'true',
          trueLabel: 'Sim',
          falseLabel: 'Não',
          ...customData,
        },
      };

    case 'end':
      return {
        ...baseBlock,
        data: {
          label: 'Fim',
          summary: true,
          ...customData,
        } as EndBlockData,
      };

    default:
      throw new Error(`Unknown block type: ${type}`);
  }
};

// Get default dimensions for each block type
const getDefaultDimensions = (type: BlockType) => {
  switch (type) {
    case 'start':
    case 'end':
      return { width: 160, height: 80 };
    case 'question':
      return { width: 280, height: 160 };
    case 'action':
      return { width: 240, height: 120 };
    case 'collector':
      return { width: 220, height: 140 };
    case 'condition':
      return { width: 200, height: 100 };
    default:
      return { width: 200, height: 100 };
  }
};

// Get UI configuration for each block type
const getBlockUI = (type: BlockType) => {
  switch (type) {
    case 'start':
      return {
        color: '#10B981', // green
        icon: 'Play',
        title: 'Início',
        description: 'Ponto de partida do fluxo',
      };
    case 'question':
      return {
        color: '#3B82F6', // blue
        icon: 'MessageSquare',
        title: 'Pergunta',
        description: 'Pergunta para o usuário',
      };
    case 'action':
      return {
        color: '#8B5CF6', // purple
        icon: 'Zap',
        title: 'Ação',
        description: 'Executa uma ação',
      };
    case 'collector':
      return {
        color: '#F59E0B', // amber
        icon: 'Calculator',
        title: 'Coletor',
        description: 'Coleta dados do usuário',
      };
    case 'condition':
      return {
        color: '#EF4444', // red
        icon: 'GitBranch',
        title: 'Condição',
        description: 'Decisão condicional',
      };
    case 'end':
      return {
        color: '#6B7280', // gray
        icon: 'Square',
        title: 'Fim',
        description: 'Final do fluxo',
      };
    default:
      return {
        color: '#6B7280',
        icon: 'Box',
        title: 'Desconhecido',
        description: '',
      };
  }
};

// Get input connection points for each block type
const getBlockInputs = (type: BlockType) => {
  switch (type) {
    case 'start':
      return []; // Start blocks don't have inputs
    case 'end':
      return [{ id: 'input', type: 'input' as const, position: 'top' as const }];
    default:
      return [{ id: 'input', type: 'input' as const, position: 'top' as const }];
  }
};

// Get output connection points for each block type
const getBlockOutputs = (type: BlockType) => {
  switch (type) {
    case 'start':
      return [{ id: 'output', type: 'output' as const, position: 'bottom' as const }];
    case 'question':
      return [
        { id: 'output', type: 'output' as const, position: 'bottom' as const },
        { id: 'option-0', type: 'output' as const, position: 'right' as const },
        { id: 'option-1', type: 'output' as const, position: 'right' as const },
      ];
    case 'condition':
      return [
        { id: 'true', type: 'output' as const, position: 'bottom' as const },
        { id: 'false', type: 'output' as const, position: 'right' as const },
      ];
    case 'end':
      return []; // End blocks don't have outputs
    default:
      return [{ id: 'output', type: 'output' as const, position: 'bottom' as const }];
  }
};

// Validation helper
export const validateBlockData = (type: BlockType, data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  switch (type) {
    case 'start':
      if (!data.label || data.label.trim() === '') {
        errors.push('Label is required for start block');
      }
      break;

    case 'question':
      if (!data.question || data.question.trim() === '') {
        errors.push('Question text is required');
      }
      if (!data.options || data.options.length === 0) {
        errors.push('At least one option is required');
      }
      break;

    case 'action':
      if (!data.name || data.name.trim() === '') {
        errors.push('Action name is required');
      }
      if (!data.actionType) {
        errors.push('Action type is required');
      }
      break;

    case 'collector':
      if (!data.fields || data.fields.length === 0) {
        errors.push('At least one field is required');
      }
      break;

    case 'end':
      if (!data.label || data.label.trim() === '') {
        errors.push('Label is required for end block');
      }
      break;
  }

  return { isValid: errors.length === 0, errors };
};