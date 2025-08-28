"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, HelpCircle, Database } from "lucide-react";
import { api } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { 
  ConsumableUnit, 
  getRecommendedUnitsForType, 
  formatUnit, 
  getUnitDescription 
} from "@/lib/utils/consumable-units";
import { PrintHeadSpecsModal } from "@/components/modals/print-head-specs-modal";

const consumableSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  code: z.string().optional(),
  type: z.enum(["ink", "printHead", "tool", "material", "other"], {
    required_error: "Tipo é obrigatório",
  }),
  cost: z.number().min(0, "Custo deve ser positivo"),
  unit: z.nativeEnum(ConsumableUnit, {
    errorMap: () => ({ message: "Unidade é obrigatória" }),
  }),
  supplier: z.string().optional(),
  color: z.string().optional(),
  // Converter string vazia para undefined nos campos numéricos
  volumeMl: z.preprocess((val) => {
    if (val === "" || val === null) return undefined;
    return val;
  }, z.number().int().positive().optional()),
  lifespan: z.preprocess((val) => {
    if (val === "" || val === null) return undefined;
    return val;
  }, z.number().int().positive().optional()),
  currentUse: z.number().int().min(0).optional(),
  material: z.string().optional(),
  diameter: z.preprocess((val) => {
    if (val === "" || val === null) return undefined;
    return val;
  }, z.number().positive().optional()),
  // Campos específicos para cabeças de impressão
  model: z.string().optional(),
  durationMonths: z.preprocess((val) => {
    if (val === "" || val === null) return undefined;
    return val;
  }, z.number().int().positive().optional()),
  installationDate: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return val instanceof Date ? val : new Date(val as string);
  }, z.date().optional()),
  optimalSpeedRange: z.string().optional(),
  shotsPerM2: z.preprocess((val) => {
    if (val === "" || val === null) return undefined;
    return val;
  }, z.number().int().positive().optional()),
  // Campos de estoque
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).default(0),
  currentStock: z.number().int().min(0).default(0),
  alertThreshold: z.number().int().min(0).default(0),
  autoReorder: z.boolean().default(false),
  active: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

type ConsumableFormData = z.infer<typeof consumableSchema>;

