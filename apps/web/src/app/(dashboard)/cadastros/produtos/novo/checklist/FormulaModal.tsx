"use client";

import React, { useState } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calculator, Ruler, Hash, Info, CheckCircle } from 'lucide-react';
import { api } from "@/lib/trpc";

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (ruleId: string, ruleName: string, ruleFormula: string) => void;
  materialName?: string;
  materialUnit?: string;
}

interface FormulaRule {
  id: string;
  name: string;
  category: 'AREA' | 'LENGTH' | 'UNIT';
  formula: string;
  variables: string[];
  resultUnit: string;
  description?: string;
}

export default function FormulaModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  materialName = "", 
  materialUnit = "" 
}: FormulaModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRule, setSelectedRule] = useState<string>("");

  // Buscar regras de cálculo
  const { data: calculationRulesData } = api.calculationRules.list.useQuery({ active: true });
  const { data: predefinedRulesData } = api.calculationRules.getPredefined.useQuery({});
  
  const calculationRules = calculationRulesData?.rules || [];
  const predefinedRules = predefinedRulesData?.rules || [];
  const allRules = [...calculationRules, ...predefinedRules];

  // Mapeamento de materiais para sugestões de fórmulas
  const getMaterialSuggestions = (materialName: string, materialUnit: string): string[] => {
    const name = materialName.toLowerCase();
    const unit = materialUnit.toLowerCase();

    // Sugestões baseadas no tipo de material
    if (name.includes('chapa') || name.includes('acm') || name.includes('acp') || name.includes('pvc')) {
      return ['area_frontal', 'area_traseira', 'area_laterais', 'area_total', 'area_com_margem'];
    }
    
    if (name.includes('metalon') || name.includes('perfil') || name.includes('estrutura') || name.includes('tubo')) {
      return ['perimetro_frontal', 'estrutura_profundidade', 'soma_arestas', 'comprimento_largura', 'comprimento_altura'];
    }
    
    if (name.includes('parafuso') || name.includes('rebite') || name.includes('ilhó') || name.includes('acessório')) {
      return ['unidades_por_m2', 'unidades_por_ml', 'unidades_cantos', 'unidades_por_face'];
    }
    
    if (name.includes('adesivo') || name.includes('lona') || name.includes('vinil')) {
      return ['area_frontal', 'area_com_margem', 'area_total'];
    }

    // Sugestões baseadas na unidade
    if (unit === 'm2' || unit === 'm²') {
      return ['area_frontal', 'area_traseira', 'area_laterais', 'area_total', 'area_com_margem'];
    }
    
    if (unit === 'ml' || unit === 'm') {
      return ['perimetro_frontal', 'estrutura_profundidade', 'comprimento_largura', 'comprimento_altura', 'soma_arestas'];
    }
    
    if (unit === 'un' || unit === 'und') {
      return ['unidades_por_m2', 'unidades_por_ml', 'unidades_cantos', 'unidades_por_face'];
    }

    return [];
  };

  // Descrições detalhadas das fórmulas em português
  const getFormulaDetails = (rule: FormulaRule) => {
    const descriptions: Record<string, { title: string; usage: string; example: string; variables: Record<string, string> }> = {
      // ÁREA
      area_frontal: {
        title: "Área da Frente",
        usage: "Use para calcular material da face frontal de placas, painéis e fachadas",
        example: "Placa 3m x 1m = 3m²",
        variables: { L: "Largura em metros", A: "Altura em metros" }
      },
      area_traseira: {
        title: "Área do Verso", 
        usage: "Use para calcular material do verso de placas dupla face",
        example: "Verso da placa 3m x 1m = 3m²",
        variables: { L: "Largura em metros", A: "Altura em metros" }
      },
      area_laterais: {
        title: "Área das Bordas com Avanço",
        usage: "Use para calcular material das laterais de caixas e fachadas com profundidade",
        example: "Bordas 3m x 1m com 20cm = 1.6m²", 
        variables: { L: "Largura em metros", A: "Altura em metros", E: "Espessura/Avanço em metros" }
      },
      area_total: {
        title: "Área Completa (Caixa)",
        usage: "Use para calcular material total de uma caixa fechada",
        example: "Caixa 3m x 1m x 20cm = 7.6m²",
        variables: { L: "Largura em metros", A: "Altura em metros", E: "Profundidade em metros" }
      },
      area_com_margem: {
        title: "Área com Sobra de Corte",
        usage: "Use quando precisa de margem extra para corte e acabamento",
        example: "Placa 3m x 1m + 5cm = 3.315m²",
        variables: { L: "Largura em metros", A: "Altura em metros", M: "Margem em metros" }
      },

      // COMPRIMENTO
      perimetro_frontal: {
        title: "Perímetro da Face",
        usage: "Use para calcular perfis, molduras e contornos",
        example: "Contorno de placa 3m x 1m = 8ml",
        variables: { L: "Largura em metros", A: "Altura em metros" }
      },
      estrutura_profundidade: {
        title: "Travessas de Profundidade",
        usage: "Use para calcular perfis que fazem a estrutura interna",
        example: "4 travessas de 20cm = 0.8ml",
        variables: { E: "Profundidade em metros" }
      },
      comprimento_largura: {
        title: "Apenas Largura",
        usage: "Use para perfis horizontais (superior e inferior)",
        example: "Perfil de 3m de largura",
        variables: { L: "Largura em metros" }
      },
      comprimento_altura: {
        title: "Apenas Altura", 
        usage: "Use para perfis verticais (laterais)",
        example: "Perfil de 1m de altura",
        variables: { A: "Altura em metros" }
      },
      soma_arestas: {
        title: "Todas as Arestas",
        usage: "Use para calcular todo o perfil de uma estrutura 3D",
        example: "Todas arestas 3m x 1m x 20cm = 16.8ml",
        variables: { L: "Largura em metros", A: "Altura em metros", E: "Profundidade em metros" }
      },

      // UNIDADES
      unidades_por_m2: {
        title: "Quantidade por Metro Quadrado",
        usage: "Use para parafusos, rebites distribuídos pela área",
        example: "4 parafusos/m² em 3m² = 12 unidades",
        variables: { L: "Largura em metros", A: "Altura em metros", D: "Densidade (unidades por m²)" }
      },
      unidades_por_ml: {
        title: "Quantidade por Metro Linear",
        usage: "Use para ilhós, rebites distribuídos pelo perímetro",
        example: "2 ilhós/ml em 8ml = 16 unidades",
        variables: { L: "Largura em metros", A: "Altura em metros", D: "Densidade (unidades por ml)" }
      },
      unidades_cantos: {
        title: "Fixo nos Cantos",
        usage: "Use para elementos que sempre ficam nos 4 cantos",
        example: "4 cantoneiras sempre",
        variables: {}
      },
      unidades_por_face: {
        title: "Quantidade por Face",
        usage: "Use para elementos que se repetem em cada face",
        example: "1 fechadura por face, 2 faces = 2 unidades",
        variables: { F: "Número de faces", D: "Quantidade por face" }
      }
    };

    return descriptions[rule.id] || {
      title: rule.name,
      usage: rule.description || "Fórmula customizada",
      example: "Veja a fórmula para entender",
      variables: {}
    };
  };

  // Filtrar e ordenar regras
  const suggestedRuleIds = getMaterialSuggestions(materialName, materialUnit);
  
  const filteredRules = allRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || rule.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Separar sugeridas das outras
  const suggestedRules = filteredRules.filter(rule => suggestedRuleIds.includes(rule.id));
  const otherRules = filteredRules.filter(rule => !suggestedRuleIds.includes(rule.id));
  const sortedRules = [...suggestedRules, ...otherRules];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "AREA": return <Calculator className="w-4 h-4" />;
      case "LENGTH": return <Ruler className="w-4 h-4" />;
      case "UNIT": return <Hash className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "AREA": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "LENGTH": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "UNIT": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const handleSelect = () => {
    const rule = allRules.find(r => r.id === selectedRule);
    if (rule) {
      onSelect(rule.id, rule.name, rule.formula);
      onClose();
      setSelectedRule("");
      setSearchTerm("");
      setSelectedCategory("all");
    }
  };

  const handleCancel = () => {
    onClose();
    setSelectedRule("");
    setSearchTerm("");
    setSelectedCategory("all");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Escolher Fórmula de Cálculo
          </DialogTitle>
          <DialogDescription>
            {materialName && (
              <span>
                Selecione como calcular a quantidade de <strong>{materialName}</strong>
                {materialUnit && ` (${materialUnit})`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar Fórmula</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite o nome da fórmula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Label htmlFor="category">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="AREA">📐 Área</SelectItem>
                  <SelectItem value="LENGTH">📏 Comprimento</SelectItem>
                  <SelectItem value="UNIT">🔢 Unidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Fórmulas */}
          <div className="space-y-4">
            {suggestedRules.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ⭐ Sugeridas para este material
                  </Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {suggestedRules.map((rule) => {
                    const details = getFormulaDetails(rule);
                    const isSelected = selectedRule === rule.id;
                    
                    return (
                      <Card 
                        key={rule.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected 
                            ? 'ring-2 ring-primary border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedRule(rule.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getCategoryColor(rule.category)} variant="secondary">
                                {getCategoryIcon(rule.category)}
                                <span className="ml-1">{rule.category}</span>
                              </Badge>
                              {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                            </div>
                          </div>
                          <CardTitle className="text-lg">{details.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {details.usage}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">FÓRMULA:</div>
                              <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                {rule.formula}
                              </code>
                            </div>
                            
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">EXEMPLO:</div>
                              <div className="text-sm text-green-700 dark:text-green-300">
                                {details.example}
                              </div>
                            </div>

                            {Object.keys(details.variables).length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1">VARIÁVEIS:</div>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(details.variables).map(([variable, description]) => (
                                    <Badge key={variable} variant="outline" className="text-xs">
                                      <span className="font-mono font-bold">{variable}</span>: {description}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">RESULTADO:</div>
                              <Badge variant="outline">{rule.resultUnit}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {otherRules.length > 0 && (
              <div>
                {suggestedRules.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 mt-6">
                    <Badge variant="secondary">Outras fórmulas disponíveis</Badge>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {otherRules.map((rule) => {
                    const details = getFormulaDetails(rule);
                    const isSelected = selectedRule === rule.id;
                    
                    return (
                      <Card 
                        key={rule.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected 
                            ? 'ring-2 ring-primary border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedRule(rule.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getCategoryColor(rule.category)} variant="secondary">
                                {getCategoryIcon(rule.category)}
                                <span className="ml-1">{rule.category}</span>
                              </Badge>
                              {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                            </div>
                          </div>
                          <CardTitle className="text-lg">{details.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {details.usage}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">FÓRMULA:</div>
                              <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                {rule.formula}
                              </code>
                            </div>
                            
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">EXEMPLO:</div>
                              <div className="text-sm text-green-700 dark:text-green-300">
                                {details.example}
                              </div>
                            </div>

                            {Object.keys(details.variables).length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1">VARIÁVEIS:</div>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(details.variables).map(([variable, description]) => (
                                    <Badge key={variable} variant="outline" className="text-xs">
                                      <span className="font-mono font-bold">{variable}</span>: {description}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">RESULTADO:</div>
                              <Badge variant="outline">{rule.resultUnit}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {sortedRules.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Nenhuma fórmula encontrada com os filtros aplicados" 
                    : "Nenhuma fórmula disponível"
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSelect}
            disabled={!selectedRule}
          >
            Selecionar Fórmula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}