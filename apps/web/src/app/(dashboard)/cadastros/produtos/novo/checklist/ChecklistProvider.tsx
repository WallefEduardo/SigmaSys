"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { Node, Edge } from 'reactflow';
import ChecklistStorage from './checklist-storage';

export interface ChecklistSelections {
  productType: string | null;
  materials: string[];
  processes: string[];
  equipment: string[];
  finishes: string[];
}

export interface ChecklistState {
  nodes: Node[];
  edges: Edge[];
  selections: ChecklistSelections;
  isDirty: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  nextNodeId: number;
  viewport: { x: number; y: number; zoom: number };
}

type ChecklistAction =
  | { type: 'LOAD_DATA'; payload: { nodes: Node[]; edges: Edge[]; selections: ChecklistSelections; viewport?: { x: number; y: number; zoom: number } } }
  | { type: 'UPDATE_NODES'; payload: Node[] }
  | { type: 'UPDATE_EDGES'; payload: Edge[] }
  | { type: 'UPDATE_SELECTIONS'; payload: ChecklistSelections }
  | { type: 'UPDATE_VIEWPORT'; payload: { x: number; y: number; zoom: number } }
  | { type: 'ADD_NODE'; payload: Node }
  | { type: 'UPDATE_NODE'; payload: { nodeId: string; data: any } }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'ADD_EDGE'; payload: Edge }
  | { type: 'REMOVE_EDGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'MARK_CLEAN' }
  | { type: 'MARK_DIRTY' }
  | { type: 'INCREMENT_NODE_ID' };

const initialState: ChecklistState = {
  nodes: [],
  edges: [],
  selections: {
    productType: null,
    materials: [],
    processes: [],
    equipment: [],
    finishes: [],
  },
  isDirty: false,
  isLoading: false,
  lastSaved: null,
  nextNodeId: 1,
  viewport: { x: 0, y: 0, zoom: 1 },
};

function checklistReducer(state: ChecklistState, action: ChecklistAction): ChecklistState {
  switch (action.type) {
    case 'LOAD_DATA':
      // Validar e corrigir nodes que possam vir sem position válida
      const validatedNodes = action.payload.nodes.map((node: any, index: number) => {
        const hasValidPosition = node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number';
        
        if (!hasValidPosition) {
          console.warn('🚨 CHECKLISTPROVIDER - Node sem position válida detectado:', node.id, 'position:', node.position);
        }
        
        return {
          ...node,
          position: hasValidPosition ? node.position : { x: 250, y: index * 150 }
        };
      });

      console.log('✅ CHECKLISTPROVIDER - Dados carregados com', validatedNodes.length, 'nodes validados');

      return {
        ...state,
        nodes: validatedNodes,
        edges: action.payload.edges,
        selections: action.payload.selections,
        viewport: action.payload.viewport || state.viewport,
        isDirty: false,
        isLoading: false,
      };

    case 'UPDATE_NODES':
      // Validar positions dos nodes
      const validatedUpdateNodes = action.payload.map((node: any, index: number) => ({
        ...node,
        position: node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number' 
          ? node.position 
          : { x: 250, y: index * 150 }
      }));

      return {
        ...state,
        nodes: validatedUpdateNodes,
        isDirty: true,
      };

    case 'UPDATE_EDGES':
      return {
        ...state,
        edges: action.payload,
        isDirty: true,
      };

    case 'UPDATE_SELECTIONS':
      return {
        ...state,
        selections: action.payload,
        isDirty: true,
      };

    case 'UPDATE_VIEWPORT':
      return {
        ...state,
        viewport: action.payload,
        isDirty: true,
      };

    case 'ADD_NODE':
      // Validar position do novo node
      const nodeToAdd = {
        ...action.payload,
        position: action.payload.position && typeof action.payload.position.x === 'number' && typeof action.payload.position.y === 'number' 
          ? action.payload.position 
          : { x: 250, y: state.nodes.length * 150 }
      };

      return {
        ...state,
        nodes: [...state.nodes, nodeToAdd],
        isDirty: true,
      };

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.nodeId
            ? { ...node, data: { ...node.data, ...action.payload.data } }
            : node
        ),
        isDirty: true,
      };

    case 'REMOVE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter(node => node.id !== action.payload),
        edges: state.edges.filter(edge => edge.source !== action.payload && edge.target !== action.payload),
        isDirty: true,
      };

    case 'ADD_EDGE':
      return {
        ...state,
        edges: [...state.edges, action.payload],
        isDirty: true,
      };

    case 'REMOVE_EDGE':
      return {
        ...state,
        edges: state.edges.filter(edge => edge.id !== action.payload),
        isDirty: true,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'MARK_CLEAN':
      return {
        ...state,
        isDirty: false,
        lastSaved: new Date(),
      };

    case 'MARK_DIRTY':
      return {
        ...state,
        isDirty: true,
      };

    case 'INCREMENT_NODE_ID':
      return {
        ...state,
        nextNodeId: state.nextNodeId + 1,
      };

    default:
      return state;
  }
}

