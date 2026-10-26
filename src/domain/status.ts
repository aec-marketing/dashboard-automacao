import type { Project } from '../types';

// Fonte única de status e prioridades (valores idênticos aos da planilha, aba 01.1-DADOS).
export const STATUSES = [
  { code: 'S0', value: 'S0 - Não iniciado', label: 'Não iniciado', plural: 'Não iniciados' },
  { code: 'S1', value: 'S1 - Em Planejamento', label: 'Planejamento', plural: 'Planejamento' },
  { code: 'S2', value: 'S2 - Em Andamento', label: 'Em andamento', plural: 'Em andamento' },
  { code: 'S3', value: 'S3 - Parado', label: 'Parado', plural: 'Parados' },
  { code: 'S4', value: 'S4 - Pendências externas', label: 'Pendências externas', plural: 'Pend. externas' },
  { code: 'S5', value: 'S5 - Pendências cliente', label: 'Pendências cliente', plural: 'Pend. cliente' },
  { code: 'S6', value: 'S6 - Concluído', label: 'Concluído', plural: 'Concluídos' },
] as const;

export const PRIORITIES = [
  { code: 'P0', value: 'P0 - Urgente', label: 'Urgente' },
  { code: 'P1', value: 'P1 - Alta', label: 'Alta' },
  { code: 'P2', value: 'P2 - Normal', label: 'Normal' },
  { code: 'P3', value: 'P3 - Baixa', label: 'Baixa' },
  { code: 'P4', value: 'P4 - Minima', label: 'Mínima' },
] as const;

export const STATUS_VALUES: string[] = STATUSES.map(s => s.value);
export const PRIORITY_VALUES: string[] = PRIORITIES.map(p => p.value);

export const statusCode = (status?: string) => (status || '').slice(0, 2);
export const priorityCode = (priority?: string) => (priority || 'P2').slice(0, 2);
export const statusLabel = (status?: string) =>
  STATUSES.find(s => s.code === statusCode(status))?.label ?? (status || 'N/A');
export const priorityLabel = (priority?: string) =>
  PRIORITIES.find(p => p.code === priorityCode(priority))?.label ?? '';

// "Ativos" = S1 a S5 (igual à TV). S0 é a fila (ainda não começou) e S6 está concluído.
export const ACTIVE_CODES = ['S1', 'S2', 'S3', 'S4', 'S5'];
export const OPEN_CODES = ['S0', ...ACTIVE_CODES];

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Entrega vencida só conta em planejamento e andamento (nos demais a data deixou de ser o que importa)
export const isLate = (p: Project, today = todayISO()) =>
  !!p.entregaEstimada && p.entregaEstimada < today && ['S1', 'S2'].includes(statusCode(p.status));

// Entrega ISO (AAAA-MM-DD) para 31/08 (ou 31/08/25 se for de outro ano)
export const formatDate = (iso?: string, today = todayISO()) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}${y === today.slice(0, 4) ? '' : '/' + y.slice(2)}`;
};

export const comparePriority = (a: Project, b: Project) => {
  const d = Number(priorityCode(a.prioridade).slice(1)) - Number(priorityCode(b.prioridade).slice(1));
  if (d) return d;
  if (a.entregaEstimada === b.entregaEstimada) return 0;
  if (!a.entregaEstimada) return 1;
  if (!b.entregaEstimada) return -1;
  return a.entregaEstimada < b.entregaEstimada ? -1 : 1;
};

// AAAA-MM-DD -> DD/MM/AAAA (para leitura)
export const formatDateBR = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

// "-" na planilha significa "sem código"
export const cleanCode = (code?: string) => {
  const c = (code || '').trim();
  return c === '-' ? '' : c;
};
