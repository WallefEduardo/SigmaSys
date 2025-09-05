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
import { Trash2, Plus, Calculator, Hash, Edit2, Save, X, Settings, Printer } from 'lucide-react';
import { api } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import FormulaModal from "./FormulaModal";
import { FormulaEngine, type FormulaVariables } from "@/lib/formula-engine";

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipments: EquipmentItem[]) => void;
  initialEquipments?: EquipmentItem[];
}

interface EquipmentItem {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  costPerM2: number;
  calculationType: 'fixed' | 'formula';
  fixedTime?: number; // tempo fixo em minutos
  calculationRuleId?: string;
  calculationRuleName?: string;
  calculationRuleFormula?: string;
  multiplier?: number; // Multiplicador para fórmulas
  timeUnit: string;
  description?: string;
  measurementText?: string; // Texto personalizado para coleta de medidas
  // Custos calculados
  totalTime?: number; // tempo total em minutos
  totalCost?: number; // custo total calculado
}

export default function EquipmentModal({ isOpen, onClose, onSave, initialEquipments = [] }: EquipmentModalProps) {
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCostDetailModal, setShowCostDetailModal] = useState(false);
  const [selectedEquipmentForDetail, setSelectedEquipmentForDetail] = useState<EquipmentItem | null>(null);
  const [currentForm, setCurrentForm] = useState({
    equipmentId: "",
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

  // Buscar dados
  const { data: equipmentsData } = api.equipments.listWithCosts.useQuery({});
  const { data: calculationRulesData } = api.calculationRules.list.useQuery({ active: true });
  const { data: predefinedRulesData } = api.calculationRules.getPredefined.useQuery({});
  
  const equipmentsOptions = equipmentsData || [];
  const calculationRules = calculationRulesData?.rules || [];
  const predefinedRules = predefinedRulesData?.rules || [];
  const allRules = [...calculationRules, ...predefinedRules];

  // Carregar equipamentos iniciais quando modal abrir
  useEffect(() => {
    if (isOpen && initialEquipments.length > 0) {
      setEquipments(initialEquipments);
    } else if (isOpen) {
      setEquipments([]);
    }
  }, [isOpen, initialEquipments]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "AREA": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "LENGTH": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "UNIT": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getEquipmentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'printing': return Printer;
      case 'machining': return Settings;
      default: return Settings;
    }
  };

  const getEquipmentTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'printing': return 'Impressão';
      case 'machining': return 'Usinagem';
      default: return 'Equipamento';
    }
  };

  // Função para preparar estrutura dos tempos/custos (SEM calcular valores reais)
  const prepareCostStructure = (equipment: any, calculationType: string, time?: number, formula?: string, multiplier = 1) => {
    const costPerM2 = Number(equipment.totalCostPerM2) || 0;
    
    // ⚠️ NO EQUIPMENT MODAL: Não calcular valores reais, apenas estruturar
    // Os cálculos reais acontecem no Teste de Fluxo / Orçamento quando há medidas
    
    return {
      calculatedTime: 0, // Será calculado com medidas reais
      totalCost: 0, // Será calculado com medidas reais
      // Manter dados para estrutura
      costPerM2: costPerM2
    };
  };

  const addEquipment = () => {
    if (!currentForm.equipmentId) {
      return;
    }
    
    if (currentForm.calculationType === 'fixed' && !currentForm.fixedTime) {
      return;
    }
    
    if (currentForm.calculationType === 'formula' && !currentForm.calculationRuleId) {
      return;
    }

    const equipment = equipmentsOptions.find(e => e.id === currentForm.equipmentId);
    const rule = allRules.find(r => r.id === currentForm.calculationRuleId);

    // Preparar estrutura de custos (sem cálculos reais ainda)
    const costs = prepareCostStructure(
      equipment,
      currentForm.calculationType,
      parseFloat(currentForm.fixedTime),
      currentForm.calculationRuleFormula,
      parseFloat(currentForm.multiplier) || 1
    );

    const newEquipment: EquipmentItem = {
      id: `equipment-${Date.now()}`,
      equipmentId: currentForm.equipmentId,
      equipmentName: equipment?.name || "",
      equipmentType: equipment?.type || "",
      costPerM2: Number(equipment?.totalCostPerM2) || 0,
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
      timeUnit: currentForm.timeUnit || "minutos",
      description: currentForm.description.trim() || undefined,
      measurementText: currentForm.measurementText.trim() || undefined,
      // Custos calculados
      totalTime: costs.calculatedTime,
      totalCost: costs.totalCost
    };

    setEquipments(prev => [...prev, newEquipment]);
    setCurrentForm({
      equipmentId: "",
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

  const removeEquipment = (id: string) => {
    setEquipments(prev => prev.filter(e => e.id !== id));
    setEditingId(null); // Cancelar edição se estava editando este item
  };

  const startEdit = (equipment: EquipmentItem) => {
    setEditingId(equipment.id);
    setCurrentForm({
      equipmentId: equipment.equipmentId,
      calculationType: equipment.calculationType,
      fixedTime: equipment.fixedTime?.toString() || "",
      calculationRuleId: equipment.calculationRuleId || "",
      calculationRuleName: equipment.calculationRuleName || "",
      calculationRuleFormula: equipment.calculationRuleFormula || "",
      multiplier: equipment.multiplier?.toString() || "1",
      timeUnit: equipment.timeUnit,
      description: equipment.description || "",
      measurementText: equipment.measurementText || ""
    });
  };

  const saveEdit = () => {
    if (!editingId) return;

    const equipment = equipmentsOptions.find(e => e.id === currentForm.equipmentId);

    // Preparar estrutura de custos (sem cálculos reais ainda)
    const costs = prepareCostStructure(
      equipment,
      currentForm.calculationType,
      parseFloat(currentForm.fixedTime),
      currentForm.calculationRuleFormula,
      parseFloat(currentForm.multiplier) || 1
    );

    const updatedEquipment: EquipmentItem = {
      id: editingId,
      equipmentId: currentForm.equipmentId,
      equipmentName: equipment?.name || "",
      equipmentType: equipment?.type || "",
      costPerM2: Number(equipment?.totalCostPerM2) || 0,
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
      timeUnit: currentForm.timeUnit || "minutos",
      description: currentForm.description.trim() || undefined,
      measurementText: currentForm.measurementText.trim() || undefined,
      // Custos calculados
      totalTime: costs.calculatedTime,
      totalCost: costs.totalCost
    };

    setEquipments(prev => prev.map(e => e.id === editingId ? updatedEquipment : e));
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCurrentForm({
      equipmentId: "",
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
    onSave(equipments);
    onClose();
    setEquipments([]);
  };

  const handleCancel = () => {
    onClose();
    setEquipments([]);
    setEditingId(null);
    setCurrentForm({
      equipmentId: "",
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

  const handleShowCostDetail = (equipment: EquipmentItem) => {
    setSelectedEquipmentForDetail(equipment);
    setShowCostDetailModal(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Equipamentos</DialogTitle>
          <DialogDescription>
            Configure os equipamentos necessários para este produto (impressoras, máquinas, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formulário de Adição */}
          <div className={`border rounded-lg p-4 space-y-4 ${editingId ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="font-medium text-lg">
              Adicionar Equipamento
              {editingId && <span className="text-sm text-muted-foreground ml-2">(Bloqueado durante edição)</span>}
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="equipment">Equipamento (Impressora/Máquina) *</Label>
                <Select
                  value={currentForm.equipmentId}
                  onValueChange={(value) => {
                    const equipment = equipmentsOptions.find(e => e.id === value);
                    setCurrentForm(prev => ({
                      ...prev,
                      equipmentId: value,
                      timeUnit: "minutos"
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentsOptions.map((equipment) => {
                      const Icon = getEquipmentTypeIcon(equipment.type);
                      return (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{equipment.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {getEquipmentTypeLabel(equipment.type)}
                            </Badge>
                            <span className="text-muted-foreground ml-2">
                              (R$ {Number(equipment.totalCostPerM2 || 0).toFixed(2)}/m²)
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sistema de Cálculo de Tempo de Uso - Layout lado a lado */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Como Calcular o Tempo de Uso? *</Label>
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
                      Tempo de Uso Fixo
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ex: 15 minutos na impressora, 30 minutos na máquina
                    </p>
                    
                    {currentForm.calculationType === 'fixed' && (
                      <div className="mt-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={currentForm.fixedTime}
                          onChange={(e) => setCurrentForm(prev => ({ ...prev, fixedTime: e.target.value }))}
                          placeholder="Ex: 15, 30, 60..."
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
                      Tempo Calculado por Dimensão
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      O sistema calcula tempo baseado no tamanho da peça (ex: 2m² = 20 minutos)
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
                                  Tempo = Resultado da Fórmula × Multiplicador (minutos por m²)
                                </p>
                              </div>
                            )}
                            
                            {/* Campo de Texto para Medidas */}
                            {currentForm.calculationRuleId && (
                              <div>
                                <Label htmlFor="measurementText" className="text-sm font-medium">
                                  Texto para Coleta de Medidas (opcional)
                                </Label>
                                <Input
                                  id="measurementText"
                                  type="text"
                                  value={currentForm.measurementText}
                                  onChange={(e) => setCurrentForm(prev => ({ ...prev, measurementText: e.target.value }))}
                                  placeholder="Ex: Informe o tempo estimado de operação"
                                  className="mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Se deixado vazio, será usado um texto padrão
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
                                      Multiplicador: <span className="font-mono">{currentForm.multiplier}x min/m²</span>
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
                placeholder="Descreva detalhes específicos do uso deste equipamento para o produto..."
                rows={3}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Esta descrição será específica para este produto e aparecerá na lista de equipamentos.
              </p>
            </div>

            <Button 
              type="button" 
              onClick={addEquipment}
              disabled={
                !currentForm.equipmentId || 
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
            <div className="border rounded-lg p-4 space-y-4 bg-purple-50/50 dark:bg-purple-950/20">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">Editando Equipamento</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveEdit}
                    disabled={
                      !currentForm.equipmentId || 
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
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-equipment">Equipamento *</Label>
                  <Select
                    value={currentForm.equipmentId}
                    onValueChange={(value) => {
                      const equipment = equipmentsOptions.find(e => e.id === value);
                      setCurrentForm(prev => ({
                        ...prev,
                        equipmentId: value,
                        timeUnit: "minutos"
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentsOptions.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name}
                          <span className="text-muted-foreground ml-2">
                            (R$ {Number(equipment.totalCostPerM2 || 0).toFixed(2)}/m²)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sistema de Cálculo para Edição */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Como Calcular o Tempo de Uso? *</Label>
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
                            Tempo de Uso Fixo
                          </Label>
                          
                          {currentForm.calculationType === 'fixed' && (
                            <div className="mt-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={currentForm.fixedTime}
                                onChange={(e) => setCurrentForm(prev => ({ ...prev, fixedTime: e.target.value }))}
                                placeholder="Ex: 15, 30, 60..."
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
                            Tempo Calculado por Dimensão
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
                                    Tempo = Resultado da Fórmula × Multiplicador (min/m²)
                                  </p>
                                </div>
                              )}
                              
                              {/* Campo de Texto para Medidas - Edição */}
                              {currentForm.calculationRuleId && (
                                <div>
                                  <Label htmlFor="edit-measurementText" className="text-sm font-medium">
                                    Texto para Coleta de Medidas (opcional)
                                  </Label>
                                  <Input
                                    id="edit-measurementText"
                                    type="text"
                                    value={currentForm.measurementText}
                                    onChange={(e) => setCurrentForm(prev => ({ ...prev, measurementText: e.target.value }))}
                                    placeholder="Ex: Informe o tempo estimado de operação"
                                    className="mt-1"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Se deixado vazio, será usado um texto padrão
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
                                        Multiplicador: <span className="font-mono">{currentForm.multiplier}x min/m²</span>
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
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-base font-medium">
                    Descrição Personalizada (Opcional)
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={currentForm.description}
                    onChange={(e) => setCurrentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva detalhes específicos do uso deste equipamento para o produto..."
                    rows={3}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta descrição será específica para este produto e aparecerá na lista de equipamentos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Equipamentos Adicionados */}
          {equipments.length > 0 && (
            <div className="space-y-4">
              {/* Header com Total dos Custos por m² */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">Equipamentos Adicionados ({equipments.length})</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-muted-foreground">
                    Custo médio por m²: <span className="font-bold text-lg text-purple-600">
                      R$ {equipments.length > 0 ? (equipments.reduce((sum, e) => sum + (e.costPerM2 || 0), 0) / equipments.length).toFixed(2) : '0.00'}/m²
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 grid grid-cols-8 gap-3 font-medium text-sm">
                  <div>Equipamento</div>
                  <div>Tipo</div>
                  <div>Cálculo de Tempo</div>
                  <div className="text-center">Unidade</div>
                  <div className="text-center">Custo/m²</div>
                  <div className="text-center">Tempo Base</div>
                  <div className="text-center">Ações</div>
                  <div className="text-center">Editar</div>
                </div>
                
                {equipments.map((equipment) => {
                  const Icon = getEquipmentTypeIcon(equipment.equipmentType);
                  return (
                    <div key={equipment.id} className="px-4 py-3 grid grid-cols-8 gap-3 border-t text-sm">
                      <div className="font-medium">{equipment.equipmentName}</div>
                      <div className="flex items-center gap-1">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs">
                          {getEquipmentTypeLabel(equipment.equipmentType)}
                        </span>
                      </div>
                      <div>
                        {equipment.calculationType === 'fixed' ? (
                          <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3 text-muted-foreground" />
                            <span className="font-mono">{equipment.fixedTime} min</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calculator className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium text-xs">{equipment.calculationRuleName}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {equipment.calculationRuleFormula}
                              {equipment.multiplier && equipment.multiplier !== 1 && (
                                <span className="ml-1 text-purple-600">× {equipment.multiplier}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-center text-muted-foreground">{equipment.timeUnit}</div>
                      <div className="text-center">
                        <span className="font-mono text-sm">
                          R$ {(equipment.costPerM2 || 0).toFixed(2)}/m²
                        </span>
                      </div>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => handleShowCostDetail(equipment)}
                          className="font-mono text-sm font-bold text-purple-600 hover:text-purple-700 cursor-pointer transition-colors underline decoration-dotted underline-offset-2"
                        >
                          {equipment.calculationType === 'fixed' ? `${equipment.fixedTime} min` : 'Calculado'}
                        </button>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEquipment(equipment.id)}
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
                          onClick={() => startEdit(equipment)}
                          className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                          disabled={editingId !== null && editingId !== equipment.id}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
            disabled={equipments.length === 0}
          >
            Salvar Equipamentos ({equipments.length})
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal de Seleção de Fórmulas */}
      <FormulaModal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        onSelect={handleFormulaSelect}
        materialName={equipmentsOptions.find(e => e.id === currentForm.equipmentId)?.name}
        materialUnit="minutos por m²"
      />

      {/* Modal de Detalhamento de Uso */}
      <Dialog open={showCostDetailModal} onOpenChange={setShowCostDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Detalhamento do Equipamento
            </DialogTitle>
            <DialogDescription>
              Detalhamento do tempo de uso e custo deste equipamento
            </DialogDescription>
          </DialogHeader>

          {selectedEquipmentForDetail && (
            <div className="space-y-4 py-4">
              {/* Header do Equipamento */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const Icon = getEquipmentTypeIcon(selectedEquipmentForDetail.equipmentType);
                    return <Icon className="w-5 h-5" />;
                  })()}
                  <div className="font-medium text-lg">{selectedEquipmentForDetail.equipmentName}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Tipo: {getEquipmentTypeLabel(selectedEquipmentForDetail.equipmentType)}
                </div>
              </div>

              {/* Detalhamento do Tempo */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Configuração do Tempo de Uso</h4>
                
                {/* Método de Cálculo */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <div className="font-medium text-sm">Método de Cálculo</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedEquipmentForDetail.calculationType === 'fixed' ? (
                          <>Tempo fixo: {selectedEquipmentForDetail.fixedTime} minutos</>
                        ) : (
                          <>
                            Fórmula: {selectedEquipmentForDetail.calculationRuleName}
                            {selectedEquipmentForDetail.multiplier && selectedEquipmentForDetail.multiplier !== 1 && (
                              <span className="ml-1 text-blue-600">× {selectedEquipmentForDetail.multiplier}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-blue-700">
                    {selectedEquipmentForDetail.calculationType === 'fixed' ? (
                      `${selectedEquipmentForDetail.fixedTime} min`
                    ) : (
                      'Calculado dinamicamente'
                    )}
                  </div>
                </div>

                {/* Custo por m² */}
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <div>
                      <div className="font-medium text-sm">Custo por m²</div>
                      <div className="text-xs text-muted-foreground">
                        Custo total do equipamento (incluindo depreciação, energia, manutenção)
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-purple-700">
                    R$ {(selectedEquipmentForDetail.costPerM2 || 0).toFixed(2)}/m²
                  </div>
                </div>

                {/* Total Estimado */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-600"></div>
                    <div>
                      <div className="font-bold text-base">Estrutura de Cálculo</div>
                      <div className="text-xs text-muted-foreground">
                        Tempo de Uso × Custo por m²
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-xl text-green-700">
                    Configurado ✓
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedEquipmentForDetail.description && (
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="font-medium text-sm mb-1">Observações</div>
                  <div className="text-sm text-muted-foreground">{selectedEquipmentForDetail.description}</div>
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