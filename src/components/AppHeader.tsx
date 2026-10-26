import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';

interface AppHeaderProps {
  updatedAt: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
  onNew: () => void;
}

const hhmm = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

function AppHeader({ updatedAt, refreshing, onRefresh, onNew }: AppHeaderProps) {
  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.dark', color: '#fff' }}>
      <Toolbar sx={{ gap: { xs: 1.5, sm: 3 }, minHeight: { xs: 60, sm: 72 }, px: { xs: 2, sm: 3 } }}>
        <Box component="img" src="/logo-aec-branco.svg" alt="Almeida & Camargo" sx={{ height: { xs: 34, sm: 44 }, display: 'block' }} />
        <Box sx={{ width: '1px', height: 32, bgcolor: 'rgba(255,255,255,0.25)', display: { xs: 'none', sm: 'block' } }} />
        <Typography
          component="h1"
          variant="h6"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: { xs: '0.85rem', sm: '1.05rem' }, flexGrow: 1, whiteSpace: 'nowrap' }}
        >
          Painel de projetos
        </Typography>

        {updatedAt && (
          <Typography className="num" variant="body2" sx={{ color: '#C9D0EA', display: { xs: 'none', md: 'block' } }}>
            Atualizado às {hhmm(updatedAt)}
          </Typography>
        )}
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={refreshing}
          sx={{ borderColor: 'rgba(255,255,255,0.4)', minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } } }}
          aria-label="Atualizar dados da planilha"
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{refreshing ? 'Atualizando…' : 'Atualizar'}</Box>
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={onNew}
          sx={{ minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } } }}
          aria-label="Novo projeto"
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Novo projeto</Box>
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader;
