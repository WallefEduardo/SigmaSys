"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { Node, Edge } from 'reactflow';

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
}

const ChecklistContext = createContext<ChecklistContextType | null>(null);

interface ChecklistProviderProps {
  children: React.ReactNode;
  onConfigurationChange?: (config: { nodes: Node[]; edges: Edge[]; selections: ChecklistSelections }) => void;
  initialData?: { nodes: Node[]; edges: Edge[]; selections: ChecklistSelections; viewport?: { x: number; y: number; zoom: number } };
}

export function ChecklistProvider({ children, onConfigurationChange, initialData }: ChecklistProviderProps) {
  const [state, dispatch] = useReducer(checklistReducer, initialState);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousConfigRef = useRef<string>('');
  const hasInitializedRef = useRef(false);

  // Load initial data on mount - only once
  useEffect(() => {
    if (!hasInitializedRef.current && initialData?.nodes?.length > 0) {
      hasInitializedRef.current = true;
      dispatch({ type: 'LOAD_DATA', payload: initialData });
      console.log('✅ CHECKLISTPROVIDER - Dados iniciais carregados:', initialData);
    }
  }, [initialData]);

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