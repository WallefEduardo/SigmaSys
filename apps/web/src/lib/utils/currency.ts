// Utilitários para formatação de moeda brasileira

/**
 * Formata um valor numérico para moeda brasileira
 */
export function formatCurrency(
  value: number | undefined | null,
  options?: {
    showSymbol?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return options?.showSymbol !== false ? 'R$ 0,00' : '0,00'
  }

  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options || {}

  const formatter = new Intl.NumberFormat('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits,
    maximumFractionDigits,
  })

  return formatter.format(value)
}

/**
 * Converte string formatada em moeda para número
 */
export function parseCurrency(value: string): number | undefined {
  if (!value || typeof value !== 'string') {
    return undefined
  }

  // Remove todos os caracteres que não são números, vírgula ou ponto
  const cleanValue = value
    .replace(/[^\d,-]/g, '')
    .replace(',', '.')

  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? undefined : parsed
}

/**
 * Formata valor por unidade
 */
export function formatCurrencyPerUnit(
  value: number | undefined | null,
  unit: string
): string {
  const formattedValue = formatCurrency(value)
  return `${formattedValue} / ${unit}`
}

/**
 * Aplica máscara de moeda durante a digitação
 */
export function applyCurrencyMask(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  if (!numbers) return ''
  
  // Converte para centavos
  const valueInCents = parseInt(numbers, 10)
  const valueInReais = valueInCents / 100
  
  return formatCurrency(valueInReais)
}

/**
 * Calcula percentual entre dois valores monetários
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 1
): string {
  if (total === 0) return '0%'
  
  const percentage = (value / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

/**
 * Formata diferença monetária com sinal
 */
export function formatCurrencyDifference(
  current: number,
  previous: number
): string {
  const difference = current - previous
  const sign = difference >= 0 ? '+' : ''
  
  return `${sign}${formatCurrency(difference)}`
}

/**
 * Converte valor para centavos (útil para cálculos precisos)
 */
export function toCents(value: number): number {
  return Math.round(value * 100)
}

/**
 * Converte centavos para reais
 */
export function fromCents(cents: number): number {
  return cents / 100
}