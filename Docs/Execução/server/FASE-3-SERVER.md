# 🖥️ FASE 3 - SISTEMA DE PRODUTOS E FÓRMULAS SERVER (Semanas 5-7)

## 📋 Visão Geral da Fase
Implementar o engine de fórmulas matemáticas, sistema de unidades diversas e CRUD completo de materiais, equipamentos, processos e acabamentos.

---

## ⚙️ PARTE 3.1: Engine de Fórmulas Matemáticas

### **Objetivo**: Criar sistema flexível de cálculos com parser de fórmulas

### **Pré-requisitos**:
- FASE 2 concluída
- Sistema de empresas funcionando
- Permissões implementadas

### **Comandos Iniciais**:
```bash
cd apps/server

# Instalar dependências para fórmulas
pnpm add mathjs
pnpm add -D @types/mathjs
```

### **Tarefas Sequenciais**:

#### 3.1.1 - Sistema de Unidades de Medida
**Arquivo**: `apps/server/src/lib/units.ts`

```typescript
export interface Unit {
  id: string
  name: string
  symbol: string
  category: 'area' | 'length' | 'volume' | 'weight' | 'quantity' | 'time'
  baseUnit?: string
  factor?: number
  formula?: string
}

export const defaultUnits: Unit[] = [
  // Área
  { id: 'm2', name: 'Metro Quadrado', symbol: 'm²', category: 'area' },
  { id: 'cm2', name: 'Centímetro Quadrado', symbol: 'cm²', category: 'area', baseUnit: 'm2', factor: 0.0001 },
  
  // Comprimento/Linear
  { id: 'ml', name: 'Metro Linear', symbol: 'ml', category: 'length' },
  { id: 'cm', name: 'Centímetro', symbol: 'cm', category: 'length', baseUnit: 'ml', factor: 0.01 },
  { id: 'mm', name: 'Milímetro', symbol: 'mm', category: 'length', baseUnit: 'ml', factor: 0.001 },
  
  // Perímetro (calculado)
  { id: 'perimetro', name: 'Perímetro', symbol: 'per', category: 'length', formula: '2 * (largura + altura)' },
  { id: 'perimetro_total', name: 'Perímetro Total', symbol: 'ptot', category: 'length', formula: '2 * largura + 2 * altura + 2 * espessura' },
  
  // Metro Linear específicos
  { id: 'ml_largura', name: 'Metro Linear Largura', symbol: 'ml_l', category: 'length', formula: 'largura' },
  { id: 'ml_altura', name: 'Metro Linear Altura', symbol: 'ml_a', category: 'length', formula: 'altura' },
  { id: 'ml_travas', name: 'Metro Linear Travas', symbol: 'ml_t', category: 'length', formula: 'altura / espacamento_travas' },
  { id: 'ml_travas_altura', name: 'Metro Linear Travas Altura', symbol: 'ml_ta', category: 'length', formula: 'altura' },
  
  // Metro Quadrado específicos
  { id: 'm2_largura_altura', name: 'Metro Quadrado (L x A)', symbol: 'm²_la', category: 'area', formula: 'largura * altura' },
  { id: 'm2_largura_espessura', name: 'Metro Quadrado (L x E)', symbol: 'm²_le', category: 'area', formula: 'largura * espessura' },
  { id: 'm2_altura_espessura', name: 'Metro Quadrado (A x E)', symbol: 'm²_ae', category: 'area', formula: 'altura * espessura' },
  
  // Volume
  { id: 'm3', name: 'Metro Cúbico', symbol: 'm³', category: 'volume' },
  { id: 'litro', name: 'Litro', symbol: 'L', category: 'volume', baseUnit: 'm3', factor: 0.001 },
  { id: 'ml_volume', name: 'Mililitro', symbol: 'mL', category: 'volume', baseUnit: 'm3', factor: 0.000001 },
  
  // Peso
  { id: 'kg', name: 'Quilograma', symbol: 'kg', category: 'weight' },
  { id: 'g', name: 'Grama', symbol: 'g', category: 'weight', baseUnit: 'kg', factor: 0.001 },
  { id: 'ton', name: 'Tonelada', symbol: 't', category: 'weight', baseUnit: 'kg', factor: 1000 },
  
  // Quantidade
  { id: 'un', name: 'Unidade', symbol: 'un', category: 'quantity' },
  { id: 'par', name: 'Par', symbol: 'par', category: 'quantity', baseUnit: 'un', factor: 2 },
  { id: 'duzia', name: 'Dúzia', symbol: 'dz', category: 'quantity', baseUnit: 'un', factor: 12 },
  { id: 'centena', name: 'Centena', symbol: 'cen', category: 'quantity', baseUnit: 'un', factor: 100 },
  
  // Tempo
  { id: 'hora', name: 'Hora', symbol: 'h', category: 'time' },
  { id: 'minuto', name: 'Minuto', symbol: 'min', category: 'time', baseUnit: 'hora', factor: 1/60 },
  { id: 'segundo', name: 'Segundo', symbol: 's', category: 'time', baseUnit: 'hora', factor: 1/3600 }
]

export class UnitsService {
  static getUnitById(id: string): Unit | undefined {
    return defaultUnits.find(unit => unit.id === id)
  }

  static getUnitsByCategory(category: string): Unit[] {
    return defaultUnits.filter(unit => unit.category === category)
  }

  static convertToBaseUnit(value: number, fromUnit: string): number {
    const unit = this.getUnitById(fromUnit)
    if (!unit || !unit.baseUnit || !unit.factor) {
      return value
    }
    return value * unit.factor
  }

  static convertBetweenUnits(value: number, fromUnit: string, toUnit: string): number {
    const from = this.getUnitById(fromUnit)
    const to = this.getUnitById(toUnit)
    
    if (!from || !to) return value
    
    // Se são da mesma categoria, fazer conversão
    if (from.category === to.category) {
      const baseValue = this.convertToBaseUnit(value, fromUnit)
      const toFactor = to.factor || 1
      return baseValue / toFactor
    }
    
    return value
  }

  static validateUnit(unitId: string): boolean {
    return defaultUnits.some(unit => unit.id === unitId)
  }

  static getFormulaSuggestions(): string[] {
    return [
      'quantidade',
      'largura',
      'altura', 
      'espessura',
      'perimetro',
      'area',
      'volume',
      'largura * altura',
      'largura * espessura',
      'altura * espessura',
      '2 * (largura + altura)',
      '2 * largura + 2 * altura',
      'quantidade * largura',
      'quantidade * altura',
      'quantidade * (largura * altura)',
      'ceil(altura / espacamento_travas)',
      'ceil(largura / largura_material)',
      'area / rendimento_tinta'
    ]
  }
}
```

