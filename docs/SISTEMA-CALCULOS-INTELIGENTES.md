# 🧮 SISTEMA DE CÁLCULOS INTELIGENTES - REGRAS DINÂMICAS

## 📋 VISÃO GERAL

Sistema revolucionário que substitui cálculos manuais por **regras de cálculo dinâmicas e contextuais**, permitindo configuração uma única vez e uso automático infinitas vezes.

### 🎯 PROBLEMA RESOLVIDO
- ❌ **Antes**: Campo "Unidade" burro que replica m², ml, un
- ✅ **Depois**: "Regras de Cálculo Dinâmico" inteligentes e contextuais

### 💡 INOVAÇÃO CORE
**Desacoplar** a unidade de custo (cadastrada no material) da **fórmula de uso** (configurada na regra), criando flexibilidade total.

---

## 🏗️ ARQUITETURA DO SISTEMA

### **1. CADASTRO DE MATERIAIS** (Já implementado)
```
Material: "Chapa ACM 3mm"
├── Unidade de Custo: m²
├── Valor por Unidade: R$ 80,00/m²
└── Fornecedor: ACM Company
```

### **2. REGRAS DE CÁLCULO** (Nova funcionalidade)
```
Regra: "Área das Laterais"
├── Fórmula: ((Largura + Altura) × 2) × Espessura
├── Variáveis Necessárias: [L, A, E]
├── Tipo: ÁREA
└── Resultado: m²
```

### **3. CONFIGURAÇÃO DO PRODUTO** (Checklist inteligente)
```
Produto: "Fachada ACM"
├── Pergunta: "Qual modelo?"
│   ├── "Com Avanço"
│   │   ├── Material: Chapa ACM → Regra: "Área Frontal"
│   │   ├── Material: Chapa ACM → Regra: "Área Laterais"
│   │   └── Material: Metalon → Regra: "Estrutura Perímetro"
│   └── "Sem Avanço"
│       └── Material: Chapa ACM → Regra: "Área Frontal"
```

