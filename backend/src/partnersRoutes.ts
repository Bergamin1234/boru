import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { readJsonStorageFile, writeJsonStorageFile } from './utils/sharedHelpers';

export interface PartnerItem {
  id: string;
  nome: string;
  categoria: 'EMPREENDIMENTO_ALUNO' | 'PATROCINADOR_FELIPE' | 'PARCEIRO_OFICIAL' | 'APOIADOR_EVENTO';
  descricao: string;
  beneficioAlunos?: string;
  alunoVinculadoNome?: string;
  logoUrl: string;
  bannerUrl?: string;
  linkDestino: string;
  tipoLink: 'INSTAGRAM' | 'WHATSAPP' | 'SITE';
  contatoTexto?: string;
  destaqueHome: boolean;
  ordem: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  ativo: boolean;
  cliquesCount: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface GoogleAdsConfig {
  enabled: boolean;
  clientId: string;
  slots: {
    homeHorizontalSlot: string;
    parceirosPageSlot: string;
    portalAlunoSlot: string;
  };
  showPlaceholderWhenEmpty: boolean;
  updatedAt?: string;
}

interface PartnersStoragePayload {
  partners: PartnerItem[];
  adsConfig: GoogleAdsConfig;
}

const DATA_DIR = path.join(__dirname, '../data');
const PARTNERS_FILE = path.join(DATA_DIR, 'parceiros_patrocinadores.json');

const DEFAULT_PARTNERS: PartnerItem[] = [
  {
    id: 'parceiro-wellhub-oficial',
    nome: 'Wellhub (Gympass) & TotalPass',
    categoria: 'PARCEIRO_OFICIAL',
    descricao: 'Convênio corporativo oficial aceito no BORÜ Centro de Combate. Faça check-in diário e treine Muay Thai em estrutura 100% climatizada.',
    beneficioAlunos: 'Check-in liberado em todos os horários compatíveis com seu plano corporativo',
    logoUrl: '/logo-boru.jpg',
    bannerUrl: '/ct-boru-estrutura.jpg',
    linkDestino: 'https://wa.me/556992384491?text=Ol%C3%A1!%20Gostaria%20de%20saber%20como%20treinar%20no%20CT%20BOR%C3%9C%20usando%20Wellhub%20ou%20TotalPass.',
    tipoLink: 'WHATSAPP',
    contatoTexto: 'Atendimento Recepção CT Borü',
    destaqueHome: true,
    ordem: 1,
    dataInicio: null,
    dataFim: null,
    ativo: true,
    cliquesCount: 0,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'patrocinador-felipe-boru',
    nome: 'Espaço Patrocinador Oficial — Mestre Felipe Borü',
    categoria: 'PATROCINADOR_FELIPE',
    descricao: 'Associe sua marca à preparação de alto rendimento, campeonatos e eventos oficiais do Mestre Felipe Borü em Porto Velho - RO.',
    beneficioAlunos: 'Visibilidade no tatame, uniformes de competição e vitrine digital do CT',
    logoUrl: '/logo-boru.jpg',
    bannerUrl: '/equipe-boru-hero.jpg',
    linkDestino: 'https://wa.me/556992384491?text=Ol%C3%A1!%20Tenho%20interesse%20em%20ser%20Patrocinador%20do%20Mestre%20Felipe%20Bor%C3%BC%20e%20do%20CT.',
    tipoLink: 'WHATSAPP',
    contatoTexto: '(69) 99238-4491',
    destaqueHome: true,
    ordem: 2,
    dataInicio: null,
    dataFim: null,
    ativo: true,
    cliquesCount: 0,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'empreendimento-aluno-vitrine',
    nome: 'Vitrine Empreendimento de Aluno Borü',
    categoria: 'EMPREENDIMENTO_ALUNO',
    descricao: 'É aluno do CT BORÜ e tem uma empresa, clínica, loja ou prestação de serviço? Divulgue seu negócio para toda a nossa comunidade de guerreiros!',
    beneficioAlunos: 'Condição especial de divulgação para alunos ativos do CT Borü',
    alunoVinculadoNome: 'Comunidade de Alunos Nak Muay Borü',
    logoUrl: '/logo-boru.jpg',
    bannerUrl: '/galeria-mestre-aluno.jpg',
    linkDestino: 'https://wa.me/556992384491?text=Ol%C3%A1!%20Sou%20aluno%20do%20CT%20BOR%C3%9C%20e%20quero%20divulgar%20meu%20empreendimento%20na%20Vitrine%20de%20Parceiros.',
    tipoLink: 'WHATSAPP',
    contatoTexto: '@borucentrodecombate',
    destaqueHome: true,
    ordem: 3,
    dataInicio: null,
    dataFim: null,
    ativo: true,
    cliquesCount: 0,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
];

const DEFAULT_ADS_CONFIG: GoogleAdsConfig = {
  enabled: false,
  clientId: '',
  slots: {
    homeHorizontalSlot: '',
    parceirosPageSlot: '',
    portalAlunoSlot: '',
  },
  showPlaceholderWhenEmpty: false,
  updatedAt: new Date().toISOString(),
};

function loadPartnersStorage(): PartnersStoragePayload {
  const raw = readJsonStorageFile<Partial<PartnersStoragePayload>>(PARTNERS_FILE, {
    partners: DEFAULT_PARTNERS,
    adsConfig: DEFAULT_ADS_CONFIG,
  });

  const partners = Array.isArray(raw.partners) ? raw.partners : DEFAULT_PARTNERS;
  const adsConfig: GoogleAdsConfig = {
    ...DEFAULT_ADS_CONFIG,
    ...(raw.adsConfig || {}),
    slots: {
      ...DEFAULT_ADS_CONFIG.slots,
      ...(raw.adsConfig?.slots || {}),
    },
  };

  return { partners, adsConfig };
}

function savePartnersStorage(payload: PartnersStoragePayload): void {
  writeJsonStorageFile(PARTNERS_FILE, payload);
}

export function isPartnerCurrentlyActive(partner: PartnerItem, now = new Date()): boolean {
  if (!partner.ativo) return false;
  const todayStr = now.toISOString().split('T')[0];

  if (partner.dataInicio) {
    const startStr = String(partner.dataInicio).split('T')[0];
    if (startStr > todayStr) return false;
  }
  if (partner.dataFim) {
    const endStr = String(partner.dataFim).split('T')[0];
    if (endStr < todayStr) return false;
  }
  return true;
}

export function registerPartnersRoutes(app: Express, _prisma?: PrismaClient) {
  // 1. Endpoint Público: Lista parceiros ativos dentro do período de exibição + configuração Google Ads
  app.get('/api/parceiros', (_req: Request, res: Response) => {
    try {
      const store = loadPartnersStorage();
      const now = new Date();
      const ativos = store.partners
        .filter((p) => isPartnerCurrentlyActive(p, now))
        .sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));

      res.json({
        parceiros: ativos,
        adsConfig: store.adsConfig,
      });
    } catch (error) {
      console.error('Erro ao listar parceiros públicos:', error);
      res.status(500).json({ erro: 'Erro ao carregar parceiros.' });
    }
  });

