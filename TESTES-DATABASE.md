# 📋 Documentação - Testes de Database

## 🚀 Como rodar scripts de teste

### Comando base:
```bash
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/erp_system" node_modules/.pnpm/node_modules/.bin/tsx scripts/seu-script.ts
```

### Alternativa (mais fácil):
1. Criar `.env` na raiz:
```bash
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/erp_system"
```

2. Rodar script:
```bash
node_modules/.pnpm/node_modules/.bin/tsx scripts/seu-script.ts
```

## 📁 Estrutura para scripts

### Import do database:
```typescript
import { prisma } from '@repo/database/client';
```

### Template básico:
```typescript
import { prisma } from '@repo/database/client';

async function meuTeste() {
  try {
    // Seu código aqui
    const dados = await prisma.material.findMany();
    console.log(dados);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

meuTeste();
```

## 🛠️ Comandos úteis

```bash
# Seed database
pnpm db:seed

# Prisma Studio
pnpm db:studio

# Reset database
pnpm db:push --force-reset

# Generate Prisma client
pnpm db:generate

# Start PostgreSQL
pnpm db:start

# Stop PostgreSQL
pnpm db:stop
```

## 📝 Exemplo de teste completo

```typescript
import { prisma } from '@repo/database/client';

async function testMaterials() {
  try {
    console.log('🔍 Testando materiais...');
    
    // Criar material
    const newMaterial = await prisma.material.create({
      data: {
        name: 'Material Teste',
        unit: 'UN',
        cost: 10.50,
        active: true,
        companyId: 'company-1',
        createdBy: 'user-admin'
      }
    });
    
    console.log('✅ Material criado:', newMaterial.name);
    
    // Soft delete
    await prisma.material.update({
      where: { id: newMaterial.id },
      data: { active: false }
    });
    
    console.log('🗑️ Material deletado (soft delete)');
    
    // Verificar se não aparece na lista ativa
    const activeMaterials = await prisma.material.findMany({
      where: { active: true }
    });
    
    console.log('📋 Materiais ativos:', activeMaterials.length);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMaterials();
```

**Pronto! Com isso você testa qualquer coisa no banco.**