import { Container, Typography, Card, CardContent, Box, Button, Chip, LinearProgress, IconButton, ToggleButton, ToggleButtonGroup, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, InputAdornment, Skeleton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { Add, Refresh, ChevronLeft, ChevronRight, ViewList, ViewModule, Search, Clear } from '@mui/icons-material';
import { getProjectsInProgress, getProjectsPending, getProjectsNotStarted, getProjectsCompleted, getProjectsInPlanning, getProjectsStopped, createProject, updateProject, refreshData } from '../services/api';
import type { Project } from '../types';
import ProjectForm from '../components/ProjectForm';
import ProjectDetailModal from '../components/ProjectDetailModal.tsx';
import { useNotification } from '../contexts/types';


function Dashboard() {
  const [projectsInProgress, setProjectsInProgress] = useState<Project[]>([]);
  const [projectsPending, setProjectsPending] = useState<Project[]>([]);
  const [projectsNotStarted, setProjectsNotStarted] = useState<Project[]>([]);
  const [projectsCompleted, setProjectsCompleted] = useState<Project[]>([]);
  const [projectsPlanning, setProjectsPlanning] = useState<Project[]>([]);
  const [projectsStopped, setProjectsStopped] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para o formulário
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Estado para paginação do carrossel
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  
  // Estado para controle do status selecionado
  const [selectedStatus, setSelectedStatus] = useState('inProgress');
  
  // Estado para controle do modo de visualização
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

// Estado para o modal de detalhes
const [detailModalOpen, setDetailModalOpen] = useState(false);
const [selectedProject, setSelectedProject] = useState<Project | null>(null);
const [isRefreshing, setIsRefreshing] = useState(false);
const [isCreating, setIsCreating] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [priorityFilter, setPriorityFilter] = useState<string>('');
const [clientFilter, setClientFilter] = useState<string>('');
  const { showSuccess, showError, showInfo } = useNotification();

  // Função para obter todos os projetos (exceto concluídos)
const getAllActiveProjects = () => {
  const allProjects = [
    ...projectsNotStarted,
    ...projectsPlanning,
    ...projectsInProgress,
    ...projectsStopped,
    ...projectsPending
  ].sort((a, b) => {
    // Ordenar por prioridade primeiro (P0 primeiro)
    if (a.prioridade !== b.prioridade) {
      return (a.prioridade || 'P2').localeCompare(b.prioridade || 'P2');
    }
    // Depois por status
    return (a.status || '').localeCompare(b.status || '');
  });
  
  return getFilteredProjects(allProjects);
};

  // Função para obter projetos do status atual
const getCurrentProjects = () => {
  let projects: Project[] = [];
  switch (selectedStatus) {
    case 'notStarted': projects = projectsNotStarted; break;
    case 'planning': projects = projectsPlanning; break;
    case 'inProgress': projects = projectsInProgress; break;
    case 'stopped': projects = projectsStopped; break;
    case 'pending': projects = projectsPending; break;
    default: projects = projectsInProgress;
  }
  
  return getFilteredProjects(projects);
};
const getFilteredProjects = (projects: Project[]) => {
  let filtered = projects;
  
  // Filtro de busca textual
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(project => 
      (project.codigo?.toLowerCase() || '').includes(query) ||
      (project.cliente?.toLowerCase() || '').includes(query) ||
      (project.descricao?.toLowerCase() || '').includes(query) ||
      (project.nPedido?.toLowerCase() || '').includes(query)
    );
  }
  
  // Filtro de prioridade
  if (priorityFilter) {
    filtered = filtered.filter(project => 
      project.prioridade?.includes(priorityFilter)
    );
  }
  
  // Filtro de cliente
  if (clientFilter) {
    filtered = filtered.filter(project => 
      project.cliente?.toLowerCase().includes(clientFilter.toLowerCase())
    );
  }
  
  return filtered;
};
const getUniquePriorities = () => {
  const allProjects = [
    ...projectsNotStarted, ...projectsPlanning, ...projectsInProgress,
    ...projectsStopped, ...projectsPending
  ];
  const priorities = [...new Set(allProjects.map(p => p.prioridade).filter(Boolean))];
  return priorities.sort();
};

const getUniqueClients = () => {
  const allProjects = [
    ...projectsNotStarted, ...projectsPlanning, ...projectsInProgress,
    ...projectsStopped, ...projectsPending
  ];
  const clients = [...new Set(allProjects.map(p => p.cliente).filter(Boolean))];
  return clients.sort();
};
const renderCardSkeletons = () => {
  return Array.from({ length: 6 }, (_, index) => (
    <Card key={index} sx={{ height: '220px' }}>
      <CardContent sx={{ height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="rectangular" width={40} height={20} />
        </Box>
        <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1.5 }} />
        <Skeleton variant="text" width="50%" height={16} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1.5 }} />
        <Skeleton variant="rectangular" width="100%" height={6} />
      </CardContent>
    </Card>
  ));
};

