"use client";

import {
	Calculator,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Hash,
	Info,
	Lightbulb,
	Ruler,
	Search,
} from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	category: "AREA" | "LENGTH" | "UNIT";
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
	materialUnit = "",
}: FormulaModalProps) {
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedRule, setSelectedRule] = useState<string>("");
	const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set(['AREA', 'LENGTH', 'UNIT']));
	const [showExamplesModal, setShowExamplesModal] = useState(false);
	const [selectedExampleRule, setSelectedExampleRule] = useState<FormulaRule | null>(null);

	const toggleCategory = (category: string) => {
		setCollapsedCategories(prev => {
			const newSet = new Set(prev);
			if (newSet.has(category)) {
				newSet.delete(category);
			} else {
				newSet.add(category);
			}
			return newSet;
		});
	};

	// Buscar regras de cálculo
	const { data: calculationRulesData } = api.calculationRules.list.useQuery({
		active: true,
	});
	const { data: predefinedRulesData } =
		api.calculationRules.getPredefined.useQuery({});

	const calculationRules = calculationRulesData?.rules || [];
	const predefinedRules = predefinedRulesData?.rules || [];
	const allRules = [...calculationRules, ...predefinedRules];

	// Mapeamento de materiais para sugestões de fórmulas
	const getMaterialSuggestions = (
		materialName: string,
		materialUnit: string,
	): string[] => {
		const name = materialName.toLowerCase();
		const unit = materialUnit.toLowerCase();

		// Sugestões baseadas no tipo de material
		if (
			name.includes("chapa") ||
			name.includes("acm") ||
			name.includes("acp") ||
			name.includes("pvc")
		) {
			return [
				"area_frontal",
				"area_traseira",
				"area_laterais",
				"area_total",
				"area_com_margem",
			];
		}

		if (
			name.includes("metalon") ||
			name.includes("perfil") ||
			name.includes("estrutura") ||
			name.includes("tubo")
		) {
			return [
				"perimetro_frontal",
				"estrutura_profundidade",
				"soma_arestas",
				"comprimento_largura",
				"comprimento_altura",
			];
		}

		if (
			name.includes("parafuso") ||
			name.includes("rebite") ||
			name.includes("ilhó") ||
			name.includes("acessório")
		) {
			return [
				"unidades_por_m2",
				"unidades_por_ml",
				"unidades_cantos",
				"unidades_por_face",
			];
		}

		if (
			name.includes("adesivo") ||
			name.includes("lona") ||
			name.includes("vinil")
		) {
			return ["area_frontal", "area_com_margem", "area_total"];
		}

		// Sugestões baseadas na unidade
		if (unit === "m2" || unit === "m²") {
			return [
				"area_frontal",
				"area_traseira",
				"area_laterais",
				"area_total",
				"area_com_margem",
			];
		}

		if (unit === "ml" || unit === "m") {
			return [
				"perimetro_frontal",
				"estrutura_profundidade",
				"comprimento_largura",
				"comprimento_altura",
				"soma_arestas",
			];
		}

		if (unit === "un" || unit === "und") {
			return [
				"unidades_por_m2",
				"unidades_por_ml",
				"unidades_cantos",
				"unidades_por_face",
			];
		}

		return [];
	};

	// Descrições detalhadas das fórmulas em português
	const getFormulaDetails = (rule: FormulaRule) => {
		const descriptions: Record<
			string,
			{
				title: string;
				usage: string;
				example: string;
				variables: Record<string, string>;
				visualExamples: {
					title: string;
					description: string;
					cases: Array<{
						name: string;
						scenario: string;
						measurements: string;
						calculation: string;
						result: string;
					}>;
				};
			}
		> = {
			// ÁREA
			area_frontal: {
				title: "Área da Frente",
				usage:
					"Use para calcular material da face frontal de placas, painéis e fachadas",
				example: "Placa 3m x 1m = 3m²",
				variables: { L: "Largura em metros", A: "Altura em metros" },
				visualExamples: {
					title: "Exemplos de Aplicação - Área Frontal",
					description: "Esta fórmula calcula a área da face principal do produto, ideal para materiais que cobrem toda a frente.",
					cases: [
						{
							name: "🏢 Fachada ACM",
							scenario: "Revestimento de fachada comercial com painel de ACM",
							measurements: "Largura: 8m, Altura: 3m",
							calculation: "L × A = 8 × 3",
							result: "24m² de ACM necessário"
						},
						{
							name: "🚩 Lona para Toldo",
							scenario: "Toldo retrátil para estabelecimento comercial",
							measurements: "Largura: 4m, Altura: 2.5m",
							calculation: "L × A = 4 × 2.5",
							result: "10m² de lona necessária"
						},
						{
							name: "🖼️ Painel Publicitário",
							scenario: "Outdoor em MDF com impressão digital",
							measurements: "Largura: 6m, Altura: 3m",
							calculation: "L × A = 6 × 3",
							result: "18m² de MDF + impressão"
						}
					]
				}
			},
			area_traseira: {
				title: "Área do Verso",
				usage: "Use para calcular material do verso de placas dupla face",
				example: "Verso da placa 3m x 1m = 3m²",
				variables: { L: "Largura em metros", A: "Altura em metros" },
				visualExamples: {
					title: "Exemplos de Aplicação - Área Traseira",
					description: "Para produtos de dupla face que precisam de material no verso.",
					cases: [
						{
							name: "🏪 Totem Dupla Face",
							scenario: "Totem promocional visível dos dois lados",
							measurements: "Largura: 1.5m, Altura: 2m",
							calculation: "L × A = 1.5 × 2",
							result: "3m² de adesivo para o verso"
						},
						{
							name: "🚥 Placa de Trânsito",
							scenario: "Sinalização viária com informação nos dois lados",
							measurements: "Largura: 0.8m, Altura: 1.2m",
							calculation: "L × A = 0.8 × 1.2",
							result: "0.96m² de material refletivo"
						}
					]
				}
			},
			area_laterais: {
				title: "Área das Bordas com Avanço",
				usage:
					"Use para calcular material das laterais de caixas e fachadas com profundidade",
				example: "Bordas 3m x 1m com 20cm = 1.6m²",
				variables: {
					L: "Largura em metros",
					A: "Altura em metros",
					E: "Espessura/Avanço em metros",
				},
				visualExamples: {
					title: "Exemplos de Aplicação - Bordas com Avanço",
					description: "Para calcular as laterais de estruturas com profundidade.",
					cases: [
						{
							name: "🏬 Letreiro Caixa",
							scenario: "Letreiro em caixa com LED interno e avanço",
							measurements: "Largura: 4m, Altura: 1m, Avanço: 15cm",
							calculation: "2 × (L × E) + 2 × (A × E) = 2 × (4 × 0.15) + 2 × (1 × 0.15)",
							result: "1.5m² de ACM para as bordas"
						},
						{
							name: "🏦 Fachada 3D",
							scenario: "Letra caixa com recorte e profundidade",
							measurements: "Largura: 2m, Altura: 0.8m, Profundidade: 10cm",
							calculation: "2 × (L × E) + 2 × (A × E) = 2 × (2 × 0.1) + 2 × (0.8 × 0.1)",
							result: "0.56m² de chapa para as laterais"
						}
					]
				}
			},
			area_total: {
				title: "Área Completa (Caixa)",
				usage: "Use para calcular material total de uma caixa fechada",
				example: "Caixa 3m x 1m x 20cm = 7.6m²",
				variables: {
					L: "Largura em metros",
					A: "Altura em metros",
					E: "Profundidade em metros",
				},
				visualExamples: {
					title: "Exemplos de Aplicação - Área Total de Caixa",
					description: "Para calcular todo o material de estruturas tridimensionais fechadas.",
					cases: [
						{
							name: "📦 Totem Promocional",
							scenario: "Totem em forma de caixa para shopping center",
							measurements: "Largura: 1m, Altura: 2.5m, Profundidade: 0.4m",
							calculation: "2×(L×A + L×E + A×E) = 2×(1×2.5 + 1×0.4 + 2.5×0.4)",
							result: "7.6m² de ACM para toda a estrutura"
						}
					]
				}
			},
			area_com_margem: {
				title: "Área com Sobra de Corte",
				usage: "Use quando precisa de margem extra para corte e acabamento",
				example: "Placa 3m x 1m + 5cm = 3.315m²",
				variables: {
					L: "Largura em metros",
					A: "Altura em metros",
					M: "Margem em metros",
				},
			},

			// COMPRIMENTO
			perimetro_frontal: {
				title: "Perímetro da Face",
				usage: "Use para calcular perfis, molduras e contornos",
				example: "Contorno de placa 3m x 1m = 8ml",
				variables: { L: "Largura em metros", A: "Altura em metros" },
				visualExamples: {
					title: "Exemplos de Aplicação - Perímetro",
					description: "Para calcular perfis que contornam toda a borda da peça.",
					cases: [
						{
							name: "🔲 Perfil de Alumínio",
							scenario: "Moldura de alumínio para painel ACM",
							measurements: "Largura: 3m, Altura: 2m",
							calculation: "2 × (L + A) = 2 × (3 + 2)",
							result: "10ml de perfil de alumínio"
						},
						{
							name: "🔩 Metalon para Estrutura",
							scenario: "Estrutura perimetral para back-light",
							measurements: "Largura: 2.5m, Altura: 1.8m",
							calculation: "2 × (L + A) = 2 × (2.5 + 1.8)",
							result: "8.6ml de metalon 30x30"
						}
					]
				}
			},
			estrutura_profundidade: {
				title: "Travessas de Profundidade",
				usage: "Use para calcular perfis que fazem a estrutura interna",
				example: "4 travessas de 20cm = 0.8ml",
				variables: { E: "Profundidade em metros" },
			},
			comprimento_largura: {
				title: "Apenas Largura",
				usage: "Use para perfis horizontais (superior e inferior)",
				example: "Perfil de 3m de largura",
				variables: { L: "Largura em metros" },
			},
			comprimento_altura: {
				title: "Apenas Altura",
				usage: "Use para perfis verticais (laterais)",
				example: "Perfil de 1m de altura",
				variables: { A: "Altura em metros" },
			},
			soma_arestas: {
				title: "Todas as Arestas",
				usage: "Use para calcular todo o perfil de uma estrutura 3D",
				example: "Todas arestas 3m x 1m x 20cm = 16.8ml",
				variables: {
					L: "Largura em metros",
					A: "Altura em metros",
					E: "Profundidade em metros",
				},
			},

			// UNIDADES
			unidades_por_m2: {
				title: "Quantidade por Metro Quadrado",
				usage: "Use para parafusos, rebites distribuídos pela área",
				example: "4 parafusos/m² em 3m² = 12 unidades",
				variables: {
					L: "Largura em metros",
					A: "Altura em metros",
					D: "Densidade (unidades por m²)",
				},
				visualExamples: {
					title: "Exemplos de Aplicação - Unidades por Área",
					description: "Para itens distribuídos uniformemente pela superfície.",
					cases: [
						{
							name: "🔩 Parafusos de Fixação",
							scenario: "Fixação de chapa ACM na fachada",
							measurements: "Painel: 4m x 2m, Densidade: 6 parafusos/m²",
							calculation: "(L × A) × D = (4 × 2) × 6",
							result: "48 parafusos auto-atarraxantes"
						},
						{
							name: "⚡ LEDs para Back-Light",
							scenario: "Iluminação interna de letreiro caixa",
							measurements: "Letreiro: 3m x 1m, Densidade: 25 LEDs/m²",
							calculation: "(L × A) × D = (3 × 1) × 25",
							result: "75 LEDs 5050 necessários"
						}
					]
				}
			},
			unidades_por_ml: {
				title: "Quantidade por Metro Linear",
				usage: "Use para ilhós, rebites distribuídos pelo perímetro",
				example: "2 ilhós/ml em 8ml = 16 unidades",
				variables: {
					L: "Largura em metros",
					A: "Altura em metros",
					D: "Densidade (unidades por ml)",
				},
			},
			unidades_cantos: {
				title: "Fixo nos Cantos",
				usage: "Use para elementos que sempre ficam nos 4 cantos",
				example: "4 cantoneiras sempre",
				variables: {},
				visualExamples: {
					title: "Exemplos de Aplicação - Elementos nos Cantos",
					description: "Para itens que sempre são posicionados nos quatro cantos.",
					cases: [
						{
							name: "🔩 Cantoneiras de Proteção",
							scenario: "Proteção dos cantos de painel ACM",
							measurements: "Qualquer dimensão do painel",
							calculation: "Sempre 4 unidades (constante)",
							result: "4 cantoneiras de alumínio"
						},
						{
							name: "🔍 Suportes de Canto",
							scenario: "Fixação de painel suspenso na parede",
							measurements: "Qualquer tamanho de painel",
							calculation: "Sempre 4 unidades (constante)",
							result: "4 suportes em L para os cantos"
						}
					]
				}
			},
			unidades_por_face: {
				title: "Quantidade por Face",
				usage: "Use para elementos que se repetem em cada face",
				example: "1 fechadura por face, 2 faces = 2 unidades",
				variables: { F: "Número de faces", D: "Quantidade por face" },
			},
		};

		return (
			descriptions[rule.id] || {
				title: rule.name,
				usage: rule.description || "Fórmula customizada",
				example: "Veja a fórmula para entender",
				variables: {},
			}
		);
	};

	// Filtrar e ordenar regras
	const suggestedRuleIds = getMaterialSuggestions(materialName, materialUnit);

	const filteredRules = allRules.filter((rule) => {
		const matchesSearch =
			rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory =
			selectedCategory === "all" || rule.category === selectedCategory;

		return matchesSearch && matchesCategory;
	});

	// Separar por categorias
	const suggestedRules = filteredRules.filter((rule) =>
		suggestedRuleIds.includes(rule.id),
	);
	const otherRules = filteredRules.filter(
		(rule) => !suggestedRuleIds.includes(rule.id),
	);
	
	// Agrupar por categoria
	const rulesByCategory = {
		AREA: filteredRules.filter(rule => rule.category === 'AREA'),
		LENGTH: filteredRules.filter(rule => rule.category === 'LENGTH'),
		UNIT: filteredRules.filter(rule => rule.category === 'UNIT')
	};
	
	const categoryNames = {
		AREA: 'Área (m²)',
		LENGTH: 'Comprimento (ml)',
		UNIT: 'Unidades (un)'
	};
	
	const sortedRules = [...suggestedRules, ...otherRules];

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "AREA":
				return <Calculator className="h-4 w-4" />;
			case "LENGTH":
				return <Ruler className="h-4 w-4" />;
			case "UNIT":
				return <Hash className="h-4 w-4" />;
			default:
				return <Info className="h-4 w-4" />;
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "AREA":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
			case "LENGTH":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			case "UNIT":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		}
	};

	const handleSelect = () => {
		const rule = allRules.find((r) => r.id === selectedRule);
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
		setCollapsedCategories(new Set());
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Calculator className="h-5 w-5" />
						Escolher Fórmula de Cálculo
					</DialogTitle>
					<DialogDescription>
						{materialName && (
							<span>
								Selecione como calcular a quantidade de{" "}
								<strong>{materialName}</strong>
								{materialUnit && ` (${materialUnit})`}
							</span>
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Filtros */}
					<div className="flex flex-col gap-4 sm:flex-row">
						<div className="flex-1">
							<Label htmlFor="search">Buscar Fórmula</Label>
							<div className="relative mt-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
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
							<Select
								value={selectedCategory}
								onValueChange={setSelectedCategory}
							>
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

					{/* Lista de Fórmulas - Organizada por Categorias */}
					<div className="space-y-4">
						{/* Seção de Sugeridas */}
						{suggestedRules.length > 0 && (
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
										⭐ Sugeridas para este material
									</Badge>
								</div>
								<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
									{suggestedRules.map((rule) => {
										const details = getFormulaDetails(rule);
										const isSelected = selectedRule === rule.id;
										return (
											<Card
												key={rule.id}
												className={`cursor-pointer transition-all hover:shadow-sm ${
													isSelected
														? "border-primary bg-primary/5 ring-1 ring-primary"
														: "border-border hover:border-primary/50"
												}`}
												onClick={() => setSelectedRule(rule.id)}
											>
												<CardHeader className="pb-2 pt-3">
													<div className="flex items-start justify-between">
														<Badge className={getCategoryColor(rule.category)} variant="secondary">
															{getCategoryIcon(rule.category)}
															<span className="ml-1 text-xs">{rule.category}</span>
														</Badge>
														{isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
													</div>
													<CardTitle className="text-base leading-tight">
														{details.title}
													</CardTitle>
												</CardHeader>
												<CardContent className="pt-0 pb-3">
													<div className="space-y-2">
														<div className="text-xs text-muted-foreground">
															{details.usage}
														</div>
														<div className="flex items-center justify-between gap-2">
															<code className="flex-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">
																{rule.formula}
															</code>
															<button
																type="button"
																onClick={(e) => {
																	e.stopPropagation();
																	setSelectedExampleRule(rule);
																	setShowExamplesModal(true);
																}}
																className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
																title="Ver exemplos práticos"
															>
																<Lightbulb className="h-3 w-3" />
															</button>
														</div>
													</div>
												</CardContent>
											</Card>
										);
									})}
								</div>
							</div>
						)}
						
						{/* Seções por Categoria */}
						{selectedCategory === 'all' ? (
							<div className="space-y-4">
								{Object.entries(rulesByCategory).map(([category, rules]) => {
									if (rules.length === 0) return null;
									
									const isCollapsed = collapsedCategories.has(category);
									const categoryRules = rules.filter(rule => !suggestedRuleIds.includes(rule.id));
									
									if (categoryRules.length === 0) return null;
									
									return (
										<div key={category} className="space-y-3">
											<button
												type="button"
												onClick={() => toggleCategory(category)}
												className="flex items-center gap-2 w-full text-left p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
											>
												{isCollapsed ? (
													<ChevronRight className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												)}
												<Badge className={getCategoryColor(category)} variant="secondary">
													{getCategoryIcon(category)}
													<span className="ml-1">{categoryNames[category as keyof typeof categoryNames]}</span>
												</Badge>
												<span className="text-xs text-muted-foreground ml-auto">
													{categoryRules.length} fórmula{categoryRules.length > 1 ? 's' : ''}
												</span>
											</button>
											
											{!isCollapsed && (
												<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
													{categoryRules.map((rule) => {
														const details = getFormulaDetails(rule);
														const isSelected = selectedRule === rule.id;
														return (
															<Card
																key={rule.id}
																className={`cursor-pointer transition-all hover:shadow-sm ${
																	isSelected
																		? "border-primary bg-primary/5 ring-1 ring-primary"
																		: "border-border hover:border-primary/50"
																}`}
																onClick={() => setSelectedRule(rule.id)}
															>
																<CardHeader className="pb-2 pt-3">
																	<div className="flex items-start justify-between">
																		<Badge className={getCategoryColor(rule.category)} variant="secondary">
																			{getCategoryIcon(rule.category)}
																			<span className="ml-1 text-xs">{rule.category}</span>
																		</Badge>
																		{isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
																	</div>
																	<CardTitle className="text-base leading-tight">
																		{details.title}
																	</CardTitle>
																</CardHeader>
																<CardContent className="pt-0 pb-3">
																	<div className="space-y-2">
																		<div className="text-xs text-muted-foreground">
																			{details.usage}
																		</div>
																		<div className="flex items-center justify-between gap-2">
																			<code className="flex-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">
																				{rule.formula}
																			</code>
																			<button
																				type="button"
																				onClick={(e) => {
																					e.stopPropagation();
																					setSelectedExampleRule(rule);
																					setShowExamplesModal(true);
																				}}
																				className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
																				title="Ver exemplos práticos"
																			>
																				<Lightbulb className="h-3 w-3" />
																			</button>
																		</div>
																	</div>
																</CardContent>
															</Card>
														);
													})}
												</div>
											)}
										</div>
									);
								})}
							</div>
						) : (
							/* Categoria específica selecionada */
							<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
								{filteredRules.filter(rule => !suggestedRuleIds.includes(rule.id)).map((rule) => {
									const details = getFormulaDetails(rule);
									const isSelected = selectedRule === rule.id;
									return (
										<Card
											key={rule.id}
											className={`cursor-pointer transition-all hover:shadow-sm ${
												isSelected
													? "border-primary bg-primary/5 ring-1 ring-primary"
													: "border-border hover:border-primary/50"
											}`}
											onClick={() => setSelectedRule(rule.id)}
										>
											<CardHeader className="pb-2 pt-3">
												<div className="flex items-start justify-between">
													<Badge className={getCategoryColor(rule.category)} variant="secondary">
														{getCategoryIcon(rule.category)}
														<span className="ml-1 text-xs">{rule.category}</span>
													</Badge>
													{isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
												</div>
												<CardTitle className="text-base leading-tight">
													{details.title}
												</CardTitle>
											</CardHeader>
											<CardContent className="pt-0 pb-3">
												<div className="space-y-2">
													<div className="text-xs text-muted-foreground">
														{details.usage}
													</div>
													<div className="flex items-center justify-between gap-2">
														<code className="flex-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">
															{rule.formula}
														</code>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																setSelectedExampleRule(rule);
																setShowExamplesModal(true);
															}}
															className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
															title="Ver exemplos práticos"
														>
															<Lightbulb className="h-3 w-3" />
														</button>
													</div>
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>
						)}

						{sortedRules.length === 0 && (
							<div className="py-12 text-center">
								<div className="text-muted-foreground">
									{searchTerm || selectedCategory !== "all"
										? "Nenhuma fórmula encontrada com os filtros aplicados"
										: "Nenhuma fórmula disponível"}
								</div>
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						Cancelar
					</Button>
					<Button onClick={handleSelect} disabled={!selectedRule}>
						Selecionar Fórmula
					</Button>
				</DialogFooter>
			</DialogContent>

			{/* Modal de Exemplos Práticos */}
			<Dialog open={showExamplesModal} onOpenChange={setShowExamplesModal}>
				<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Lightbulb className="h-5 w-5 text-blue-600" />
							{selectedExampleRule && getFormulaDetails(selectedExampleRule).visualExamples?.title}
						</DialogTitle>
						<DialogDescription>
							{selectedExampleRule && getFormulaDetails(selectedExampleRule).visualExamples?.description}
						</DialogDescription>
					</DialogHeader>

					{selectedExampleRule && (
						<div className="space-y-6 py-4">
							{/* Informações da Fórmula */}
							<div className="rounded-lg border bg-muted/30 p-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<div>
										<div className="mb-2 font-medium text-sm text-muted-foreground">FÓRMULA</div>
										<code className="rounded bg-background px-3 py-2 font-mono text-sm">
											{selectedExampleRule.formula}
										</code>
									</div>
									<div>
										<div className="mb-2 font-medium text-sm text-muted-foreground">CATEGORIA</div>
										<Badge className={getCategoryColor(selectedExampleRule.category)} variant="secondary">
											{getCategoryIcon(selectedExampleRule.category)}
											<span className="ml-1">{categoryNames[selectedExampleRule.category as keyof typeof categoryNames]}</span>
										</Badge>
									</div>
								</div>
							</div>

							{/* Casos de Exemplo */}
							<div className="space-y-4">
								<h3 className="font-semibold text-lg">Exemplos Práticos</h3>
								<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
									{getFormulaDetails(selectedExampleRule).visualExamples?.cases.map((example, index) => (
										<Card key={index} className="border-l-4 border-l-blue-500">
											<CardHeader className="pb-3">
												<CardTitle className="text-base">{example.name}</CardTitle>
												<CardDescription className="text-sm">
													{example.scenario}
												</CardDescription>
											</CardHeader>
											<CardContent className="space-y-3">
												<div>
													<div className="mb-1 font-medium text-xs text-muted-foreground uppercase tracking-wide">
														Medidas
													</div>
													<div className="text-sm">{example.measurements}</div>
												</div>
												
												<div>
													<div className="mb-1 font-medium text-xs text-muted-foreground uppercase tracking-wide">
														Cálculo
													</div>
													<code className="block rounded bg-muted px-2 py-1 font-mono text-sm">
														{example.calculation}
													</code>
												</div>
												
												<div>
													<div className="mb-1 font-medium text-xs text-muted-foreground uppercase tracking-wide">
														Resultado
													</div>
													<div className="rounded bg-green-50 px-2 py-1 font-medium text-green-800 text-sm dark:bg-green-950/20 dark:text-green-300">
														{example.result}
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setShowExamplesModal(false)}>
							Fechar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Dialog>
	);
}
