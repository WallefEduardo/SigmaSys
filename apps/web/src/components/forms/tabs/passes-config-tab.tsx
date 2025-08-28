"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Trash2, 
  Layers, 
  Zap, 
  Droplet, 
  Settings,
  Info,
  Calculator,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EquipmentFormData, getDefaultPassConfigurations, PassConfiguration } from "../equipment-form-types";
import { api } from "@/lib/trpc";
import { 
  ConsumableUnit, 
  formatUnit, 
  getUnitDescription 
} from "@/lib/utils/consumable-units";

interface PassesConfigTabProps {
  form: UseFormReturn<EquipmentFormData>;
}

export function PassesConfigTab({ form }: PassesConfigTabProps) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedPasses = watch("passes") || {};
  const [editingPassId, setEditingPassId] = React.useState<string | null>(null);
  // Buscar insumos do tipo tinta da API
  const { data: consumablesData, isLoading: loadingConsumables } = api.consumables.list.useQuery({
    type: "ink",
    active: true,
    limit: 100
  });
  const availableInks = consumablesData?.data || [];
  const [showNewPassForm, setShowNewPassForm] = React.useState(false);
  
  // Inicializar todas as passadas como recolhidas por padrão
  const [collapsedPasses, setCollapsedPasses] = React.useState<Set<string>>(() => {
    return new Set(Object.keys(watchedPasses));
  });
  const [newPassData, setNewPassData] = React.useState({
    name: '',
    quality: 'custom' as const,
    speed: 60,
    inkConsumption: 1.0,
    powerConsumption: 1.0,
    printHeadWear: 1.0,
    description: '',
    inkConfiguration: {} as Record<string, { consumptionRate: number; required: boolean }>
  });
  
  // Função para adicionar passadas padrão (opcional)
  const addDefaultPasses = () => {
    const defaults = getDefaultPassConfigurations();
    setValue("passes", {
      ...watchedPasses,
      ...defaults
    });
  };

  const addNewPass = () => {
    if (newPassData.name.trim()) {
      const newPassId = `custom_${Date.now()}`;
      const newPass: PassConfiguration = {
        name: newPassData.name.trim(),
        quality: 'custom',
        speed: newPassData.speed,
        inkConsumption: newPassData.inkConsumption,
        powerConsumption: newPassData.powerConsumption,
        printHeadWear: newPassData.printHeadWear,
        description: newPassData.description,
        inkConfiguration: newPassData.inkConfiguration
      };
      
      setValue("passes", {
        ...watchedPasses,
        [newPassId]: newPass
      });
      
      // Reset form
      setNewPassData({
        name: '',
        quality: 'custom',
        speed: 60,
        inkConsumption: 1.0,
        powerConsumption: 1.0,
        printHeadWear: 1.0,
        description: '',
        inkConfiguration: {}
      });
      setShowNewPassForm(false);
    }
  };

  const cancelNewPass = () => {
    setNewPassData({
      name: '',
      quality: 'custom',
      speed: 60,
      inkConsumption: 1.0,
      powerConsumption: 1.0,
      printHeadWear: 1.0,
      description: '',
      inkConfiguration: {}
    });
    setShowNewPassForm(false);
  };

  const deletePass = (passId: string) => {
    const updatedPasses = { ...watchedPasses };
    delete updatedPasses[passId];
    setValue("passes", updatedPasses);
  };


  const updatePass = (passId: string, field: keyof PassConfiguration, value: any) => {
    setValue("passes", {
      ...watchedPasses,
      [passId]: {
        ...watchedPasses[passId],
        [field]: value
      }
    });
  };

  const updateNewPassData = (field: keyof typeof newPassData, value: any) => {
    setNewPassData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funções para gerenciar tintas na nova passada
  const updateNewPassInkConfiguration = (inkId: string, field: 'consumptionRate' | 'required', value: number | boolean) => {
    setNewPassData(prev => ({
      ...prev,
      inkConfiguration: {
        ...prev.inkConfiguration,
        [inkId]: {
          ...prev.inkConfiguration[inkId],
          [field]: value
        }
      }
    }));
  };

  const toggleNewPassInkUsage = (inkId: string, shouldUse: boolean) => {
    if (shouldUse) {
      setNewPassData(prev => ({
        ...prev,
        inkConfiguration: {
          ...prev.inkConfiguration,
          [inkId]: {
            consumptionRate: 1.0,
            required: true
          }
        }
      }));
    } else {
      setNewPassData(prev => {
        const newInkConfig = { ...prev.inkConfiguration };
        delete newInkConfig[inkId];
        return {
          ...prev,
          inkConfiguration: newInkConfig
        };
      });
    }
  };

  const resetToDefaults = () => {
    setValue("passes", getDefaultPassConfigurations());
  };

  // Funções para gerenciar colapso
  const togglePassCollapse = (passId: string) => {
    console.log('Toggling collapse for passId:', passId);
    console.log('Current collapsed passes:', Array.from(collapsedPasses));
    const newCollapsed = new Set(collapsedPasses);
    if (newCollapsed.has(passId)) {
      console.log('Expanding pass');
      newCollapsed.delete(passId);
    } else {
      console.log('Collapsing pass');
      newCollapsed.add(passId);
    }
    console.log('New collapsed passes:', Array.from(newCollapsed));
    setCollapsedPasses(newCollapsed);
  };

  const isPassCollapsed = (passId: string) => collapsedPasses.has(passId);

  // Sincronizar passadas novas com o estado de colapso
  React.useEffect(() => {
    const passIds = Object.keys(watchedPasses);
    setCollapsedPasses(prev => {
      const newCollapsed = new Set(prev);
      // Adicionar novas passadas como recolhidas
      passIds.forEach(passId => {
        if (!prev.has(passId)) {
          newCollapsed.add(passId);
        }
      });
      return newCollapsed;
    });
  }, [Object.keys(watchedPasses).join(',')]);

  const getQualityBadgeColor = (quality: string) => {
    switch (quality) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'normal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'photo': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    }
  };

  const calculateEfficiency = (pass: PassConfiguration) => {
    // Cálculo simples de eficiência baseado em velocidade vs qualidade
    const speedFactor = pass.speed / 100; // Normalizado
    const qualityFactor = pass.inkConsumption; // Maior consumo = maior qualidade
    const efficiency = (speedFactor * qualityFactor) / (pass.powerConsumption * pass.printHeadWear);
    return efficiency;
  };

  // Funções para gerenciar configuração de tintas nas passadas
  const updateInkConfiguration = (passId: string, inkId: string, field: 'consumptionRate' | 'required', value: number | boolean) => {
    const currentPass = watchedPasses[passId];
    const currentInkConfig = currentPass.inkConfiguration || {};
    
    setValue("passes", {
      ...watchedPasses,
      [passId]: {
        ...currentPass,
        inkConfiguration: {
          ...currentInkConfig,
          [inkId]: {
            ...currentInkConfig[inkId],
            [field]: value
          }
        }
      }
    });
  };

  const toggleInkUsage = (passId: string, inkId: string, shouldUse: boolean) => {
    const currentPass = watchedPasses[passId];
    const currentInkConfig = currentPass.inkConfiguration || {};
    
    if (shouldUse) {
      // Adicionar tinta com valores padrão
      setValue("passes", {
        ...watchedPasses,
        [passId]: {
          ...currentPass,
          inkConfiguration: {
            ...currentInkConfig,
            [inkId]: {
              consumptionRate: 1.0, // ml/m² padrão
              required: true
            }
          }
        }
      });
    } else {
      // Remover tinta
      const newInkConfig = { ...currentInkConfig };
      delete newInkConfig[inkId];
      
      setValue("passes", {
        ...watchedPasses,
        [passId]: {
          ...currentPass,
          inkConfiguration: newInkConfig
        }
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configurações de Passada</h3>
          <p className="text-sm text-muted-foreground">
            Configure diferentes qualidades de impressão com multiplicador base + consumo específico por tinta
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <Settings className="mr-2 h-4 w-4" />
            Padrões
          </Button>
          <Button size="sm" onClick={() => setShowNewPassForm(true)} disabled={showNewPassForm}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Passada
          </Button>
        </div>
      </div>

      {/* Informações sobre passadas */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4" />
            Sobre Configuração de Passadas
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
          <p><strong>Velocidade:</strong> m²/hora que o equipamento processa nesta qualidade</p>
          <p><strong>Consumo de Tinta (×):</strong> Multiplicador base aplicado a todas as tintas (0.6× = economia, 1.4× = alta qualidade)</p>
          <p><strong>Consumo Específico:</strong> Consumo individual de cada tinta por m² (será multiplicado pelo base)</p>
          <p><strong>Cálculo Final:</strong> Multiplicador Base × Consumo Específico × Preço da Tinta</p>
          <p><strong>Desgaste da Cabeça:</strong> Multiplicador do desgaste por m² processado</p>
        </CardContent>
      </Card>

      {/* Formulário de Nova Passada */}
      {showNewPassForm && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-800 dark:text-green-300">
              <Plus className="h-4 w-4" />
              Criar Nova Passada Personalizada
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Defina uma nova configuração de passada com nome e parâmetros customizados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Nome da Passada *
                </Label>
                <Input
                  placeholder="Ex: Impressão Econômica, Qualidade Premium..."
                  value={newPassData.name}
                  onChange={(e) => updateNewPassData('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Categoria Base
                </Label>
                <Select 
                  value={newPassData.quality} 
                  onValueChange={(value) => updateNewPassData('quality', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho (Rápida)</SelectItem>
                    <SelectItem value="normal">Normal (Equilibrada)</SelectItem>
                    <SelectItem value="high">Alta (Detalhada)</SelectItem>
                    <SelectItem value="photo">Fotográfica (Premium)</SelectItem>
                    <SelectItem value="custom">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Velocidade (m²/h)
                </Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={newPassData.speed}
                  onChange={(e) => updateNewPassData('speed', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Consumo Tinta (×)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        <strong>Multiplicador base</strong> para todas as tintas desta passada.
                        <br />• 0.6× = Economia (60% do consumo normal)
                        <br />• 1.0× = Normal (100% do consumo)  
                        <br />• 1.4× = Alta qualidade (140% do consumo)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  type="number"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={newPassData.inkConsumption}
                  onChange={(e) => updateNewPassData('inkConsumption', parseFloat(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Consumo Energia (×)
                </Label>
                <Input
                  type="number"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={newPassData.powerConsumption}
                  onChange={(e) => updateNewPassData('powerConsumption', parseFloat(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Desgaste Cabeça (×)
                </Label>
                <Input
                  type="number"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={newPassData.printHeadWear}
                  onChange={(e) => updateNewPassData('printHeadWear', parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={newPassData.description}
                placeholder="Descreva quando usar esta configuração..."
                onChange={(e) => updateNewPassData('description', e.target.value)}
              />
            </div>

            {/* Seleção de Tintas */}
            {availableInks.length > 0 && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Droplet className="h-4 w-4" />
                    Tintas para esta Passada
                  </h5>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {availableInks.map((ink) => {
                      const inkConfig = newPassData.inkConfiguration[ink.id];
                      const isUsed = !!inkConfig;
                      
                      return (
                        <div key={ink.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          isUsed ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' : 
                          'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: ink.color || '#999' }}
                            />
                            <div>
                              <div className="font-medium text-sm">{ink.name}</div>
                              <div className="text-xs text-muted-foreground">
                                R$ {Number(ink.cost).toFixed(2)}/{formatUnit(ink.unit as ConsumableUnit)}
                                {ink.code && <span className="ml-1">({ink.code})</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isUsed && (
                              <div className="flex items-center gap-2">
                                <Label className="text-xs flex items-center gap-1">
                                  Consumo ({formatUnit(ink.unit as ConsumableUnit)}/m²):
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">
                                        <strong>Consumo específico</strong> desta tinta por m².
                                        <br />• Será multiplicado pelo "Consumo Tinta (×)"
                                        <br />• Cálculo final: {newPassData.inkConsumption}× × [este valor] × preço da tinta
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step={ink.unit === ConsumableUnit.ML_M2 || ink.unit === ConsumableUnit.L_M2 ? "0.1" : "0.01"}
                                  value={inkConfig?.consumptionRate || 0}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    if (value >= 0 && value <= 100) {
                                      updateNewPassInkConfiguration(ink.id, 'consumptionRate', value);
                                    }
                                  }}
                                  className="w-20 h-7 text-xs"
                                  placeholder="0.0"
                                />
                              </div>
                            )}
                            
                            <Button
                              variant={isUsed ? "destructive" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => toggleNewPassInkUsage(ink.id, !isUsed)}
                            >
                              {isUsed ? (
                                <>
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remover
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Usar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {Object.keys(newPassData.inkConfiguration).length === 0 && (
                    <div className="text-center py-3 text-muted-foreground border-2 border-dashed border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20 rounded-lg">
                      <Info className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                      <p className="text-xs font-medium text-orange-800 dark:text-orange-300">Nenhuma tinta selecionada</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Adicione tintas para calcular custos precisos</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancelNewPass}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={addNewPass}
                disabled={!newPassData.name.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                Criar Passada
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de configurações */}
      <div className="space-y-4">
        {Object.entries(watchedPasses).map(([passId, passConfig]) => (
          <Card key={passId} className={`relative transition-all ${
            isPassCollapsed(passId) 
              ? 'border-dashed border-muted-foreground/30' 
              : 'border-solid'
          }`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePassCollapse(passId)}
                    className="h-8 w-8 p-0 hover:bg-muted"
                    title={isPassCollapsed(passId) ? "Expandir passada" : "Recolher passada"}
                  >
                    {isPassCollapsed(passId) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Layers className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {editingPassId === passId ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={passConfig.name}
                            onChange={(e) => updatePass(passId, 'name', e.target.value)}
                            className="h-7 text-base font-semibold"
                            onBlur={() => setEditingPassId(null)}
                            onKeyPress={(e) => e.key === 'Enter' && setEditingPassId(null)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{passConfig.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPassId(passId)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <Badge className={getQualityBadgeColor(passConfig.quality)}>
                        {passConfig.quality}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Velocidade: {passConfig.speed} m²/h • 
                      Eficiência: {calculateEfficiency(passConfig).toFixed(2)}
                    </CardDescription>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePass(passId)}
                  className="text-destructive hover:text-destructive"
                  title="Deletar passada"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            {!isPassCollapsed(passId) && (
              <CardContent className="space-y-4">
              {/* Nome e categoria da passada */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Nome da Passada
                  </Label>
                  <Input
                    value={passConfig.name}
                    onChange={(e) => updatePass(passId, 'name', e.target.value)}
                    placeholder="Nome da configuração"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Categoria
                  </Label>
                  <Select 
                    value={passConfig.quality} 
                    onValueChange={(value) => updatePass(passId, 'quality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="photo">Fotográfica</SelectItem>
                      <SelectItem value="custom">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Velocidade (m²/h)
                  </Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={passConfig.speed}
                    onChange={(e) => updatePass(passId, 'speed', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Droplet className="h-4 w-4" />
                    Consumo Tinta (×)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          <strong>Multiplicador base</strong> para todas as tintas desta passada.
                          <br />• 0.6× = Economia (60% do consumo normal)
                          <br />• 1.0× = Normal (100% do consumo)  
                          <br />• 1.4× = Alta qualidade (140% do consumo)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    type="number"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={passConfig.inkConsumption}
                    onChange={(e) => updatePass(passId, 'inkConsumption', parseFloat(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Consumo Energia (×)
                  </Label>
                  <Input
                    type="number"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={passConfig.powerConsumption}
                    onChange={(e) => updatePass(passId, 'powerConsumption', parseFloat(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Desgaste Cabeça (×)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          <strong>Multiplicador de desgaste</strong> das cabeças instaladas.
                          <br />• 0.5× = Baixo desgaste (rascunho)
                          <br />• 1.0× = Desgaste normal
                          <br />• 2.5× = Alto desgaste (fotográfica)
                          <br />• Impacta o custo baseado na vida útil das cabeças
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    type="number"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={passConfig.printHeadWear}
                    onChange={(e) => updatePass(passId, 'printHeadWear', parseFloat(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={2}
                  value={passConfig.description || ''}
                  placeholder="Descreva quando usar esta configuração..."
                  onChange={(e) => updatePass(passId, 'description', e.target.value)}
                />
              </div>

              {/* Configuração de Tintas Específicas */}
              {availableInks.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Droplet className="h-4 w-4" />
                      Tintas Utilizadas nesta Passada
                    </h5>
                    <div className="space-y-3">
                      {availableInks.map((ink) => {
                        const inkConfig = passConfig.inkConfiguration?.[ink.id];
                        const isUsed = !!inkConfig;
                        
                        return (
                          <div key={ink.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                            isUsed ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' : 
                            'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: ink.color || '#999' }}
                              />
                              <div>
                                <div className="font-medium">{ink.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  R$ {Number(ink.cost).toFixed(2)}/{formatUnit(ink.unit as ConsumableUnit)}
                                  {ink.code && <span className="ml-1 text-xs">({ink.code})</span>}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {isUsed && (
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm flex items-center gap-1">
                                    Consumo ({formatUnit(ink.unit as ConsumableUnit)}/m²):
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">
                                          <strong>Consumo específico</strong> desta tinta por m².
                                          <br />• Será multiplicado pelo "Consumo Tinta (×)" = {passConfig.inkConsumption}×
                                          <br />• Cálculo final: {passConfig.inkConsumption}× × [este valor] × preço da tinta
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step={ink.unit === ConsumableUnit.ML_M2 || ink.unit === ConsumableUnit.L_M2 ? "0.1" : "0.01"}
                                    value={inkConfig?.consumptionRate || 0}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      if (value >= 0 && value <= 100) {
                                        updateInkConfiguration(passId, ink.id, 'consumptionRate', value);
                                      }
                                    }}
                                    className={`w-24 ${
                                      inkConfig?.consumptionRate && inkConfig.consumptionRate > 50 ? 
                                      'border-yellow-500 focus:border-yellow-500' : ''
                                    }`}
                                    placeholder={`0.0`}
                                  />
                                </div>
                              )}
                              
                              <Button
                                variant={isUsed ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => toggleInkUsage(passId, ink.id, !isUsed)}
                              >
                                {isUsed ? (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remover
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Usar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {availableInks.filter(ink => passConfig.inkConfiguration?.[ink.id]).length === 0 && (
                      <div className="text-center py-4 text-muted-foreground border-2 border-dashed border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20 rounded-lg">
                        <Info className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Nenhuma tinta selecionada para esta passada</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Adicione tintas para calcular custos precisos</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mostrar status das tintas */}
              {loadingConsumables && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Carregando tintas...</span>
                  </div>
                </div>
              )}
              
              {!loadingConsumables && availableInks.length === 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Nenhuma tinta cadastrada</span>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    Cadastre tintas na seção de insumos para configurar o consumo específico por passada
                  </p>
                </div>
              )}

              {/* Métricas calculadas */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Métricas Calculadas (para 1 m²)
                </h5>
                <div className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-6">
                  <div>
                    <span className="font-medium">Tempo:</span> {(1/passConfig.speed * 60).toFixed(1)} min
                  </div>
                  <div>
                    <span className="font-medium">Eficiência:</span> 
                    <Badge variant={calculateEfficiency(passConfig) > 1 ? "default" : "secondary"} className="ml-1 text-xs">
                      {calculateEfficiency(passConfig) > 1 ? "Alta" : "Média"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Desgaste Relativo:</span> {(passConfig.printHeadWear * 100).toFixed(0)}%
                  </div>
                  <div>
                    <span className="font-medium">Custo Tintas:</span> R$ {
                      (() => {
                        if (!passConfig.inkConfiguration) return '0,00';
                        const totalCost = Object.entries(passConfig.inkConfiguration).reduce((sum, [inkId, config]) => {
                          const ink = availableInks.find(i => i.id === inkId);
                          if (!ink) return sum;
                          
                          // Calcular custo baseado na unidade da tinta
                          let costPerM2 = 0;
                          
                          // Aplicar a fórmula: Multiplicador Base × Consumo Específico × Preço
                          const baseMultiplier = passConfig.inkConsumption || 1.0;
                          const specificConsumption = config.consumptionRate;
                          
                          // Se a tinta já está em unidade por m², usar direto
                          if (ink.unit === ConsumableUnit.ML_M2 || ink.unit === ConsumableUnit.L_M2 || ink.unit === ConsumableUnit.G_M2) {
                            costPerM2 = baseMultiplier * specificConsumption * Number(ink.cost);
                          } 
                          // Se é por passada, multiplicar pela quantidade de passes necessárias
                          else if (ink.unit === ConsumableUnit.ML_PASS) {
                            costPerM2 = baseMultiplier * specificConsumption * Number(ink.cost);
                          }
                          // Para unidades tradicionais (ML, L, G), usar consumo direto
                          else {
                            costPerM2 = baseMultiplier * specificConsumption * Number(ink.cost);
                          }
                          
                          return sum + costPerM2;
                        }, 0);
                        return totalCost.toFixed(2).replace('.', ',');
                      })()
                    }/m²
                  </div>
                  <div>
                    <span className="font-medium">Custo Cabeças:</span> R$ {
                      (() => {
                        // Simulação do cálculo de desgaste das cabeças
                        // Em produção, isso virá das cabeças realmente instaladas
                        const averagePrintHeadCost = 500; // Custo médio de uma cabeça
                        const averageLifespan = 5000000; // Vida útil média em disparos
                        const shotsPerM2 = 50000; // Disparos por m² (isso virá das configurações das cabeças)
                        const wearMultiplier = passConfig.printHeadWear || 1.0;
                        
                        // Custo por m² = (Custo da Cabeça / Vida Útil) × Disparos por m² × Multiplicador de Desgaste
                        const costPerM2 = (averagePrintHeadCost / averageLifespan) * shotsPerM2 * wearMultiplier;
                        
                        return costPerM2.toFixed(2).replace('.', ',');
                      })()
                    }/m²
                  </div>
                  <div>
                    <span className="font-medium">Custo Total:</span> R$ {
                      (() => {
                        // Custo do equipamento baseado no tempo
                        const timeInHours = 1 / passConfig.speed; // tempo para processar 1m²
                        const equipmentCostPerM2 = timeInHours * (watch("costPerHour") || 0);
                        
                        // Custo das tintas
                        const inksCost = passConfig.inkConfiguration ? 
                          Object.entries(passConfig.inkConfiguration).reduce((sum, [inkId, config]) => {
                            const ink = availableInks.find(i => i.id === inkId);
                            if (!ink) return sum;
                            
                            let costPerM2 = 0;
                            const baseMultiplier = passConfig.inkConsumption || 1.0;
                            const specificConsumption = config.consumptionRate;
                            
                            if (ink.unit === ConsumableUnit.ML_M2 || ink.unit === ConsumableUnit.L_M2 || ink.unit === ConsumableUnit.G_M2) {
                              costPerM2 = baseMultiplier * specificConsumption * Number(ink.cost);
                            } else if (ink.unit === ConsumableUnit.ML_PASS) {
                              costPerM2 = baseMultiplier * specificConsumption * Number(ink.cost);
                            } else {
                              costPerM2 = baseMultiplier * specificConsumption * Number(ink.cost);
                            }
                            return sum + costPerM2;
                          }, 0) : 0;
                          
                        // Custo de desgaste das cabeças
                        const averagePrintHeadCost = 500;
                        const averageLifespan = 5000000;
                        const shotsPerM2 = 50000;
                        const wearMultiplier = passConfig.printHeadWear || 1.0;
                        const printHeadCost = (averagePrintHeadCost / averageLifespan) * shotsPerM2 * wearMultiplier;
                          
                        const totalCost = equipmentCostPerM2 + inksCost + printHeadCost;
                        return totalCost.toFixed(2).replace('.', ',');
                      })()
                    }/m²
                  </div>
                </div>
              </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {Object.keys(watchedPasses).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma Configuração de Passada</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Configure diferentes qualidades de impressão para otimizar custos e tempo
            </p>
            <Button onClick={() => setValue("passes", getDefaultPassConfigurations())}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Configurações Padrão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resumo das configurações */}
      {Object.keys(watchedPasses).length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-green-800 dark:text-green-300">
              <Calculator className="h-4 w-4" />
              Resumo das Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h5 className="font-medium mb-2">Velocidades Configuradas:</h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(watchedPasses)
                    .sort(([,a], [,b]) => b.speed - a.speed)
                    .map(([passId, pass]) => (
                      <div key={passId} className="flex justify-between">
                        <span>{pass.name}:</span>
                        <span className="font-mono">{pass.speed} m²/h</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-2">Eficiência por Configuração:</h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(watchedPasses)
                    .sort(([,a], [,b]) => calculateEfficiency(b) - calculateEfficiency(a))
                    .map(([passId, pass]) => (
                      <div key={passId} className="flex justify-between">
                        <span>{pass.name}:</span>
                        <Badge variant={calculateEfficiency(pass) > 1 ? "default" : "secondary"} className="text-xs">
                          {calculateEfficiency(pass).toFixed(2)}
                        </Badge>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {errors.passes && (
        <p className="text-sm text-destructive">{errors.passes.message}</p>
      )}
      </div>
    </TooltipProvider>
  );
}