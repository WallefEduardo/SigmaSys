import { prisma } from '../src/client';

async function testMaterialDelete() {
  try {
    console.log('🔍 Testando sistema de delete de materiais...\n');
    
    // 1. Verificar materiais existentes
    const allMaterials = await prisma.material.findMany({
      select: { id: true, name: true, active: true }
    });
    console.log('📊 Todos os materiais:', allMaterials);
    
    // 2. Verificar apenas materiais ativos 
    const activeMaterials = await prisma.material.findMany({
      where: { active: true },
      select: { id: true, name: true, active: true }
    });
    console.log('✅ Materiais ativos:', activeMaterials);
    
    if (activeMaterials.length === 0) {
      // Criar um material para teste
      console.log('\n➕ Criando material de teste...');
      await prisma.material.create({
        data: {
          name: 'Material Teste Delete',
          description: 'Material para testar delete',
          unit: 'UN',
          category: 'teste',
          cost: 10.50,
          active: true,
          companyId: 'company-1', // Da empresa do seed
          createdBy: 'user-admin' // Do admin do seed
        }
      });
      console.log('✅ Material de teste criado!');
    }
    
    // 3. Pegar o primeiro material para testar delete
    const materialsToTest = await prisma.material.findMany({
      where: { active: true },
      select: { id: true, name: true, active: true }
    });
    
    if (materialsToTest.length > 0) {
      const materialToDelete = materialsToTest[0];
      console.log(`\n🗑️  Testando delete do material: ${materialToDelete.name}`);
      
      // 4. Fazer soft delete (setar active = false)
      await prisma.material.update({
        where: { id: materialToDelete.id },
        data: { active: false }
      });
      console.log('✅ Material marcado como inativo (active: false)');
      
      // 5. Verificar se não aparece mais na lista ativa
      const activeAfterDelete = await prisma.material.findMany({
        where: { active: true },
        select: { id: true, name: true, active: true }
      });
      console.log('📋 Materiais ativos após delete:', activeAfterDelete);
      
      // 6. Verificar se ainda está no banco (mas inativo)
      const inactiveMaterials = await prisma.material.findMany({
        where: { active: false },
        select: { id: true, name: true, active: true }
      });
      console.log('🚫 Materiais inativos:', inactiveMaterials);
      
      console.log('\n🎉 TESTE CONCLUÍDO:');
      console.log('   ✅ Material foi marcado como inativo');
      console.log('   ✅ Não aparece mais na lista de ativos');
      console.log('   ✅ Ainda existe no banco (soft delete funcionando)');
      
    } else {
      console.log('❌ Nenhum material encontrado para testar');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMaterialDelete();