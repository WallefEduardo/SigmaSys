import { apiLogger } from './logger';

export interface PassConfiguration {
  quality: 'draft' | 'normal' | 'high' | 'photo';
  speed: number; // m²/hora
  inkConsumption: number; // multiplicador de consumo de tinta
  powerConsumption: number; // multiplicador de consumo de energia
  printHeadWear: number; // multiplicador de desgaste da cabeça
  description?: string;
}

export interface PrintJobCalculation {
  area: number; // m²
  passConfig: PassConfiguration;
  equipmentConfig: {
    costPerHour: number;
    energyCostPerHour: number;
    inkCostPerMl: number;
    printHeadCost: number;
    printHeadLifespan: number; // m² que a cabeça suporta
  };
}

export interface PrintJobResult {
  timeRequired: number; // horas
  costs: {
    equipment: number;
    energy: number;
    ink: number;
    printHeadWear: number;
    total: number;
  };
  consumption: {
    inkMl: number;
    printHeadWearPercent: number;
  };
  quality: string;
}

export class EquipmentPassesService {
  /**
   * Configurações padrão de passadas para impressoras
   */
  static getDefaultPassConfigurations(): Record<string, PassConfiguration> {
    return {
      draft: {
        quality: 'draft',
        speed: 100, // m²/h
        inkConsumption: 0.6, // 60% do consumo normal
        powerConsumption: 0.8, // 80% do consumo normal
        printHeadWear: 0.5, // 50% do desgaste normal
        description: 'Qualidade rascunho - alta velocidade, menor qualidade'
      },
      normal: {
        quality: 'normal',
        speed: 60, // m²/h
        inkConsumption: 1.0, // 100% consumo base
        powerConsumption: 1.0, // 100% consumo base
        printHeadWear: 1.0, // 100% desgaste base
        description: 'Qualidade normal - equilibrio entre velocidade e qualidade'
      },
      high: {
        quality: 'high',
        speed: 30, // m²/h
        inkConsumption: 1.4, // 140% do consumo normal
        powerConsumption: 1.2, // 120% do consumo normal
        printHeadWear: 1.8, // 180% do desgaste normal
        description: 'Alta qualidade - menor velocidade, maior precisão'
      },
      photo: {
        quality: 'photo',
        speed: 15, // m²/h
        inkConsumption: 2.0, // 200% do consumo normal
        powerConsumption: 1.5, // 150% do consumo normal
        printHeadWear: 2.5, // 250% do desgaste normal
        description: 'Qualidade fotográfica - máxima qualidade, menor velocidade'
      }
    };
  }

  /**
   * Calcula o custo e tempo para uma impressão com passada específica
   */
  static calculatePrintJob(calculation: PrintJobCalculation): PrintJobResult {
    const { area, passConfig, equipmentConfig } = calculation;
    
    // Tempo necessário baseado na velocidade da passada
    const timeRequired = area / passConfig.speed;
    
    // Custos detalhados
    const equipmentCost = timeRequired * equipmentConfig.costPerHour;
    const energyCost = timeRequired * equipmentConfig.energyCostPerHour * passConfig.powerConsumption;
    
    // Consumo de tinta (baseado na área e multiplicador da passada)
    const baseInkConsumption = area * 10; // 10ml por m² como base
    const inkMl = baseInkConsumption * passConfig.inkConsumption;
    const inkCost = inkMl * equipmentConfig.inkCostPerMl;
    
    // Desgaste da cabeça de impressão
    const printHeadWearPercent = (area / equipmentConfig.printHeadLifespan) * passConfig.printHeadWear * 100;
    const printHeadWearCost = (area / equipmentConfig.printHeadLifespan) * 
                              passConfig.printHeadWear * 
                              equipmentConfig.printHeadCost;
    
    const totalCost = equipmentCost + energyCost + inkCost + printHeadWearCost;
    
    const result: PrintJobResult = {
      timeRequired,
      costs: {
        equipment: equipmentCost,
        energy: energyCost,
        ink: inkCost,
        printHeadWear: printHeadWearCost,
        total: totalCost
      },
      consumption: {
        inkMl,
        printHeadWearPercent
      },
      quality: passConfig.quality
    };

    apiLogger.info('Print job calculated', {
      area,
      quality: passConfig.quality,
      timeRequired,
      totalCost,
      inkConsumption: inkMl,
      printHeadWear: printHeadWearPercent
    });

    return result;
  }

  /**
   * Compara diferentes configurações de passada para a mesma área
   */
  static comparePassOptions(
    area: number,
    equipmentConfig: PrintJobCalculation['equipmentConfig']
  ): Record<string, PrintJobResult> {
    const passConfigs = this.getDefaultPassConfigurations();
    const results: Record<string, PrintJobResult> = {};

    for (const [quality, passConfig] of Object.entries(passConfigs)) {
      results[quality] = this.calculatePrintJob({
        area,
        passConfig,
        equipmentConfig
      });
    }

    return results;
  }