### **4. ORÇAMENTO AUTOMATIZADO** (Fluxo do vendedor)
```
Quiz Inteligente:
├── P1: "Qual modelo?" → R: "Com Avanço"
├── P2: "Largura e altura?" → R: L=3m, A=1m  
├── P3: "Espessura avanço?" → R: E=0.2m
└── 💰 Cálculo automático → Orçamento pronto
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### **1. Tabela: `calculation_rules`**
```sql
CREATE TABLE calculation_rules (
  id                VARCHAR PRIMARY KEY,
  name              VARCHAR NOT NULL,           -- "Área das Laterais"
  category          ENUM('AREA', 'LENGTH', 'UNIT'),
  formula           TEXT NOT NULL,              -- "((L + A) * 2) * E"
  variables         JSON NOT NULL,              -- ["L", "A", "E"]
  result_unit       VARCHAR NOT NULL,           -- "m2", "ml", "un"
  description       TEXT,
  active            BOOLEAN DEFAULT true,
  created_at        TIMESTAMP DEFAULT NOW()
);
```

### **2. Tabela: `product_material_rules`**
```sql
CREATE TABLE product_material_rules (
  id                    VARCHAR PRIMARY KEY,
  product_id            VARCHAR REFERENCES products(id),
  question_id           VARCHAR,                -- Pergunta do checklist
  answer_option         VARCHAR,                -- Resposta específica
  material_id           VARCHAR REFERENCES materials(id),
  equipment_id          VARCHAR REFERENCES equipments(id),
  calculation_rule_id   VARCHAR REFERENCES calculation_rules(id),
  multiplier            DECIMAL DEFAULT 1,      -- Fator multiplicador
  waste_factor          DECIMAL DEFAULT 0,      -- % de desperdício
  created_at            TIMESTAMP DEFAULT NOW()
);
```

### **3. Tabela: `quote_calculations`** (Log de cálculos)
```sql
CREATE TABLE quote_calculations (
  id                VARCHAR PRIMARY KEY,
  quote_id          VARCHAR REFERENCES quotes(id),
  rule_id           VARCHAR REFERENCES calculation_rules(id),
  input_variables   JSON,                       -- {"L": 3, "A": 1, "E": 0.2}
  calculated_value  DECIMAL,                    -- 1.6
  unit_cost         DECIMAL,                    -- 80.00
  total_cost        DECIMAL,                    -- 128.00
  created_at        TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 REGRAS DE CÁLCULO PRÉ-DEFINIDAS

### **📐 FÓRMULAS DE ÁREA (para chapas, lonas, adesivos)**

| Nome | Fórmula | Variáveis | Uso |
|------|---------|-----------|-----|
| **Área Frontal** | `L × A` | L, A | Frente de placas |
| **Área Traseira** | `L × A` | L, A | Verso de placas |
| **Área Laterais** | `((L + A) × 2) × E` | L, A, E | Bordas com avanço |
| **Área Total** | `(L × A × 2) + ((L + A) × 2 × E)` | L, A, E | Caixa completa |
| **Área com Margem** | `(L + M) × (A + M)` | L, A, M | Com sobra de corte |

### **📏 FÓRMULAS DE COMPRIMENTO (para perfis, fitas, metalon)**

| Nome | Fórmula | Variáveis | Uso |
|------|---------|-----------|-----|
| **Perímetro Frontal** | `(L + A) × 2` | L, A | Contorno da frente |
| **Estrutura Profundidade** | `E × 4` | E | Travessas do avanço |
| **Comprimento Largura** | `L` | L | Apenas largura |
| **Comprimento Altura** | `A` | A | Apenas altura |
| **Soma Arestas** | `(L + A + E) × 4` | L, A, E | Todas as arestas |

### **🔢 FÓRMULAS DE UNIDADE (para parafusos, ilhós, acessórios)**

| Nome | Fórmula | Variáveis | Uso |
|------|---------|-----------|-----|
| **Unidades por m²** | `(L × A) × densidade` | L, A, D | 4 parafusos/m² |
| **Unidades por ml** | `((L + A) × 2) × densidade` | L, A, D | 2 ilhós/metro linear |
| **Unidades nos Cantos** | `4` | - | Fixo 4 cantos |
| **Unidades por Face** | `faces × densidade` | F, D | Por quantidade de faces |

---

## ⚙️ ENGINE DE CÁLCULO

### **1. Parser de Fórmulas** (`/lib/formula-engine.ts`)
```typescript
interface FormulaEngine {
  // Avaliar fórmula matemática
  evaluate(formula: string, variables: Record<string, number>): number;
  
  // Validar fórmula
  validate(formula: string, requiredVars: string[]): boolean;
  
  // Obter variáveis da fórmula
  extractVariables(formula: string): string[];
}
```

### **2. Serviço de Cálculo** (`/services/calculation-service.ts`)
```typescript
interface CalculationService {
  // Calcular custo de material usando regra
  calculateMaterialCost(
    materialId: string,
    ruleId: string, 
    variables: Record<string, number>
  ): Promise<CalculationResult>;
  
  // Calcular custo total do produto
  calculateProductCost(
    productId: string,
    answers: Record<string, string>,
    measurements: Record<string, number>
  ): Promise<ProductCostResult>;
}
```

### **3. Cache Inteligente**
```typescript
// Cache de cálculos por combinação de inputs
const cacheKey = `calc:${ruleId}:${JSON.stringify(variables)}`;
const ttl = 3600; // 1 hora
```

---

## 🎮 FLUXO DO VENDEDOR (UX)

### **1. Quiz Sequencial Inteligente**
```typescript
interface QuizFlow {
  // Passo 1: Pergunta principal
  question: "Qual modelo da fachada?";
  options: ["Com Avanço", "Sem Avanço"];
  
  // Passo 2: Coleta de medidas (baseada na resposta)
  measurements: {
    "Com Avanço": ["Largura", "Altura", "Espessura"],
    "Sem Avanço": ["Largura", "Altura"]
  };
  
  // Passo 3: Cálculo automático
  calculation: "auto";
}
```

### **2. Interface de Medidas**
```tsx
<MeasurementForm>
  <MeasureInput label="Largura (m)" variable="L" />
  <MeasureInput label="Altura (m)" variable="A" />
  <MeasureInput label="Espessura (m)" variable="E" />
  
  <CalculationPreview 
    rules={selectedRules}
    variables={measurements}
    onChange={(cost) => setTotalCost(cost)}
  />
</MeasurementForm>
```

### **3. Preview em Tempo Real**
```
📊 CÁLCULO EM TEMPO REAL:
├── Chapa frontal: 3×1 = 3m² × R$80 = R$240,00
├── Chapa laterais: (3+1)×2×0.2 = 1.6m² × R$80 = R$128,00
├── Metalon estrutura: (3+1+0.2)×4 = 16.8ml × R$8 = R$134,40
└── 💰 TOTAL: R$502,40
```

---

## 🔄 FLUXO DE IMPLEMENTAÇÃO

### **FASE 1: Core Engine**
1. ✅ Criar tabelas no banco
2. ✅ Implementar FormulaEngine
3. ✅ Criar CalculationService  
4. ✅ Implementar cache inteligente

### **FASE 2: Interface de Configuração**
1. ✅ Modal MaterialModal com regras
2. ✅ Seletor de fórmulas por categoria
3. ✅ Preview de cálculo na configuração
4. ✅ Validação de fórmulas

### **FASE 3: Quiz do Vendedor**
1. ✅ Fluxo sequencial de perguntas
2. ✅ Coleta inteligente de medidas
3. ✅ Cálculo automático em tempo real
4. ✅ Geração de orçamento final

### **FASE 4: Otimizações**
1. ✅ Performance com cache Redis
2. ✅ Batch calculations para múltiplos produtos
3. ✅ Analytics de fórmulas mais usadas
4. ✅ Backup e versionamento de regras

---

## 📈 VANTAGENS COMPETITIVAS

### **🎯 Para o Configurador (Você)**
- **Configuração única**: Define uma vez, usa infinitas
- **Flexibilidade total**: Qualquer fórmula matemática possível
- **Manutenção centralizada**: Altera regra, atualiza tudo
- **Controle granular**: Cada material tem sua regra específica

### **⚡ Para o Vendedor**
- **Zero cálculos manuais**: Sistema faz tudo automaticamente
- **Impossível errar**: Fluxo guiado à prova de erro
- **Orçamento instantâneo**: Resultado em tempo real
- **Interface simples**: Só responde perguntas básicas

### **💰 Para o Negócio**
- **Precisão absoluta**: Nunca mais erro de cálculo
- **Velocidade 10x**: Orçamento em minutos, não horas
- **Margem controlada**: Custos sempre precisos
- **Escalabilidade**: Adiciona produtos sem complexidade

### **🏆 Para o Cliente**
- **Transparência total**: Vê exatamente o que está pagando
- **Atendimento rápido**: Não precisa "esperar calcular"
- **Preço justo**: Sem margem de erro para mais ou menos

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar Core Engine** - Base de cálculos
2. **Criar Interface de Configuração** - Para cadastrar regras
3. **Desenvolver Quiz do Vendedor** - Fluxo automático
4. **Integrar com Orçamentos** - Sistema completo
5. **Otimizar Performance** - Cache e velocidade
6. **Documentar Casos de Uso** - Exemplos práticos

---

## 💡 EXEMPLO COMPLETO DE USO

### **Configuração (Você faz 1x)**
```
Produto: "Placa Automotiva"
├── P: "Qual tipo de placa?"
│   ├── R: "Simples" 
│   │   └── Chapa ACM → Regra: "Área Frontal"
│   └── R: "Com LED"
│       ├── Chapa ACM → Regra: "Área Frontal"
│       ├── LED Strip → Regra: "Perímetro Frontal" 
│       └── Fonte 12V → Regra: "1 por Face"
```

### **Orçamento (Vendedor usa ∞x)**
```
🤖 "Qual tipo de placa?"
👤 "Com LED"

🤖 "Largura e altura da placa?"  
👤 L: 1.5m | A: 0.4m

💰 Cálculo automático:
├── Chapa ACM: 1.5×0.4 = 0.6m² × R$80 = R$48,00
├── LED Strip: (1.5+0.4)×2 = 3.8ml × R$25 = R$95,00  
├── Fonte 12V: 1un × R$120 = R$120,00
└── 🏷️ TOTAL: R$263,00 + margem = R$350,00
```

---

**🎯 RESULTADO: Sistema mais inteligente do mercado, configuração simples, uso automático e precisão absoluta!**