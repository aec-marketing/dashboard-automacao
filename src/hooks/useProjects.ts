import { useCallback, useEffect, useRef, useState } from 'react';
import { getProjects, refreshData } from '../services/api';
import type { Project } from '../types';

const AUTO_REFRESH_MS = 2 * 60 * 1000;

// Carrega a lista UMA vez (antes eram 6 chamadas, uma por status) e mantém atualizada:
// recarrega sozinho a cada 2 min e ao voltar para a aba, sem piscar a tela.
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const seq = useRef(0); // só a resposta mais recente vale (evita lista velha por cima de uma nova)

  // silent = recarga em segundo plano (sem skeleton); force = pede ao servidor para reler a planilha
  const load = useCallback(async (opts: { silent?: boolean; force?: boolean } = {}) => {
    const mine = ++seq.current;
    try {
      if (!opts.silent) setRefreshing(true);
      if (opts.force) await refreshData();
      const data = await getProjects();
      if (mine !== seq.current) return;
      setProjects(data);
      setUpdatedAt(new Date());
      setError(null);
    } catch (e) {
      console.error('Erro ao carregar projetos:', e);
      if (!opts.silent && mine === seq.current) setError('Não foi possível carregar os projetos. Verifique a conexão e tente de novo.');
    } finally {
      if (mine === seq.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => { if (!document.hidden) load({ silent: true }); }, AUTO_REFRESH_MS);
    const onVisible = () => { if (!document.hidden) load({ silent: true }); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);

  return { projects, loading, refreshing, error, updatedAt, reload: load };
}
