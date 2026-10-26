import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Typography, LinearProgress, Paper } from '@mui/material';
import type { Project } from '../types';
import { cleanCode, formatDate, isLate, priorityCode, priorityLabel, statusLabel } from '../domain/status';

interface ProjectTableProps {
  projects: Project[];
  onOpen: (project: Project) => void;
  mode?: 'open' | 'done';
}

const head = { fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'var(--ac-tint)', whiteSpace: 'nowrap' } as const;

// Dias entre a entrega prometida e a conclusão (positivo = atrasou). null = faltam datas.
const finishDelta = (p: Project) => {
  if (!p.dataFim || !p.entregaEstimada) return null;
  return Math.round((new Date(p.dataFim).getTime() - new Date(p.entregaEstimada).getTime()) / 86400000);
};

// Concluídos: o que importa é quando acabou e se foi no prazo.
function DoneTable({ projects, onOpen }: ProjectTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="Projetos concluídos">
        <TableHead>
          <TableRow>
            <TableCell sx={head}>Cliente</TableCell>
            <TableCell sx={head}>Código</TableCell>
            <TableCell sx={head}>Projeto</TableCell>
            <TableCell sx={head}>Consultor</TableCell>
            <TableCell sx={head}>Entrega prevista</TableCell>
            <TableCell sx={head}>Concluído em</TableCell>
            <TableCell sx={head}>Prazo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((p, i) => {
            const delta = finishDelta(p);
            return (
              <TableRow
                key={p.id}
                hover
                tabIndex={0}
                onClick={() => onOpen(p)}
                onKeyDown={(e) => { if (e.key === 'Enter') onOpen(p); }}
                sx={{ cursor: 'pointer', bgcolor: i % 2 ? 'var(--ac-tint)' : 'transparent', '& td': { py: 1 } }}
              >
                <TableCell sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.cliente || '—'}</TableCell>
                <TableCell className="num" sx={{ whiteSpace: 'nowrap' }}>{cleanCode(p.codigo) || <Box component="span" sx={{ color: 'text.secondary' }}>Sem código</Box>}</TableCell>
                <TableCell sx={{ maxWidth: 420 }}><Typography noWrap title={p.descricao}>{p.descricao || 'Sem descrição'}</Typography></TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{p.consultor || '—'}</TableCell>
                <TableCell className="num" sx={{ whiteSpace: 'nowrap' }}>{formatDate(p.entregaEstimada) || '—'}</TableCell>
                <TableCell className="num" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{formatDate(p.dataFim) || '—'}</TableCell>
                <TableCell className="num" sx={{ whiteSpace: 'nowrap', fontWeight: 600, color: delta !== null && delta > 0 ? 'error.dark' : 'text.primary' }}>
                  {delta === null ? '—' : delta <= 0 ? 'No prazo' : `+${delta} d`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Lista densa: uma linha por projeto, cabeçalho fixo, zebra leve, números alinhados.
function ProjectTable({ projects, onOpen, mode = 'open' }: ProjectTableProps) {
  if (mode === 'done') return <DoneTable projects={projects} onOpen={onOpen} />;
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '70vh' }}>
      <Table size="small" stickyHeader aria-label="Lista de projetos">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...head, width: 28, px: 1 }} />
            <TableCell sx={head}>Cliente</TableCell>
            <TableCell sx={head}>Código</TableCell>
            <TableCell sx={head}>Projeto</TableCell>
            <TableCell sx={head}>Status</TableCell>
            <TableCell sx={head}>Estado</TableCell>
            <TableCell sx={head}>Entrega</TableCell>
            <TableCell sx={{ ...head, minWidth: 130 }}>Progresso</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((p, i) => {
            const prio = priorityCode(p.prioridade);
            const late = isLate(p);
            const progress = Math.max(0, Math.min(100, p.progresso || 0));
            return (
              <TableRow
                key={p.id}
                hover
                tabIndex={0}
                onClick={() => onOpen(p)}
                onKeyDown={(e) => { if (e.key === 'Enter') onOpen(p); }}
                sx={{ cursor: 'pointer', bgcolor: i % 2 ? 'var(--ac-tint)' : 'transparent', '& td': { py: 1 } }}
              >
                <TableCell sx={{ px: 1 }}>
                  {(prio === 'P0' || prio === 'P1') && (
                    <Box
                      title={`Prioridade ${priorityLabel(p.prioridade).toLowerCase()}`}
                      sx={{ width: 11, height: 11, boxSizing: 'border-box', border: '3px solid', borderColor: 'error.main', bgcolor: prio === 'P0' ? 'error.main' : 'transparent' }}
                    />
                  )}
                </TableCell>
                <TableCell sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.cliente || '—'}</TableCell>
                <TableCell className="num" sx={{ whiteSpace: 'nowrap' }}>{cleanCode(p.codigo) || <Box component="span" sx={{ color: 'text.secondary' }}>Sem código</Box>}</TableCell>
                <TableCell sx={{ maxWidth: 380 }}><Typography noWrap title={p.descricao}>{p.descricao || 'Sem descrição'}</Typography></TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{statusLabel(p.status)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {p.estadoProjeto ? (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontWeight: 700, color: 'primary.dark' }}>
                      <Box sx={{ width: 9, height: 9, bgcolor: 'secondary.main' }} />{p.estadoProjeto}
                    </Box>
                  ) : <Box component="span" sx={{ color: 'text.secondary' }}>—</Box>}
                </TableCell>
                <TableCell className="num" sx={{ whiteSpace: 'nowrap', color: late ? 'error.dark' : 'text.primary', fontWeight: late ? 700 : 400 }}>
                  {formatDate(p.entregaEstimada) || '—'}{late ? ' · atrasada' : ''}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress variant="determinate" value={progress} sx={{ flexGrow: 1, height: 5 }} />
                    <Typography className="num" variant="body2" sx={{ width: 36, textAlign: 'right', fontWeight: 600 }}>{progress}%</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProjectTable;
