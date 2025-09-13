'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { FlowStore, Block, Group, Connection, Position, Viewport } from '../types/flow.types';

const initialViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const useFlowStore = create<FlowStore>()(
  devtools(
    (set, get) => ({
      // State
      groups: [],
      blocks: [], // Mantido para compatibilidade
      connections: [],
      viewport: initialViewport,
      selectedBlocks: [],
      selectedGroups: [],
      draggedBlock: null,
      isConnecting: false,
      connectionInProgress: undefined,

      // Group actions
      addGroup: (groupData) => {
        const id = nanoid();
        let groupNumber = get().groups.length + 1;
        
        // Check if group title already exists, if so increment number
        while (get().groups.some(g => g.title === `Group #${groupNumber}`)) {
          groupNumber++;
        }
        
        const group: Group = {
          ...groupData,
          id,
          title: groupData.title || `Group #${groupNumber}`,
          blocks: [],
        };

        set((state) => ({
          groups: [...state.groups, group],
        }));

        return id;
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          ),
        }));
      },

      removeGroup: (id) => {
        set((state) => {
          // Remove group and all its blocks
          const groupToRemove = state.groups.find(g => g.id === id);
          const blockIdsToRemove = groupToRemove?.blocks.map(b => b.id) || [];
          
          return {
            groups: state.groups.filter((group) => group.id !== id),
            blocks: state.blocks.filter((block) => !blockIdsToRemove.includes(block.id)),
            connections: state.connections.filter(
              (conn) => !blockIdsToRemove.includes(conn.source) && !blockIdsToRemove.includes(conn.target)
            ),
            selectedGroups: state.selectedGroups.filter((groupId) => groupId !== id),
          };
        });
      },

      moveGroup: (id, position) => {
        console.log('📍 Store moveGroup called:', { id, position });
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, position } : group
          ),
        }));
      },

      duplicateGroup: (id) => {
        const originalGroup = get().groups.find(g => g.id === id);
        if (!originalGroup) return '';

        const newGroupId = nanoid();
        let groupNumber = get().groups.length + 1;
        
        // Find next available group number
        while (get().groups.some(g => g.title.includes(`Group #${groupNumber}`))) {
          groupNumber++;
        }

        // Duplicate blocks
        const duplicatedBlocks = originalGroup.blocks.map(block => ({
          ...block,
          id: nanoid(),
          groupId: newGroupId,
          position: {
            x: block.position.x + 20, // Slight offset
            y: block.position.y + 20,
          },
        }));

        const duplicatedGroup: Group = {
          ...originalGroup,
          id: newGroupId,
          title: `${originalGroup.title} Copy`,
          position: {
            x: originalGroup.position.x + 300, // Offset to the right
            y: originalGroup.position.y,
          },
          blocks: duplicatedBlocks,
        };

        set((state) => ({
          groups: [...state.groups, duplicatedGroup],
          blocks: [...state.blocks, ...duplicatedBlocks],
        }));

        return newGroupId;
      },

      addBlockToGroup: (groupId, blockData) => {
        const id = nanoid();
        const block: Block = {
          ...blockData,
          id,
          groupId,
        };

        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId 
              ? { ...group, blocks: [...group.blocks, block] }
              : group
          ),
          blocks: [...state.blocks, block],
        }));

        return id;
      },

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

      selectGroup: (id) => {
        set((state) => ({
          selectedGroups: state.selectedGroups.includes(id) 
            ? state.selectedGroups
            : [id],
          selectedBlocks: [], // Clear block selection when selecting group
        }));
      },

      clearSelection: () => {
        set(() => ({
          selectedBlocks: [],
          selectedGroups: [],
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
          groups: [],
          blocks: [],
          connections: [],
          viewport: initialViewport,
          selectedBlocks: [],
          selectedGroups: [],
          draggedBlock: null,
          isConnecting: false,
          connectionInProgress: undefined,
        }));
      },

      loadFlow: (flow) => {
        set(() => ({
          groups: flow.groups || [],
          blocks: flow.blocks,
          connections: flow.connections,
          selectedBlocks: [],
          selectedGroups: [],
          draggedBlock: null,
          isConnecting: false,
          connectionInProgress: undefined,
        }));
      },

      exportFlow: () => {
        const { groups, blocks, connections } = get();
        return { groups, blocks, connections };
      },
    }),
    {
      name: 'checkflow-store',
      partialize: (state) => ({
        groups: state.groups,
        blocks: state.blocks,
        connections: state.connections,
        viewport: state.viewport,
      }),
    }
  )
);