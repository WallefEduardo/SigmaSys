"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  DollarSign, 
  Layers, 
  Package, 
  Calendar,
  BarChart3,
  AlertTriangle,
  Info,
  Cpu
} from "lucide-react";
import { EquipmentFormData } from "./equipment-form-types";
import { BasicDataTab } from "./tabs/basic-data-tab";
import { DepreciationTab } from "./tabs/depreciation-tab";
import { PassesConfigTab } from "./tabs/passes-config-tab";
import { PrintHeadsTab } from "./tabs/print-heads-tab";
import { MaintenanceTab } from "./tabs/maintenance-tab";
import { ReportsTab } from "./tabs/reports-tab";

interface EquipmentTabsProps {
  form: UseFormReturn<EquipmentFormData>;
  isEditing?: boolean;
  equipmentId?: string;
}

export function EquipmentTabs({ form, isEditing = false, equipmentId }: EquipmentTabsProps) {
  const [activeTab, setActiveTab] = React.useState("basic");
  const watchedType = form.watch("type");
  
  // Definir ordem das tabs
  const tabOrder = [
    "basic",
    "depreciation", 
    ...(watchedType === "printing" ? ["passes", "printheads"] : []),
    "maintenance",
    "reports"
  ];
  
  const getCurrentTabIndex = () => tabOrder.indexOf(activeTab);
  const getNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    return currentIndex < tabOrder.length - 1 ? tabOrder[currentIndex + 1] : null;
  };
  const getPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    return currentIndex > 0 ? tabOrder[currentIndex - 1] : null;
  };
  
  // Validar se cada tab tem erros
  const getTabErrors = (tabName: string) => {
    const errors = form.formState.errors;
    const tabFields: Record<string, string[]> = {
      basic: ["name", "code", "type", "costPerHour", "description", "manufacturer", "model", "year", "location"],
      depreciation: ["acquisitionValue", "residualValue", "depreciationMethod", "usefulLifeHours", "usefulLifeYears"],
      passes: ["passes"],
      printheads: [],
      maintenance: ["maintenanceInterval", "maintenanceNotes", "manualUrl"],
      reports: []
    };

    const fieldsInTab = tabFields[tabName] || [];
    return fieldsInTab.some(field => errors[field as keyof typeof errors]);
  };

  const TabTriggerWithBadge = ({ 
    value, 
    icon: Icon, 
    label
  }: { 
    value: string; 
    icon: React.ElementType; 
    label: string;
  }) => {
    const hasErrors = getTabErrors(value);
    
    return (
      <TabsTrigger 
        value={value} 
        className="flex flex-col items-center gap-1 py-3 px-6 min-w-[120px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
          {hasErrors && (
            <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full">
              <span className="sr-only">Erro</span>
            </Badge>
          )}
        </div>
      </TabsTrigger>
    );
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b overflow-x-auto">
          <TabsList className="w-full h-auto bg-transparent justify-start p-0 min-w-max">
            <TabTriggerWithBadge
              value="basic"
              icon={Settings}
              label="Dados Gerais"
            />
            
            <TabTriggerWithBadge
              value="depreciation"
              icon={DollarSign}
              label="Depreciação"
            />
            
            {watchedType === "printing" && (
              <>
                <TabTriggerWithBadge
                  value="passes"
                  icon={Layers}
                  label="Passadas"
                />
                
                <TabTriggerWithBadge
                  value="printheads"
                  icon={Cpu}
                  label="Cabeças"
                />
              </>
            )}
            
            
            <TabTriggerWithBadge
              value="maintenance"
              icon={Calendar}
              label="Manutenção"
            />
            
            {isEditing && (
              <TabTriggerWithBadge
                value="reports"
                icon={BarChart3}
                label="Relatórios"
              />
            )}
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="basic" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <div>
                    <CardTitle>Dados Gerais do Equipamento</CardTitle>
                    <CardDescription>
                      Informações básicas e especificações técnicas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <BasicDataTab form={form} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="depreciation" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <div>
                    <CardTitle>Depreciação e Vida Útil</CardTitle>
                    <CardDescription>
                      Configure o cálculo de depreciação e impacto no custo/hora
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DepreciationTab form={form} />
              </CardContent>
            </Card>
          </TabsContent>

          {watchedType === "printing" && (
            <>
              <TabsContent value="passes" className="mt-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      <div>
                        <CardTitle>Configuração de Passadas</CardTitle>
                        <CardDescription>
                          Configure as diferentes qualidades de impressão e seus custos
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PassesConfigTab form={form} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="printheads" className="mt-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      <div>
                        <CardTitle>Cabeças de Impressão</CardTitle>
                        <CardDescription>
                          Gerencie as cabeças instaladas e monitore o desgaste
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PrintHeadsTab form={form} equipmentId={equipmentId} />
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}


          <TabsContent value="maintenance" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <CardTitle>Manutenção e Documentação</CardTitle>
                    <CardDescription>
                      Configurar agenda de manutenção e documentação técnica
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MaintenanceTab form={form} />
              </CardContent>
            </Card>
          </TabsContent>

          {isEditing && equipmentId && (
            <TabsContent value="reports" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <div>
                      <CardTitle>Relatórios de Performance</CardTitle>
                      <CardDescription>
                        Análise de custos, depreciação e eficiência operacional
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ReportsTab equipmentId={equipmentId} equipmentType={watchedType} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </div>
        
        {/* Navegação entre tabs */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div>
            {getPreviousTab() && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab(getPreviousTab()!)}
              >
                ← Anterior
              </Button>
            )}
          </div>
          
          <div>
            {getNextTab() && (
              <Button
                type="button"
                onClick={() => setActiveTab(getNextTab()!)}
              >
                Próximo →
              </Button>
            )}
          </div>
        </div>
      </Tabs>

      {/* Indicador de validação */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>
          {Object.keys(form.formState.errors).length > 0 
            ? `${Object.keys(form.formState.errors).length} campo(s) com erro` 
            : "Todos os campos estão válidos"
          }
        </span>
      </div>
    </div>
  );
}