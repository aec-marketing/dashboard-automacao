import { Box, Typography } from '@mui/material';

export interface SummaryItem {
  label: string;
  value: string | number;
  hint: string;
  alert?: boolean;
}

// Faixa única de indicadores (em vez de seis cartões iguais): leitura em linha, divisórias finas.
// Celular: 2 colunas. Telas largas: uma linha só.
function SummaryStrip({ items }: { items: SummaryItem[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: `repeat(${items.length}, 1fr)` } }}>
      {items.map((item, i) => (
        <Box
          key={item.label}
          sx={{
            py: 1.5,
            pr: { xs: 1.5, md: 2.5 },
            pl: { xs: i % 2 === 1 ? 2 : 0, md: i === 0 ? 0 : 2.5 },
            borderColor: 'divider',
            borderStyle: 'solid',
            borderWidth: 0,
            borderLeftWidth: { xs: i % 2 === 1 ? 1 : 0, md: i > 0 ? 1 : 0 },
            borderTopWidth: { xs: i >= 2 ? 1 : 0, md: 0 },
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'text.secondary' }}>
            {item.label}
          </Typography>
          <Typography
            className="num"
            sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '2rem', lineHeight: 1.15, mt: 0.5, color: item.alert ? 'error.dark' : 'primary.main' }}
          >
            {item.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">{item.hint}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export default SummaryStrip;
