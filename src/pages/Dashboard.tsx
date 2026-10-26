import { useMemo, useState, useEffect } from 'react';
import {
  Box, Container, Tabs, Tab, ToggleButton, ToggleButtonGroup, TextField, InputAdornment, IconButton, FormControl,
  InputLabel, Select, MenuItem, Button, Paper, Skeleton, Alert, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import { createProject, updateProject } from '../services/api';
import type { Project } from '../types';
import { useProjects } from '../hooks/useProjects';
import { useNotification } from '../contexts/types';
import { ACTIVE_CODES, OPEN_CODES, PRIORITIES, comparePriority, isLate, priorityCode, statusCode } from '../domain/status';
import AppHeader from '../components/AppHeader';
import SummaryStrip from '../components/SummaryStrip';
import DistributionBar from '../components/DistributionBar';
import type { Segment } from '../components/DistributionBar';
import ProjectCard from '../components/ProjectCard';
import ProjectTable from '../components/ProjectTable';
import ProjectForm from '../components/ProjectForm';
import ProjectDetailModal from '../components/ProjectDetailModal';

// Etapas do quadro, na ordem em que a equipe acompanha
const TABS = [
  { key: 'S2', label: 'Em andamento' },
  { key: 'S1', label: 'Planejamento' },
  { key: 'S5', label: 'Pend. cliente' },
  { key: 'S4', label: 'Pend. externas' },
  { key: 'S3', label: 'Parados' },
  { key: 'S0', label: 'Não iniciados' },
  { key: 'all', label: 'Todos os abertos' },
  { key: 'S6', label: 'Concluídos' },
] as const;

const DONE_PAGE = 50; // concluídos são centenas: mostra aos poucos para a página continuar leve

// Cores só da paleta A&C (azuis e neutros; amarelo e laranja só onde há atenção)
const STATUS_COLORS: Record<string, string> = { S0: '#9AA3B8', S1: '#6C84C4', S2: '#233A79', S3: '#EB5C3D', S4: '#FDC30B', S5: '#8C6E00' };
const PRIORITY_COLORS: Record<string, string> = { P0: '#EB5C3D', P1: '#FDC30B', P2: '#233A79', P3: '#6C84C4', P4: '#9AA3B8' };
const PROGRESS_BUCKETS = [
  { key: 'b1', label: '0–25%', from: 0, to: 25, color: '#9AA3B8' },
  { key: 'b2', label: '26–50%', from: 26, to: 50, color: '#6C84C4' },
  { key: 'b3', label: '51–75%', from: 51, to: 75, color: '#3F5CA8' },
  { key: 'b4', label: '76–100%', from: 76, to: 100, color: '#233A79' },
];

const PREFS_KEY = 'painel:prefs';
const loadPrefs = (): { tab?: string; view?: string } => {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch { return {}; }
};

function Dashboard() {
  const { projects, loading, refreshing, error, updatedAt, reload } = useProjects();
  const { showSuccess, showError } = useNotification();

  const prefs = useMemo(loadPrefs, []);
  const [tab, setTab] = useState<string>(TABS.some(t => t.key === prefs.tab) ? prefs.tab! : 'S2');
  const [view, setView] = useState<'cards' | 'list'>(prefs.view === 'list' ? 'list' : 'cards');
  const [chart, setChart] = useState<'status' | 'priority' | 'progress'>('status');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [client, setClient] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ tab, view })); } catch { /* sem armazenamento: tudo bem */ }
  }, [tab, view]);

  // ---- derivados (calculados uma vez por mudança, não a cada renderização) ----
  const open = useMemo(() => projects.filter(p => OPEN_CODES.includes(statusCode(p.status))), [projects]);
  const done = useMemo(() => projects.filter(p => statusCode(p.status) === 'S6'), [projects]);
  const isDoneTab = tab === 'S6';
  const clients = useMemo(
    () => [...new Set((isDoneTab ? done : open).map(p => p.cliente?.trim()).filter(Boolean))].sort() as string[],
    [open, done, isDoneTab],
  );

  const applyFilters = (list: Project[]) => {
    const q = search.trim().toLowerCase();
    return list
      .filter(p => !priority || priorityCode(p.prioridade) === priority)
      .filter(p => !client || p.cliente?.trim() === client)
      .filter(p => !q || [p.codigo, p.cliente, p.descricao, p.nPedido, p.consultor, p.estadoProjeto].some(v => (v || '').toLowerCase().includes(q)));
  };

  const filtered = useMemo(() => applyFilters(open).sort(comparePriority), [open, search, priority, client]); // eslint-disable-line react-hooks/exhaustive-deps
  // Concluídos: os mais recentes primeiro
  const filteredDone = useMemo(
    () => applyFilters(done).sort((a, b) => (b.dataFim || b.entregaEstimada || '').localeCompare(a.dataFim || a.entregaEstimada || '')),
    [done, search, priority, client], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const countBy = useMemo(() => {
    const c: Record<string, number> = { all: filtered.length, S6: filteredDone.length };
    filtered.forEach(p => { const k = statusCode(p.status); c[k] = (c[k] || 0) + 1; });
    return c;
  }, [filtered, filteredDone]);

  const [shown, setShown] = useState(DONE_PAGE);
  useEffect(() => { setShown(DONE_PAGE); }, [tab, search, priority, client]);

  const visible = useMemo(
    () => (isDoneTab ? filteredDone : tab === 'all' ? filtered : filtered.filter(p => statusCode(p.status) === tab)),
    [isDoneTab, filteredDone, filtered, tab],
  );

  const kpis = useMemo(() => {
    const active = projects.filter(p => ACTIVE_CODES.includes(statusCode(p.status)));
    const done = projects.filter(p => statusCode(p.status) === 'S6');
    const withDates = done.filter(p => p.dataFim && p.entregaEstimada);
    const onTime = withDates.filter(p => p.dataFim <= p.entregaEstimada).length;
    const timed = done.filter(p => p.dataEntradaPlanejamento && p.dataFim);
    const days = timed.reduce((sum, p) => sum + Math.abs((new Date(p.dataFim).getTime() - new Date(p.dataEntradaPlanejamento).getTime()) / 86400000), 0);
    return {
      active: active.length,
      inProgress: active.filter(p => statusCode(p.status) === 'S2').length,
      queue: projects.filter(p => statusCode(p.status) === 'S0').length,
      late: active.filter(p => isLate(p)).length,
      critical: active.filter(p => ['P0', 'P1'].includes(priorityCode(p.prioridade)) && statusCode(p.status) !== 'S1').length,
      onTimeRate: withDates.length ? Math.round((onTime / withDates.length) * 100) : 0,
      avgDays: timed.length ? Math.round(days / timed.length) : 0,
      done: done.length,
    };
  }, [projects]);

  const segments: Segment[] = useMemo(() => {
    if (chart === 'status') {
      return TABS.filter(t => t.key !== 'all' && t.key !== 'S6').map(t => ({
        key: t.key, label: t.label, color: STATUS_COLORS[t.key],
        value: open.filter(p => statusCode(p.status) === t.key).length,
        onClick: () => setTab(t.key),
      }));
    }
    if (chart === 'priority') {
      return PRIORITIES.map(p => ({ key: p.code, label: `${p.code} ${p.label}`, color: PRIORITY_COLORS[p.code], value: open.filter(x => priorityCode(x.prioridade) === p.code).length }));
    }
    return PROGRESS_BUCKETS.map(b => ({ key: b.key, label: b.label, color: b.color, value: open.filter(p => (p.progresso || 0) >= b.from && (p.progresso || 0) <= b.to).length }));
  }, [chart, open]);

  const hasFilters = !!(search || priority || client);
  const clearFilters = () => { setSearch(''); setPriority(''); setClient(''); };

  // ---- ações ----
  const handleCreate = async (data: Partial<Project>) => {
    try {
      await createProject(data);
      await reload();
      showSuccess(`Projeto "${data.codigo || data.cliente || 'novo'}" criado.`);
      setFormOpen(false);
    } catch (e) {
      console.error('Erro ao criar projeto:', e);
      showError('Não foi possível criar o projeto. Confira os dados e tente de novo.');
    }
  };

  const handleUpdate = async (data: Partial<Project>) => {
    if (!selected) return;
    try {
      await updateProject(selected.id, data);
      await reload();
      setSelected(null);
      showSuccess(`Projeto "${data.codigo || data.cliente || 'sem código'}" atualizado.`);
    } catch (e) {
      console.error('Erro ao atualizar projeto:', e);
      showError('Não foi possível salvar as alterações. Tente de novo.');
    }
  };

  const handleDeleted = async () => { await reload(); showSuccess('Projeto excluído.'); };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader updatedAt={updatedAt} refreshing={refreshing} onRefresh={() => reload({ force: true })} onNew={() => setFormOpen(true)} />

      <Container maxWidth={false} sx={{ maxWidth: 1600, py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => reload()}>Tentar de novo</Button>}>
            {error}
          </Alert>
        )}

        {/* Visão rápida: indicadores + distribuição */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}>
          {loading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2 }}>
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rectangular" height={74} />)}
            </Box>
          ) : (
            <>
              <SummaryStrip
                items={[
                  { label: 'Ativos', value: kpis.active, hint: `${kpis.queue} na fila · ${kpis.done} concluídos` },
                  { label: 'Em andamento', value: kpis.inProgress, hint: 'Etapa S2' },
                  { label: 'Atrasados', value: kpis.late, hint: 'Entrega vencida (S1 e S2)', alert: kpis.late > 0 },
                  { label: 'Críticos', value: kpis.critical, hint: 'P0 e P1 em curso' },
                  { label: 'No prazo', value: `${kpis.onTimeRate}%`, hint: 'Concluídos dentro do prazo' },
                  { label: 'Tempo médio', value: `${kpis.avgDays} d`, hint: 'Do planejamento à conclusão' },
                ]}
              />
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1.5, pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', color: 'text.secondary' }}>
                    Projetos abertos por {chart === 'status' ? 'etapa' : chart === 'priority' ? 'prioridade' : 'progresso'} ({open.length})
                  </Typography>
                  <ToggleButtonGroup value={chart} exclusive size="small" onChange={(_, v) => v && setChart(v)} aria-label="Agrupar por">
                    <ToggleButton value="status">Etapa</ToggleButton>
                    <ToggleButton value="priority">Prioridade</ToggleButton>
                    <ToggleButton value="progress">Progresso</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <DistributionBar segments={segments} />
              </Box>
            </>
          )}
        </Paper>

        {/* Quadro de projetos */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ flexGrow: 1, minWidth: 0 }}
            aria-label="Etapas"
          >
            {TABS.map(t => (
              <Tab
                key={t.key}
                value={t.key}
                label={<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>{t.label}<Box component="span" className="num" sx={{ color: 'text.secondary', fontWeight: 700 }}>{loading ? '' : countBy[t.key] || 0}</Box></Box>}
              />
            ))}
          </Tabs>
          {!isDoneTab && (
            <ToggleButtonGroup value={view} exclusive size="small" onChange={(_, v) => v && setView(v)} aria-label="Modo de exibição" sx={{ mb: 0.5 }}>
              <ToggleButton value="cards" aria-label="Cartões"><ViewModuleIcon fontSize="small" sx={{ mr: 0.75 }} />Cartões</ToggleButton>
              <ToggleButton value="list" aria-label="Lista"><ViewListIcon fontSize="small" sx={{ mr: 0.75 }} />Lista</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', py: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar por código, cliente, projeto, pedido, estado…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: '1 1 280px', maxWidth: 520 }}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar projetos' },
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: search ? <InputAdornment position="end"><IconButton size="small" aria-label="Limpar busca" onClick={() => setSearch('')}><ClearIcon fontSize="small" /></IconButton></InputAdornment> : null,
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Prioridade</InputLabel>
            <Select value={priority} label="Prioridade" onChange={(e) => setPriority(e.target.value)}>
              <MenuItem value="">Todas</MenuItem>
              {PRIORITIES.map(p => <MenuItem key={p.code} value={p.code}>{p.code} · {p.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Cliente</InputLabel>
            <Select value={client} label="Cliente" onChange={(e) => setClient(e.target.value)} MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360 } } } }}>
              <MenuItem value="">Todos</MenuItem>
              {clients.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          {hasFilters && <Button size="small" onClick={clearFilters}>Limpar filtros</Button>}
        </Box>

        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 2 }}>
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rectangular" height={238} />)}
          </Box>
        ) : visible.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Nenhum projeto aqui</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {hasFilters ? 'Nenhum projeto desta etapa combina com os filtros.' : 'Não há projetos nesta etapa agora.'}
            </Typography>
            {hasFilters && <Button variant="outlined" onClick={clearFilters}>Limpar filtros</Button>}
          </Paper>
        ) : isDoneTab ? (
          <>
            <ProjectTable mode="done" projects={visible.slice(0, shown)} onOpen={setSelected} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
              <Typography variant="body2" color="text.secondary" className="num">
                Mostrando {Math.min(shown, visible.length)} de {visible.length} · mais recentes primeiro
              </Typography>
              {visible.length > shown && (
                <Button variant="outlined" onClick={() => setShown(s => s + DONE_PAGE)}>Mostrar mais {Math.min(DONE_PAGE, visible.length - shown)}</Button>
              )}
            </Box>
          </>
        ) : view === 'cards' ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 2 }}>
            {visible.map(p => <ProjectCard key={p.id} project={p} showStatus={tab === 'all'} onOpen={setSelected} />)}
          </Box>
        ) : (
          <ProjectTable projects={visible} onOpen={setSelected} />
        )}
      </Container>

      <ProjectDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
        onDelete={handleDeleted}
        project={selected}
      />
      <ProjectForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} project={null} title="Novo projeto" />
    </Box>
  );
}

export default Dashboard;