#### 3.1.2 - Engine de Fórmulas
**Arquivo**: `apps/server/src/lib/formulas.ts`

```typescript
import { evaluate, parse, MathNode } from 'mathjs'
import { UnitsService } from './units'

export interface FormulaVariable {
  name: string
  type: 'number' | 'dimension' | 'constant'
  description: string
  unit?: string
  defaultValue?: number
  required: boolean
}

export interface FormulaContext {
  quantidade?: number
  largura?: number
  altura?: number
  espessura?: number
  area?: number
  perimetro?: number
  volume?: number
  espacamento_travas?: number
  largura_material?: number
  rendimento_tinta?: number
  densidade?: number
  peso_especifico?: number
  [key: string]: number | undefined
}

export interface FormulaResult {
  value: number
  unit: string
  variables: Record<string, number>
  formula: string
  steps?: string[]
}

export class FormulaEngine {
  private static readonly AVAILABLE_VARIABLES: FormulaVariable[] = [
    { name: 'quantidade', type: 'number', description: 'Quantidade de itens', unit: 'un', required: true },
    { name: 'largura', type: 'dimension', description: 'Largura em metros', unit: 'ml', required: false },
    { name: 'altura', type: 'dimension', description: 'Altura em metros', unit: 'ml', required: false },
    { name: 'espessura', type: 'dimension', description: 'Espessura em metros', unit: 'ml', required: false },
    { name: 'area', type: 'dimension', description: 'Área em metros quadrados', unit: 'm2', required: false },
    { name: 'perimetro', type: 'dimension', description: 'Perímetro em metros', unit: 'ml', required: false },
    { name: 'volume', type: 'dimension', description: 'Volume em metros cúbicos', unit: 'm3', required: false },
    { name: 'espacamento_travas', type: 'constant', description: 'Espaçamento entre travas', unit: 'ml', defaultValue: 1.0, required: false },
    { name: 'largura_material', type: 'constant', description: 'Largura padrão do material', unit: 'ml', required: false },
    { name: 'rendimento_tinta', type: 'constant', description: 'Rendimento da tinta por m²', unit: 'm2', required: false },
    { name: 'densidade', type: 'constant', description: 'Densidade do material', unit: 'kg', required: false },
    { name: 'peso_especifico', type: 'constant', description: 'Peso específico', unit: 'kg', required: false }
  ]

  private static readonly MATHEMATICAL_FUNCTIONS = [
    'abs', 'ceil', 'floor', 'round', 'sqrt', 'pow', 'min', 'max',
    'sin', 'cos', 'tan', 'log', 'exp'
  ]

  static validateFormula(formula: string): { valid: boolean; error?: string; variables: string[] } {
    try {
      // Parse da fórmula
      const parsed = parse(formula)
      
      // Extrair variáveis usadas
      const variables = this.extractVariables(parsed)
      
      // Validar se todas as variáveis são conhecidas
      const unknownVariables = variables.filter(
        variable => !this.AVAILABLE_VARIABLES.some(v => v.name === variable) &&
                   !this.MATHEMATICAL_FUNCTIONS.includes(variable)
      )
      
      if (unknownVariables.length > 0) {
        return {
          valid: false,
          error: `Variáveis desconhecidas: ${unknownVariables.join(', ')}`,
          variables
        }
      }

      // Teste com valores dummy
      const testContext: FormulaContext = {}
      variables.forEach(variable => {
        const varDef = this.AVAILABLE_VARIABLES.find(v => v.name === variable)
        if (varDef) {
          testContext[variable] = varDef.defaultValue || 1
        }
      })

      const result = evaluate(formula, testContext)
      
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return {
          valid: false,
          error: 'Fórmula não retorna um número válido',
          variables
        }
      }

      return { valid: true, variables }
    } catch (error) {
      return {
        valid: false,
        error: `Erro de sintaxe: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variables: []
      }
    }
  }

  static calculateFormula(
    formula: string,
    context: FormulaContext,
    targetUnit: string = 'un'
  ): FormulaResult {
    try {
      // Validar fórmula
      const validation = this.validateFormula(formula)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Pré-processar contexto (calcular valores derivados)
      const processedContext = this.preprocessContext(context)

      // Executar cálculo
      const rawResult = evaluate(formula, processedContext)
      
      if (typeof rawResult !== 'number' || isNaN(rawResult) || !isFinite(rawResult)) {
        throw new Error('Resultado do cálculo é inválido')
      }

      // Arredondar para 4 casas decimais
      const value = Math.round(rawResult * 10000) / 10000

      return {
        value,
        unit: targetUnit,
        variables: processedContext,
        formula,
        steps: this.generateCalculationSteps(formula, processedContext, value)
      }
    } catch (error) {
      throw new Error(`Erro no cálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  private static preprocessContext(context: FormulaContext): FormulaContext {
    const processed = { ...context }

    // Calcular valores derivados se não fornecidos
    if (processed.largura && processed.altura && !processed.area) {
      processed.area = processed.largura * processed.altura
    }

    if (processed.largura && processed.altura && !processed.perimetro) {
      processed.perimetro = 2 * (processed.largura + processed.altura)
    }

    if (processed.largura && processed.altura && processed.espessura && !processed.volume) {
      processed.volume = processed.largura * processed.altura * processed.espessura
    }

    // Definir valores padrão
    if (!processed.espacamento_travas) {
      processed.espacamento_travas = 1.0
    }

    return processed
  }

  private static extractVariables(node: MathNode): string[] {
    const variables: Set<string> = new Set()

    node.traverse((childNode: any) => {
      if (childNode.type === 'SymbolNode') {
        variables.add(childNode.name)
      }
    })

    return Array.from(variables).filter(name => 
      !this.MATHEMATICAL_FUNCTIONS.includes(name) && 
      name !== 'pi' && 
      name !== 'e'
    )
  }

  private static generateCalculationSteps(
    formula: string,
    context: FormulaContext,
    result: number
  ): string[] {
    const steps: string[] = []
    
    steps.push(`Fórmula: ${formula}`)
    
    const variables = Object.entries(context)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${value}`)
    
    if (variables.length > 0) {
      steps.push(`Variáveis: ${variables.join(', ')}`)
    }
    
    steps.push(`Resultado: ${result}`)
    
    return steps
  }

  static getAvailableVariables(): FormulaVariable[] {
    return this.AVAILABLE_VARIABLES
  }

  static previewFormula(formula: string, sampleContext?: Partial<FormulaContext>): {
    preview: string
    result?: number
    error?: string
  } {
    try {
      const defaultContext: FormulaContext = {
        quantidade: 1,
        largura: 2,
        altura: 1.5,
        espessura: 0.1,
        espacamento_travas: 1.0,
        largura_material: 1.2,
        rendimento_tinta: 8,
        densidade: 1.5,
        peso_especifico: 2.5,
        ...sampleContext
      }

      const result = this.calculateFormula(formula, defaultContext)
      
      return {
        preview: `Com valores exemplo: ${formula} = ${result.value}`,
        result: result.value
      }
    } catch (error) {
      return {
        preview: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  static suggestFormulas(category: 'area' | 'length' | 'volume' | 'weight' | 'quantity'): string[] {
    const suggestions: Record<string, string[]> = {
      area: [
        'largura * altura',
        'quantidade * (largura * altura)',
        'area',
        'perimetro * espessura'
      ],
      length: [
        'largura',
        'altura',
        'perimetro',
        '2 * (largura + altura)',
        'quantidade * largura',
        'ceil(altura / espacamento_travas)',
        'ceil(largura / largura_material)'
      ],
      volume: [
        'largura * altura * espessura',
        'area * espessura',
        'volume',
        'quantidade * volume'
      ],
      weight: [
        'volume * densidade',
        'area * peso_especifico',
        'quantidade * peso_especifico'
      ],
      quantity: [
        'quantidade',
        'ceil(area / rendimento_tinta)',
        'ceil(largura / largura_material)',
        'ceil(altura / espacamento_travas)'
      ]
    }

    return suggestions[category] || []
  }
}
```

### **Critérios de Aceite**:
- [ ] Engine de fórmulas validando sintaxe
- [ ] Sistema de unidades diversas
- [ ] Cálculo com variáveis dinâmicas
- [ ] Preview de fórmulas funcionando

---

## 📦 PARTE 3.2: CRUD de Matérias-Primas

### **Objetivo**: Gestão completa de materiais com controle de preços

### **Tarefas Sequenciais**:

#### 3.2.1 - Expandir Schema de Materiais
**Arquivo**: `apps/server/prisma/schema.prisma` (atualizar Material)

```prisma
model Material {
  id           String   @id @default(cuid())
  name         String
  description  String?
  code         String?  // código interno
  barcode      String?  // código de barras
  unit         String   // unidade de medida principal
  cost         Decimal  @db.Decimal(10, 4)
  lastCost     Decimal? @db.Decimal(10, 4) // último custo para comparação
  costHistory  Json?    // histórico de preços
  
  // Fornecedor
  supplier     String?
  supplierCode String?  // código do fornecedor
  supplierContact Json? // contato do fornecedor
  
  // Estoque
  minStock     Decimal? @db.Decimal(10, 4)
  maxStock     Decimal? @db.Decimal(10, 4)
  location     String?  // localização no estoque
  
  // Categorização
  category     String?
  subcategory  String?
  brand        String?  // marca
  model        String?  // modelo
  color        String?  // cor
  
  // Características físicas
  dimensions   Json?    // dimensões (largura, altura, espessura)
  weight       Decimal? @db.Decimal(10, 4)
  volume       Decimal? @db.Decimal(10, 4)
  density      Decimal? @db.Decimal(10, 4)
  
  // Múltiplas unidades de medida
  alternativeUnits Json? // unidades alternativas com fatores de conversão
  
  // Controle de qualidade
  quality      String?  // A, B, C
  certification String? // certificações
  
  // Imagens e documentos
  images       String[] // URLs das imagens
  documents    String[] // URLs de documentos técnicos
  
  // Observações
  notes        String?
  tags         String[] // tags para busca
  
  // Status
  active       Boolean  @default(true)
  discontinued Boolean  @default(false)
  
  // Auditoria
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  createdBy    String?
  updatedBy    String?

  // Relations
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  creator      User?    @relation("MaterialCreator", fields: [createdBy], references: [id])
  updater      User?    @relation("MaterialUpdater", fields: [updatedBy], references: [id])
  productItems ProductMaterial[]
  inventory    InventoryItem[]
  priceHistory MaterialPriceHistory[]

  @@unique([companyId, code])
  @@index([companyId, category])
  @@index([companyId, supplier])
  @@map("materials")
}

model MaterialPriceHistory {
  id          String   @id @default(cuid())
  oldPrice    Decimal  @db.Decimal(10, 4)
  newPrice    Decimal  @db.Decimal(10, 4)
  reason      String?  // motivo da alteração
  supplier    String?  // fornecedor da cotação
  createdAt   DateTime @default(now())
  createdBy   String?

  // Relations
  materialId  String
  material    Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
  user        User?    @relation("PriceHistoryUser", fields: [createdBy], references: [id])

  @@map("material_price_history")
}
```

#### 3.2.2 - Router de Materiais
**Arquivo**: `apps/server/src/routers/materials.ts`

```typescript
import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { PermissionService } from '../lib/permissions'
import { ensureCompanyAccess } from '../lib/tenancy'
import { UnitsService } from '../lib/units'
import { TRPCError } from '@trpc/server'

const dimensionsSchema = z.object({
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  thickness: z.number().optional()
}).optional()

const alternativeUnitsSchema = z.array(z.object({
  unit: z.string(),
  factor: z.number(),
  description: z.string().optional()
})).optional()

const supplierContactSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional()
}).optional()

export const materialsRouter = router({
  // Listar materiais
  list: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      category: z.string().optional(),
      supplier: z.string().optional(),
      unit: z.string().optional(),
      active: z.boolean().optional(),
      discontinued: z.boolean().optional(),
      lowStock: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { page, limit, search, category, supplier, unit, active, discontinued, lowStock } = input
      const offset = (page - 1) * limit

      const where = {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { supplier: { contains: search, mode: 'insensitive' as const } },
            { tags: { hasSome: [search] } }
          ]
        }),
        ...(category && { category }),
        ...(supplier && { supplier }),
        ...(unit && { unit }),
        ...(active !== undefined && { active }),
        ...(discontinued !== undefined && { discontinued })
      }

      const [materials, total] = await Promise.all([
        ctx.db.material.findMany({
          where,
          skip: offset,
          take: limit,
          include: {
            creator: { select: { name: true } },
            inventory: {
              select: {
                quantity: true,
                minStock: true
              }
            },
            _count: {
              select: {
                productItems: true,
                priceHistory: true
              }
            }
          },
          orderBy: { name: 'asc' }
        }),
        ctx.db.material.count({ where })
      ])

      // Filtrar por estoque baixo se solicitado
      const filteredMaterials = lowStock 
        ? materials.filter(material => {
            const totalStock = material.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0)
            const minStock = material.minStock ? Number(material.minStock) : 0
            return totalStock <= minStock
          })
        : materials

      return {
        materials: filteredMaterials,
        pagination: {
          page,
          limit,
          total: lowStock ? filteredMaterials.length : total,
          pages: Math.ceil((lowStock ? filteredMaterials.length : total) / limit)
        }
      }
    }),

  // Obter material por ID
  getById: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const material = await ctx.db.material.findFirst({
        where: {
          id: input.id,
          companyId
        },
        include: {
          creator: { select: { name: true, email: true } },
          updater: { select: { name: true, email: true } },
          inventory: {
            include: {
              movements: {
                take: 10,
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          priceHistory: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { name: true } }
            }
          },
          productItems: {
            include: {
              product: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      if (!material) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material not found'
        })
      }

      return material
    }),

  // Criar material
  create: protectedProcedure
    .use(PermissionService.requirePermission('products.create'))
    .input(z.object({
      name: z.string().min(2).max(200),
      description: z.string().optional(),
      code: z.string().max(50).optional(),
      barcode: z.string().max(100).optional(),
      unit: z.string().min(1),
      cost: z.number().min(0),
      supplier: z.string().optional(),
      supplierCode: z.string().optional(),
      supplierContact: supplierContactSchema,
      minStock: z.number().min(0).optional(),
      maxStock: z.number().min(0).optional(),
      location: z.string().optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      color: z.string().optional(),
      dimensions: dimensionsSchema,
      weight: z.number().min(0).optional(),
      volume: z.number().min(0).optional(),
      density: z.number().min(0).optional(),
      alternativeUnits: alternativeUnitsSchema,
      quality: z.enum(['A', 'B', 'C']).optional(),
      certification: z.string().optional(),
      images: z.array(z.string().url()).default([]),
      documents: z.array(z.string().url()).default([]),
      notes: z.string().optional(),
      tags: z.array(z.string()).default([])
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Validar unidade de medida
      if (!UnitsService.validateUnit(input.unit)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid unit of measurement'
        })
      }

      // Verificar se código já existe (se fornecido)
      if (input.code) {
        const existingMaterial = await ctx.db.material.findFirst({
          where: {
            companyId,
            code: input.code
          }
        })

        if (existingMaterial) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Material code already exists'
          })
        }
      }

      const material = await ctx.db.material.create({
        data: {
          ...input,
          companyId,
          createdBy: ctx.user!.id
        },
        include: {
          creator: { select: { name: true } },
          _count: {
            select: { productItems: true }
          }
        }
      })

      return material
    }),

  // Atualizar material
  update: protectedProcedure
    .use(PermissionService.requirePermission('products.update'))
    .input(z.object({
      id: z.string(),
      name: z.string().min(2).max(200).optional(),
      description: z.string().optional(),
      code: z.string().max(50).optional(),
      barcode: z.string().max(100).optional(),
      unit: z.string().optional(),
      cost: z.number().min(0).optional(),
      supplier: z.string().optional(),
      supplierCode: z.string().optional(),
      supplierContact: supplierContactSchema,
      minStock: z.number().min(0).optional(),
      maxStock: z.number().min(0).optional(),
      location: z.string().optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      color: z.string().optional(),
      dimensions: dimensionsSchema,
      weight: z.number().min(0).optional(),
      volume: z.number().min(0).optional(),
      density: z.number().min(0).optional(),
      alternativeUnits: alternativeUnitsSchema,
      quality: z.enum(['A', 'B', 'C']).optional(),
      certification: z.string().optional(),
      images: z.array(z.string().url()).optional(),
      documents: z.array(z.string().url()).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      discontinued: z.boolean().optional(),
      reason: z.string().optional() // motivo da alteração de preço
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)
      const { id, cost, reason, ...data } = input

      // Verificar se material existe
      const existingMaterial = await ctx.db.material.findFirst({
        where: { id, companyId }
      })

      if (!existingMaterial) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material not found'
        })
      }

      // Verificar código único (se alterado)
      if (data.code && data.code !== existingMaterial.code) {
        const codeExists = await ctx.db.material.findFirst({
          where: {
            companyId,
            code: data.code,
            id: { not: id }
          }
        })

        if (codeExists) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Material code already exists'
          })
        }
      }

      // Validar nova unidade (se alterada)
      if (data.unit && !UnitsService.validateUnit(data.unit)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid unit of measurement'
        })
      }

      // Atualizar material em transação (para histórico de preço)
      const material = await ctx.db.$transaction(async (tx) => {
        // Se preço mudou, criar histórico
        if (cost !== undefined && cost !== Number(existingMaterial.cost)) {
          await tx.materialPriceHistory.create({
            data: {
              materialId: id,
              oldPrice: existingMaterial.cost,
              newPrice: cost,
              reason: reason || 'Atualização manual',
              createdBy: ctx.user!.id
            }
          })
        }

        // Atualizar material
        return tx.material.update({
          where: { id },
          data: {
            ...data,
            ...(cost !== undefined && { 
              lastCost: existingMaterial.cost,
              cost 
            }),
            updatedBy: ctx.user!.id
          },
          include: {
            creator: { select: { name: true } },
            updater: { select: { name: true } },
            _count: {
              select: { 
                productItems: true,
                priceHistory: true
              }
            }
          }
        })
      })

      return material
    }),

  // Desativar material
  deactivate: protectedProcedure
    .use(PermissionService.requirePermission('products.delete'))
    .input(z.object({
      id: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      // Verificar se material está sendo usado em produtos
      const usage = await ctx.db.productMaterial.count({
        where: {
          materialId: input.id,
          product: { companyId }
        }
      })

      if (usage > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Material is being used in ${usage} products`
        })
      }

      const material = await ctx.db.material.update({
        where: {
          id: input.id,
          companyId
        },
        data: { 
          active: false,
          updatedBy: ctx.user!.id
        }
      })

      return material
    }),

  // Estatísticas
  stats: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .query(async ({ ctx }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const [
        totalMaterials,
        activeMaterials,
        categories,
        suppliers,
        lowStockMaterials,
        recentMaterials,
        totalValue
      ] = await Promise.all([
        ctx.db.material.count({ where: { companyId } }),
        ctx.db.material.count({ where: { companyId, active: true } }),
        ctx.db.material.groupBy({
          by: ['category'],
          where: { companyId, category: { not: null } },
          _count: true,
          orderBy: { _count: { category: 'desc' } },
          take: 10
        }),
        ctx.db.material.groupBy({
          by: ['supplier'],
          where: { companyId, supplier: { not: null } },
          _count: true,
          orderBy: { _count: { supplier: 'desc' } },
          take: 10
        }),
        ctx.db.material.findMany({
          where: {
            companyId,
            active: true,
            inventory: {
              some: {
                quantity: { lte: ctx.db.material.fields.minStock }
              }
            }
          },
          take: 10,
          select: {
            id: true,
            name: true,
            minStock: true,
            inventory: {
              select: { quantity: true }
            }
          }
        }),
        ctx.db.material.findMany({
          where: { companyId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            cost: true,
            createdAt: true
          }
        }),
        ctx.db.material.aggregate({
          where: { companyId, active: true },
          _sum: { cost: true }
        })
      ])

      return {
        totalMaterials,
        activeMaterials,
        inactiveMaterials: totalMaterials - activeMaterials,
        categories: categories.map(c => ({ name: c.category, count: c._count })),
        suppliers: suppliers.map(s => ({ name: s.supplier, count: s._count })),
        lowStockMaterials,
        recentMaterials,
        totalValue: totalValue._sum.cost || 0,
        lowStockCount: lowStockMaterials.length
      }
    }),

  // Buscar por código de barras
  findByBarcode: protectedProcedure
    .use(PermissionService.requirePermission('products.read'))
    .input(z.object({
      barcode: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ensureCompanyAccess()(ctx)

      const material = await ctx.db.material.findFirst({
        where: {
          companyId,
          barcode: input.barcode
        },
        include: {
          inventory: {
            select: { quantity: true }
          }
        }
      })

      return material
    }),

  // Obter unidades disponíveis
  getUnits: protectedProcedure
    .query(() => {
      return UnitsService.getUnitsByCategory('area')
        .concat(UnitsService.getUnitsByCategory('length'))
        .concat(UnitsService.getUnitsByCategory('volume'))
        .concat(UnitsService.getUnitsByCategory('weight'))
        .concat(UnitsService.getUnitsByCategory('quantity'))
    })
})
```

### **Critérios de Aceite**:
- [ ] CRUD completo de materiais funcional
- [ ] Histórico de preços implementado
- [ ] Sistema de unidades diversas
- [ ] Validações de negócio ativas

---

## ⚙️ PARTE 3.3: CRUD de Equipamentos

### **Objetivo**: Gestão de equipamentos de impressão e usinagem

### **Tarefas Sequenciais**:

#### 3.3.1 - Schema de Equipamentos
**Arquivo**: `apps/server/prisma/schema.prisma` (expandir Equipment)

```prisma
model Equipment {
  id            String   @id @default(cuid())
  name          String
  description   String?
  code          String?  // código interno
  type          String   // "printing" ou "machining"
  
  // Custos
  costPerHour   Decimal  @db.Decimal(10, 4)
  maintenanceCost Decimal? @db.Decimal(10, 4) // custo de manutenção por hora
  energyCost    Decimal? @db.Decimal(10, 4) // custo de energia por hora
  
  // Capacidade geral
  maxWidth      Decimal? @db.Decimal(10, 4) // largura máxima
  maxHeight     Decimal? @db.Decimal(10, 4) // altura máxima
  maxThickness  Decimal? @db.Decimal(10, 4) // espessura máxima
  
  // Configurações específicas por tipo
  printingConfig Json?   // config para impressoras
  machiningConfig Json?  // config para usinagem
  
  // Insumos do equipamento
  consumables   Json?    // tintas, cabeças, brocas, etc
  
  // Status operacional
  status        String   @default("available") // available, busy, maintenance, broken
  location      String?  // localização física
  serialNumber  String?  // número de série
  manufacturer  String?  // fabricante
  model         String?  // modelo
  year          Int?     // ano de fabricação
  
  // Manutenção
  lastMaintenance DateTime?
  nextMaintenance DateTime?
  maintenanceInterval Int? // dias entre manutenções
  maintenanceNotes String?
  
  // Documentação
  manualUrl     String?  // URL do manual
  images        String[] // fotos do equipamento
  documents     String[] // documentos técnicos
  
  // Observações
  notes         String?
  tags          String[]
  
  // Status
  active        Boolean  @default(true)
  
  // Auditoria
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?
  updatedBy     String?

  // Relations
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  creator       User?    @relation("EquipmentCreator", fields: [createdBy], references: [id])
  updater       User?    @relation("EquipmentUpdater", fields: [updatedBy], references: [id])
  productItems  ProductEquipment[]
  usageLog      EquipmentUsage[]

  @@unique([companyId, code])
  @@index([companyId, type])
  @@index([companyId, status])
  @@map("equipments")
}

model EquipmentUsage {
  id          String   @id @default(cuid())
  startTime   DateTime
  endTime     DateTime?
  duration    Int?     // minutos de uso
  operatorId  String?  // usuário que operou
  orderId     String?  // ordem de serviço relacionada
  description String?  // descrição do trabalho
  cost        Decimal? @db.Decimal(10, 4) // custo calculado
  
  // Consumo de insumos
  consumablesUsed Json? // insumos consumidos
  
  // Métricas de produção
  unitsProduced Int?
  area          Decimal? @db.Decimal(10, 4) // m² processados
  length        Decimal? @db.Decimal(10, 4) // metros processados
  
  createdAt   DateTime @default(now())

  // Relations
  equipmentId String
  equipment   Equipment @relation(fields: [equipmentId], references: [id], onDelete: Cascade)
  operator    User?     @relation("EquipmentOperator", fields: [operatorId], references: [id])

  @@map("equipment_usage")
}
```

#### 3.3.2 - Router de Equipamentos (continuarei no próximo arquivo devido ao limite)

### **Critérios de Aceite Parciais**:
- [ ] Schema de equipamentos expandido
- [ ] Suporte para dois tipos (impressão/usinagem)
- [ ] Controle de manutenção implementado
- [ ] Log de uso dos equipamentos

---

## 📋 RESUMO PARCIAL DA FASE 3 - SERVER

### **O que foi implementado até agora**:
✅ **Engine de Fórmulas Completo**
- Parser matemático com validação
- Sistema de unidades diversas
- Variáveis dinâmicas
- Preview e validação

✅ **CRUD de Materiais Avançado**
- Gestão completa com histórico de preços
- Múltiplas unidades de medida
- Controle de qualidade
- Integração com fornecedores

✅ **Base de Equipamentos**
- Schema para impressão e usinagem
- Controle de manutenção
- Log de uso detalhado

### **Próximos Passos na Fase 3**:
- Completar router de equipamentos
- Sistema de processos e setores
- CRUD de acabamentos
- Integração entre todos os módulos

### **Comandos para Testar**:
```bash
# Atualizar schema
pnpm db:push

# Testar engine de fórmulas
pnpm dev:server
# Testar endpoint: /trpc/materials.list
```