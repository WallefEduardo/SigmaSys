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
  const watchedPrintHeads = watch("printHeads") || {};
  const [editingPassId, setEditingPassId] = React.useState<string | null>(null);
  // Buscar insumos do tipo tinta e cabeça da API
  const { data: inksData, isLoading: loadingInks } = api.consumables.list.useQuery({
    type: "ink",
    active: true,
    limit: 100
  });
  const { data: headsData, isLoading: loadingHeads } = api.consumables.list.useQuery({
    type: "printHead",
    active: true,
    limit: 100
  });
  const availableInks = inksData?.data || [];
  const availableHeads = headsData?.data || [];
  const [showNewPassForm, setShowNewPassForm] = React.useState(false);
  
  // Inicializar todas as passadas como recolhidas por padrão
  const [collapsedPasses, setCollapsedPasses] = React.useState<Set<string>>(() => {
    return new Set(Object.keys(watchedPasses));
  });
  // NOVA ESTRUTURA: Passada integrada com insumos cadastrados
  const [newPassData, setNewPassData] = React.useState({
    name: '',
    description: '',
    speedM2PerHour: 60,
    inkConsumables: [] as Array<{
      consumableId: string;
      consumptionMlPerM2: number;
    }>,
    printHeadConsumables: [] as Array<{
      consumableId: string;
    }>,
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
        description: newPassData.description,
        speedM2PerHour: newPassData.speedM2PerHour,
        inkConsumables: newPassData.inkConsumables,
        printHeadConsumables: newPassData.printHeadConsumables,
      };
      
      setValue("passes", {
        ...watchedPasses,
        [newPassId]: newPass
      });
      
      // Reset form
      setNewPassData({
        name: '',
        description: '',
        speedM2PerHour: 60,
        inkConsumables: [],
        printHeadConsumables: [],
      });
      setShowNewPassForm(false);
    }
  };

  const cancelNewPass = () => {
    setNewPassData({
      name: '',
      description: '',
      speedM2PerHour: 60,
      inkConsumables: [],
      printHeadConsumables: [],
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
  const updateNewPassInkConsumption = (inkId: string, consumptionMlPerM2: number) => {
    setNewPassData(prev => ({
      ...prev,
      inkConsumables: prev.inkConsumables.map(ic => 
        ic.consumableId === inkId 
          ? { ...ic, consumptionMlPerM2 }
          : ic
      )
    }));
  };

  const toggleNewPassInkUsage = (inkId: string, shouldUse: boolean) => {
    if (shouldUse) {
      setNewPassData(prev => ({
        ...prev,
        inkConsumables: [...prev.inkConsumables, {
          consumableId: inkId,
          consumptionMlPerM2: 1.0
        }]
      }));
    } else {
      setNewPassData(prev => ({
        ...prev,
        inkConsumables: prev.inkConsumables.filter(ic => ic.consumableId !== inkId)
      }));
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


  const calculateEfficiency = (pass: PassConfiguration) => {
    // Cálculo simples de eficiência baseado na velocidade
    const speedM2PerHour = pass.speedM2PerHour || 1;
    const inkCount = pass.inkConsumables?.length || 0;
    const headCount = pass.printHeadConsumables?.length || 0;
    
    // Eficiência baseada na velocidade e número de recursos utilizados
    const efficiency = speedM2PerHour / (10 * Math.max(1, inkCount + headCount));
    return efficiency;
  };

  // Função para calcular custo real das cabeças de impressão cadastradas no equipamento
  const calculatePrintHeadCost = () => {
    let totalCost = 0;
    
    // Pegar TODAS as cabeças cadastradas na aba "Cabeças" do equipamento
    Object.values(watchedPrintHeads).forEach((installedHead: any) => {
      // Buscar o consumível (cabeça) para pegar o custo
      const headData = availableHeads.find(h => h.id === installedHead.consumableId);
      
      if (headData) {
        // Cálculo baseado no custo real da cabeça
        const headCost = Number(headData.cost) || 500;
        const lifespan = 5000000; // Disparos (pode vir de headData.volumeMl ou outro campo)
        const shotsPerM2 = 50000; // Pode vir das configurações da cabeça
        
        const costPerM2 = (headCost / lifespan) * shotsPerM2;
        totalCost += costPerM2;
      }
    });
    
    return totalCost;
  };

  // Funções para gerenciar configuração de tintas nas passadas
  const updateInkConfiguration = (passId: string, inkId: string, field: 'consumptionRate' | 'required', value: number | boolean) => {
    if (field === 'consumptionRate' && typeof value === 'number') {
      // Converter para nova estrutura: encontrar o consumable e atualizar
      const currentPass = watchedPasses[passId];
      const currentConsumables = currentPass.inkConsumables || [];
      
      const updatedConsumables = currentConsumables.map(consumable => 
        consumable.consumableId === inkId 
          ? { ...consumable, consumptionMlPerM2: value * 1000 } // Converter L para mL
          : consumable
      );
      
      setValue("passes", {
        ...watchedPasses,
        [passId]: {
          ...currentPass,
          inkConsumables: updatedConsumables
        }
      });
    }
  };

  const toggleInkUsage = (passId: string, inkId: string, shouldUse: boolean) => {
    const currentPass = watchedPasses[passId];
    const currentConsumables = currentPass.inkConsumables || [];
    
    if (shouldUse) {
      // Adicionar tinta se não existir
      if (!currentConsumables.find(c => c.consumableId === inkId)) {
        setValue("passes", {
          ...watchedPasses,
          [passId]: {
            ...currentPass,
            inkConsumables: [
              ...currentConsumables,
              {
                consumableId: inkId,
                consumptionMlPerM2: 10.0 // Valor padrão em ml/m²
              }
            ]
          }
        });
      }
    } else {
      // Remover tinta
      setValue("passes", {
        ...watchedPasses,
        [passId]: {
          ...currentPass,
          inkConsumables: currentConsumables.filter(c => c.consumableId !== inkId)
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
          <p><strong>Velocidade:</strong> m²/hora que o equipamento processa nesta configuração</p>
          <p><strong>Tintas:</strong> Selecione as tintas cadastradas e defina o consumo específico em ml/m²</p>
          <p><strong>Cabeças:</strong> Selecione as cabeças de impressão que serão utilizadas</p>
          <p><strong>Cálculo:</strong> Consumo em ml/m² × Preço por Litro da Tinta ÷ 1000</p>
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
                  <Zap className="h-4 w-4" />
                  Velocidade (m²/h)
                </Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={newPassData.speedM2PerHour}
                  onChange={(e) => updateNewPassData('speedM2PerHour', parseFloat(e.target.value) || 0)}
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
                      const inkConsumable = newPassData.inkConsumables.find(ic => ic.consumableId === ink.id);
                      const isUsed = !!inkConsumable;
                      
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
                                  Consumo (ml/m²):
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">
                                        <strong>Consumo direto</strong> desta tinta por m².
                                        <br />• Valor em ml de tinta por metro quadrado
                                        <br />• Cálculo: [este valor] × preço da tinta por litro
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={inkConsumable?.consumptionMlPerM2 || 0}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    if (value >= 0 && value <= 100) {
                                      updateNewPassInkConsumption(ink.id, value);
                                    }
                                  }}
                                  className="w-20 h-7 text-xs"
                                  placeholder="0.0 ml/m²"
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
                  
                  {newPassData.inkConsumables.length === 0 && (
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
                      <Badge variant="outline">
                        {passConfig.name}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Velocidade: {passConfig.speedM2PerHour || 0} m²/h • 
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

              </div>

              <div className="grid gap-4 md:grid-cols-1">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Velocidade (m²/h)
                  </Label>
                  <Input
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.1"
                    value={passConfig.speedM2PerHour || 0}
                    onChange={(e) => updatePass(passId, 'speedM2PerHour', parseFloat(e.target.value) || 1)}
                    placeholder="Ex: 25.5"
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
                        const inkConsumable = passConfig.inkConsumables?.find(c => c.consumableId === ink.id);
                        const isUsed = !!inkConsumable;
                        
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
                                    Consumo (ml/m²):
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">
                                          <strong>Consumo específico</strong> desta tinta por m² (em mililitros).
                                          <br />• Consumo direto por m² em mililitros
                                          <br />• Cálculo final: [este valor ÷ 1000] × preço da tinta por litro
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={inkConsumable?.consumptionMlPerM2?.toFixed(1) || '0'}
                                    onChange={(e) => {
                                      const valueInMl = parseFloat(e.target.value) || 0;
                                      if (valueInMl >= 0 && valueInMl <= 100000) {
                                        updateInkConfiguration(passId, ink.id, 'consumptionRate', valueInMl / 1000);
                                      }
                                    }}
                                    className={`w-24 ${
                                      inkConsumable?.consumptionMlPerM2 && inkConsumable.consumptionMlPerM2 > 50 ? 
                                      'border-yellow-500 focus:border-yellow-500' : ''
                                    }`}
                                    placeholder="0.0 ml/m²"
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
                    
                    {(!passConfig.inkConsumables || passConfig.inkConsumables.length === 0) && (
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
              {(loadingInks || loadingHeads) && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Carregando consumíveis...</span>
                  </div>
                </div>
              )}
              
              {!(loadingInks || loadingHeads) && availableInks.length === 0 && (
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
                    <span className="font-medium">Tempo:</span> {(passConfig.speedM2PerHour ? (1/(passConfig.speedM2PerHour) * 60).toFixed(1) : 'N/A')} min
                  </div>
                  <div>
                    <span className="font-medium">Eficiência:</span> 
                    <Badge variant={calculateEfficiency(passConfig) > 1 ? "default" : "secondary"} className="ml-1 text-xs">
                      {calculateEfficiency(passConfig) > 1 ? "Alta" : "Média"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Cabeças:</span> {Object.keys(watchedPrintHeads).length}
                  </div>
                  <div>
                    <span className="font-medium">Custo Tintas:</span> R$ {
                      (() => {
                        if (!passConfig.inkConsumables || passConfig.inkConsumables.length === 0) return '0,00';
                        const totalCost = passConfig.inkConsumables.reduce((sum, inkConsumable) => {
                          const ink = availableInks.find(i => i.id === inkConsumable.consumableId);
                          if (!ink) return sum;
                          
                          // Cálculo simples: consumo em ml/m² × preço por litro ÷ 1000
                          const costPerM2 = (inkConsumable.consumptionMlPerM2 / 1000) * Number(ink.cost);
                          
                          return sum + costPerM2;
                        }, 0);
                        return totalCost.toFixed(2).replace('.', ',');
                      })()
                    }/m²
                  </div>
                  <div>
                    <span className="font-medium">Custo Cabeças:</span> R$ {
                      calculatePrintHeadCost().toFixed(2).replace('.', ',')
                    }/m²
                  </div>
                  <div>
                    <span className="font-medium">Custo Total:</span> R$ {
                      (() => {
                        // Custo do equipamento baseado no tempo
                        const speedM2PerHour = passConfig.speedM2PerHour || 1;
                        const timeInHours = 1 / speedM2PerHour; // tempo para processar 1m²
                        const equipmentCostPerM2 = timeInHours * (watch("costPerHour") || 0);
                        
                        // Custo das tintas usando nova estrutura
                        const inksCost = passConfig.inkConsumables ? 
                          passConfig.inkConsumables.reduce((sum, inkConsumable) => {
                            const ink = availableInks.find(i => i.id === inkConsumable.consumableId);
                            if (!ink) return sum;
                            
                            // Cálculo: consumo em ml/m² × preço por litro ÷ 1000
                            const costPerM2 = (inkConsumable.consumptionMlPerM2 / 1000) * Number(ink.cost);
                            return sum + costPerM2;
                          }, 0) : 0;
                          
                        // Custo das cabeças usando dados reais das cabeças cadastradas
                        const printHeadCost = calculatePrintHeadCost();
                          
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
                    .sort(([,a], [,b]) => (b.speedM2PerHour || 0) - (a.speedM2PerHour || 0))
                    .map(([passId, pass]) => (
                      <div key={passId} className="flex justify-between">
                        <span>{pass.name}:</span>
                        <span className="font-mono">{pass.speedM2PerHour || 0} m²/h</span>
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