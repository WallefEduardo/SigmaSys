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
import { Trash2, Plus, Calculator, Hash, Edit2, Save, X, DollarSign } from 'lucide-react';
import { api } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import FormulaModal from "./FormulaModal";
import { FormulaEngine, type FormulaVariables } from "@/lib/formula-engine";

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (materials: MaterialItem[]) => void;
  initialMaterials?: MaterialItem[];
}

interface MaterialItem {
  id: string;
  materialId: string;
  materialName: string;
  materialCost: number;
  equipmentId: string;
  equipmentName: string;
  equipmentCostPerM2?: number;
  calculationType: 'fixed' | 'formula';
  fixedQuantity?: number;
  calculationRuleId?: string;
  calculationRuleName?: string;
  calculationRuleFormula?: string;
  multiplier?: number; // Multiplicador para fórmulas
  unit: string;
  description?: string;
  measurementText?: string; // Texto personalizado para coleta de medidas
  // Custos calculados
  totalMaterialCost?: number;
  totalEquipmentCost?: number;
  totalCost?: number;
}

export default function MaterialModal({ isOpen, onClose, onSave, initialMaterials = [] }: MaterialModalProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCostDetailModal, setShowCostDetailModal] = useState(false);
  const [selectedMaterialForDetail, setSelectedMaterialForDetail] = useState<MaterialItem | null>(null);
  const [currentForm, setCurrentForm] = useState({
    materialId: "",
    equipmentId: "none",
    calculationType: "fixed" as 'fixed' | 'formula',
    fixedQuantity: "",
    calculationRuleId: "",
    calculationRuleName: "",
    calculationRuleFormula: "",
    multiplier: "1",
    unit: "",
    description: "",
    measurementText: ""
  });

  // 🛡️ Queries protegidas com fallbacks seguros
  const { data: materialsData, isLoading: materialsLoading, error: materialsError } = api.materials.list.useQuery(
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
  
  const { data: equipmentsData, isLoading: equipmentsLoading, error: equipmentsError } = api.equipments.listWithCosts.useQuery(
    { limit: 100 },
    { retry: 1, enabled: isOpen }
  );
  
  const materialsOptions = materialsData?.materials || [];
  const calculationRules = calculationRulesData?.rules || [];
  const predefinedRules = predefinedRulesData?.rules || [];
  const allRules = [...calculationRules, ...predefinedRules];
  const equipmentsOptions = equipmentsData || [];

  // Carregar materiais iniciais quando modal abrir
  useEffect(() => {
    if (isOpen && initialMaterials.length > 0) {
      setMaterials(initialMaterials);
    } else if (isOpen) {
      setMaterials([]);
    }
  }, [isOpen, initialMaterials]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "AREA": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "LENGTH": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "UNIT": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Função para preparar estrutura dos custos (SEM calcular valores reais)
  const prepareCostStructure = (material: any, equipment: any, calculationType: string, quantity?: number, formula?: string, multiplier = 1) => {
    const materialCost = Number(material.cost) || 0;
    const equipmentCostPerM2 = Number(equipment?.totalCostPerM2) || 0;
    
    // ⚠️ NO MATERIAL MODAL: Não calcular valores reais, apenas estruturar
    // Os cálculos reais acontecem no Teste de Fluxo / Orçamento quando há medidas
    
    return {
      calculatedQuantity: 0, // Será calculado com medidas reais
      equipmentArea: 0, // Será calculado com medidas reais
      totalMaterialCost: 0, // Será calculado com medidas reais
      totalEquipmentCost: 0, // Será calculado com medidas reais  
      totalCost: 0, // Será calculado com medidas reais
      // Manter dados para estrutura
      materialCostPerUnit: materialCost,
      equipmentCostPerM2: equipmentCostPerM2
    };
  };

  const addMaterial = () => {
    if (!currentForm.materialId) {
      return;
    }
    
    if (currentForm.calculationType === 'fixed' && !currentForm.fixedQuantity) {
      return;
    }
    
    if (currentForm.calculationType === 'formula' && !currentForm.calculationRuleId) {
      return;
    }

    const material = materialsOptions.find(m => m.id === currentForm.materialId);
    const equipment = currentForm.equipmentId === 'none' ? null : equipmentsOptions.find(e => e.id === currentForm.equipmentId);
    const rule = allRules.find(r => r.id === currentForm.calculationRuleId);

    // Preparar estrutura de custos (sem cálculos reais ainda)
    const costs = prepareCostStructure(
      material,
      equipment,
      currentForm.calculationType,
      parseFloat(currentForm.fixedQuantity),
      currentForm.calculationRuleFormula,
      parseFloat(currentForm.multiplier) || 1
    );

    const newMaterial: MaterialItem = {
      id: `mat-${Date.now()}`,
      materialId: currentForm.materialId,
      materialName: material?.name || "",
      materialCost: Number(material?.cost) || 0,
      equipmentId: currentForm.equipmentId === 'none' ? '' : currentForm.equipmentId,
      equipmentName: equipment?.name || "Nenhum",
      equipmentCostPerM2: Number(equipment?.totalCostPerM2) || 0,
      calculationType: currentForm.calculationType,
      ...(currentForm.calculationType === 'fixed' 
        ? { fixedQuantity: parseFloat(currentForm.fixedQuantity) }
        : { 
            calculationRuleId: currentForm.calculationRuleId,
            calculationRuleName: currentForm.calculationRuleName,
            calculationRuleFormula: currentForm.calculationRuleFormula,
            multiplier: parseFloat(currentForm.multiplier) || 1
          }
      ),
      unit: currentForm.unit || material?.unit || rule?.resultUnit || "un",
      description: currentForm.description.trim() || undefined,
      measurementText: currentForm.measurementText.trim() || undefined,
      // Custos calculados
      totalMaterialCost: costs.totalMaterialCost,
      totalEquipmentCost: costs.totalEquipmentCost,
      totalCost: costs.totalCost
    };

    setMaterials(prev => [...prev, newMaterial]);
    setCurrentForm({
      materialId: "",
      equipmentId: "none",
      calculationType: "fixed",
      fixedQuantity: "",
      calculationRuleId: "",
      calculationRuleName: "",
      calculationRuleFormula: "",
      multiplier: "1",
      unit: "",
      description: "",
      measurementText: "",
      measurementText: ""
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

  const removeMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    setEditingId(null); // Cancelar edição se estava editando este item
  };

  const startEdit = (material: MaterialItem) => {
    setEditingId(material.id);
    setCurrentForm({
      materialId: material.materialId,
      equipmentId: material.equipmentId || 'none',
      calculationType: material.calculationType,
      fixedQuantity: material.fixedQuantity?.toString() || "",
      calculationRuleId: material.calculationRuleId || "",
      calculationRuleName: material.calculationRuleName || "",
      calculationRuleFormula: material.calculationRuleFormula || "",
      multiplier: material.multiplier?.toString() || "1",
      unit: material.unit,
      description: material.description || "",
      measurementText: material.measurementText || ""
    });
  };

  const saveEdit = () => {
    if (!editingId) return;

    const material = materialsOptions.find(m => m.id === currentForm.materialId);
    const equipment = currentForm.equipmentId === 'none' ? null : equipmentsOptions.find(e => e.id === currentForm.equipmentId);

    // Preparar estrutura de custos (sem cálculos reais ainda)
    const costs = prepareCostStructure(
      material,
      equipment,
      currentForm.calculationType,
      parseFloat(currentForm.fixedQuantity),
      currentForm.calculationRuleFormula,
      parseFloat(currentForm.multiplier) || 1
    );

    const updatedMaterial: MaterialItem = {
      id: editingId,
      materialId: currentForm.materialId,
      materialName: material?.name || "",
      materialCost: Number(material?.cost) || 0,
      equipmentId: currentForm.equipmentId === 'none' ? '' : currentForm.equipmentId,
      equipmentName: equipment?.name || "Nenhum",
      equipmentCostPerM2: Number(equipment?.totalCostPerM2) || 0,
      calculationType: currentForm.calculationType,
      ...(currentForm.calculationType === 'fixed' 
        ? { fixedQuantity: parseFloat(currentForm.fixedQuantity) }
        : { 
            calculationRuleId: currentForm.calculationRuleId,
            calculationRuleName: currentForm.calculationRuleName,
            calculationRuleFormula: currentForm.calculationRuleFormula,
            multiplier: parseFloat(currentForm.multiplier) || 1
          }
      ),
      unit: currentForm.unit || material?.unit || "un",
      description: currentForm.description.trim() || undefined,
      measurementText: currentForm.measurementText.trim() || undefined,
      // Custos calculados
      totalMaterialCost: costs.totalMaterialCost,
      totalEquipmentCost: costs.totalEquipmentCost,
      totalCost: costs.totalCost
    };

    setMaterials(prev => prev.map(m => m.id === editingId ? updatedMaterial : m));
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCurrentForm({
      materialId: "",
      equipmentId: "none",
      calculationType: "fixed",
      fixedQuantity: "",
      calculationRuleId: "",
      calculationRuleName: "",
      calculationRuleFormula: "",
      multiplier: "1",
      unit: "",
      description: "",
      measurementText: ""
    });
  };

  const handleSave = () => {
    onSave(materials);
    onClose();
    setMaterials([]);
  };

  const handleCancel = () => {
    onClose();
    setMaterials([]);
    setEditingId(null);
    setCurrentForm({
      materialId: "",
      equipmentId: "none",
      calculationType: "fixed",
      fixedQuantity: "",
      calculationRuleId: "",
      calculationRuleName: "",
      calculationRuleFormula: "",
      multiplier: "1",
      unit: "",
      description: "",
      measurementText: ""
    });
  };

  const handleShowCostDetail = (material: MaterialItem) => {
    setSelectedMaterialForDetail(material);
    setShowCostDetailModal(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Materiais</DialogTitle>
          <DialogDescription>
            Configure os materiais necessários para este produto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formulário de Adição */}
          <div className={`border rounded-lg p-4 space-y-4 ${editingId ? 'opacity-50 pointer-events-none' : ''}`}>
            <h3 className="font-medium text-lg">
              Adicionar Material
              {editingId && <span className="text-sm text-muted-foreground ml-2">(Bloqueado durante edição)</span>}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material">Matéria Prima *</Label>
                <Select
                  value={currentForm.materialId}
                  onValueChange={(value) => {
                    const material = materialsOptions.find(m => m.id === value);
                    setCurrentForm(prev => ({
                      ...prev,
                      materialId: value,
                      unit: material?.unit || "un"
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a matéria prima" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialsLoading ? (
                      <SelectItem value="loading" disabled>
                        Carregando materiais...
                      </SelectItem>
                    ) : materialsError ? (
                      <SelectItem value="error" disabled>
                        Erro ao carregar materiais
                      </SelectItem>
                    ) : materialsOptions.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Nenhum material encontrado
                      </SelectItem>
                    ) : (
                      materialsOptions.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                          <span className="text-muted-foreground ml-2">
                            (R$ {Number(material.cost).toFixed(2)}/{material.unit})
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="equipment">Equipamento (Opcional)</Label>
                <Select
                  value={currentForm.equipmentId}
                  onValueChange={(value) => setCurrentForm(prev => ({ ...prev, equipmentId: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o equipamento (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum equipamento</SelectItem>
                    {equipmentsLoading ? (
                      <SelectItem value="loading" disabled>
                        Carregando equipamentos...
                      </SelectItem>
                    ) : equipmentsError ? (
                      <SelectItem value="error" disabled>
                        Erro ao carregar equipamentos
                      </SelectItem>
                    ) : (
                      equipmentsOptions.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name}
                          <span className="text-muted-foreground ml-2">
                            (R$ {Number(equipment.totalCostPerM2 || 0).toFixed(2)}/m²)
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Sistema de Cálculo Inteligente - Layout lado a lado */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Como Calcular a Quantidade? *</Label>
              <RadioGroup 
                value={currentForm.calculationType} 
                onValueChange={(value) => setCurrentForm(prev => ({ 
                  ...prev, 
                  calculationType: value as 'fixed' | 'formula',
                  fixedQuantity: "",
                  calculationRuleId: "",
                  calculationRuleName: "",
                  calculationRuleFormula: "",
                  multiplier: "1"
                }))}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Quantidade Fixa */}
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="fixed" className="flex items-center text-sm font-medium cursor-pointer">
                      <Hash className="w-4 h-4 mr-2" />
                      Quantidade Fixa
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ex: 1 tubo de cola, 4 parafusos, 2 dobradiças
                    </p>
                    
                    {currentForm.calculationType === 'fixed' && (
                      <div className="mt-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={currentForm.fixedQuantity}
                          onChange={(e) => setCurrentForm(prev => ({ ...prev, fixedQuantity: e.target.value }))}
                          placeholder="Ex: 1, 4, 2.5..."
                          className="w-32"
                        />
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
                                  Multiplicador
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
                                  Quantidade = Resultado da Fórmula × Multiplicador
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
                placeholder="Descreva detalhes específicos deste material para o produto..."
                rows={3}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Esta descrição será específica para este produto e aparecerá na lista de materiais.
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
                  placeholder="Ex: Informe as dimensões da fachada"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Texto que aparecerá para o vendedor quando for coletar as medidas. Se vazio, usará texto padrão.
                </p>
              </div>
            )}

            <Button 
              type="button" 
              onClick={addMaterial}
              disabled={
                !currentForm.materialId || 
                (currentForm.calculationType === 'fixed' && !currentForm.fixedQuantity) ||
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
                <h3 className="font-medium text-lg">Editando Material</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveEdit}
                    disabled={
                      !currentForm.materialId || 
                      (currentForm.calculationType === 'fixed' && !currentForm.fixedQuantity) ||
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
                  <Label htmlFor="edit-material">Matéria Prima *</Label>
                  <Select
                    value={currentForm.materialId}
                    onValueChange={(value) => {
                      const material = materialsOptions.find(m => m.id === value);
                      setCurrentForm(prev => ({
                        ...prev,
                        materialId: value,
                        unit: material?.unit || "un"
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a matéria prima" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialsOptions.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                          <span className="text-muted-foreground ml-2">
                            (R$ {Number(material.cost).toFixed(2)}/{material.unit})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-equipment">Equipamento (Opcional)</Label>
                  <Select
                    value={currentForm.equipmentId}
                    onValueChange={(value) => setCurrentForm(prev => ({ ...prev, equipmentId: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o equipamento (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum equipamento</SelectItem>
                      {equipmentsOptions.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sistema de Cálculo para Edição */}
                <div className="col-span-2">
                  <Label className="text-base font-medium">Como Calcular a Quantidade? *</Label>
                  <RadioGroup 
                    value={currentForm.calculationType} 
                    onValueChange={(value) => setCurrentForm(prev => ({ 
                      ...prev, 
                      calculationType: value as 'fixed' | 'formula',
                      fixedQuantity: "",
                      calculationRuleId: "",
                      calculationRuleName: "",
                      calculationRuleFormula: "",
                      multiplier: "1"
                    }))}
                    className="mt-2"
                  >
                    <div className="space-y-4">
                      {/* Quantidade Fixa para Edição */}
                      <div className="flex items-start space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="fixed" id="edit-fixed" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="edit-fixed" className="flex items-center text-sm font-medium cursor-pointer">
                            <Hash className="w-4 h-4 mr-2" />
                            Quantidade Fixa
                          </Label>
                          
                          {currentForm.calculationType === 'fixed' && (
                            <div className="mt-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={currentForm.fixedQuantity}
                                onChange={(e) => setCurrentForm(prev => ({ ...prev, fixedQuantity: e.target.value }))}
                                placeholder="Ex: 1, 4, 2.5..."
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
                                    Multiplicador
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
                                    Quantidade = Resultado da Fórmula × Multiplicador
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
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-base font-medium">
                    Descrição Personalizada (Opcional)
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={currentForm.description}
                    onChange={(e) => setCurrentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva detalhes específicos deste material para o produto..."
                    rows={3}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta descrição será específica para este produto e aparecerá na lista de materiais.
                  </p>
                </div>

                {/* Campo de Texto para Medidas - Edição - Só aparece se for fórmula */}
                {currentForm.calculationType === 'formula' && currentForm.calculationRuleId && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-measurementText" className="text-base font-medium">
                      Texto Personalizado para Medidas (Opcional)
                    </Label>
                    <Input
                      id="edit-measurementText"
                      value={currentForm.measurementText}
                      onChange={(e) => setCurrentForm(prev => ({ ...prev, measurementText: e.target.value }))}
                      placeholder="Ex: Informe as dimensões da fachada"
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

          {/* Tabela de Materiais Adicionados */}
          {materials.length > 0 && (
            <div className="space-y-4">
              {/* Header com Total dos Custos por m² */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">Materiais Adicionados ({materials.length})</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-muted-foreground">
                    Total por m²: <span className="font-bold text-lg text-green-600">
                      R$ {materials.reduce((sum, m) => sum + ((m.materialCost || 0) + (m.equipmentCostPerM2 || 0)), 0).toFixed(2)}/m²
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 grid grid-cols-9 gap-3 font-medium text-sm">
                  <div>Matéria Prima</div>
                  <div>Equipamento</div>
                  <div>Cálculo</div>
                  <div className="text-center">Unidade</div>
                  <div className="text-center">Custo Material</div>
                  <div className="text-center">Custo Equip.</div>
                  <div className="text-center">Custo/m²</div>
                  <div className="text-center">Ações</div>
                  <div className="text-center">Editar</div>
                </div>
                
                {materials.map((material) => (
                  <div key={material.id} className="px-4 py-3 grid grid-cols-9 gap-3 border-t text-sm">
                    <div className="font-medium">{material.materialName}</div>
                    <div className="text-muted-foreground">{material.equipmentName}</div>
                    <div>
                      {material.calculationType === 'fixed' ? (
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono">{material.fixedQuantity}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-3 h-3 text-muted-foreground" />
                            <span className="font-medium text-xs">{material.calculationRuleName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {material.calculationRuleFormula}
                            {material.multiplier && material.multiplier !== 1 && (
                              <span className="ml-1 text-blue-600">× {material.multiplier}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-center text-muted-foreground">{material.unit}</div>
                    <div className="text-center">
                      <span className="font-mono text-sm">
                        R$ {(material.materialCost || 0).toFixed(2)}/m²
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="font-mono text-sm">
                        R$ {(material.equipmentCostPerM2 || 0).toFixed(2)}/m²
                      </span>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => handleShowCostDetail(material)}
                        className="font-mono text-sm font-bold text-green-600 hover:text-green-700 cursor-pointer transition-colors underline decoration-dotted underline-offset-2"
                      >
                        R$ {((material.materialCost || 0) + (material.equipmentCostPerM2 || 0)).toFixed(2)}/m²
                      </button>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMaterial(material.id)}
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
                        onClick={() => startEdit(material)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        disabled={editingId !== null && editingId !== material.id}
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
            disabled={materials.length === 0}
          >
            Salvar Materiais ({materials.length})
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal de Seleção de Fórmulas */}
      <FormulaModal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
        onSelect={handleFormulaSelect}
        materialName={materialsOptions.find(m => m.id === currentForm.materialId)?.name}
        materialUnit={materialsOptions.find(m => m.id === currentForm.materialId)?.unit}
      />

      {/* Modal de Detalhamento de Custos */}
      <Dialog open={showCostDetailModal} onOpenChange={setShowCostDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Custos por m²
            </DialogTitle>
            <DialogDescription>
              Detalhamento dos custos unitários deste material
            </DialogDescription>
          </DialogHeader>

          {selectedMaterialForDetail && (
            <div className="space-y-4 py-4">
              {/* Header do Material */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="font-medium text-lg">{selectedMaterialForDetail.materialName}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedMaterialForDetail.equipmentName !== "Nenhum" && (
                    <>Equipamento: {selectedMaterialForDetail.equipmentName}</>
                  )}
                </div>
              </div>

              {/* Detalhamento dos Custos por m² */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Composição do Custo por m²</h4>
                
                {/* Custo da Matéria-Prima */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <div className="font-medium text-sm">Custo da Matéria-Prima</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedMaterialForDetail.calculationType === 'fixed' ? (
                          <>Quantidade fixa: {selectedMaterialForDetail.fixedQuantity} {selectedMaterialForDetail.unit}</>
                        ) : (
                          <>
                            Fórmula: {selectedMaterialForDetail.calculationRuleName}
                            {selectedMaterialForDetail.multiplier && selectedMaterialForDetail.multiplier !== 1 && (
                              <span className="ml-1 text-blue-600">× {selectedMaterialForDetail.multiplier}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-blue-700">
                    R$ {(selectedMaterialForDetail.materialCost || 0).toFixed(2)}/m²
                  </div>
                </div>

                {/* Custo do Equipamento */}
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <div>
                      <div className="font-medium text-sm">Custo do Equipamento</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedMaterialForDetail.equipmentName !== "Nenhum" ? (
                          <>Equipamento: {selectedMaterialForDetail.equipmentName}</>
                        ) : (
                          "Nenhum equipamento selecionado"
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-orange-700">
                    R$ {(selectedMaterialForDetail.equipmentCostPerM2 || 0).toFixed(2)}/m²
                  </div>
                </div>

                {/* Total por m² */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-600"></div>
                    <div>
                      <div className="font-bold text-base">Custo Total por m²</div>
                      <div className="text-xs text-muted-foreground">
                        Material + Equipamento
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-xl text-green-700">
                    R$ {((selectedMaterialForDetail.materialCost || 0) + (selectedMaterialForDetail.equipmentCostPerM2 || 0)).toFixed(2)}/m²
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedMaterialForDetail.description && (
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="font-medium text-sm mb-1">Observações</div>
                  <div className="text-sm text-muted-foreground">{selectedMaterialForDetail.description}</div>
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