interface ChecklistContextType {
  state: ChecklistState;
  dispatch: React.Dispatch<ChecklistAction>;
  
  // High-level actions
  loadInitialData: (data: { nodes: Node[]; edges: Edge[]; selections: ChecklistSelections; viewport?: { x: number; y: number; zoom: number } }) => void;
  updateNode: (nodeId: string, data: any) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateEdges: (edges: Edge[]) => void;
  getCurrentConfiguration: () => { nodes: Node[]; edges: Edge[]; selections: ChecklistSelections };
  markClean: () => void;
  
  // Auto-save functionality
  onConfigurationChange?: (config: { nodes: Node[]; edges: Edge[]; selections: ChecklistSelections }) => void;
  clearAutoSave: () => void;
  getAutoSaveStats: () => any;
}

const ChecklistContext = createContext<ChecklistContextType | null>(null);

interface ChecklistProviderProps {
  children: React.ReactNode;
  onConfigurationChange?: (config: { nodes: Node[]; edges: Edge[]; selections: ChecklistSelections }) => void;
  initialData?: { nodes: Node[]; edges: Edge[]; selections: ChecklistSelections; viewport?: { x: number; y: number; zoom: number } };
  enableAutoSave?: boolean; // Controle para habilitar/desabilitar auto-save
  productId?: string; // ID do produto para chave única no localStorage
}

