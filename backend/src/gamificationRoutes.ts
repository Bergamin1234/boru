import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  ensureGamificationSeeded,
  evaluateStudentGamification,
} from './gamificationService';

export function registerGamificationRoutes(app: Express, prisma: PrismaClient) {
  // Inicializa o seed padrão silenciosamente ao subir o servidor
  ensureGamificationSeeded(prisma).catch((err) =>
    console.error('Erro ao inicializar seed de gamificação:', err)
  );

  // Marcar conquistas recém-desbloqueadas como já notificadas (após exibir modal Level Up!)
  app.post('/api/alunos/:id/gamificacao/notificar', async (req, res) => {
    const { id } = req.params;
    const { achievementIds } = req.body;
    try {
      if (Array.isArray(achievementIds) && achievementIds.length > 0) {
        await prisma.userAchievementProgress.updateMany({
          where: {
            user_id: id,
            achievement_id: { in: achievementIds },
          },
          data: { notified: true },
        });
      } else {
        await prisma.userAchievementProgress.updateMany({
          where: { user_id: id, status: 'completed' },
          data: { notified: true },
        });
      }
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar notificação de conquistas.' });
    }
  });

  // Listar configuração completa de Ranks e Conquistas (Admin / Professor)
  app.get('/api/admin/gamificacao/config', async (_req, res) => {
    try {
      await ensureGamificationSeeded(prisma);
      const ranks = await prisma.gamificationRank.findMany({
        orderBy: { order_index: 'asc' },
      });
      const achievements = await prisma.gamificationAchievement.findMany({
        orderBy: [{ category: 'asc' }, { xp_points: 'asc' }],
      });
      res.json({ ranks, achievements });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao carregar configurações de gamificação.' });
    }
  });

  // Resumo de Gamificação de todos os alunos (Para Chamada Rápida do Professor e Ranking)
  app.get('/api/admin/gamificacao/resumo-alunos', async (_req, res) => {
    try {
      await ensureGamificationSeeded(prisma);
      const ranks = await prisma.gamificationRank.findMany({
        where: { is_active: true },
        orderBy: { order_index: 'asc' },
      });
      const alunos = await prisma.aluno.findMany({
        include: {
          presencas: {
            where: { status: 'PRESENTE' },
            orderBy: { data: 'desc' },
          },
          conquistasProgresso: {
            where: { status: 'completed' },
            include: { achievement: true },
          },
        },
        orderBy: { nome: 'asc' },
      });

      const resumo = alunos.map((aluno) => {
        const totalPresencas = aluno.presencas.length;

        let rankAtual = ranks[0] || null;
        let proximoRank = ranks.length > 1 ? ranks[1] : null;
        for (let i = 0; i < ranks.length; i++) {
          const r = ranks[i];
          const minOk = totalPresencas >= r.required_checkins_min;
          const maxOk =
            r.required_checkins_max === null || totalPresencas <= r.required_checkins_max;
          if (minOk && maxOk) {
            rankAtual = r;
            proximoRank = ranks[i + 1] || null;
            break;
          }
          if (totalPresencas >= r.required_checkins_min && r.required_checkins_max === null) {
            rankAtual = r;
            proximoRank = null;
          }
        }

        const xpConquistas = aluno.conquistasProgresso.reduce(
          (acc, cur) => acc + (cur.achievement?.xp_points || 0),
          0
        );
        const xpTotal = xpConquistas + totalPresencas * 10;

        return {
          alunoId: aluno.id,
          nome: aluno.nome,
          plano: aluno.plano || '2x na semana',
          prajied: aluno.prajied,
          modalidade: aluno.modalidade || 'Muay Thai',
          totalPresencas,
          xpTotal,
          conquistasDesbloqueadas: aluno.conquistasProgresso.length,
          ultimasConquistas: aluno.conquistasProgresso.slice(0, 5).map((cp) => ({
            id: cp.achievement_id,
            title: cp.achievement?.title,
            badge_icon_url: cp.achievement?.badge_icon_url,
          })),
          rankAtual:
            totalPresencas === 0 && ranks[0]
              ? {
                  id: 'aspirante',
                  name: 'Aspirante',
                  badge_icon_url: '🥋',
                  order_index: 0,
                }
              : rankAtual,
          proximoRank,
        };
      });

      res.json(resumo);
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao carregar resumo de gamificação dos alunos.' });
    }
  });

  // Aprovação Rápida do Professor: Validar Check-in Especial ou Conceder Badge Direta
  app.post('/api/admin/gamificacao/aprovar-especial', async (req, res) => {
    const {
      alunoId,
      achievementId,
      registrarCheckinEspecial,
      presencaId,
      shift,
      is_special_event,
      arrived_early,
      adverse_weather,
      accompanied_by_user_id,
      checked_by_teacher_id,
    } = req.body;

    if (!alunoId) {
      return res.status(400).json({ erro: 'Selecione um aluno válido.' });
    }

    try {
      await ensureGamificationSeeded(prisma);

      // 1. Se o professor enviou flags de check-in especial ou quer atualizar uma presença de hoje
      if (registrarCheckinEspecial || presencaId) {
        if (presencaId) {
          await prisma.agendamentoPresenca.update({
            where: { id: presencaId },
            data: {
              status: 'PRESENTE',
              shift: shift || undefined,
              is_special_event: Boolean(is_special_event),
              arrived_early: Boolean(arrived_early),
              adverse_weather: Boolean(adverse_weather),
              accompanied_by_user_id: accompanied_by_user_id || null,
              checked_by_teacher_id: checked_by_teacher_id || null,
            },
          });
        } else {
          // Procura presença de hoje ou cria uma nova confirmada com os atributos especiais
          const hoje = new Date();
          const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
          const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

          const existenteHoje = await prisma.agendamentoPresenca.findFirst({
            where: {
              alunoId,
              data: { gte: inicioDia, lte: fimDia },
            },
          });

          if (existenteHoje) {
            await prisma.agendamentoPresenca.update({
              where: { id: existenteHoje.id },
              data: {
                status: 'PRESENTE',
                shift: shift || existenteHoje.shift || 'NOITE',
                is_special_event: is_special_event !== undefined ? Boolean(is_special_event) : existenteHoje.is_special_event,
                arrived_early: arrived_early !== undefined ? Boolean(arrived_early) : existenteHoje.arrived_early,
                adverse_weather: adverse_weather !== undefined ? Boolean(adverse_weather) : existenteHoje.adverse_weather,
                accompanied_by_user_id: accompanied_by_user_id || existenteHoje.accompanied_by_user_id,
                checked_by_teacher_id: checked_by_teacher_id || existenteHoje.checked_by_teacher_id,
              },
            });
          } else {
            await prisma.agendamentoPresenca.create({
              data: {
                alunoId,
                data: new Date(),
                status: 'PRESENTE',
                shift: shift || 'NOITE',
                is_special_event: Boolean(is_special_event),
                arrived_early: Boolean(arrived_early),
                adverse_weather: Boolean(adverse_weather),
                accompanied_by_user_id: accompanied_by_user_id || null,
                checked_by_teacher_id: checked_by_teacher_id || null,
              },
            });
          }
        }
      }

      // 2. Se o professor selecionou uma Conquista específica para desbloquear/aprovar diretamente
      if (achievementId) {
        const ach = await prisma.gamificationAchievement.findUnique({
          where: { id: achievementId },
        });
        if (ach) {
          let target = 1;
          try {
            const parsed = JSON.parse(ach.trigger_value || '{}');
            target = Number(parsed.target) || 1;
          } catch {
            target = 1;
          }

          await prisma.userAchievementProgress.upsert({
            where: {
              user_id_achievement_id: {
                user_id: alunoId,
                achievement_id: ach.id,
              },
            },
            update: {
              current_progress: target,
              target_progress: target,
              status: 'completed',
              unlocked_at: new Date(),
              notified: false,
            },
            create: {
              user_id: alunoId,
              achievement_id: ach.id,
              current_progress: target,
              target_progress: target,
              status: 'completed',
              unlocked_at: new Date(),
              notified: false,
            },
          });
        }
      }

      const resultado = await evaluateStudentGamification(prisma, alunoId);
      res.json({
        mensagem: 'Aprovação especial registrada e Trilha do Nak Muay atualizada!',
        gamificacao: resultado,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: 'Erro ao aprovar conquista/check-in especial.' });
    }
  });

  // ==========================================
  // CRUD DE RANKS (ADMIN)
  // ==========================================
  app.post('/api/admin/gamificacao/ranks', async (req, res) => {
    const {
      name,
      required_checkins_min,
      required_checkins_max,
      badge_icon_url,
      reward_description,
      order_index,
      is_active,
    } = req.body;

    if (!name || required_checkins_min === undefined) {
      return res.status(400).json({ erro: 'Nome e mínimo de check-ins são obrigatórios.' });
    }

    try {
      const novoRank = await prisma.gamificationRank.create({
        data: {
          name: String(name).trim(),
          required_checkins_min: Number(required_checkins_min) || 1,
          required_checkins_max:
            required_checkins_max === null || required_checkins_max === '' || required_checkins_max === undefined
              ? null
              : Number(required_checkins_max),
          badge_icon_url: badge_icon_url || '🥊',
          reward_description: reward_description || '',
          order_index: Number(order_index) || 1,
          is_active: is_active !== undefined ? Boolean(is_active) : true,
        },
      });
      res.json({ mensagem: 'Rank criado com sucesso!', rank: novoRank });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao criar rank.' });
    }
  });

  app.put('/api/admin/gamificacao/ranks/:id', async (req, res) => {
    const { id } = req.params;
    const {
      name,
      required_checkins_min,
      required_checkins_max,
      badge_icon_url,
      reward_description,
      order_index,
      is_active,
    } = req.body;

    try {
      const rankAtualizado = await prisma.gamificationRank.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: String(name).trim() } : {}),
          ...(required_checkins_min !== undefined
            ? { required_checkins_min: Number(required_checkins_min) }
            : {}),
          ...(required_checkins_max !== undefined
            ? {
                required_checkins_max:
                  required_checkins_max === null || required_checkins_max === ''
                    ? null
                    : Number(required_checkins_max),
              }
            : {}),
          ...(badge_icon_url !== undefined ? { badge_icon_url } : {}),
          ...(reward_description !== undefined ? { reward_description } : {}),
          ...(order_index !== undefined ? { order_index: Number(order_index) } : {}),
          ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
        },
      });
      res.json({ mensagem: 'Rank atualizado com sucesso!', rank: rankAtualizado });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar rank.' });
    }
  });

  app.delete('/api/admin/gamificacao/ranks/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.gamificationRank.delete({ where: { id } });
      res.json({ mensagem: 'Rank removido com sucesso!' });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao excluir rank.' });
    }
  });

  // ==========================================
  // CRUD DE CONQUISTAS / ACHIEVEMENTS (ADMIN)
  // ==========================================
  app.post('/api/admin/gamificacao/conquistas', async (req, res) => {
    const {
      title,
      description,
      category,
      badge_icon_url,
      trigger_type,
      trigger_value,
      xp_points,
      reward_text,
      is_secret,
      is_active,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ erro: 'Título e descrição da conquista são obrigatórios.' });
    }

    try {
      const triggerStr =
        typeof trigger_value === 'string'
          ? trigger_value
          : JSON.stringify(trigger_value || { target: 1 });

      const novaConquista = await prisma.gamificationAchievement.create({
        data: {
          title: String(title).trim(),
          description: String(description).trim(),
          category: category || 'FREQUENCIA',
          badge_icon_url: badge_icon_url || '🏅',
          trigger_type: trigger_type || 'TOTAL_CHECKINS',
          trigger_value: triggerStr,
          xp_points: Number(xp_points) || 100,
          reward_text: reward_text || '+100 XP',
          is_secret: Boolean(is_secret),
          is_active: is_active !== undefined ? Boolean(is_active) : true,
        },
      });
      res.json({ mensagem: 'Conquista criada com sucesso!', achievement: novaConquista });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao criar conquista.' });
    }
  });

  app.put('/api/admin/gamificacao/conquistas/:id', async (req, res) => {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      badge_icon_url,
      trigger_type,
      trigger_value,
      xp_points,
      reward_text,
      is_secret,
      is_active,
    } = req.body;

    try {
      const triggerStr =
        trigger_value !== undefined
          ? typeof trigger_value === 'string'
            ? trigger_value
            : JSON.stringify(trigger_value)
          : undefined;

      const conquistaAtualizada = await prisma.gamificationAchievement.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title: String(title).trim() } : {}),
          ...(description !== undefined ? { description: String(description).trim() } : {}),
          ...(category !== undefined ? { category } : {}),
          ...(badge_icon_url !== undefined ? { badge_icon_url } : {}),
          ...(trigger_type !== undefined ? { trigger_type } : {}),
          ...(triggerStr !== undefined ? { trigger_value: triggerStr } : {}),
          ...(xp_points !== undefined ? { xp_points: Number(xp_points) } : {}),
          ...(reward_text !== undefined ? { reward_text } : {}),
          ...(is_secret !== undefined ? { is_secret: Boolean(is_secret) } : {}),
          ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
        },
      });
      res.json({ mensagem: 'Conquista atualizada com sucesso!', achievement: conquistaAtualizada });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao atualizar conquista.' });
    }
  });

  app.delete('/api/admin/gamificacao/conquistas/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.gamificationAchievement.delete({ where: { id } });
      res.json({ mensagem: 'Conquista removida com sucesso!' });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao remover conquista.' });
    }
  });

  // Resetar para o Template Padrão ("Trilha do Nak Muay" - 6 Ranks e 30 Conquistas)
  app.post('/api/admin/gamificacao/reset-padrao', async (_req, res) => {
    try {
      await ensureGamificationSeeded(prisma, true);
      const ranks = await prisma.gamificationRank.findMany({
        orderBy: { order_index: 'asc' },
      });
      const achievements = await prisma.gamificationAchievement.findMany({
        orderBy: [{ category: 'asc' }, { xp_points: 'asc' }],
      });
      res.json({
        mensagem: 'Trilha do Nak Muay restaurada para o padrão original (6 Ranks e 30 Conquistas)!',
        ranks,
        achievements,
      });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao restaurar padrão de gamificação.' });
    }
  });

  // Exportar Configuração Completa em JSON (Para replicação em outras academias / Combat-Hub)
  app.get('/api/admin/gamificacao/export-json', async (_req, res) => {
    try {
      await ensureGamificationSeeded(prisma);
      const ranks = await prisma.gamificationRank.findMany({
        orderBy: { order_index: 'asc' },
      });
      const achievements = await prisma.gamificationAchievement.findMany({
        orderBy: { criadoEm: 'asc' },
      });
      res.json({
        module: 'Trilha do Nak Muay - Gamification Engine',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        ranks,
        achievements,
      });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao exportar configuração JSON.' });
    }
  });
}
