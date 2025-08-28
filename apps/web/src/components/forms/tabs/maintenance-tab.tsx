"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  FileText, 
  ExternalLink, 
  Upload, 
  Download,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle,
  Settings,
  BookOpen
} from "lucide-react";
import { EquipmentFormData } from "../equipment-form-types";

interface MaintenanceTabProps {
  form: UseFormReturn<EquipmentFormData>;
}

export function MaintenanceTab({ form }: MaintenanceTabProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedValues = {
    maintenanceInterval: watch("maintenanceInterval"),
    maintenanceNotes: watch("maintenanceNotes"),
    manualUrl: watch("manualUrl"),
    images: watch("images") || [],
    documents: watch("documents") || [],
    tags: watch("tags") || [],
  };

  // Calcular próxima manutenção baseada no intervalo
  const calculateNextMaintenance = React.useMemo(() => {
    if (!watchedValues.maintenanceInterval) return null;
    
    const today = new Date();
    const nextDate = new Date(today.getTime() + (watchedValues.maintenanceInterval * 24 * 60 * 60 * 1000));
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      date: nextDate,
      daysUntil,
      urgency: daysUntil <= 7 ? 'urgent' : daysUntil <= 30 ? 'soon' : 'normal'
    };
  }, [watchedValues.maintenanceInterval]);

  const addTag = (tagName: string) => {
    if (tagName && !watchedValues.tags.includes(tagName)) {
      setValue("tags", [...watchedValues.tags, tagName]);
    }
  };

  const removeTag = (tagIndex: number) => {
    const updatedTags = watchedValues.tags.filter((_, index) => index !== tagIndex);
    setValue("tags", updatedTags);
  };

  const addDocument = (url: string) => {
    if (url && !watchedValues.documents.includes(url)) {
      setValue("documents", [...watchedValues.documents, url]);
    }
  };

  const removeDocument = (docIndex: number) => {
    const updatedDocs = watchedValues.documents.filter((_, index) => index !== docIndex);
    setValue("documents", updatedDocs);
  };

  const addImage = (url: string) => {
    if (url && !watchedValues.images.includes(url)) {
      setValue("images", [...watchedValues.images, url]);
    }
  };

  const removeImage = (imgIndex: number) => {
    const updatedImages = watchedValues.images.filter((_, index) => index !== imgIndex);
    setValue("images", updatedImages);
  };

  const getMaintenanceUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'soon': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'normal': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const suggestedTags = [
    "Impressora", "Usinagem", "Preventiva", "Corretiva", 
    "Limpeza", "Calibração", "Lubrificação", "Substituição"
  ];

  return (
    <div className="space-y-6">
      {/* Próxima manutenção */}
      {calculateNextMaintenance && (
        <Card className={`${
          calculateNextMaintenance.urgency === 'urgent' 
            ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
            : calculateNextMaintenance.urgency === 'soon'
            ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
            : 'border-green-200 bg-green-50 dark:bg-green-950/20'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center gap-2 text-base ${
              calculateNextMaintenance.urgency === 'urgent'
                ? 'text-red-800 dark:text-red-300'
                : calculateNextMaintenance.urgency === 'soon'
                ? 'text-yellow-800 dark:text-yellow-300'
                : 'text-green-800 dark:text-green-300'
            }`}>
              <Calendar className="h-4 w-4" />
              Próxima Manutenção
              <Badge className={getMaintenanceUrgencyColor(calculateNextMaintenance.urgency)}>
                {calculateNextMaintenance.urgency === 'urgent' ? 'Urgente' : 
                 calculateNextMaintenance.urgency === 'soon' ? 'Em breve' : 'Programada'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Data prevista:</div>
              <div className="text-lg">
                {calculateNextMaintenance.date.toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Tempo restante:</div>
              <div className="text-lg">
                {calculateNextMaintenance.daysUntil} dias
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuração de Manutenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              Configuração de Manutenção
            </CardTitle>
            <CardDescription>
              Defina intervalo e observações para manutenção preventiva
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maintenanceInterval">Intervalo de Manutenção (dias)</Label>
              <Input
                id="maintenanceInterval"
                type="number"
                placeholder="Ex: 90"
                min="1"
                max="3650"
                {...register("maintenanceInterval", { valueAsNumber: true })}
              />
              {errors.maintenanceInterval && (
                <p className="text-sm text-destructive">{errors.maintenanceInterval.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Frequência recomendada para manutenção preventiva
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceNotes">Instruções de Manutenção</Label>
              <Textarea
                id="maintenanceNotes"
                placeholder="Descreva os procedimentos de manutenção..."
                rows={4}
                {...register("maintenanceNotes")}
              />
              <p className="text-xs text-muted-foreground">
                Procedimentos específicos e pontos de atenção
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualUrl">Link do Manual</Label>
              <Input
                id="manualUrl"
                type="url"
                placeholder="https://exemplo.com/manual.pdf"
                {...register("manualUrl")}
              />
              {errors.manualUrl && (
                <p className="text-sm text-destructive">{errors.manualUrl.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Link para manual técnico ou documentação oficial
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Manual e Documentação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Manual e Documentação
            </CardTitle>
            <CardDescription>
              Links para manuais e documentos técnicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {watchedValues.manualUrl && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">Manual Oficial</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={watchedValues.manualUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Abrir
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {watchedValues.documents.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Documentos Adicionais</h5>
                <div className="space-y-2">
                  {watchedValues.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm truncate">{doc}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeDocument(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="URL do documento"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addDocument((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const input = document.querySelector('input[placeholder="URL do documento"]') as HTMLInputElement;
                  if (input?.value) {
                    addDocument(input.value);
                    input.value = '';
                  }
                }}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Imagens e Fotos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Imagens e Fotos do Equipamento
          </CardTitle>
          <CardDescription>
            Adicione fotos do equipamento para documentação e referência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {watchedValues.images.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {watchedValues.images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-video bg-muted rounded-lg border overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={`Equipamento ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjEgMTlWNWEyIDIgMCAwIDAtMi0ySDVhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDE0YTIgMiAwIDAgMCAyLTJ6IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48Y2lyY2xlIGN4PSI5IiBjeT0iOSIgcj0iMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0ibTIxIDE1LTMuMDg2LTMuMDg2YTIgMiAwIDAgMC0yLjgyOCAwTDYgMjEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==';
                      }}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="URL da imagem"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addImage((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const input = document.querySelector('input[placeholder="URL da imagem"]') as HTMLInputElement;
                if (input?.value) {
                  addImage(input.value);
                  input.value = '';
                }
              }}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Adicione URLs de imagens ou use um serviço de upload de imagens
          </p>
        </CardContent>
      </Card>

      {/* Tags e Classificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Tags e Classificação
          </CardTitle>
          <CardDescription>
            Organize equipamentos com tags para facilitar buscas e filtros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {watchedValues.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {watchedValues.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button 
                    onClick={() => removeTag(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <h5 className="text-sm font-medium mb-2">Tags Sugeridas</h5>
            <div className="flex flex-wrap gap-2">
              {suggestedTags
                .filter(tag => !watchedValues.tags.includes(tag))
                .map(tag => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tag)}
                  >
                    + {tag}
                  </Button>
                ))
              }
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Nova tag personalizada"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addTag((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const input = document.querySelector('input[placeholder="Nova tag personalizada"]') as HTMLInputElement;
                if (input?.value) {
                  addTag(input.value);
                  input.value = '';
                }
              }}
            >
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre Manutenção */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4" />
            Dicas de Manutenção Preventiva
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
          <p>
            <strong>Impressoras:</strong> Limpeza semanal, calibração mensal, substituição de cabeças conforme desgaste.
          </p>
          <p>
            <strong>Equipamentos de Usinagem:</strong> Lubrificação regular, verificação de ferramentas, calibração de eixos.
          </p>
          <p>
            <strong>Documentação:</strong> Mantenha fotos e manuais acessíveis para equipe técnica.
          </p>
          <p>
            <strong>Intervalos:</strong> Equipamentos críticos: 30-60 dias. Equipamentos auxiliares: 90-180 dias.
          </p>
        </CardContent>
      </Card>

      {(errors.maintenanceInterval || errors.maintenanceNotes || errors.manualUrl) && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Erro nos dados de manutenção</span>
            </div>
            <ul className="mt-2 text-sm text-red-700 dark:text-red-400">
              {errors.maintenanceInterval && <li>• {errors.maintenanceInterval.message}</li>}
              {errors.maintenanceNotes && <li>• {errors.maintenanceNotes.message}</li>}
              {errors.manualUrl && <li>• {errors.manualUrl.message}</li>}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}