  /**
   * Sugere a melhor configuração de passada baseada em critérios
   */
  static suggestBestPass(
    area: number,
    equipmentConfig: PrintJobCalculation['equipmentConfig'],
    criteria: {
      priority: 'cost' | 'speed' | 'quality' | 'balanced';
      maxBudget?: number;
      maxTime?: number; // horas
      minQuality?: 'draft' | 'normal' | 'high' | 'photo';
    }
  ): { recommended: string; reason: string; options: Record<string, PrintJobResult> } {
    const options = this.comparePassOptions(area, equipmentConfig);
    
    // Filtrar opções por restrições
    const filteredOptions = Object.entries(options).filter(([quality, result]) => {
      if (criteria.maxBudget && result.costs.total > criteria.maxBudget) return false;
      if (criteria.maxTime && result.timeRequired > criteria.maxTime) return false;
      if (criteria.minQuality) {
        const qualityOrder = ['draft', 'normal', 'high', 'photo'];
        const minIndex = qualityOrder.indexOf(criteria.minQuality);
        const currentIndex = qualityOrder.indexOf(quality as any);
        if (currentIndex < minIndex) return false;
      }
      return true;
    });

    if (filteredOptions.length === 0) {
      return {
        recommended: 'normal',
        reason: 'Nenhuma opção atende aos critérios especificados. Usando qualidade normal.',
        options
      };
    }

    let recommended = 'normal';
    let reason = '';

    switch (criteria.priority) {
      case 'cost':
        const cheapest = filteredOptions.reduce((min, [quality, result]) => 
          result.costs.total < min[1].costs.total ? [quality, result] : min
        );
        recommended = cheapest[0];
        reason = `Opção mais econômica: R$ ${cheapest[1].costs.total.toFixed(2)}`;
        break;

      case 'speed':
        const fastest = filteredOptions.reduce((min, [quality, result]) => 
          result.timeRequired < min[1].timeRequired ? [quality, result] : min
        );
        recommended = fastest[0];
        reason = `Opção mais rápida: ${fastest[1].timeRequired.toFixed(2)} horas`;
        break;

      case 'quality':
        const qualityOrder = ['draft', 'normal', 'high', 'photo'];
        const highestQuality = filteredOptions.reduce((max, [quality, result]) => {
          const currentIndex = qualityOrder.indexOf(quality as any);
          const maxIndex = qualityOrder.indexOf(max[0] as any);
          return currentIndex > maxIndex ? [quality, result] : max;
        });
        recommended = highestQuality[0];
        reason = `Melhor qualidade disponível: ${highestQuality[0]}`;
        break;

      case 'balanced':
        // Algoritmo de pontuação balanceada
        const scored = filteredOptions.map(([quality, result]) => {
          const costScore = 1 / result.costs.total; // menor custo = maior pontuação
          const speedScore = 1 / result.timeRequired; // menor tempo = maior pontuação
          const qualityScore = qualityOrder.indexOf(quality as any) + 1; // maior índice = maior pontuação
          
          const totalScore = (costScore * 0.4) + (speedScore * 0.3) + (qualityScore * 0.3);
          return { quality, result, score: totalScore };
        });
        
        const best = scored.reduce((max, current) => 
          current.score > max.score ? current : max
        );
        recommended = best.quality;
        reason = `Melhor equilíbrio custo/tempo/qualidade (score: ${best.score.toFixed(3)})`;
        break;
    }

    return { recommended, reason, options };
  }

  /**
   * Calcula estimativa de vida útil da cabeça de impressão
   */
  static calculatePrintHeadLifespan(
    currentUsage: number, // m² já impressos
    totalLifespan: number, // m² total que a cabeça suporta
    passUsageHistory: Array<{
      area: number;
      quality: string;
      date: Date;
    }>
  ): {
    remainingLifespan: number; // m²
    estimatedDaysRemaining: number;
    wearRate: number; // desgaste por dia
    replacementDate: Date;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  } {
    const remainingLifespan = Math.max(0, totalLifespan - currentUsage);
    const usagePercentage = (currentUsage / totalLifespan) * 100;
    
    // Calcular taxa de desgaste baseada no histórico
    const recentUsage = passUsageHistory.filter(usage => {
      const daysDiff = (Date.now() - usage.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30; // últimos 30 dias
    });
    
    const totalRecentArea = recentUsage.reduce((sum, usage) => sum + usage.area, 0);
    const wearRate = totalRecentArea / 30; // m² por dia
    
    const estimatedDaysRemaining = wearRate > 0 ? remainingLifespan / wearRate : Infinity;
    const replacementDate = new Date(Date.now() + (estimatedDaysRemaining * 24 * 60 * 60 * 1000));
    
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (usagePercentage >= 95) urgency = 'critical';
    else if (usagePercentage >= 85) urgency = 'high';
    else if (usagePercentage >= 70) urgency = 'medium';

    return {
      remainingLifespan,
      estimatedDaysRemaining: Math.round(estimatedDaysRemaining),
      wearRate,
      replacementDate,
      urgency
    };
  }
}