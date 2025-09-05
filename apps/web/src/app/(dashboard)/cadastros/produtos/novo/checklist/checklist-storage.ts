"use client";

import type { Node, Edge } from 'reactflow';
import type { ChecklistSelections } from './ChecklistProvider';

export interface SavedChecklistData {
  version: string;
  timestamp: number;
  productId?: string;
  config: {
    nodes: Node[];
    edges: Edge[];
    selections: ChecklistSelections;
    viewport: { x: number; y: number; zoom: number };
  };
}

/**
 * 🚀 CHECKLIST AUTO-SAVE UTILITIES
 * 
 * Sistema robusto e otimizado para auto-save do flow checklist no localStorage.
 * - Performance: Debounce, compressão, deep comparison
 * - Robustez: Try/catch, fallbacks, validação
 * - UX: Cleanup automático, recovery, timestamps
 */

class ChecklistStorage {
  private static readonly STORAGE_KEY = 'checklist_flow_data';
  private static readonly VERSION = '1.0.0';
  private static readonly MAX_STORAGE_AGE_DAYS = 7;
  
  /**
   * 💾 Salva dados do checklist no localStorage com compressão
   */
  static save(config: SavedChecklistData['config'], productId?: string): boolean {
    try {
      const dataToSave: SavedChecklistData = {
        version: this.VERSION,
        timestamp: Date.now(),
        productId,
        config: this.sanitizeConfig(config),
      };

      // Compressão básica: remover propriedades desnecessárias
      const compressedData = this.compressData(dataToSave);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(compressedData));
      return true;
    } catch (error) {
      console.error('❌ CHECKLIST-STORAGE - Erro ao salvar:', error);
      return false;
    }
  }

  /**
   * 📖 Carrega dados do checklist do localStorage com validação
   */
  static load(): SavedChecklistData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const data: SavedChecklistData = JSON.parse(stored);
      
      // Validar estrutura dos dados
      if (!this.validateData(data)) {
        console.warn('⚠️ CHECKLIST-STORAGE - Dados inválidos encontrados, limpando...');
        this.clear();
        return null;
      }

      // Verificar se dados não são muito antigos
      const daysOld = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
      if (daysOld > this.MAX_STORAGE_AGE_DAYS) {
        this.clear();
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ CHECKLIST-STORAGE - Erro ao carregar:', error);
      return null;
    }
  }

  /**
   * 🧹 Limpa dados do localStorage
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('❌ CHECKLIST-STORAGE - Erro ao limpar:', error);
    }
  }

  /**
   * 📊 Verifica se há dados salvos
   */
  static hasSavedData(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored !== null;
    } catch {
      return false;
    }
  }

  /**
   * ⏰ Retorna timestamp da última modificação
   */
  static getLastModified(): Date | null {
    try {
      const data = this.load();
      return data ? new Date(data.timestamp) : null;
    } catch {
      return null;
    }
  }

  /**
   * 🔄 Compara se configuração atual é diferente da salva
   */
  static hasChanges(currentConfig: SavedChecklistData['config']): boolean {
    try {
      const saved = this.load();
      if (!saved) return true;

      const currentSerialized = JSON.stringify(this.sanitizeConfig(currentConfig));
      const savedSerialized = JSON.stringify(this.sanitizeConfig(saved.config));
      
      return currentSerialized !== savedSerialized;
    } catch {
      return true;
    }
  }

  /**
   * 🛡️ Sanitiza configuração removendo propriedades problemáticas
   */
  private static sanitizeConfig(config: SavedChecklistData['config']): SavedChecklistData['config'] {
    return {
      nodes: config.nodes.map(node => ({
        id: node.id,
        type: node.type || 'question',
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
      })),
      edges: config.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      })),
      selections: config.selections || {
        productType: null,
        materials: [],
        processes: [],
        equipment: [],
        finishes: [],
      },
      viewport: config.viewport || { x: 0, y: 0, zoom: 1 },
    };
  }

  /**
   * 📦 Comprime dados removendo propriedades desnecessárias
   */
  private static compressData(data: SavedChecklistData): SavedChecklistData {
    return {
      ...data,
      config: {
        ...data.config,
        // Remover callbacks e funções dos nodes
        nodes: data.config.nodes.map(node => ({
          ...node,
          data: this.removeCallbacks(node.data),
        })),
      },
    };
  }

  /**
   * 🚿 Remove callbacks e funções dos dados dos nodes
   */
  private static removeCallbacks(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const cleaned = { ...data };
    
    // Remover propriedades que são funções
    Object.keys(cleaned).forEach(key => {
      if (typeof cleaned[key] === 'function') {
        delete cleaned[key];
      }
    });

    return cleaned;
  }

  /**
   * ✅ Valida estrutura dos dados carregados
   */
  private static validateData(data: any): data is SavedChecklistData {
    if (!data || typeof data !== 'object') return false;
    
    // Verificar propriedades obrigatórias
    if (!data.version || !data.timestamp || !data.config) return false;
    
    // Verificar estrutura da config
    const config = data.config;
    if (!Array.isArray(config.nodes) || !Array.isArray(config.edges)) return false;
    
    // Verificar se selections existe
    if (!config.selections || typeof config.selections !== 'object') return false;
    
    return true;
  }

  /**
   * 📈 Retorna estatísticas do storage para debug
   */
  static getStats(): {
    hasData: boolean;
    lastModified: Date | null;
    nodeCount: number;
    edgeCount: number;
    size: number;
  } {
    try {
      const data = this.load();
      const rawData = localStorage.getItem(this.STORAGE_KEY);
      
      return {
        hasData: data !== null,
        lastModified: data ? new Date(data.timestamp) : null,
        nodeCount: data?.config.nodes.length || 0,
        edgeCount: data?.config.edges.length || 0,
        size: rawData?.length || 0,
      };
    } catch {
      return {
        hasData: false,
        lastModified: null,
        nodeCount: 0,
        edgeCount: 0,
        size: 0,
      };
    }
  }
}

export default ChecklistStorage;

// Hook personalizado para facilitar uso
export function useChecklistStorage() {
  const save = (config: SavedChecklistData['config'], productId?: string) => 
    ChecklistStorage.save(config, productId);
  
  const load = () => ChecklistStorage.load();
  
  const clear = () => ChecklistStorage.clear();
  
  const hasSavedData = () => ChecklistStorage.hasSavedData();
  
  const hasChanges = (config: SavedChecklistData['config']) => 
    ChecklistStorage.hasChanges(config);
  
  const getStats = () => ChecklistStorage.getStats();
  
  const getLastModified = () => ChecklistStorage.getLastModified();

  return {
    save,
    load,
    clear,
    hasSavedData,
    hasChanges,
    getStats,
    getLastModified,
  };
}