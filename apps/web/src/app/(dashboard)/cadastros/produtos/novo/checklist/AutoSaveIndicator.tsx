"use client";

import React, { useState, useEffect } from 'react';
import { Save, Check, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChecklist } from './ChecklistProvider';
import ChecklistStorage from './checklist-storage';

interface AutoSaveIndicatorProps {
  className?: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function AutoSaveIndicator({ className }: AutoSaveIndicatorProps) {
  const { state } = useChecklist();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showIndicator, setShowIndicator] = useState(false);

  // Monitor mudanças no estado para mostrar indicador de salvamento
  useEffect(() => {
    if (state.isDirty) {
      setSaveStatus('saving');
      setShowIndicator(true);
      
      // Simular tempo de debounce do auto-save (500ms)
      const timeout = setTimeout(() => {
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // Esconder indicador após 2 segundos
        setTimeout(() => {
          setShowIndicator(false);
        }, 2000);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [state.isDirty]);

  // Verificar se há dados salvos no localStorage na inicialização
  useEffect(() => {
    const savedTimestamp = ChecklistStorage.getLastModified();
    if (savedTimestamp) {
      setLastSaved(savedTimestamp);
    }
  }, []);

  if (!showIndicator && !lastSaved) return null;

  const getStatusConfig = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Salvando...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconClass: 'animate-spin',
        };
      case 'saved':
        return {
          icon: Check,
          text: 'Salvo automaticamente',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800',
          iconClass: '',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Erro ao salvar',
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          iconClass: '',
        };
      default:
        return {
          icon: Save,
          text: lastSaved ? 'Auto-save ativo' : 'Aguardando mudanças',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900',
          borderColor: 'border-gray-200 dark:border-gray-700',
          iconClass: '',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-300',
        config.bgColor,
        config.borderColor,
        config.color,
        showIndicator ? 'opacity-100 scale-100' : 'opacity-70 scale-95',
        className
      )}
    >
      <Icon className={cn('w-4 h-4', config.iconClass)} />
      
      <div className="flex flex-col min-w-0">
        <div className="font-medium">
          {config.text}
        </div>
        
        {lastSaved && saveStatus !== 'saving' && (
          <div className="text-xs opacity-75 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(lastSaved)}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente mais simples para usar na header
export function SimpleAutoSaveIndicator({ className }: AutoSaveIndicatorProps) {
  const { state } = useChecklist();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    if (state.isDirty) {
      setSaveStatus('saving');
      const timeout = setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [state.isDirty]);

  if (saveStatus === 'idle') return null;

  return (
    <div className={cn('flex items-center gap-1.5 text-sm', className)}>
      {saveStatus === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span className="text-blue-600">Salvando...</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-green-500" />
          <span className="text-green-600">Salvo</span>
        </>
      )}
    </div>
  );
}