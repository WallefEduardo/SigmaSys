'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { FlowStore, Block, Connection, Position, Viewport } from '../types/flow.types';

const initialViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const useFlowStore = create<FlowStore>()(
  devtools(
    (set, get) => ({
      // State
      blocks: [],
      connections: [],
      viewport: initialViewport,
      selectedBlocks: [],
      draggedBlock: null,
      isConnecting: false,
      connectionInProgress: undefined,

      // Block actions
      addBlock: (blockData) => {
        const id = nanoid();
        const block: Block = {
          ...blockData,
          id,
        };

        set((state) => ({
          blocks: [...state.blocks, block],
        }));

        return id;
      },

      updateBlock: (id, updates) => {
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, ...updates } : block
          ),
        }));
      },

      removeBlock: (id) => {
        set((state) => ({
          blocks: state.blocks.filter((block) => block.id !== id),
          connections: state.connections.filter(
            (conn) => conn.source !== id && conn.target !== id
          ),
          selectedBlocks: state.selectedBlocks.filter((blockId) => blockId !== id),
        }));
      },

      moveBlock: (id, position) => {
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? { ...block, position } : block
          ),
        }));
      },

      // Connection actions
      addConnection: (connectionData) => {
        const id = nanoid();
        const connection: Connection = {
          ...connectionData,
          id,
        };

        // Check if connection already exists
        const exists = get().connections.some(
          (conn) =>
            conn.source === connection.source &&
            conn.target === connection.target &&
            conn.sourceHandle === connection.sourceHandle &&
            conn.targetHandle === connection.targetHandle
        );

        if (exists) return '';

        set((state) => ({
          connections: [...state.connections, connection],
        }));

        return id;
      },

      removeConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== id),
        }));
      },

      // Selection actions
      selectBlock: (id) => {
        set((state) => ({
          selectedBlocks: state.selectedBlocks.includes(id) 
            ? state.selectedBlocks
            : [id],
        }));
      },

      selectMultipleBlocks: (ids) => {
        set(() => ({
          selectedBlocks: ids,
        }));
      },

      clearSelection: () => {
        set(() => ({
          selectedBlocks: [],
        }));
      },

      // Viewport actions
      setViewport: (viewport) => {
        set((state) => ({
          viewport: { ...state.viewport, ...viewport },
        }));
      },

      // Drag & Drop actions
      startDrag: (blockId) => {
        set(() => ({
          draggedBlock: blockId,
        }));
      },

      endDrag: () => {
        set(() => ({
          draggedBlock: null,
        }));
      },

      // Connection mode actions
      startConnection: (sourceId, sourceHandle) => {
        const sourceBlock = get().blocks.find(b => b.id === sourceId);
        if (!sourceBlock) return;

        set(() => ({
          isConnecting: true,
          connectionInProgress: {
            sourceId,
            sourceHandle,
            position: sourceBlock.position,
          },
        }));
      },

      endConnection: (targetId, targetHandle) => {
        const state = get();
        
        if (!state.connectionInProgress || !targetId) {
          set(() => ({
            isConnecting: false,
            connectionInProgress: undefined,
          }));
          return;
        }

        // Create connection
        const connectionId = get().addConnection({
          source: state.connectionInProgress.sourceId,
          target: targetId,
          sourceHandle: state.connectionInProgress.sourceHandle,
          targetHandle,
        });

        set(() => ({
          isConnecting: false,
          connectionInProgress: undefined,
        }));
      },

      // Utility actions
      reset: () => {
        set(() => ({
          blocks: [],
          connections: [],
          viewport: initialViewport,
          selectedBlocks: [],
          draggedBlock: null,
          isConnecting: false,
          connectionInProgress: undefined,
        }));
      },

      loadFlow: (flow) => {
        set(() => ({
          blocks: flow.blocks,
          connections: flow.connections,
          selectedBlocks: [],
          draggedBlock: null,
          isConnecting: false,
          connectionInProgress: undefined,
        }));
      },

      exportFlow: () => {
        const { blocks, connections } = get();
        return { blocks, connections };
      },
    }),
    {
      name: 'checkflow-store',
      partialize: (state) => ({
        blocks: state.blocks,
        connections: state.connections,
        viewport: state.viewport,
      }),
    }
  )
);