export default function NewConsumablePage() {
  const router = useRouter();
  const [newTag, setNewTag] = React.useState("");
  const [showSpecsModal, setShowSpecsModal] = React.useState(false);

  const createConsumableMutation = api.consumables.create.useMutation({
    onSuccess: (data) => {
      console.log("✅ Insumo criado com sucesso:", data);
      toast.success("Insumo criado com sucesso!");
      router.push("/cadastros/insumos");
    },
    onError: (error) => {
      console.error("❌ Erro ao criar insumo:", error);
      console.error("Detalhes do erro:", {
        message: error.message,
        data: error.data,
        shape: error.shape
      });
      toast.error(error.message || "Erro ao criar insumo");
    },
  });

  const form = useForm<ConsumableFormData>({
    resolver: zodResolver(consumableSchema),
    defaultValues: {
      name: "",
      description: "",
      code: "",
      type: undefined,
      cost: 0,
      unit: undefined,
      supplier: "",
      color: "",
      volumeMl: "" as any,
      lifespan: "" as any,
      currentUse: 0,
      material: "",
      diameter: "" as any,
      model: "",
      durationMonths: "" as any,
      installationDate: undefined,
      optimalSpeedRange: "",
      shotsPerM2: "" as any,
      // Campos de estoque
      minStock: 0,
      maxStock: 0,
      currentStock: 0,
      alertThreshold: 0,
      autoReorder: false,
      active: true,
      tags: [],
      notes: "",
    },
  });

  const watchedType = form.watch("type");
  const watchedUnit = form.watch("unit");

  // Automaticamente definir unidade como "L" para tintas
  React.useEffect(() => {
    if (watchedType === "ink") {
      form.setValue("unit", "L");
    }
  }, [watchedType, form]);

  const onSubmit = async (data: ConsumableFormData) => {
    console.log("🚀 Função onSubmit foi chamada!");
    console.log("📝 Dados do formulário:", data);
    console.log("🔍 Errors do form:", form.formState.errors);
    console.log("📋 Campos críticos:", {
      type: data.type,
      unit: data.unit,
      name: data.name,
      cost: data.cost
    });
    
    // Verificar se há erros de validação
    const isValid = await form.trigger();
    console.log("✅ Formulário válido?", isValid);
    
    if (!isValid) {
      console.log("❌ Formulário inválido - não enviando");
      console.log("🚫 Erros específicos:", form.formState.errors);
      return;
    }
    
    // Os dados já foram processados pelo schema com z.preprocess
    const submitData = data;
    
    console.log("📤 Dados processados para envio:", submitData);
    console.log("🔗 Iniciando mutation...");
    
    try {
      createConsumableMutation.mutate(submitData);
    } catch (error) {
      console.error("💥 Erro ao chamar mutation:", error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      const currentTags = form.getValues("tags");
      form.setValue("tags", [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const getTypeLabel = (type: string) => {
    const types = {
      ink: "Tinta",
      printHead: "Cabeça de Impressão",
      tool: "Ferramenta", 
      material: "Material",
      other: "Outro"
    };
    return types[type as keyof typeof types] || type;
  };

  const handleSpecSelect = (spec: {
    model: string;
    lifespan: number;
    shotsPerM2?: number;
    optimalSpeedRange: string;
    unit?: string;
    durationMonths?: number;
  }) => {
    // Preencher os campos do formulário com as especificações selecionadas
    form.setValue("model", spec.model);
    
    if (spec.shotsPerM2) {
      form.setValue("shotsPerM2", spec.shotsPerM2);
      form.setValue("unit", "SHOTS_M2"); // Definir unidade como DISPAROS/M²
      form.setValue("lifespan", spec.lifespan);
    } else if (spec.unit === "PCS") {
      form.setValue("unit", "PCS"); // Usar unidade PCS
      // Para PCS, usar duração em meses ao invés de disparos
      if (spec.durationMonths) {
        form.setValue("durationMonths", spec.durationMonths);
      }
    } else {
      // Para DISPAROS normais
      form.setValue("lifespan", spec.lifespan);
      form.setValue("unit", "SHOTS");
    }
    
    form.setValue("optimalSpeedRange", spec.optimalSpeedRange);
    
    const unitText = spec.shotsPerM2 ? "DISPAROS/M²" : spec.unit === "PCS" ? "PCS" : "DISPAROS";
    toast.success(`Especificações do ${spec.model} aplicadas como ${unitText}!`);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/cadastros/insumos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-3xl">Novo Insumo</h1>
            <p className="text-muted-foreground">
              Cadastre tintas, cabeças de impressão, ferramentas e materiais
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados Básicos */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Básicos</CardTitle>
                <CardDescription>
                  Informações fundamentais do insumo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Tinta Eco-Solvente Magenta" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: TINT-ECO-MAG-1L" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ink">Tinta</SelectItem>
                            <SelectItem value="printHead">Cabeça de Impressão</SelectItem>
                            <SelectItem value="tool">Ferramenta</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {watchedType === "ink" ? "Custo por Litro *" : "Custo *"}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md p-4">
                              {watchedType === "ink" ? (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm">💡 Custo por Litro para Tintas:</h4>
                                  
                                  <div className="space-y-2 text-xs">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                      <span className="font-medium text-blue-800 dark:text-blue-200">🎨 Sempre em Litros</span>
                                      <p className="text-blue-700 dark:text-blue-300 mt-1">
                                        Para tintas, sempre cadastramos o valor por litro, independente do tamanho da embalagem.
                                      </p>
                                    </div>
                                    
                                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                      <span className="font-medium text-green-800 dark:text-green-200">💡 Exemplos:</span>
                                      <div className="mt-1 text-green-700 dark:text-green-300">
                                        <p>• Tinta 1L custa R$ 89,90 → <strong>R$ 89,90</strong></p>
                                        <p>• Tinta 500ml custa R$ 45 → <strong>R$ 90,00</strong> (R$ 45 ÷ 0,5L)</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                                    <strong>🎯 Dica:</strong> O consumo por m² será configurado depois no equipamento
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm">Como preencher o custo:</h4>
                                  
                                  <div className="space-y-2 text-xs">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                      <span className="font-medium text-blue-800 dark:text-blue-200">💡 Custo unitário:</span>
                                      <p className="text-blue-700 dark:text-blue-300 mt-1">
                                        Informe o custo por unidade (conforme a unidade selecionada)
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <CurrencyInput 
                            value={field.value}
                            onChange={(value) => field.onChange(value || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Para tintas, mostrar informação de que unidade é sempre L */}
                  {watchedType === "ink" && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                      <div className="text-blue-600 dark:text-blue-400">
                        🎨
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Unidade: Litros (L)
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Tintas sempre são cadastradas por litro
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Para tintas, não mostrar campo de unidade - sempre será L */}
                  {watchedType !== "ink" && (
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => {
                        const recommendedUnits = watchedType 
                          ? getRecommendedUnitsForType(watchedType)
                          : Object.values(ConsumableUnit);
                        
                        return (
                          <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Unidade *
                            {watchedType === "printHead" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md p-4">
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-sm">Como calcular o desgaste da cabeça:</h4>
                                    
                                    <div className="space-y-3 text-xs">
                                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                        <span className="font-medium text-blue-800 dark:text-blue-200">🔧 PCS (Peças):</span>
                                        <p className="text-blue-700 dark:text-blue-300 mt-1"><strong>Quando usar:</strong> Custo fixo por cabeça instalada</p>
                                        <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                                          <strong>Exemplo:</strong> DX5 = R$ 800. Usa por 6 meses = R$ 133/mês
                                        </p>
                                        <p className="text-blue-600 dark:text-blue-400 text-xs">
                                          <strong>Ideal para:</strong> Controle de custos mensais fixos
                                        </p>
                                      </div>
                                      
                                      <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                        <span className="font-medium text-green-800 dark:text-green-200">🎯 DISPAROS (Vida útil):</span>
                                        <p className="text-green-700 dark:text-green-300 mt-1"><strong>Quando usar:</strong> Custo proporcional ao desgaste real</p>
                                        <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                                          <strong>Exemplo:</strong> DX5 = R$ 800 ÷ 5M disparos = R$ 0,00016/disparo
                                        </p>
                                        <p className="text-green-600 dark:text-green-400 text-xs">
                                          <strong>Ideal para:</strong> Cálculo preciso por trabalho realizado
                                        </p>
                                      </div>
                                      
                                      <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                                        <span className="font-medium text-orange-800 dark:text-orange-200">📐 DISPAROS/M² (Densidade):</span>
                                        <p className="text-orange-700 dark:text-orange-300 mt-1"><strong>Quando usar:</strong> Custo por área impressa</p>
                                        <div className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                                          <p><strong>Exemplo:</strong> 50.000 disparos/m² × R$ 0,00016 = R$ 8,00/m²</p>
                                          <p className="mt-1"><strong>Varia conforme:</strong></p>
                                          <ul className="list-disc ml-4 mt-1">
                                            <li>Resolução: 720dpi vs 1440dpi</li>
                                            <li>Qualidade: Draft vs Photo</li>
                                            <li>Passadas configuradas</li>
                                          </ul>
                                        </div>
                                        <p className="text-orange-600 dark:text-orange-400 text-xs mt-2">
                                          <strong>💡 Como medir:</strong> Configure RIP, imprima 1m² sólido, veja contador de disparos
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                                      <strong>Dica:</strong> Para cálculo preciso, use DISPAROS/M² pois considera a qualidade de impressão. Para estimativa simples, use DISPAROS totais.
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a unidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {recommendedUnits.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{formatUnit(unit)}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {getUnitDescription(unit)}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do fornecedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-4">
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
                          <div className="space-y-0.5">
                            <FormLabel>Ativo</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição detalhada do insumo..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Especificações por Tipo */}
            {watchedType && (
              <Card>
                <CardHeader>
                  <CardTitle>Especificações - {getTypeLabel(watchedType)}</CardTitle>
                  <CardDescription>
                    Informações específicas para {getTypeLabel(watchedType).toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {watchedType === "ink" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: #FF0080 ou Magenta" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="volumeMl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volume (ml)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1000" 
                                {...field}
                                value={field.value || ""}
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {watchedType === "printHead" && (
                    <div className="space-y-4">
                      {/* Botão para abrir banco de especificações */}
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowSpecsModal(true)}
                          className="flex items-center gap-2 border-2 border-dashed border-primary/50 hover:border-primary"
                        >
                          <Database className="h-4 w-4" />
                          Consultar Especificações Técnicas
                          <Badge variant="secondary" className="text-xs">
                            25+ modelos
                          </Badge>
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center h-5">Modelo</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: DX5, DX7, I3200" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Duração em Meses - Só mostra se for PCS */}
                        {watchedUnit === "PCS" && (
                          <FormField
                            control={form.control}
                            name="durationMonths"
                            render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Duração (meses)
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-2 text-xs">
                                      <p><strong>Para cálculo de custo fixo mensal:</strong></p>
                                      <ul className="list-disc ml-4 space-y-1">
                                        <li>Tempo estimado de vida útil da cabeça</li>
                                        <li>Baseado na experiência operacional</li>
                                        <li>Considera uso normal da impressora</li>
                                      </ul>
                                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                                        <strong>💡 Exemplo:</strong>
                                        <br />Cabeça R$800 que dura 12 meses
                                        <br />= R$66,67/mês de custo fixo
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="12" 
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        )}

                        {/* Vida Útil - Só mostra se não for PCS */}
                        {watchedUnit !== "PCS" && (
                          <FormField
                            control={form.control}
                            name="lifespan"
                            render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Vida Útil (disparos)
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-2 text-xs">
                                      <p><strong>Onde encontrar:</strong></p>
                                      <ul className="list-disc ml-4 space-y-1">
                                        <li>Manual do fabricante da cabeça</li>
                                        <li>Datasheet técnico do modelo</li>
                                        <li>Especificações do fornecedor</li>
                                      </ul>
                                      <p><strong>Exemplos comuns:</strong></p>
                                      <ul className="list-disc ml-4 space-y-1">
                                        <li>DX5: 5.000.000 disparos</li>
                                        <li>DX7: 8.000.000 disparos</li>
                                        <li>I3200: 3.200.000 disparos</li>
                                      </ul>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="5000000" 
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Uso Atual - Só mostra se não for PCS */}
                        {watchedUnit !== "PCS" && (
                          <FormField
                            control={form.control}
                            name="currentUse"
                            render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center h-5">Uso Atual (disparos)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        )}

                        {/* Disparos por m² - Só mostra se for SHOTS_M2 */}
                        {watchedUnit === "SHOTS_M2" && (
                          <FormField
                            control={form.control}
                            name="shotsPerM2"
                            render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Disparos por m²
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <div className="space-y-2 text-xs">
                                      <p><strong>Como medir:</strong></p>
                                      <ol className="list-decimal ml-4 space-y-1">
                                        <li>Configure uma qualidade padrão (ex: 720x720 dpi)</li>
                                        <li>Anote o contador de disparos antes da impressão</li>
                                        <li>Imprima exatamente 1m² com 100% de cobertura</li>
                                        <li>Anote o contador depois da impressão</li>
                                        <li>A diferença = disparos/m²</li>
                                      </ol>
                                      
                                      <p><strong>Onde consultar:</strong></p>
                                      <ul className="list-disc ml-4 space-y-1">
                                        <li>RIP/Software de impressão (configurações)</li>
                                        <li>Painel da impressora (contador de disparos)</li>
                                        <li>Manual técnico do equipamento</li>
                                      </ul>
                                      
                                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                                        <strong>💡 Valores típicos:</strong>
                                        <br />• 720dpi: 30.000-50.000/m²
                                        <br />• 1440dpi: 120.000-200.000/m²
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="50000" 
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="optimalSpeedRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Faixa de Velocidade Ideal
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-2 text-xs">
                                      <p><strong>Como definir:</strong></p>
                                      <ul className="list-disc ml-4 space-y-1">
                                        <li>Velocidade onde a cabeça tem melhor desempenho</li>
                                        <li>Balanceio entre qualidade e vida útil</li>
                                        <li>Faixa recomendada pelo fabricante</li>
                                      </ul>
                                      
                                      <p><strong>Exemplos:</strong></p>
                                      <ul className="list-disc ml-4 space-y-1">
                                        <li>"30-60 m²/h" (faixa)</li>
                                        <li>"45 m²/h" (velocidade específica)</li>
                                        <li>"até 80 m²/h" (velocidade máxima)</li>
                                      </ul>
                                      
                                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                                        <strong>💡 Dica:</strong> Velocidades muito altas reduzem a vida útil da cabeça.
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: 30-60 m²/h" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="installationDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center h-5">Data de Instalação</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  value={field.value && field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value || undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Alerta para unidade PCS */}
                      {watchedUnit === "PCS" && (
                        <Card className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="text-green-600 dark:text-green-400 mt-0.5">
                                ✅
                              </div>
                              <div>
                                <h5 className="font-medium text-green-900 dark:text-green-100 mb-1">
                                  Unidade PCS Selecionada
                                </h5>
                                <p className="text-green-800 dark:text-green-200 text-sm">
                                  Com <strong>PCS (Peças)</strong>, você não precisa das informações de disparos. 
                                  O custo será calculado como <strong>valor fixo por cabeça instalada</strong>.
                                </p>
                                <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                                  <strong>Exemplo:</strong> Se uma cabeça custa R$ 800 e fica instalada 6 meses, 
                                  o custo mensal será R$ 133,33.
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Card de Ajuda para Cabeças de Impressão */}
                      {watchedUnit !== "PCS" && (
                        <Card className="mt-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
                        <CardContent className="p-4">
                          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Guia Rápido - Configuração de Cabeças
                          </h5>
                          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="font-medium">📋 Dados essenciais:</p>
                                <ul className="list-disc ml-4 space-y-1">
                                  <li>Modelo específico (DX5, DX7, etc.)</li>
                                  <li>Vida útil em disparos (manual)</li>
                                  <li>Custo de aquisição</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium">⚙️ Para cálculo preciso:</p>
                                <ul className="list-disc ml-4 space-y-1">
                                  <li>Meça disparos/m² na sua impressora</li>
                                  <li>Configure velocidade ideal</li>
                                  <li>Use unidade DISPAROS/M² quando possível</li>
                                </ul>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded">
                                <p className="font-medium">🔧 PCS</p>
                                <p className="text-xs">Custo fixo mensal/anual independente do uso</p>
                              </div>
                              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded">
                                <p className="font-medium">🎯 DISPAROS</p>
                                <p className="text-xs">Custo proporcional ao desgaste real</p>
                              </div>
                              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded">
                                <p className="font-medium">📐 DISPAROS/M²</p>
                                <p className="text-xs">Custo por área impressa (mais preciso)</p>
                              </div>
                            </div>

                            <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs">
                              <strong>💡 Ordem de preenchimento:</strong> 
                              1º Modelo → 2º Vida útil → 3º Custo → 4º Escolha Unidade → 5º Velocidade ideal
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      )}
                    </div>
                  )}

                  {watchedType === "tool" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="material"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Tungstênio, Aço, Carbono" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="diameter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diâmetro (mm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                placeholder="6.0" 
                                {...field}
                                value={field.value || ""}
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : "")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Controle de Estoque */}
            <Card>
              <CardHeader>
                <CardTitle>Controle de Estoque</CardTitle>
                <CardDescription>
                  Configurações de estoque e alertas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currentStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Atual</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alertThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Alerta</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Mínimo</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Máximo</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="100" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="autoReorder"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>Reposição Automática</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Gerar alertas automáticos quando atingir o nível mínimo
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Tags e Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Tags e Observações</CardTitle>
                <CardDescription>
                  Informações adicionais e categorização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>Tags</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch("tags").map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações adicionais..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                asChild
                disabled={createConsumableMutation.isPending}
              >
                <Link href="/cadastros/insumos">
                  Cancelar
                </Link>
              </Button>
              <Button 
                type="submit" 
                disabled={createConsumableMutation.isPending}
                onClick={() => {
                  console.log("🖱️ Botão Submit foi clicado!");
                  console.log("📋 Valores atuais do form:", form.getValues());
                  console.log("🚫 Erros atuais:", form.formState.errors);
                  console.log("🔍 Form state:", {
                    isValid: form.formState.isValid,
                    isSubmitting: form.formState.isSubmitting,
                    isDirty: form.formState.isDirty
                  });
                }}
              >
                {createConsumableMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Modal de Especificações */}
        <PrintHeadSpecsModal
          open={showSpecsModal}
          onOpenChange={setShowSpecsModal}
          onSelectSpec={handleSpecSelect}
        />
      </div>
    </TooltipProvider>
  );
}