const loadData = useCallback(async (showLoadingMessage = false) => {
  try {
    setLoading(true);
    if (showLoadingMessage) {
      showInfo('Carregando dados da planilha...');
    }
    
    const [inProgress, pending, notStarted, planning, stopped, completed] = await Promise.all([
      getProjectsInProgress(),    // S2 - Em Andamento
      getProjectsPending(),       // S4 - Pendências
      getProjectsNotStarted(),    // S0 - Não iniciado
      getProjectsInPlanning(),    // S1 - Em Planejamento
      getProjectsStopped(),       // S3 - Parado
      getProjectsCompleted()      // S6 - Concluído
    ]);
    
    setProjectsInProgress(inProgress);
    setProjectsPending(pending);
    setProjectsNotStarted(notStarted);
    setProjectsPlanning(planning);
    setProjectsStopped(stopped);
    setProjectsCompleted(completed);
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    showError('Erro ao carregar dados da planilha. Tente novamente.');
  } finally {
    setLoading(false);
  }
}, [showInfo, showError]);

useEffect(() => {
  loadData();
}, [loadData]);

const handleCreateProject = async (projectData: Partial<Project>) => {
  try {
    setIsCreating(true);
    showInfo('Criando novo projeto...');
    await createProject(projectData);
    await refreshData();
    await loadData();
    showSuccess(`Projeto "${projectData.codigo || 'sem código'}" criado com sucesso!`);
    setFormOpen(false); // Fecha o modal automaticamente
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    showError('Erro ao criar projeto. Verifique os dados e tente novamente.');
  } finally {
    setIsCreating(false);
  }
};

const handleUpdateProject = async (projectData: Partial<Project>) => {
  const projectToUpdate = editingProject || selectedProject;
  if (!projectToUpdate) return;
  
  try {
    showInfo('Salvando alterações...');
    await updateProject(projectToUpdate.id, projectData);
    await refreshData();
    await loadData();
    setEditingProject(null);
    setDetailModalOpen(false);
    setSelectedProject(null);
    showSuccess(`Projeto "${projectData.codigo || 'sem código'}" atualizado com sucesso!`);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    showError('Erro ao salvar alterações. Tente novamente.');
  }
};

const handleRefresh = async () => {
  try {
    setIsRefreshing(true);
    showInfo('Atualizando dados...');
    await refreshData();
    await loadData();
    showSuccess('Dados atualizados com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    showError('Erro ao atualizar dados. Tente novamente.');
  } finally {
    setIsRefreshing(false);
  }
};

const handleProjectClick = (project: Project) => {
  setSelectedProject(project);
  setDetailModalOpen(true);
};

if (loading) {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard - Gestão de Projetos</Typography>
        <Skeleton variant="rectangular" width={200} height={36} />
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Skeleton variant="text" width="80%" height={24} />
              <Skeleton variant="text" width="60%" height={48} />
            </CardContent>
          </Card>
        ))}
      </Box>
      
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(2, 220px)',
        gap: 2
      }}>
        {renderCardSkeletons()}
      </Box>
    </Container>
  );
}

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
  {/* Filtros */}
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
    <TextField
      size="small"
      placeholder="Buscar por código, cliente, descrição..."
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(0);
      }}
      sx={{ minWidth: 250 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: searchQuery && (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => setSearchQuery('')}>
              <Clear fontSize="small" />
            </IconButton>
          </InputAdornment>
        )
      }}
    />
    
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel>Prioridade</InputLabel>
      <Select
        value={priorityFilter}
        label="Prioridade"
        onChange={(e) => {
          setPriorityFilter(e.target.value);
          setCurrentPage(0);
        }}
      >
        <MenuItem value="">Todas</MenuItem>
        {getUniquePriorities().map(priority => (
          <MenuItem key={priority} value={priority.split(' ')[0]}>{priority}</MenuItem>
        ))}
      </Select>
    </FormControl>
    
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Cliente</InputLabel>
      <Select
        value={clientFilter}
        label="Cliente"
        onChange={(e) => {
          setClientFilter(e.target.value);
          setCurrentPage(0);
        }}
      >
        <MenuItem value="">Todos</MenuItem>
        {getUniqueClients().map(client => (
          <MenuItem key={client} value={client}>{client.length > 20 ? client.substring(0, 20) + '...' : client}</MenuItem>
        ))}
      </Select>
    </FormControl>
    
    {(searchQuery || priorityFilter || clientFilter) && (
      <Button 
        size="small" 
        onClick={() => {
          setSearchQuery('');
          setPriorityFilter('');
          setClientFilter('');
          setCurrentPage(0);
        }}
      >
        Limpar Filtros
      </Button>
    )}
  </Box>
    
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      
    </Box>
  </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Dashboard - Gestão de Projetos
        </Typography>
        <Box>
