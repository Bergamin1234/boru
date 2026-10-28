import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando Seed/Migrate RBAC (Módulo 1)...');

  // 1. AdminDev / BrgAdmin (Ítalo Bergamin) com is_dev = true
  const brgAdmin = await prisma.usuario.upsert({
    where: { email: 'brgadmin@boru.com' },
    update: {
      nome: 'Ítalo Bergamin (BrgAdmin)',
      senha: 'BoruCentroDeCombate98490@!',
      cargo: 'ADMIN',
      is_dev: true,
      ativo: true,
      prajied: 'Prajied Preto',
      prajied_faixa: 'Prajied Preto'
    },
    create: {
      nome: 'Ítalo Bergamin (BrgAdmin)',
      email: 'brgadmin@boru.com',
      senha: 'BoruCentroDeCombate98490@!',
      cargo: 'ADMIN',
      is_dev: true,
      telefone: '(69) 99238-4491',
      prajied: 'Prajied Preto',
      prajied_faixa: 'Prajied Preto',
      ativo: true
    }
  });
  console.log('AdminDev configurado:', brgAdmin.nome, '| is_dev:', brgAdmin.is_dev);

  // 2. Admin Geral: Amanda Alencar Moreira (CPF: 00542041278, Senha provisória: @Felipe.01)
  const amandaExistente = await prisma.usuario.findFirst({
    where: {
      OR: [
        { cpf: '00542041278' },
        { email: 'amanda@boru.com' }
      ]
    }
  });

  if (amandaExistente) {
    const amanda = await prisma.usuario.update({
      where: { id: amandaExistente.id },
      data: {
        nome: 'Amanda Alencar Moreira',
        cpf: '00542041278',
        email: 'amanda@boru.com',
        senha: '@Felipe.01',
        cargo: 'ADMIN',
        is_dev: false,
        ativo: true
      }
    });
    console.log('Admin Geral (Amanda) atualizada:', amanda.nome, '| CPF:', amanda.cpf);
  } else {
    const amanda = await prisma.usuario.create({
      data: {
        nome: 'Amanda Alencar Moreira',
        cpf: '00542041278',
        email: 'amanda@boru.com',
        senha: '@Felipe.01',
        cargo: 'ADMIN',
        is_dev: false,
        modalidade: 'Administração Geral',
        graduacao: 'Gestão Operacional & Financeira',
        prajied: 'Gestão Operacional & Financeira',
        prajied_faixa: 'Gestão Operacional & Financeira',
        ativo: true
      }
    });
    console.log('Admin Geral (Amanda) criada:', amanda.nome, '| CPF:', amanda.cpf);
  }

  // 3. Garantir que Felipe Borü também tenha acesso como Admin Geral / Professor Mestre
  const felipe = await prisma.usuario.findFirst({
    where: {
      OR: [
        { email: 'felipe@boru.com' },
        { nome: { contains: 'Felipe', mode: 'insensitive' } }
      ]
    }
  });
  if (felipe) {
    await prisma.usuario.update({
      where: { id: felipe.id },
      data: {
        cargo: 'ADMIN',
        horarios_aula: felipe.horariosAula || 'Seg a Sex: 06h, 07h, 16h, 17h15, 18h30, 19h30, 20h30',
        prajied_faixa: felipe.prajied || 'Prajied Preto (Mestre)'
      }
    });
    console.log('Felipe Borü atualizado como Admin Geral & Professor.');
  }

  // 4. Criar logs iniciais para o Dev Dashboard
  const logCount = await prisma.systemLog.count();
  if (logCount === 0) {
    await prisma.systemLog.createMany({
      data: [
        {
          level: 'INFO',
          service: 'RBAC_SEED',
          message: 'Hierarquia RBAC inicializada: AdminDev (Ítalo Bergamin), Admin Geral (Amanda Alencar Moreira & Felipe Borü).',
          metadata: JSON.stringify({ amandaCpf: '00542041278', brgAdminDev: true })
        },
        {
          level: 'INFO',
          service: 'STORAGE_ENGINE',
          message: 'Motor de Storage Local / Base64 DataURI habilitado para fotos de professores e badges de gamificação.',
          metadata: JSON.stringify({ endpoint: '/api/upload', maxFileSizeMB: 8 })
        },
        {
          level: 'WEBHOOK',
          service: 'WHATSAPP_AUTOMATION',
          message: 'Serviço de automação de WhatsApp para Aulas Experimentais configurado e operacional.',
          metadata: JSON.stringify({ template: 'BORÜ CENTRO DE COMBATE - Rua Doutor Agenor de Carvalho, n° 1168' })
        }
      ]
    });
  }

  console.log('Seed RBAC finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed RBAC:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