export function ChecklistProvider({ 
  children, 
  onConfigurationChange, 
  initialData, 
  enableAutoSave = true, 
  productId 
}: ChecklistProviderProps) {
  console.log('🏗️ CHECKLISTPROVIDER - Componente montando/remontando!', {
    enableAutoSave,
    productId,
    initialDataNodes: initialData?.nodes?.length || 0
  });

  const [state, dispatch] = useReducer(checklistReducer, initialState);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousConfigRef = useRef<string>('');
  const hasInitializedRef = useRef(false);
  const hasLoadedFromStorageRef = useRef(false);

  // 🚀 AUTO-LOAD: Carregar dados do localStorage na inicialização - EXECUTAR APENAS UMA VEZ
  useEffect(() => {
    console.log('🔍 CHECKLISTPROVIDER - useEffect AUTO-LOAD executado:', {
      hasInitialized: hasInitializedRef.current,
      hasLoadedFromStorage: hasLoadedFromStorageRef.current,
      enableAutoSave,
      initialDataLength: initialData?.nodes?.length || 0,
      currentStateNodes: state.nodes.length
    });

    // 🛡️ SUPER PROTEÇÃO: Se já tem dados carregados no estado, não resetar
    if (state.nodes.length > 0 && hasInitializedRef.current) {
      console.log('🛡️ CHECKLISTPROVIDER - Estado já tem dados, mantendo-os:', {
        nodes: state.nodes.length,
        edges: state.edges.length
      });
      return;
    }

    // Se já inicializou, não fazer novamente
    if (hasInitializedRef.current) {
      console.log('⏭️ CHECKLISTPROVIDER - Pulando inicialização (já inicializado)');
      return;
    }
    
    // Prioridade 1: Dados salvos no localStorage (se auto-save ativado)
    if (enableAutoSave) {
      console.log('🔍 CHECKLISTPROVIDER - Tentando carregar do localStorage...');
      const savedData = ChecklistStorage.load();
      console.log('📖 CHECKLISTPROVIDER - Dados do localStorage:', savedData);
      
      if (savedData?.config && savedData.config.nodes.length > 0) {
        hasInitializedRef.current = true;
        hasLoadedFromStorageRef.current = true;
        dispatch({ type: 'LOAD_DATA', payload: savedData.config });
        console.log('🚀 CHECKLISTPROVIDER - Auto-load do localStorage realizado:', {
          nodes: savedData.config.nodes.length,
          edges: savedData.config.edges.length
        });
        return;
      } else {
        console.log('❌ CHECKLISTPROVIDER - Nenhum dado válido no localStorage');
      }
    }
    
    // Prioridade 2: Dados iniciais passados via props
    if (initialData?.nodes?.length > 0) {
      hasInitializedRef.current = true;
      dispatch({ type: 'LOAD_DATA', payload: initialData });
      console.log('✅ CHECKLISTPROVIDER - Dados iniciais carregados:', {
        nodes: initialData.nodes.length,
        edges: initialData.edges?.length || 0
      });
    } else {
      console.log('ℹ️ CHECKLISTPROVIDER - Nenhum dado inicial encontrado, iniciando vazio');
      hasInitializedRef.current = true; // Marcar como inicializado mesmo que vazio
    }
  }, []); // 🚀 DEPENDÊNCIAS VAZIAS - executar apenas na montagem

  // Debounced notification to parent
  useEffect(() => {
    if (!state.isDirty || !onConfigurationChange) return;

    const currentConfig = JSON.stringify({
      nodes: state.nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      })),
      edges: state.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      })),
      selections: state.selections,
    });

    // Only notify if configuration actually changed
    if (currentConfig === previousConfigRef.current) return;
    previousConfigRef.current = currentConfig;

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the notification
    debounceTimeoutRef.current = setTimeout(() => {
      const config = {
        nodes: state.nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: node.data,
          position: node.position,
        })),
        edges: state.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
        })),
        selections: state.selections,
      };

      console.log('🔄 CHECKLISTPROVIDER - Notificando mudanças (debounced):', config);
      onConfigurationChange(config);
      dispatch({ type: 'MARK_CLEAN' });
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [state.isDirty, state.nodes, state.edges, state.selections, onConfigurationChange]);

  // 💾 AUTO-SAVE: Salvar automaticamente no localStorage
  useEffect(() => {
    if (!enableAutoSave || !state.isDirty) return;
    
    // Aguardar carregar dados iniciais antes de começar auto-save
    if (!hasInitializedRef.current) return;

    // Clear previous auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Auto-save com debounce de 500ms
    autoSaveTimeoutRef.current = setTimeout(() => {
      const config = {
        nodes: state.nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: node.data,
          position: node.position,
        })),
        edges: state.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
        })),
        selections: state.selections,
        viewport: state.viewport,
      };

      console.log('💾 CHECKLISTPROVIDER - Tentando auto-save:', {
        nodes: config.nodes.length,
        edges: config.edges.length,
        productId,
        hasChanges: ChecklistStorage.hasChanges(config)
      });

      // Só salva se realmente houve mudanças
      if (ChecklistStorage.hasChanges(config)) {
        const success = ChecklistStorage.save(config, productId);
        if (success) {
          console.log('✅ CHECKLISTPROVIDER - Auto-save realizado com sucesso:', {
            nodes: config.nodes.length,
            edges: config.edges.length,
            timestamp: new Date().toLocaleTimeString(),
            storageStats: ChecklistStorage.getStats()
          });
        } else {
          console.error('❌ CHECKLISTPROVIDER - Auto-save falhou!');
        }
      } else {
        console.log('⏭️ CHECKLISTPROVIDER - Auto-save pulado (sem mudanças)');
      }
    }, 500); // 500ms debounce para auto-save

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.isDirty, state.nodes, state.edges, state.selections, state.viewport, enableAutoSave, productId]);

  const loadInitialData = useCallback((data: { nodes: Node[]; edges: Edge[]; selections: ChecklistSelections; viewport?: { x: number; y: number; zoom: number } }) => {
    dispatch({ type: 'LOAD_DATA', payload: data });
  }, []);

  const updateNode = useCallback((nodeId: string, data: any) => {
    console.log('🔄 CHECKLISTPROVIDER - updateNode chamado:', nodeId, data);
    dispatch({ type: 'UPDATE_NODE', payload: { nodeId, data } });
  }, []);

  const addNode = useCallback((node: Node) => {
    console.log('🔄 CHECKLISTPROVIDER - addNode chamado:', node);
    dispatch({ type: 'ADD_NODE', payload: node });
    dispatch({ type: 'INCREMENT_NODE_ID' });
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    dispatch({ type: 'REMOVE_NODE', payload: nodeId });
  }, []);

  const updateEdges = useCallback((edges: Edge[]) => {
    dispatch({ type: 'UPDATE_EDGES', payload: edges });
  }, []);

  const getCurrentConfiguration = useCallback(() => {
    return {
      nodes: state.nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      })),
      edges: state.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      })),
      selections: state.selections,
    };
  }, [state.nodes, state.edges, state.selections]);

  const markClean = useCallback(() => {
    dispatch({ type: 'MARK_CLEAN' });
  }, []);

  // 🧹 Limpar auto-save no localStorage
  const clearAutoSave = useCallback(() => {
    if (enableAutoSave) {
      ChecklistStorage.clear();
      console.log('🧹 CHECKLISTPROVIDER - Auto-save limpo');
    }
  }, [enableAutoSave]);

  // 📊 Obter estatísticas do auto-save
  const getAutoSaveStats = useCallback(() => {
    return enableAutoSave ? ChecklistStorage.getStats() : null;
  }, [enableAutoSave]);

  const contextValue: ChecklistContextType = {
    state,
    dispatch,
    loadInitialData,
    updateNode,
    addNode,
    removeNode,
    updateEdges,
    getCurrentConfiguration,
    markClean,
    onConfigurationChange,
    clearAutoSave,
    getAutoSaveStats,
  };

  return (
    <ChecklistContext.Provider value={contextValue}>
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklist(): ChecklistContextType {
  const context = useContext(ChecklistContext);
  if (!context) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
}