<Button
  variant="outlined"
  startIcon={<Refresh />}
  onClick={handleRefresh}
  disabled={isRefreshing}
  sx={{ mr: 1 }}
>
  {isRefreshing ? 'Atualizando...' : 'Atualizar'}
</Button>
<Button
  variant="contained"
  startIcon={<Add />}
  onClick={() => setFormOpen(true)}
  disabled={isCreating}
>
  Novo Projeto
</Button>
        </Box>
      </Box>
      
      {/* Cards de estatísticas - usando Flexbox */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Não Iniciados</Typography>
            <Typography variant="h3" color="text.secondary">
              {projectsNotStarted.length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Em Planejamento</Typography>
            <Typography variant="h3" color="info.main">
              {projectsPlanning.length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Em Andamento</Typography>
            <Typography variant="h3" color="primary">
              {projectsInProgress.length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Parados</Typography>
            <Typography variant="h3" color="error.main">
              {projectsStopped.length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Pendências</Typography>
            <Typography variant="h3" color="warning.main">
              {projectsPending.length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Concluídos</Typography>
            <Typography variant="h3" color="success.main">
              {projectsCompleted.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Seção de projetos com seletor de status ou lista completa */}
      <Box sx={{ mt: 4 }}>
        {/* Toggle entre Cards e Lista */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newViewMode) => {
                if (newViewMode !== null) {
                  setViewMode(newViewMode);
                  setCurrentPage(0); // Reset página ao trocar modo
                }
              }}
              size="small"
            >
              <ToggleButton value="cards">
                <ViewModule sx={{ mr: 1 }} />
                Cards
              </ToggleButton>
              <ToggleButton value="list">
                <ViewList sx={{ mr: 1 }} />
                Lista
              </ToggleButton>
            </ToggleButtonGroup>

            {viewMode === 'cards' && (
              <ToggleButtonGroup
                value={selectedStatus}
                exclusive
                onChange={(_, newStatus) => {
                  if (newStatus !== null) {
                    setSelectedStatus(newStatus);
                    setCurrentPage(0);
                  }
                }}
                size="small"
              >
                <ToggleButton value="notStarted">
                  Não Iniciados ({projectsNotStarted.length})
                </ToggleButton>
                <ToggleButton value="planning">
                  Planejamento ({projectsPlanning.length})
                </ToggleButton>
                <ToggleButton value="inProgress">
                  Em Andamento ({projectsInProgress.length})
                </ToggleButton>
                <ToggleButton value="stopped">
                  Parados ({projectsStopped.length})
                </ToggleButton>
                <ToggleButton value="pending">
                  Pendências ({projectsPending.length})
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              {viewMode === 'list' 
                ? `Todos os Projetos (${getAllActiveProjects().length})`
                : `${selectedStatus === 'inProgress' ? 'Em Andamento' : selectedStatus === 'notStarted' ? 'Não Iniciados' : selectedStatus === 'planning' ? 'Planejamento' : selectedStatus === 'stopped' ? 'Parados' : 'Pendências'} (${getCurrentProjects().length})`
              }
            </Typography>

            {viewMode === 'cards' && (
              <Box>
                <IconButton 
                  size="small" 
                  sx={{ mr: 1 }}
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton 
                  size="small"
                  disabled={currentPage >= Math.ceil(getCurrentProjects().length / itemsPerPage) - 1}
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(getCurrentProjects().length / itemsPerPage) - 1, prev + 1))}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        {/* Renderização condicional: Cards ou Lista */}
        {viewMode === 'cards' ? (
          <>
            {/* Container do carrossel */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 220px)',
              gap: 2,
              overflow: 'hidden'
            }}>
              {getCurrentProjects().slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((project) => {
                console.log('Debug - Projeto:', project.id, project.codigo);
                
                const getPriorityColor = (prioridade: string) => {
                  if (prioridade.includes('P0')) return 'error';
                  if (prioridade.includes('P1')) return 'warning';
                  if (prioridade.includes('P2')) return 'info';
                  if (prioridade.includes('P3')) return 'success';
                  return 'default';
                };
                
                return (
                  <Card 
  key={project.id} 
  onClick={() => handleProjectClick(project)}
  sx={{ 
    height: '220px',
    cursor: 'pointer',
    '&:hover': { 
      boxShadow: 4, 
      transform: 'translateY(-2px)',
      transition: 'all 0.2s ease-in-out'
    }
  }}
>
                    <CardContent sx={{ pb: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Header com código e prioridade */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                          {project.codigo || 'Sem código'}
                        </Typography>
                        <Chip 
                          label={project.prioridade || 'P2'} 
                          color={getPriorityColor(project.prioridade || 'P2')}
                          size="small"
                          variant="filled"
                        />
                      </Box>
                      
                      {/* Descrição do projeto - limitada */}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 1.5, 
                          flex: 1,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.875rem'
                        }}
                      >
                        {project.descricao || 'Sem descrição'}
                      </Typography>
                      
                      {/* Informações compactas */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          <strong>Cliente:</strong> {(project.cliente || 'Sem cliente').substring(0, 20)}
                          {project.cliente && project.cliente.length > 20 ? '...' : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Pedido:</strong> {project.nPedido || 'Sem pedido'}
                        </Typography>
                      </Box>
                      
                      {/* Barra de progresso compacta */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progresso
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            {project.progresso || 0}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={project.progresso || 0} 
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
            
            {/* Indicador de página para cards */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
              {Array.from({ length: Math.ceil(getCurrentProjects().length / itemsPerPage) }, (_, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: index === currentPage ? 'primary.main' : 'grey.300',
                    cursor: 'pointer'
                  }}
                  onClick={() => setCurrentPage(index)}
                />
              ))}
            </Box>
          </>
        ) : (
          /* Modo Lista */
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Prioridade</strong></TableCell>
                  <TableCell><strong>Descrição</strong></TableCell>
                  <TableCell><strong>Progresso</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getAllActiveProjects().map((project) => {
                  const getPriorityColor = (prioridade: string) => {
                    if (prioridade?.includes('P0')) return 'error';
                    if (prioridade?.includes('P1')) return 'warning';
                    if (prioridade?.includes('P2')) return 'info';
                    if (prioridade?.includes('P3')) return 'success';
                    return 'default';
                  };

                  const getStatusLabel = (status: string) => {
                    if (status?.includes('S0')) return 'Não Iniciado';
                    if (status?.includes('S1')) return 'Planejamento';
                    if (status?.includes('S2')) return 'Em Andamento';
                    if (status?.includes('S3')) return 'Parado';
                    if (status?.includes('S4')) return 'Pendências';
                    return status || 'N/A';
                  };

                  return (
                    <TableRow 
  key={project.id} 
  hover 
  onClick={() => handleProjectClick(project)}
  sx={{ cursor: 'pointer' }}
>
                      <TableCell>{project.codigo || 'N/A'}</TableCell>
                      <TableCell>{project.cliente || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(project.status)} 
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={project.prioridade || 'P2'} 
                          color={getPriorityColor(project.prioridade)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: '300px' }}>
                        <Typography variant="body2" noWrap>
                          {project.descricao || 'Sem descrição'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={project.progresso || 0} 
                            sx={{ flexGrow: 1, height: 4 }}
                          />
                          <Typography variant="caption">
                            {project.progresso || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

{/* Modal de detalhes do projeto */}
<ProjectDetailModal
  open={detailModalOpen}
  onClose={() => {
    setDetailModalOpen(false);
    setSelectedProject(null);
  }}
  onUpdate={handleUpdateProject}
  project={selectedProject}
/>
{/* Formulário de projeto */}
<ProjectForm
  open={formOpen}
  onClose={() => {
    setFormOpen(false);
    setEditingProject(null);
  }}
  onSubmit={handleCreateProject}
  project={null}
  title="Novo Projeto"
/>
    </Container>
  );
}

export default Dashboard;