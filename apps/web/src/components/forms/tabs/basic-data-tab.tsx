"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { EquipmentFormData, getCostUnit, getCostUnitLabel, getCostUnitDescription } from "../equipment-form-types";

interface BasicDataTabProps {
  form: UseFormReturn<EquipmentFormData>;
}

// Componente helper para Label com Tooltip
const LabelWithTooltip = ({ 
  htmlFor, 
  children, 
  tooltip 
}: { 
  htmlFor?: string; 
  children: React.ReactNode; 
  tooltip?: string;
}) => {
  if (!tooltip) {
    return <Label htmlFor={htmlFor}>{children}</Label>;
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      <Tooltip>
        <TooltipTrigger type="button">
          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export const BasicDataTab = React.memo(function BasicDataTab({ form }: BasicDataTabProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  
  const watchedType = watch("type");

  // Estado para controlar seções colapsáveis
  const [technicalDetailsExpanded, setTechnicalDetailsExpanded] = React.useState(false);

  const typeOptions = [
    { value: "printing", label: "Impressão" },
    { value: "machining", label: "Usinagem" },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="name"
              tooltip="Nome identificador do equipamento que será usado para identificá-lo no sistema e nos relatórios"
            >
              Nome *
            </LabelWithTooltip>
            <Input
              id="name"
              placeholder="Nome do equipamento"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="code"
              tooltip="Código único opcional para identificação rápida do equipamento, pode ser usado para controle patrimonial ou referência interna"
            >
              Código
            </LabelWithTooltip>
            <Input
              id="code"
              placeholder="Código único do equipamento (opcional)"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="type"
              tooltip="Tipo de operação do equipamento: Impressão (para impressoras digitais, plotters) ou Usinagem (para cortadoras, fresadoras, tornos)"
            >
              Tipo *
            </LabelWithTooltip>
            <Select 
              value={watch("type")} 
              onValueChange={(value) => setValue("type", value as "printing" | "machining", { shouldValidate: true, shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="costUnit"
              tooltip="Unidade de cobrança automática: Impressão sempre usa m² (área processada), Usinagem usa horas (tempo de operação)"
            >
              Unidade de Cobrança
            </LabelWithTooltip>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
              <div className="font-medium text-sm">
                {getCostUnitLabel(watchedType)}
              </div>
              <div className="text-xs text-muted-foreground">
                {getCostUnitDescription(watchedType)}
              </div>
            </div>
          </div>
        </div>

        {/* Custos Base (Input do Usuário) */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Custos Base</h4>
            <p className="text-sm text-muted-foreground">
              Estes custos são usados para <strong>calcular automaticamente</strong> o custo final por {watchedType === "printing" ? "m²" : "hora"}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="energyCostPerHour"
                tooltip="Custo de energia elétrica consumida por hora de operação. Considere a potência do equipamento e o valor do kWh. Será convertido automaticamente para a unidade de cobrança"
              >
                Custo de Energia (por hora)
              </LabelWithTooltip>
              <CurrencyInput
                id="energyCostPerHour"
                placeholder="R$ 0,00"
                value={watch("energyCostPerHour") || 0}
                onChange={(value) => setValue("energyCostPerHour", value, { shouldValidate: true, shouldDirty: true })}
              />
              {errors.energyCostPerHour && (
                <p className="text-sm text-destructive">{errors.energyCostPerHour.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="maintenanceCostPerHour"
                tooltip="Custo de manutenção por hora de operação (peças, revisões, calibrações). Será convertido automaticamente para a unidade de cobrança"
              >
                Custo de Manutenção (por hora)
              </LabelWithTooltip>
              <CurrencyInput
                id="maintenanceCostPerHour"
                placeholder="R$ 0,00"
                value={watch("maintenanceCostPerHour") || 0}
                onChange={(value) => setValue("maintenanceCostPerHour", value, { shouldValidate: true, shouldDirty: true })}
              />
              {errors.maintenanceCostPerHour && (
                <p className="text-sm text-destructive">{errors.maintenanceCostPerHour.message}</p>
              )}
            </div>
          </div>
        </div>


        {/* Detalhes Técnicos - Seção Colapsável */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Detalhes Técnicos</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTechnicalDetailsExpanded(!technicalDetailsExpanded)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <span className="text-xs">
                {technicalDetailsExpanded ? 'Ocultar' : 'Mostrar'}
              </span>
              {technicalDetailsExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {technicalDetailsExpanded && (
            <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="manufacturer"
                tooltip="Nome do fabricante do equipamento (ex: Epson, Roland, HP). Importante para identificação de peças e suporte técnico"
              >
                Fabricante
              </LabelWithTooltip>
              <Input
                id="manufacturer"
                placeholder="Nome do fabricante"
                {...register("manufacturer")}
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="model"
                tooltip="Modelo específico do equipamento conforme especificação do fabricante. Essencial para identificação correta de insumos compatíveis"
              >
                Modelo
              </LabelWithTooltip>
              <Input
                id="model"
                placeholder="Modelo do equipamento"
                {...register("model")}
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="serialNumber"
                tooltip="Número de série único do equipamento, encontrado na etiqueta do fabricante. Usado para garantia e suporte técnico"
              >
                Número de Série
              </LabelWithTooltip>
              <Input
                id="serialNumber"
                placeholder="Número de série"
                {...register("serialNumber")}
              />
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="year"
                tooltip="Ano de fabricação do equipamento, usado para cálculos de depreciação e avaliação de vida útil restante"
              >
                Ano de Fabricação
              </LabelWithTooltip>
              <Input
                id="year"
                type="number"
                placeholder="Ano de fabricação"
                min="1900"
                max={new Date().getFullYear() + 1}
                {...register("year", { valueAsNumber: true })}
              />
              {errors.year && (
                <p className="text-sm text-destructive">{errors.year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="location"
                tooltip="Localização física do equipamento na empresa (setor, sala, andar). Facilita o controle operacional e manutenção"
              >
                Localização
              </LabelWithTooltip>
              <Input
                id="location"
                placeholder="Localização do equipamento"
                {...register("location")}
              />
            </div>
            </div>
          )}
        </div>

        {/* Capacidade Física */}
        <div className="space-y-4">
          <h4 className="font-medium">Capacidade Física</h4>
          <div className={`grid gap-6 ${watchedType === "printing" ? "md:grid-cols-1" : "md:grid-cols-3"}`}>
            <div className="space-y-2">
              <LabelWithTooltip 
                htmlFor="maxWidth"
                tooltip={watchedType === "printing" 
                  ? "Largura máxima de impressão suportada pelo equipamento (ex: 1600mm para impressoras large format)"
                  : "Largura máxima da peça que pode ser processada no equipamento de usinagem"
                }
              >
                Largura Máxima (mm) *
              </LabelWithTooltip>
              <Input
                id="maxWidth"
                type="number"
                placeholder="Ex: 1200"
                min="0"
                step="0.1"
                {...register("maxWidth", { valueAsNumber: true })}
              />
              {errors.maxWidth && (
                <p className="text-sm text-destructive">{errors.maxWidth.message}</p>
              )}
            </div>

            {watchedType === "machining" && (
              <>
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="maxHeight"
                    tooltip="Altura máxima da peça que pode ser processada no equipamento de usinagem (eixo Y)"
                  >
                    Altura Máxima (mm)
                  </LabelWithTooltip>
                  <Input
                    id="maxHeight"
                    type="number"
                    placeholder="Ex: 800"
                    min="0"
                    step="0.1"
                    {...register("maxHeight", { valueAsNumber: true })}
                  />
                  {errors.maxHeight && (
                    <p className="text-sm text-destructive">{errors.maxHeight.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="maxThickness"
                    tooltip="Espessura máxima do material que pode ser cortado ou usinado (profundidade de corte)"
                  >
                    Espessura Máxima (mm)
                  </LabelWithTooltip>
                  <Input
                    id="maxThickness"
                    type="number"
                    placeholder="Ex: 10"
                    min="0"
                    step="0.1"
                    {...register("maxThickness", { valueAsNumber: true })}
                  />
                  {errors.maxThickness && (
                    <p className="text-sm text-destructive">{errors.maxThickness.message}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Descrição e Observações */}
        <div className="space-y-4">
          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="description"
              tooltip="Descrição detalhada do equipamento, suas características e aplicações principais"
            >
              Descrição
            </LabelWithTooltip>
            <Textarea
              id="description"
              placeholder="Descrição detalhada do equipamento..."
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip 
              htmlFor="notes"
              tooltip="Observações importantes sobre operação, limitações ou cuidados especiais com o equipamento"
            >
              Observações
            </LabelWithTooltip>
            <Textarea
              id="notes"
              placeholder="Observações gerais..."
              rows={3}
              {...register("notes")}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});