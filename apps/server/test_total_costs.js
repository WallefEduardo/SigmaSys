import 'dotenv/config'
import prisma from './prisma/index.js'

async function test() {
  console.log('🔍 Testando novo sistema de custos totais...')
  
  // Buscar equipamento com passada padrão
  const equipment = await prisma.equipment.findFirst({
    where: { 
      active: true,
      passes: { not: null },
      defaultPassKey: { not: null }
    },
    select: { 
      id: true, 
      name: true, 
      defaultPassKey: true,
      passes: true
    }
  })

  console.log('📋 Equipamento encontrado:', equipment ? 'SIM' : 'NÃO')
  
  if (equipment) {
    console.log('🎯 Dados do equipamento:', {
      id: equipment.id,
      name: equipment.name,
      defaultPassKey: equipment.defaultPassKey,
      passesCount: equipment.passes ? Object.keys(equipment.passes).length : 0
    })

    // Testar o novo endpoint
    try {
      const { EquipmentCostCalculator } = await import('./src/lib/equipment-cost-calculator.js')
      const calculator = new EquipmentCostCalculator(prisma)
      
      const totalCostData = await calculator.getCostForProductCalculation(equipment.id)
      
      console.log('💰 Resultado do cálculo de custo total:')
      console.log('- Custo fixo por m²:', totalCostData.fixedCostPerM2)
      console.log('- Dados da passada padrão:', totalCostData.passCost ? {
        passKey: totalCostData.passCost.passKey,
        passName: totalCostData.passCost.passName,
        totalCostPerM2: totalCostData.passCost.totalCostPerM2,
        isDefaultPass: totalCostData.passCost.isDefaultPass
      } : 'Nenhuma')
      
      if (totalCostData.passCost) {
        console.log('✅ SUCESSO! Custo total calculado: R$', totalCostData.passCost.totalCostPerM2.toFixed(4), '/m²')
      } else {
        console.log('⚠️ Passada padrão não encontrada')
      }
      
    } catch (error) {
      console.error('❌ Erro no cálculo:', error.message)
    }
  } else {
    console.log('⚠️ Nenhum equipamento com passada padrão encontrado')
  }
  
  await prisma.$disconnect()
}

test().catch(console.error)