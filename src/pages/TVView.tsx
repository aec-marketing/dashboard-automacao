import { Container, Typography, Card, CardContent, Grid } from '@mui/material';

function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard - Gestão de Projetos
      </Typography>

<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Projetos Em Andamento</Typography>
              <Typography variant="h3" color="primary">12</Typography>
            </CardContent>
          </Card>
        </Grid>

  <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Projetos Pendentes</Typography>
              {/* Aqui precisa ser sx, não color direto */}
              <Typography variant="h3" sx={{ color: 'warning.main' }}>5</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
