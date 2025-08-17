import { config } from 'dotenv'
import { PrismaClient } from '../generated/client'
import { AuthService } from '../../src/lib/auth'

// Carregar variáveis de ambiente
config()

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seeds...')

  // 1. Criar empresa modelo
  const company = await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      name: 'Empresa Teste Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'contato@empresateste.com',
      phone: '(11) 98765-4321',
      address: 'Rua das Empresas, 123 - São Paulo/SP',
      plan: 'premium',
      active: true,
    },
  })

  console.log('✅ Empresa criada:', company.name)

  // 2. Criar Super Admin (acesso a todas as empresas)
  const superAdminPassword = await AuthService.hashPassword('admin123')
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@erpsys.com' },
    update: {},
    create: {
      id: 'user-superadmin',
      name: 'Super Administrador',
      email: 'superadmin@erpsys.com',
      password: superAdminPassword,
      role: 'SUPERADMIN',
      active: true,
      companyId: company.id,
    },
  })

  console.log('✅ Super Admin criado:', superAdmin.email)

  // 3. Criar Admin da empresa teste
  const adminPassword = await AuthService.hashPassword('123456')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@empresateste.com' },
    update: {},
    create: {
      id: 'user-admin',
      name: 'Administrador Teste',
      email: 'admin@empresateste.com',
      password: adminPassword,
      role: 'ADMIN',
      department: 'Administração',
      position: 'Administrador',
      phone: '(11) 99999-0001',
      active: true,
      companyId: company.id,
    },
  })

  console.log('✅ Admin criado:', admin.email)

  // 4. Criar usuário gerente
  const managerPassword = await AuthService.hashPassword('123456')
  const manager = await prisma.user.upsert({
    where: { email: 'gerente@empresateste.com' },
    update: {},
    create: {
      id: 'user-manager',
      name: 'Maria Santos',
      email: 'gerente@empresateste.com',
      password: managerPassword,
      role: 'MANAGER',
      department: 'Comercial',
      position: 'Gerente Comercial',
      phone: '(11) 99999-0002',
      active: true,
      companyId: company.id,
      createdBy: admin.id,
    },
  })

  console.log('✅ Gerente criado:', manager.email)

  // 5. Criar usuário comum
  const userPassword = await AuthService.hashPassword('123456')
  const user = await prisma.user.upsert({
    where: { email: 'usuario@empresateste.com' },
    update: {},
    create: {
      id: 'user-common',
      name: 'João Silva',
      email: 'usuario@empresateste.com',
      password: userPassword,
      role: 'USER',
      department: 'Atendimento',
      position: 'Atendente',
      phone: '(11) 99999-0003',
      active: true,
      companyId: company.id,
      createdBy: admin.id,
    },
  })

  console.log('✅ Usuário criado:', user.email)

  // 6. Criar alguns clientes de exemplo
  const clients = [
    {
      id: 'client-1',
      name: 'João da Silva Transportes',
      email: 'joao@transportes.com',
      phone: '(11) 98765-4321',
      document: '12.345.678/0001-90',
      type: 'COMPANY' as const,
      address: JSON.stringify({
        street: 'Rua dos Transportes, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000'
      }),
      segment: 'Transporte e Logística',
      tags: ['vip', 'recorrente'],
      active: true,
      companyId: company.id,
      createdBy: admin.id,
    },
    {
      id: 'client-2',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      phone: '(11) 91234-5678',
      document: '123.456.789-00',
      type: 'PERSON' as const,
      segment: 'Pessoa Física',
      tags: ['novo'],
      active: true,
      companyId: company.id,
      createdBy: manager.id,
    },
    {
      id: 'client-3',
      name: 'Restaurante Bella Vista',
      email: 'contato@bellavista.com',
      phone: '(11) 95555-1234',
      document: '98.765.432/0001-10',
      type: 'COMPANY' as const,
      address: JSON.stringify({
        street: 'Avenida Principal, 456',
        neighborhood: 'Vila Madalena',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '05433-000'
      }),
      segment: 'Alimentação',
      tags: ['sazonal'],
      active: true,
      companyId: company.id,
      createdBy: manager.id,
    }
  ]

  for (const clientData of clients) {
    const client = await prisma.client.upsert({
      where: { id: clientData.id },
      update: {},
      create: clientData,
    })
    console.log('✅ Cliente criado:', client.name)
  }

  console.log('\n🎉 Seeds executados com sucesso!')
  console.log('\n📋 Credenciais criadas:')
  console.log('Super Admin: superadmin@erpsys.com / admin123')
  console.log('Admin: admin@empresateste.com / 123456')
  console.log('Gerente: gerente@empresateste.com / 123456')
  console.log('Usuário: usuario@empresateste.com / 123456')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seeds:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })