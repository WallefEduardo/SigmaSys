import { Decimal } from '@prisma/client/runtime/library';
import { apiLogger } from './logger';

export interface DepreciationConfig {
  acquisitionValue: number;
  residualValue: number;
  method: 'linear' | 'accelerated';
  usefulLifeHours?: number;
  usefulLifeYears?: number;
  accumulatedHours?: number;
}

export interface DepreciationResult {
  annualDepreciation: number;
  hourlyDepreciation: number;
  accumulatedDepreciation: number;
  remainingValue: number;
  remainingLife: {
    hours?: number;
    years?: number;
  };
  needsReplacement: boolean;
}

export class EquipmentDepreciationService {
  /**
   * Calcula a depreciação de um equipamento
   */
  static calculateDepreciation(config: DepreciationConfig): DepreciationResult {
    const {
      acquisitionValue,
      residualValue,
      method,
      usefulLifeHours,
      usefulLifeYears,
      accumulatedHours = 0
    } = config;

    const depreciableValue = acquisitionValue - residualValue;
    
    let annualDepreciation = 0;
    let hourlyDepreciation = 0;
    let accumulatedDepreciation = 0;

    if (method === 'linear') {
      // Depreciação Linear
      if (usefulLifeYears) {
        annualDepreciation = depreciableValue / usefulLifeYears;
      }
      
      if (usefulLifeHours) {
        hourlyDepreciation = depreciableValue / usefulLifeHours;
        accumulatedDepreciation = hourlyDepreciation * accumulatedHours;
      }
    } else if (method === 'accelerated') {
      // Depreciação Acelerada (método da soma dos dígitos dos anos)
      if (usefulLifeYears) {
        const sumOfYears = (usefulLifeYears * (usefulLifeYears + 1)) / 2;
        // Para o primeiro ano (mais conservador)
        annualDepreciation = (depreciableValue * usefulLifeYears) / sumOfYears;
      }
      
      if (usefulLifeHours) {
        // Aplicar aceleração nos primeiros 30% da vida útil
        const accelerationPeriod = usefulLifeHours * 0.3;
        if (accumulatedHours <= accelerationPeriod) {
          hourlyDepreciation = (depreciableValue * 0.6) / accelerationPeriod;
        } else {
          const remainingValue = depreciableValue * 0.4;
          const remainingHours = usefulLifeHours - accelerationPeriod;
          hourlyDepreciation = remainingValue / remainingHours;
        }
        accumulatedDepreciation = this.calculateAccumulatedAccelerated(
          depreciableValue, usefulLifeHours, accumulatedHours
        );
      }
    }

    const remainingValue = acquisitionValue - accumulatedDepreciation;
    const needsReplacement = remainingValue <= residualValue * 1.1; // 10% de margem

    const result: DepreciationResult = {
      annualDepreciation,
      hourlyDepreciation,
      accumulatedDepreciation,
      remainingValue,
      remainingLife: {
        hours: usefulLifeHours ? Math.max(0, usefulLifeHours - accumulatedHours) : undefined,
        years: usefulLifeYears ? Math.max(0, usefulLifeYears - (accumulatedHours ? accumulatedHours / 2000 : 0)) : undefined
      },
      needsReplacement
    };

    apiLogger.info('Equipment depreciation calculated', {
      acquisitionValue,
      method,
      annualDepreciation,
      hourlyDepreciation,
      remainingValue,
      needsReplacement
    });

    return result;
  }

  /**
   * Calcula depreciação acumulada para método acelerado
   */
  private static calculateAccumulatedAccelerated(
    depreciableValue: number,
    usefulLifeHours: number,
    accumulatedHours: number
  ): number {
    const accelerationPeriod = usefulLifeHours * 0.3;
    
    if (accumulatedHours <= accelerationPeriod) {
      // Período de depreciação acelerada
      const acceleratedRate = (depreciableValue * 0.6) / accelerationPeriod;
      return acceleratedRate * accumulatedHours;
    } else {
      // Período de depreciação normal
      const acceleratedDepreciation = depreciableValue * 0.6;
      const remainingValue = depreciableValue * 0.4;
      const remainingHours = usefulLifeHours - accelerationPeriod;
      const normalRate = remainingValue / remainingHours;
      const normalPeriodHours = accumulatedHours - accelerationPeriod;
      
      return acceleratedDepreciation + (normalRate * normalPeriodHours);
    }
  }

  /**
   * Calcula o impacto da depreciação no custo por hora
   */
  static calculateDepreciationCostPerHour(config: DepreciationConfig): number {
    const depreciation = this.calculateDepreciation(config);
    return depreciation.hourlyDepreciation;
  }

  /**
   * Verifica se o equipamento precisa de renovação
   */
  static needsRenewal(config: DepreciationConfig): {
    needs: boolean;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    timeRemaining: {
      hours?: number;
      months?: number;
    };
  } {
    const depreciation = this.calculateDepreciation(config);
    const remainingLifeRatio = depreciation.remainingValue / config.acquisitionValue;

    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (remainingLifeRatio <= 0.1) urgency = 'critical';
    else if (remainingLifeRatio <= 0.2) urgency = 'high';
    else if (remainingLifeRatio <= 0.3) urgency = 'medium';

    return {
      needs: depreciation.needsReplacement,
      urgency,
      timeRemaining: {
        hours: depreciation.remainingLife.hours,
        months: depreciation.remainingLife.years ? depreciation.remainingLife.years * 12 : undefined
      }
    };
  }

  /**
   * Gera relatório de depreciação
   */
  static generateDepreciationReport(config: DepreciationConfig) {
    const depreciation = this.calculateDepreciation(config);
    const renewal = this.needsRenewal(config);
    
    return {
      equipment: {
        acquisitionValue: config.acquisitionValue,
        residualValue: config.residualValue,
        currentValue: depreciation.remainingValue,
        depreciationMethod: config.method
      },
      depreciation: {
        annual: depreciation.annualDepreciation,
        hourly: depreciation.hourlyDepreciation,
        accumulated: depreciation.accumulatedDepreciation,
        percentage: (depreciation.accumulatedDepreciation / (config.acquisitionValue - config.residualValue)) * 100
      },
      lifespan: {
        totalHours: config.usefulLifeHours,
        usedHours: config.accumulatedHours || 0,
        remainingHours: depreciation.remainingLife.hours,
        usagePercentage: config.usefulLifeHours ? 
          ((config.accumulatedHours || 0) / config.usefulLifeHours) * 100 : 0
      },
      renewal: {
        recommended: renewal.needs,
        urgency: renewal.urgency,
        timeRemaining: renewal.timeRemaining
      }
    };
  }
}