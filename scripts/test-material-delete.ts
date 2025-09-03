import { prisma } from '@repo/database/client';

async function testMaterialDelete() {
  try {
    console.log('🔍 Verificando materiais no banco...');
    
    // Listar todos os materiais (incluindo inativos)
    const allMaterials = await prisma.material.findMany({
      select: { id: true, name: true, active: true }
    });
    
    console.log('📊 Todos os materiais:', allMaterials);
    
    // Listar apenas materiais ativos 
    const activeMaterials = await prisma.material.findMany({
      where: { active: true },
      select: { id: true, name: true, active: true }
    });
    
    console.log('✅ Materiais ativos:', activeMaterials);
    
    // Se tiver algum material, testar o "delete" (soft delete)
    if (allMaterials.length > 0) {
      const materialToDelete = allMaterials[0];
      console.log(`🗑️ Testando delete do material: ${materialToDelete.name}`);
      
      // Soft delete (setar active = false)
      await prisma.material.update({
        where: { id: materialToDelete.id },
        data: { active: false }
      });
      
      console.log('✅ Material marcado como inativo');
      
      // Verificar se ainda aparece na lista ativa
      const activeAfterDelete = await prisma.material.findMany({
        where: { active: true },
        select: { id: true, name: true, active: true }
      });
      
      console.log('📋 Materiais ativos após delete:', activeAfterDelete);
      
      // Restaurar o material para continuar testando
      await prisma.material.update({
        where: { id: materialToDelete.id },
        data: { active: true }
      });
      
      console.log('🔄 Material restaurado para active: true');
    } else {
      console.log('ℹ️ Nenhum material encontrado no banco');
    }
    
    console.log('✨ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMaterialDelete();