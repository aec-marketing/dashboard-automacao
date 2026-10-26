import { Card, CardActionArea, Box, Typography, LinearProgress } from '@mui/material';
import type { Project } from '../types';
import { cleanCode, formatDate, isLate, priorityCode, priorityLabel, statusLabel } from '../domain/status';

interface ProjectCardProps {
  project: Project;
  showStatus?: boolean;
  onOpen: (project: Project) => void;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="caption" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'text.secondary', lineHeight: 1.2 }}>
    {children}
  </Typography>
);

// Mesma anatomia dos cartões da TV: código/pedido, cliente, descrição, indicadores e estado.
function ProjectCard({ project, showStatus, onOpen }: ProjectCardProps) {
  const late = isLate(project);
  const date = formatDate(project.entregaEstimada);
  const prio = priorityCode(project.prioridade);
  const urgent = prio === 'P0', high = prio === 'P1';
  const progress = Math.max(0, Math.min(100, project.progresso || 0));

  return (
    <Card sx={{ display: 'flex', '&:hover': { borderColor: 'primary.main' } }}>
      <CardActionArea
        onClick={() => onOpen(project)}
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', height: '100%' }}
        aria-label={`Abrir projeto ${cleanCode(project.codigo) || project.cliente}`}
      >
        <Box sx={{ p: 2, pb: 1.5, flexGrow: 1, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 22 }}>
            <Typography className="num" variant="body2" noWrap sx={{ flexGrow: 1, color: 'text.secondary' }}>
              <Box component="strong" sx={{ color: 'text.primary' }}>{cleanCode(project.codigo) || 'Sem código'}</Box>
              {project.nPedido ? ` · Pedido ${project.nPedido}` : ''}
            </Typography>
            {showStatus && (
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'primary.main', whiteSpace: 'nowrap' }}>
                {statusLabel(project.status)}
              </Typography>
            )}
            {(urgent || high) && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }} title={`Prioridade ${priorityLabel(project.prioridade).toLowerCase()}`}>
                <Box sx={{ width: 11, height: 11, bgcolor: urgent ? 'error.main' : 'transparent', border: '3px solid', borderColor: 'error.main', boxSizing: 'border-box' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{priorityLabel(project.prioridade)}</Typography>
              </Box>
            )}
          </Box>

          <Typography
            variant="h6"
            component="h3"
            sx={{ mt: 0.75, color: 'primary.main', textTransform: 'uppercase', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.25, overflowWrap: 'anywhere' }}
          >
            {project.cliente || 'Sem cliente'}
          </Typography>
          <Typography
            sx={{ mt: 0.5, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.6em' }}
          >
            {project.descricao || 'Sem descrição'}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1fr', gap: 2, mt: 1.75 }}>
            <Box>
              <Label>Entrega{late ? <Box component="span" sx={{ color: 'error.dark', ml: 0.75 }}>Atrasada</Box> : null}</Label>
              <Typography className="num" sx={{ fontWeight: 700, color: late ? 'error.dark' : 'text.primary' }}>{date || 'Sem prazo'}</Typography>
            </Box>
            <Box>
              <Label>Progresso</Label>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress variant="determinate" value={progress} sx={{ flexGrow: 1, height: 6 }} />
                <Typography className="num" sx={{ fontWeight: 700 }}>{progress}%</Typography>
              </Box>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Label>Consultor</Label>
              <Typography noWrap sx={{ fontWeight: 600 }}>{project.consultor || '—'}</Typography>
            </Box>
          </Box>
        </Box>

        {project.estadoProjeto ? (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1, bgcolor: 'var(--ac-tint)', borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ width: 10, height: 10, bgcolor: 'secondary.main', flex: 'none' }} />
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'text.secondary' }}>Estado</Typography>
            <Typography noWrap sx={{ fontWeight: 700, color: 'primary.dark' }}>{project.estadoProjeto}</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '1px', bgcolor: 'transparent' }} />
        )}
      </CardActionArea>
    </Card>
  );
}

export default ProjectCard;
