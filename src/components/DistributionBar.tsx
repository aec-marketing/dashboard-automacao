import { Box, Typography } from '@mui/material';

export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}

// Barra empilhada em CSS puro (substitui o gráfico de pizza, que puxava a biblioteca recharts inteira).
// A cor nunca é o único sinal: toda faixa aparece na legenda com nome e quantidade.
function DistributionBar({ segments }: { segments: Segment[] }) {
  const shown = segments.filter(s => s.value > 0);
  const total = shown.reduce((acc, s) => acc + s.value, 0);
  if (total === 0) {
    return <Typography variant="body2" color="text.secondary">Sem projetos para mostrar.</Typography>;
  }
  const summary = shown.map(s => `${s.label}: ${s.value}`).join(', ');

  return (
    <Box>
      <Box
        role="img"
        aria-label={`Distribuição dos projetos. ${summary}`}
        sx={{ display: 'flex', height: 22, bgcolor: 'divider', gap: '2px' }}
      >
        {shown.map(s => (
          <Box
            key={s.key}
            onClick={s.onClick}
            title={`${s.label}: ${s.value}`}
            sx={{ flexGrow: s.value, flexBasis: 0, bgcolor: s.color, cursor: s.onClick ? 'pointer' : 'default', '&:hover': s.onClick ? { opacity: 0.85 } : undefined }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 3, rowGap: 0.75, mt: 1.5 }}>
        {shown.map(s => (
          <Box
            key={s.key}
            component={s.onClick ? 'button' : 'div'}
            onClick={s.onClick}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1, p: 0, border: 0, bgcolor: 'transparent',
              font: 'inherit', color: 'text.primary', cursor: s.onClick ? 'pointer' : 'default',
              '&:hover .lbl': s.onClick ? { textDecoration: 'underline' } : undefined,
            }}
          >
            <Box sx={{ width: 12, height: 12, bgcolor: s.color, flex: 'none' }} />
            <Typography className="lbl" variant="body2">{s.label}</Typography>
            <Typography className="num" variant="body2" sx={{ fontWeight: 700 }}>{s.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default DistributionBar;