  // 2. Endpoint Público: Contabilizar clique em anúncio/parceiro
  app.post('/api/parceiros/:id/clique', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const store = loadPartnersStorage();
      const index = store.partners.findIndex((p) => p.id === id);
      if (index === -1) {
        return res.status(404).json({ erro: 'Parceiro não encontrado.' });
      }
      store.partners[index].cliquesCount = (store.partners[index].cliquesCount || 0) + 1;
      savePartnersStorage(store);
      res.json({ ok: true, cliquesCount: store.partners[index].cliquesCount });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao registrar clique.' });
    }
  });

  // 3. Endpoint Admin: Listar todos os parceiros (ativos, inativos, agendados e expirados) + adsConfig
  app.get('/api/admin/parceiros', (_req: Request, res: Response) => {
    try {
      const store = loadPartnersStorage();
      const sorted = [...store.partners].sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));
      res.json({
        parceiros: sorted,
        adsConfig: store.adsConfig,
      });
    } catch (error) {
      console.error('Erro ao listar parceiros no admin:', error);
      res.status(500).json({ erro: 'Erro ao carregar parceiros no painel.' });
    }
  });

  // 4. Endpoint Admin: Criar novo parceiro/patrocinador
  app.post('/api/admin/parceiros', (req: Request, res: Response) => {
    try {
      const {
        nome,
        categoria = 'PARCEIRO_OFICIAL',
        descricao = '',
        beneficioAlunos = '',
        alunoVinculadoNome = '',
        logoUrl = '/logo-boru.jpg',
        bannerUrl = '',
        linkDestino = '',
        tipoLink = 'INSTAGRAM',
        contatoTexto = '',
        destaqueHome = true,
        ordem,
        dataInicio = null,
        dataFim = null,
        ativo = true,
      } = req.body || {};

      if (!nome || !String(nome).trim()) {
        return res.status(400).json({ erro: 'Informe o nome do parceiro ou patrocinador.' });
      }

      const store = loadPartnersStorage();
      const nextOrder =
        ordem !== undefined && ordem !== null && !Number.isNaN(Number(ordem))
          ? Number(ordem)
          : store.partners.length + 1;

      const novo: PartnerItem = {
        id: `partner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nome: String(nome).trim(),
        categoria,
        descricao: String(descricao || '').trim(),
        beneficioAlunos: beneficioAlunos ? String(beneficioAlunos).trim() : '',
        alunoVinculadoNome: alunoVinculadoNome ? String(alunoVinculadoNome).trim() : '',
        logoUrl: logoUrl && String(logoUrl).trim() ? String(logoUrl).trim() : '/logo-boru.jpg',
        bannerUrl: bannerUrl ? String(bannerUrl).trim() : '',
        linkDestino: linkDestino ? String(linkDestino).trim() : 'https://instagram.com/borucentrodecombate',
        tipoLink,
        contatoTexto: contatoTexto ? String(contatoTexto).trim() : '',
        destaqueHome: Boolean(destaqueHome),
        ordem: nextOrder,
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
        ativo: Boolean(ativo),
        cliquesCount: 0,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      store.partners.push(novo);
      savePartnersStorage(store);

      res.status(201).json({ parceiro: novo });
    } catch (error) {
      console.error('Erro ao criar parceiro:', error);
      res.status(500).json({ erro: 'Erro ao cadastrar parceiro.' });
    }
  });

  // 5. Endpoint Admin: Atualizar parceiro (dados, ordem, categoria, vigência ou ativar/desativar)
  app.patch('/api/admin/parceiros/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const store = loadPartnersStorage();
      const idx = store.partners.findIndex((p) => p.id === id);

      if (idx === -1) {
        return res.status(404).json({ erro: 'Parceiro não encontrado.' });
      }

      const atual = store.partners[idx];
      const body = req.body || {};

      const atualizado: PartnerItem = {
        ...atual,
        nome: body.nome !== undefined ? String(body.nome).trim() : atual.nome,
        categoria: body.categoria !== undefined ? body.categoria : atual.categoria,
        descricao: body.descricao !== undefined ? String(body.descricao).trim() : atual.descricao,
        beneficioAlunos:
          body.beneficioAlunos !== undefined ? String(body.beneficioAlunos || '').trim() : atual.beneficioAlunos,
        alunoVinculadoNome:
          body.alunoVinculadoNome !== undefined
            ? String(body.alunoVinculadoNome || '').trim()
            : atual.alunoVinculadoNome,
        logoUrl: body.logoUrl !== undefined && String(body.logoUrl).trim() ? String(body.logoUrl).trim() : atual.logoUrl,
        bannerUrl: body.bannerUrl !== undefined ? String(body.bannerUrl || '').trim() : atual.bannerUrl,
        linkDestino: body.linkDestino !== undefined ? String(body.linkDestino).trim() : atual.linkDestino,
        tipoLink: body.tipoLink !== undefined ? body.tipoLink : atual.tipoLink,
        contatoTexto: body.contatoTexto !== undefined ? String(body.contatoTexto || '').trim() : atual.contatoTexto,
        destaqueHome: body.destaqueHome !== undefined ? Boolean(body.destaqueHome) : atual.destaqueHome,
        ordem:
          body.ordem !== undefined && !Number.isNaN(Number(body.ordem)) ? Number(body.ordem) : atual.ordem,
        dataInicio: body.dataInicio !== undefined ? body.dataInicio || null : atual.dataInicio,
        dataFim: body.dataFim !== undefined ? body.dataFim || null : atual.dataFim,
        ativo: body.ativo !== undefined ? Boolean(body.ativo) : atual.ativo,
        atualizadoEm: new Date().toISOString(),
      };

      store.partners[idx] = atualizado;
      savePartnersStorage(store);

      res.json({ parceiro: atualizado });
    } catch (error) {
      console.error('Erro ao atualizar parceiro:', error);
      res.status(500).json({ erro: 'Erro ao atualizar parceiro.' });
    }
  });

  // 6. Endpoint Admin: Excluir parceiro
  app.delete('/api/admin/parceiros/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const store = loadPartnersStorage();
      const filtered = store.partners.filter((p) => p.id !== id);
      if (filtered.length === store.partners.length) {
        return res.status(404).json({ erro: 'Parceiro não encontrado.' });
      }
      store.partners = filtered;
      savePartnersStorage(store);
      res.json({ ok: true });
    } catch (error) {
      console.error('Erro ao remover parceiro:', error);
      res.status(500).json({ erro: 'Erro ao remover parceiro.' });
    }
  });

  // 7. Endpoint Admin: Salvar configuração do Google AdSense
  app.put('/api/admin/parceiros/ads-config', (req: Request, res: Response) => {
    try {
      const store = loadPartnersStorage();
      const body = req.body || {};

      store.adsConfig = {
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : store.adsConfig.enabled,
        clientId: body.clientId !== undefined ? String(body.clientId || '').trim() : store.adsConfig.clientId,
        slots: {
          homeHorizontalSlot:
            body.slots?.homeHorizontalSlot !== undefined
              ? String(body.slots.homeHorizontalSlot || '').trim()
              : store.adsConfig.slots.homeHorizontalSlot,
          parceirosPageSlot:
            body.slots?.parceirosPageSlot !== undefined
              ? String(body.slots.parceirosPageSlot || '').trim()
              : store.adsConfig.slots.parceirosPageSlot,
          portalAlunoSlot:
            body.slots?.portalAlunoSlot !== undefined
              ? String(body.slots.portalAlunoSlot || '').trim()
              : store.adsConfig.slots.portalAlunoSlot,
        },
        showPlaceholderWhenEmpty:
          body.showPlaceholderWhenEmpty !== undefined
            ? Boolean(body.showPlaceholderWhenEmpty)
            : store.adsConfig.showPlaceholderWhenEmpty,
        updatedAt: new Date().toISOString(),
      };

      savePartnersStorage(store);
      res.json({ adsConfig: store.adsConfig });
    } catch (error) {
      console.error('Erro ao salvar Google Ads config:', error);
      res.status(500).json({ erro: 'Erro ao salvar configuração do Google Ads.' });
    }
  });
}
