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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Package, Cpu, Settings, Palette, Copy } from 'lucide-react';
import { api } from "@/lib/trpc";
import MaterialModal from "./MaterialModal";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: QuestionData) => void;
  initialData?: any;
  isEditing?: boolean;
}

interface ResponseOption {
  id: string;
  label: string;
  actions: ResponseAction[];
}

interface ResponseAction {
  id: string;
  type: 'add_material' | 'add_process' | 'add_equipment' | 'add_finish';
  itemId: string;
  itemName?: string;
  quantity?: number;
  formula?: string;
  materials?: any[]; // Para armazenar múltiplos materiais do modal
}

interface QuestionData {
  question: string;
  description?: string;
  responseType: 'single' | 'multiple' | 'conditional';
  options: ResponseOption[];
}

const actionTypeIcons = {
  add_material: Package,
  add_process: Cpu,
  add_equipment: Settings,
  add_finish: Palette,
};

const actionTypeLabels = {
  add_material: 'Adicionar Material',
  add_process: 'Adicionar Processo',
  add_equipment: 'Adicionar Equipamento',
  add_finish: 'Adicionar Acabamento',
};

export default function QuestionModal({ isOpen, onClose, onSave, initialData, isEditing }: QuestionModalProps) {
  const [questionData, setQuestionData] = useState<QuestionData>({
    question: '',
    description: '',
    responseType: 'single',
    options: [],
  });
  
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [currentEditingAction, setCurrentEditingAction] = useState<{
    optionId: string;
    actionId: string;
  } | null>(null);

  // Carregar dados iniciais quando estiver editando
  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        // Fazer uma cópia profunda dos dados para evitar referências
        const dataToLoad = JSON.parse(JSON.stringify(initialData));
        setQuestionData({
          question: dataToLoad.question || '',
          description: dataToLoad.description || '',
          responseType: dataToLoad.responseType || 'single',
          options: dataToLoad.options || [],
        });
      } else if (!isEditing) {
        // Reset form para novo
        setQuestionData({
          question: '',
          description: '',
          responseType: 'single',
          options: [],
        });
      }
    }
  }, [isOpen, isEditing, JSON.stringify(initialData)]);

  // Fetch real data - usando estrutura correta do tRPC
  const { data: materialsData } = api.materials.list.useQuery({ limit: 100 });
  const { data: processesData } = api.processes.list.useQuery();
  const { data: equipmentsData } = api.equipments.list.useQuery();
  const { data: finishesData } = api.finishes.list.useQuery();
  
  const materials = materialsData?.items || [];
  const processes = processesData || [];
  const equipment = equipmentsData || [];
  const finishes = finishesData || [];

  const addOption = () => {
    const newOption: ResponseOption = {
      id: `opt-${Date.now()}`,
      label: '',
      actions: [],
    };
    setQuestionData(prev => ({
      ...prev,
      options: [...prev.options, newOption],
    }));
  };

  const removeOption = (optionId: string) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== optionId),
    }));
  };

  const duplicateOption = (optionId: string) => {
    console.log('🔍 QUESTIONMODAL - duplicateOption chamado para:', optionId);
    const optionToDuplicate = questionData.options.find(opt => opt.id === optionId);
    if (optionToDuplicate) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      const duplicatedOption: ResponseOption = {
        id: `opt-${timestamp}-${randomId}`,
        label: `${optionToDuplicate.label} (cópia)`,
        actions: optionToDuplicate.actions.map((action, index) => ({
          ...action,
          id: `act-${timestamp}-${randomId}-${index}`,
          // Fazer deep copy dos materiais se existir
          materials: action.materials ? JSON.parse(JSON.stringify(action.materials)) : action.materials,
        })),
      };
      
      console.log('🔍 QUESTIONMODAL - Opção duplicada criada:', duplicatedOption);
      setQuestionData(prev => {
        const updated = {
          ...prev,
          options: [...prev.options, duplicatedOption],
        };
        console.log('🔍 QUESTIONMODAL - Estado atualizado com nova opção:', updated.options.length, 'opções');
        return updated;
      });
    } else {
      console.log('🔍 QUESTIONMODAL - Opção para duplicar não encontrada:', optionId);
    }
  };

  const updateOption = (optionId: string, field: string, value: any) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const addAction = (optionId: string) => {
    const newAction: ResponseAction = {
      id: `act-${Date.now()}`,
      type: 'add_material',
      itemId: '',
    };
    
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId
          ? { ...opt, actions: [...opt.actions, newAction] }
          : opt
      ),
    }));
  };

  const removeAction = (optionId: string, actionId: string) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId
          ? { ...opt, actions: opt.actions.filter(act => act.id !== actionId) }
          : opt
      ),
    }));
  };

  const updateAction = (optionId: string, actionId: string, field: string, value: any) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId
          ? {
              ...opt,
              actions: opt.actions.map(act =>
                act.id === actionId ? { ...act, [field]: value } : act
              ),
            }
          : opt
      ),
    }));
  };

  const getItemsForActionType = (type: string) => {
    switch (type) {
      case 'add_material':
        return materials?.items || [];
      case 'add_process':
        return processes || [];
      case 'add_equipment':
        return equipment || [];
      case 'add_finish':
        return finishes || [];
      default:
        return [];
    }
  };

  const handleSave = () => {
    console.log('🔍 QUESTIONMODAL - handleSave chamado');
    console.log('🔍 QUESTIONMODAL - questionData:', questionData);
    console.log('🔍 QUESTIONMODAL - isEditing:', isEditing);
    console.log('🔍 QUESTIONMODAL - options count:', questionData.options.length);
    
    if (questionData.question && questionData.options.length > 0) {
      console.log('🔍 QUESTIONMODAL - Validação passou, chamando onSave...');
      onSave(questionData);
      console.log('🔍 QUESTIONMODAL - onSave chamado, fechando modal...');
      onClose();
      // Só reseta se não estiver editando
      if (!isEditing) {
        setQuestionData({
          question: '',
          description: '',
          responseType: 'single',
          options: [],
        });
      }
    } else {
      console.log('🔍 QUESTIONMODAL - Validação falhou:', {
        hasQuestion: !!questionData.question,
        hasOptions: questionData.options.length > 0
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Pergunta' : 'Criar Nova Pergunta'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique a pergunta e suas opções' : 'Configure a pergunta e defina as ações para cada resposta'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Pergunta *</Label>
              <Input
                id="question"
                value={questionData.question}
                onChange={(e) => setQuestionData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Ex: Qual material você deseja usar?"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={questionData.description}
                onChange={(e) => setQuestionData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Informações adicionais sobre a pergunta"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="responseType">Tipo de Resposta</Label>
              <Select
                value={questionData.responseType}
                onValueChange={(value: any) => setQuestionData(prev => ({ ...prev, responseType: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Escolha Única</SelectItem>
                  <SelectItem value="multiple">Múltipla Escolha</SelectItem>
                  <SelectItem value="conditional">Condicional (leva a outras perguntas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Response Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Opções de Resposta</Label>
              <Button type="button" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Opção
              </Button>
            </div>

            {questionData.options.map((option) => (
              <div key={option.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Label>Texto da Opção</Label>
                    <Input
                      value={option.label}
                      onChange={(e) => updateOption(option.id, 'label', e.target.value)}
                      placeholder="Ex: Acrílico 3mm"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateOption(option.id)}
                    className="mt-6"
                    title="Duplicar opção"
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(option.id)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Actions for this option */}
                <div className="ml-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Ações desta Resposta</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addAction(option.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar Ação
                    </Button>
                  </div>

                  {option.actions.map((action) => {
                    const Icon = actionTypeIcons[action.type];
                    const items = getItemsForActionType(action.type);

                    return (
                      <div key={action.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        
                        <Select
                          value={action.type}
                          onValueChange={(value: any) => {
                            updateAction(option.id, action.id, 'type', value);
                            // Se selecionou "Adicionar Material", abrir modal específico
                            if (value === 'add_material') {
                              setCurrentEditingAction({ optionId: option.id, actionId: action.id });
                              setMaterialModalOpen(true);
                            }
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(actionTypeLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {action.type === 'add_material' ? (
                          // Seção especial para materiais com modal
                          <div className="flex-1 flex items-center gap-2">
                            {action.materials && action.materials.length > 0 ? (
                              <div className="flex-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                <span className="font-medium text-green-800">
                                  {action.materials.length} material{action.materials.length > 1 ? 'ais' : ''} configurado{action.materials.length > 1 ? 's' : ''}
                                </span>
                                <div className="text-xs text-green-600 mt-1">
                                  {action.materials.map((mat: any) => mat.materialName).join(', ')}
                                </div>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 justify-start"
                                onClick={() => {
                                  setCurrentEditingAction({ optionId: option.id, actionId: action.id });
                                  setMaterialModalOpen(true);
                                }}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Configurar Materiais
                              </Button>
                            )}
                            {action.materials && action.materials.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCurrentEditingAction({ optionId: option.id, actionId: action.id });
                                  setMaterialModalOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                            )}
                          </div>
                        ) : (
                          // Seção normal para outros tipos de ação
                          <>
                            <Select
                              value={action.itemId}
                              onValueChange={(value) => {
                                const item = items.find((i: any) => i.id === value);
                                updateAction(option.id, action.id, 'itemId', value);
                                updateAction(option.id, action.id, 'itemName', item?.name || '');
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione o item" />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map((item: any) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                    {item.cost && (
                                      <span className="text-muted-foreground ml-2">
                                        (R$ {item.cost})
                                      </span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Input
                              type="number"
                              placeholder="Qtd"
                              className="w-20"
                              value={action.quantity || ''}
                              onChange={(e) => updateAction(option.id, action.id, 'quantity', e.target.value)}
                            />
                          </>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAction(option.id, action.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!questionData.question || questionData.options.length === 0}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Pergunta'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal de Materiais */}
      <MaterialModal
        isOpen={materialModalOpen}
        onClose={() => {
          setMaterialModalOpen(false);
          setCurrentEditingAction(null);
        }}
        onSave={(materials) => {
          if (currentEditingAction) {
            // Salvar os materiais na ação correspondente
            updateAction(currentEditingAction.optionId, currentEditingAction.actionId, 'materials', materials);
          }
          setMaterialModalOpen(false);
          setCurrentEditingAction(null);
        }}
        initialMaterials={
          currentEditingAction 
            ? questionData.options
                .find(opt => opt.id === currentEditingAction.optionId)
                ?.actions.find(act => act.id === currentEditingAction.actionId)
                ?.materials || []
            : []
        }
      />
    </Dialog>
  );
}