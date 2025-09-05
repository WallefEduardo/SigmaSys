"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Calculator, Hash, Edit2, Save, X, Clock } from 'lucide-react';
import { api } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import FormulaModal from "./FormulaModal";
import { FormulaEngine, type FormulaVariables } from "@/lib/formula-engine";

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (processes: ProcessItem[]) => void;
  initialProcesses?: ProcessItem[];
}

interface ProcessItem {
  id: string;
  processId: string;
  processName: string;
  costPerHour: number;
  calculationType: 'fixed' | 'formula';
  fixedTime?: number; // tempo fixo em minutos
  calculationRuleId?: string;
  calculationRuleName?: string;
  calculationRuleFormula?: string;
  multiplier?: number; // Multiplicador para fórmulas
  sector?: string;
  timeUnit: string;
  description?: string;
  measurementText?: string; // Texto personalizado para coleta de medidas
  // Custos calculados
  totalTime?: number; // tempo total em minutos
  totalCost?: number; // custo total calculado
}

export default function ProcessModal({ isOpen, onClose, onSave, initialProcesses = [] }: ProcessModalProps) {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCostDetailModal, setShowCostDetailModal] = useState(false);
  const [selectedProcessForDetail, setSelectedProcessForDetail] = useState<ProcessItem | null>(null);
  const [currentForm, setCurrentForm] = useState({
    processId: "",
    calculationType: "fixed" as 'fixed' | 'formula',
    fixedTime: "",
    calculationRuleId: "",
    calculationRuleName: "",
    calculationRuleFormula: "",
    multiplier: "1",
    timeUnit: "",
    description: "",
    measurementText: ""
  });

  // 🛡️ Queries protegidas com fallbacks seguros
  const { data: processesData, isLoading: processesLoading, error: processesError } = api.processes.list.useQuery(
    {},
    { retry: 1, enabled: isOpen }
  );
  
  const { data: calculationRulesData, isLoading: rulesLoading, error: rulesError } = api.calculationRules.list.useQuery(
    { active: true },
    { retry: 1, enabled: isOpen }
  );
  
  const { data: predefinedRulesData, isLoading: predefinedLoading, error: predefinedError } = api.calculationRules.getPredefined.useQuery(
    {},
    { retry: 1, enabled: isOpen }
  );
  
  const processesOptions = processesData?.processes || [];
  const calculationRules = calculationRulesData?.rules || [];
  const predefinedRules = predefinedRulesData?.rules || [];
  const allRules = [...calculationRules, ...predefinedRules];

  // Carregar processos iniciais quando modal abrir
  useEffect(() => {
    if (isOpen && initialProcesses.length > 0) {
      setProcesses(initialProcesses);
    } else if (isOpen) {
      setProcesses([]);
    }
  }, [isOpen, initialProcesses]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "AREA": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "LENGTH": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "UNIT": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Função para preparar estrutura dos tempos/custos (SEM calcular valores reais)
  const prepareCostStructure = (process: any, calculationType: string, time?: number, formula?: string, multiplier = 1) => {
    const costPerHour = Number(process.costPerHour) || 0;
    
    // ⚠️ NO PROCESS MODAL: Não calcular valores reais, apenas estruturar
    // Os cálculos reais acontecem no Teste de Fluxo / Orçamento quando há medidas
    
    return {
      calculatedTime: 0, // Será calculado com medidas reais
      totalCost: 0, // Será calculado com medidas reais
      // Manter dados para estrutura
      costPerHour: costPerHour
    };
  };

  const addProcess = () => {
    if (!currentForm.processId) {
      return;
    }
    
    if (currentForm.calculationType === 'fixed' && !currentForm.fixedTime) {
      return;
    }
    
    if (currentForm.calculationType === 'formula' && !currentForm.calculationRuleId) {
      return;
    }

    const process = processesOptions.find(p => p.id === currentForm.processId);
    const rule = allRules.find(r => r.id === currentForm.calculationRuleId);

    // Preparar estrutura de custos (sem cálculos reais ainda)
    const costs = prepareCostStructure(
      process,
      currentForm.calculationType,
      parseFloat(currentForm.fixedTime),
      currentForm.calculationRuleFormula,
      parseFloat(currentForm.multiplier) || 1
    );

    const newProcess: ProcessItem = {
      id: `process-${Date.now()}`,
      processId: currentForm.processId,
      processName: process?.name || "",
      costPerHour: Number(process?.costPerHour) || 0,
      calculationType: currentForm.calculationType,
      ...(currentForm.calculationType === 'fixed' 
        ? { fixedTime: parseFloat(currentForm.fixedTime) }
        : { 
            calculationRuleId: currentForm.calculationRuleId,
            calculationRuleName: currentForm.calculationRuleName,
            calculationRuleFormula: currentForm.calculationRuleFormula,
            multiplier: parseFloat(currentForm.multiplier) || 1
          }
      ),
      sector: process?.sector || "",
      timeUnit: currentForm.timeUnit || process?.timeUnit || "hour",
      description: currentForm.description.trim() || undefined,
      measurementText: currentForm.measurementText.trim() || undefined,
      // Custos calculados
      totalTime: costs.calculatedTime,
      totalCost: costs.totalCost
    };

    setProcesses(prev => [...prev, newProcess]);
    setCurrentForm({
      processId: "",
      calculationType: "fixed",
      fixedTime: "",
      calculationRuleId: "",
      calculationRuleName: "",
      calculationRuleFormula: "",
      multiplier: "1",
      timeUnit: "",
      description: ""
    });
  };

  const handleFormulaSelect = (ruleId: string, ruleName: string, ruleFormula: string) => {
    setCurrentForm(prev => ({
      ...prev,
      calculationRuleId: ruleId,
      calculationRuleName: ruleName,
      calculationRuleFormula: ruleFormula
    }));
    setShowFormulaModal(false);
  };

  const removeProcess = (id: string) => {
    setProcesses(prev => prev.filter(p => p.id !== id));
    setEditingId(null); // Cancelar edição se estava editando este item
  };

  const startEdit = (process: ProcessItem) => {
    setEditingId(process.id);
    setCurrentForm({
      processId: process.processId,
      calculationType: process.calculationType,
      fixedTime: process.fixedTime?.toString() || "",
      calculationRuleId: process.calculationRuleId || "",
      calculationRuleName: process.calculationRuleName || "",
      calculationRuleFormula: process.calculationRuleFormula || "",
      multiplier: process.multiplier?.toString() || "1",
      timeUnit: process.timeUnit,
      description: process.description || "",
      measurementText: process.measurementText || ""
    });
  };

  const saveEdit = () => {
    if (!editingId) return;

    const process = processesOptions.find(p => p.id === currentForm.processId);

    // Preparar estrutura de custos (sem cálculos reais ainda)
    const costs = prepareCostStructure(
      process,
      currentForm.calculationType,
      parseFloat(currentForm.fixedTime),
      currentForm.calculationRuleFormula,
      parseFloat(currentForm.multiplier) || 1
    );

    const updatedProcess: ProcessItem = {
      id: editingId,
      processId: currentForm.processId,
      processName: process?.name || "",
      costPerHour: Number(process?.costPerHour) || 0,
      calculationType: currentForm.calculationType,
      ...(currentForm.calculationType === 'fixed' 
        ? { fixedTime: parseFloat(currentForm.fixedTime) }
        : { 
            calculationRuleId: currentForm.calculationRuleId,
            calculationRuleName: currentForm.calculationRuleName,
            calculationRuleFormula: currentForm.calculationRuleFormula,
            multiplier: parseFloat(currentForm.multiplier) || 1
          }
      ),
      sector: process?.sector || "",
      timeUnit: currentForm.timeUnit || process?.timeUnit || "hour",
      description: currentForm.description.trim() || undefined,
      measurementText: currentForm.measurementText.trim() || undefined,
      // Custos calculados
      totalTime: costs.calculatedTime,
      totalCost: costs.totalCost
    };

    setProcesses(prev => prev.map(p => p.id === editingId ? updatedProcess : p));
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCurrentForm({
      processId: "",
      calculationType: "fixed",
      fixedTime: "",
      calculationRuleId: "",
      calculationRuleName: "",
      calculationRuleFormula: "",
      multiplier: "1",
      timeUnit: "",
      description: ""
    });
  };

  const handleSave = () => {
    onSave(processes);
    onClose();
    setProcesses([]);
  };

  const handleCancel = () => {
    onClose();
    setProcesses([]);
    setEditingId(null);
    setCurrentForm({
      processId: "",
      calculationType: "fixed",
      fixedTime: "",
      calculationRuleId: "",
      calculationRuleName: "",
      calculationRuleFormula: "",
      multiplier: "1",
      timeUnit: "",
      description: ""
    });
  };

  const handleShowCostDetail = (process: ProcessItem) => {
    setSelectedProcessForDetail(process);
    setShowCostDetailModal(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Processos</DialogTitle>
          <DialogDescription>
            Configure os processos necessários para este produto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formulário de Adição */}
          <div className={`border rounded-lg p-4 space-y-4 ${editingId ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="font-medium text-lg">
              Adicionar Processo
              {editingId && <span className="text-sm text-muted-foreground ml-2">(Bloqueado durante edição)</span>}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="process">Processo *</Label>
                <Select
                  value={currentForm.processId}
                  onValueChange={(value) => {
                    const process = processesOptions.find(p => p.id === value);
                    setCurrentForm(prev => ({
                      ...prev,
                      processId: value,
                      timeUnit: process?.timeUnit || "hour"
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {processesLoading ? (
                      <SelectItem value="loading" disabled>
                        Carregando processos...
                      </SelectItem>
                    ) : processesError ? (
                      <SelectItem value="error" disabled>
                        Erro ao carregar processos
                      </SelectItem>
                    ) : processesOptions.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Nenhum processo encontrado
                      </SelectItem>
                    ) : (
                      processesOptions.map((process) => (
                        <SelectItem key={process.id} value={process.id}>
                          {process.name}
                          <span className="text-muted-foreground ml-2">
                            (R$ {Number(process.costPerHour).toFixed(2)}/hora)
                          </span>
                          {process.sector && (
                            <span className="text-xs text-muted-foreground ml-2">
                              - {process.sector}
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sistema de Cálculo de Tempo - Layout lado a lado */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Como Calcular o Tempo? *</Label>
              <RadioGroup 
                value={currentForm.calculationType} 
                onValueChange={(value) => setCurrentForm(prev => ({ 
                  ...prev, 
                  calculationType: value as 'fixed' | 'formula',
                  fixedTime: "",
                  calculationRuleId: "",
                  calculationRuleName: "",
                  calculationRuleFormula: "",
                  multiplier: "1"
                }))}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Tempo Fixo */}
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="fixed" className="flex items-center text-sm font-medium cursor-pointer">
                      <Hash className="w-4 h-4 mr-2" />
                      Tempo Fixo
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ex: 30 minutos, 2 horas, 45 minutos
                    </p>
                    
                    {currentForm.calculationType === 'fixed' && (
                      <div className="mt-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={currentForm.fixedTime}
                          onChange={(e) => setCurrentForm(prev => ({ ...prev, fixedTime: e.target.value }))}
                          placeholder="Ex: 30, 120, 45..."
                          className="w-32"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Tempo em minutos
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fórmula Dinâmica */}
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="formula" id="formula" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="formula" className="flex items-center text-sm font-medium cursor-pointer">
                      <Calculator className="w-4 h-4 mr-2" />
                      Fórmula Dinâmica
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      O sistema calcula automaticamente baseado nas medidas que o vendedor informar
                    </p>
                        
                        {currentForm.calculationType === 'formula' && (
                          <div className="mt-3 space-y-3">
                            {/* Botão para abrir modal de fórmulas */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowFormulaModal(true)}
                              className="w-full justify-start"
                            >
                              <Calculator className="w-4 h-4 mr-2" />
                              {currentForm.calculationRuleId 
                                ? `Selecionada: ${currentForm.calculationRuleName}`
                                : "Escolher Fórmula de Cálculo"
                              }
                            </Button>
                            
                            {/* Campo Multiplicador */}
                            {currentForm.calculationRuleId && (
                              <div>
                                <Label htmlFor="multiplier" className="text-sm font-medium">
                                  Multiplicador de Tempo
                                </Label>
                                <Input
                                  id="multiplier"
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={currentForm.multiplier}
                                  onChange={(e) => setCurrentForm(prev => ({ ...prev, multiplier: e.target.value }))}
                                  placeholder="1"
                                  className="w-24 mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tempo = Resultado da Fórmula × Multiplicador (minutos)
                                </p>
                              </div>
                            )}
                            
                            {/* Preview da fórmula selecionada */}
                            {currentForm.calculationRuleId && (
                              <div className="p-3 bg-muted/50 rounded border">
                                <div className="text-xs space-y-1">
                                  <div className="font-medium">{currentForm.calculationRuleName}</div>
                                  <div className="text-muted-foreground">
                                    Fórmula: <code className="bg-background px-1 py-0.5 rounded font-mono">{currentForm.calculationRuleFormula}</code>
                                  </div>
                                  {currentForm.multiplier && parseFloat(currentForm.multiplier) !== 1 && (
                                    <div className="text-muted-foreground">
                                      Multiplicador: <span className="font-mono">{currentForm.multiplier}x</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
              </RadioGroup>
            </div>

            {/* Campo de Descrição - Largura completa */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                Descrição Personalizada (Opcional)
              </Label>
              <Textarea
                id="description"
                value={currentForm.description}
                onChange={(e) => setCurrentForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva detalhes específicos deste processo para o produto..."
                rows={3}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Esta descrição será específica para este produto e aparecerá na lista de processos.
              </p>
            </div>

            {/* Campo de Texto para Medidas - Só aparece se for fórmula */}
            {currentForm.calculationType === 'formula' && currentForm.calculationRuleId && (
              <div className="space-y-2">
                <Label htmlFor="measurementText" className="text-base font-medium">
                  Texto Personalizado para Medidas (Opcional)
                </Label>
                <Input
                  id="measurementText"
                  value={currentForm.measurementText}
                  onChange={(e) => setCurrentForm(prev => ({ ...prev, measurementText: e.target.value }))}
                  placeholder="Ex: Informe o tamanho da peça para calcular tempo de processo"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Texto que aparecerá para o vendedor quando for coletar as medidas. Se vazio, usará texto padrão.
                </p>
              </div>
            )}

            <Button 
              type="button" 
              onClick={addProcess}
              disabled={
                !currentForm.processId || 
                (currentForm.calculationType === 'fixed' && !currentForm.fixedTime) ||
                (currentForm.calculationType === 'formula' && !currentForm.calculationRuleId)
              }
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar à Lista
            </Button>
          </div>

          {/* Seção de Edição */}
          {editingId && (
            <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">Editando Processo</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveEdit}
                    disabled={
                      !currentForm.processId || 
                      (currentForm.calculationType === 'fixed' && !currentForm.fixedTime) ||
                      (currentForm.calculationType === 'formula' && !currentForm.calculationRuleId)
                    }
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-process">Processo *</Label>
                  <Select
                    value={currentForm.processId}
                    onValueChange={(value) => {
                      const process = processesOptions.find(p => p.id === value);
                      setCurrentForm(prev => ({
                        ...prev,
                        processId: value,
                        timeUnit: process?.timeUnit || "hour"
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o processo" />
                    </SelectTrigger>
                    <SelectContent>
                      {processesOptions.map((process) => (
                        <SelectItem key={process.id} value={process.id}>
                          {process.name}
                          <span className="text-muted-foreground ml-2">
                            (R$ {Number(process.costPerHour).toFixed(2)}/hora)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sistema de Cálculo para Edição */}
                <div className="col-span-2">
                  <Label className="text-base font-medium">Como Calcular o Tempo? *</Label>
                  <RadioGroup 
                    value={currentForm.calculationType} 
                    onValueChange={(value) => setCurrentForm(prev => ({ 
                      ...prev, 
                      calculationType: value as 'fixed' | 'formula',
                      fixedTime: "",
                      calculationRuleId: "",
                      calculationRuleName: "",
                      calculationRuleFormula: "",
                      multiplier: "1"
                    }))}
                    className="mt-2"
                  >
                    <div className="space-y-4">
                      {/* Tempo Fixo para Edição */}
                      <div className="flex items-start space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="fixed" id="edit-fixed" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="edit-fixed" className="flex items-center text-sm font-medium cursor-pointer">
                            <Hash className="w-4 h-4 mr-2" />
                            Tempo Fixo
                          </Label>
                          
                          {currentForm.calculationType === 'fixed' && (
                            <div className="mt-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={currentForm.fixedTime}
                                onChange={(e) => setCurrentForm(prev => ({ ...prev, fixedTime: e.target.value }))}
                                placeholder="Ex: 30, 120, 45..."
                                className="w-32"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fórmula Dinâmica para Edição */}
                      <div className="flex items-start space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="formula" id="edit-formula" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="edit-formula" className="flex items-center text-sm font-medium cursor-pointer">
                            <Calculator className="w-4 h-4 mr-2" />
                            Fórmula Dinâmica
                          </Label>
                          
                          {currentForm.calculationType === 'formula' && (
                            <div className="mt-3 space-y-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowFormulaModal(true)}
                                className="w-full justify-start"
                              >
                                <Calculator className="w-4 h-4 mr-2" />
                                {currentForm.calculationRuleId 
                                  ? `Selecionada: ${currentForm.calculationRuleName}`
                                  : "Escolher Fórmula de Cálculo"
                                }
                              </Button>
                              
                              {/* Campo Multiplicador para Edição */}
                              {currentForm.calculationRuleId && (
                                <div>
                                  <Label htmlFor="edit-multiplier" className="text-sm font-medium">
                                    Multiplicador de Tempo
                                  </Label>
                                  <Input
                                    id="edit-multiplier"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={currentForm.multiplier}
                                    onChange={(e) => setCurrentForm(prev => ({ ...prev, multiplier: e.target.value }))}
                                    placeholder="1"
                                    className="w-24 mt-1"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Tempo = Resultado da Fórmula × Multiplicador (minutos)
                                  </p>
                                </div>
                              )}
                              
                              {currentForm.calculationRuleId && (
                                <div className="p-3 bg-muted/50 rounded border">
                                  <div className="text-xs space-y-1">
                                    <div className="font-medium">{currentForm.calculationRuleName}</div>
                                    <div className="text-muted-foreground">
                                      Fórmula: <code className="bg-background px-1 py-0.5 rounded font-mono">{currentForm.calculationRuleFormula}</code>
                                    </div>
                                    {currentForm.multiplier && parseFloat(currentForm.multiplier) !== 1 && (
                                      <div className="text-muted-foreground">
                                        Multiplicador: <span className="font-mono">{currentForm.multiplier}x</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Campo de Descrição - Edição */}
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-description" className="text-base font-medium">
                    Descrição Personalizada (Opcional)
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={currentForm.description}
                    onChange={(e) => setCurrentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva detalhes específicos deste processo para o produto..."
                    rows={3}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta descrição será específica para este produto e aparecerá na lista de processos.
                  </p>
                </div>

                {/* Campo de Texto para Medidas - Edição - Só aparece se for fórmula */}
                {currentForm.calculationType === 'formula' && currentForm.calculationRuleId && (
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-measurementText" className="text-base font-medium">
                      Texto Personalizado para Medidas (Opcional)
                    </Label>
                    <Input
                      id="edit-measurementText"
                      value={currentForm.measurementText}
                      onChange={(e) => setCurrentForm(prev => ({ ...prev, measurementText: e.target.value }))}
                      placeholder="Ex: Informe o tamanho da peça para calcular tempo de processo"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Texto que aparecerá para o vendedor quando for coletar as medidas. Se vazio, usará texto padrão.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabela de Processos Adicionados */}
          {processes.length > 0 && (
            <div className="space-y-4">
              {/* Header com Total dos Custos por Hora */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">Processos Adicionados ({processes.length})</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-muted-foreground">
                    Custo médio por hora: <span className="font-bold text-lg text-orange-600">
                      R$ {processes.length > 0 ? (processes.reduce((sum, p) => sum + (p.costPerHour || 0), 0) / processes.length).toFixed(2) : '0.00'}/hora
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 grid grid-cols-8 gap-3 font-medium text-sm">
                  <div>Processo</div>
                  <div>Setor</div>
                  <div>Cálculo</div>
                  <div className="text-center">Unidade Tempo</div>
                  <div className="text-center">Custo/Hora</div>
                  <div className="text-center">Tempo Base</div>
                  <div className="text-center">Ações</div>
                  <div className="text-center">Editar</div>
                </div>
                
                {processes.map((process) => (
                  <div key={process.id} className="px-4 py-3 grid grid-cols-8 gap-3 border-t text-sm">
                    <div className="font-medium">{process.processName}</div>
                    <div className="text-muted-foreground">{process.sector || "N/A"}</div>
                    <div>
                      {process.calculationType === 'fixed' ? (
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono">{process.fixedTime} min</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium text-xs">{process.calculationRuleName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {process.calculationRuleFormula}
                            {process.multiplier && process.multiplier !== 1 && (
                              <span className="ml-1 text-blue-600">× {process.multiplier}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-center text-muted-foreground">{process.timeUnit}</div>
                    <div className="text-center">
                      <span className="font-mono text-sm">
                        R$ {(process.costPerHour || 0).toFixed(2)}/h
                      </span>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => handleShowCostDetail(process)}
                        className="font-mono text-sm font-bold text-orange-600 hover:text-orange-700 cursor-pointer transition-colors underline decoration-dotted underline-offset-2"
                      >
                        {process.calculationType === 'fixed' ? `${process.fixedTime} min` : 'Calculado'}
                      </button>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProcess(process.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(process)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        disabled={editingId !== null && editingId !== process.id}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={processes.length === 0}
          >
            Salvar Processos ({processes.length})
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal de Seleção de Fórmulas */}
      <FormulaModal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        onSelect={handleFormulaSelect}
        materialName={processesOptions.find(p => p.id === currentForm.processId)?.name}
        materialUnit="minutos"
      />

      {/* Modal de Detalhamento de Tempos */}
      <Dialog open={showCostDetailModal} onOpenChange={setShowCostDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Detalhamento do Processo
            </DialogTitle>
            <DialogDescription>
              Detalhamento do tempo e custo deste processo
            </DialogDescription>
          </DialogHeader>

          {selectedProcessForDetail && (
            <div className="space-y-4 py-4">
              {/* Header do Processo */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="font-medium text-lg">{selectedProcessForDetail.processName}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedProcessForDetail.sector && (
                    <>Setor: {selectedProcessForDetail.sector}</>
                  )}
                </div>
              </div>

              {/* Detalhamento do Tempo */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Configuração do Tempo</h4>
                
                {/* Método de Cálculo */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <div className="font-medium text-sm">Método de Cálculo</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedProcessForDetail.calculationType === 'fixed' ? (
                          <>Tempo fixo: {selectedProcessForDetail.fixedTime} minutos</>
                        ) : (
                          <>
                            Fórmula: {selectedProcessForDetail.calculationRuleName}
                            {selectedProcessForDetail.multiplier && selectedProcessForDetail.multiplier !== 1 && (
                              <span className="ml-1 text-blue-600">× {selectedProcessForDetail.multiplier}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-blue-700">
                    {selectedProcessForDetail.calculationType === 'fixed' ? (
                      `${selectedProcessForDetail.fixedTime} min`
                    ) : (
                      'Calculado dinamicamente'
                    )}
                  </div>
                </div>

                {/* Custo por Hora */}
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <div>
                      <div className="font-medium text-sm">Custo por Hora</div>
                      <div className="text-xs text-muted-foreground">
                        Custo base do processo
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-orange-700">
                    R$ {(selectedProcessForDetail.costPerHour || 0).toFixed(2)}/hora
                  </div>
                </div>

                {/* Total Estimado */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-600"></div>
                    <div>
                      <div className="font-bold text-base">Estrutura de Cálculo</div>
                      <div className="text-xs text-muted-foreground">
                        Tempo × Custo por Hora
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-xl text-green-700">
                    Configurado ✓
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedProcessForDetail.description && (
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="font-medium text-sm mb-1">Observações</div>
                  <div className="text-sm text-muted-foreground">{selectedProcessForDetail.description}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCostDetailModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}