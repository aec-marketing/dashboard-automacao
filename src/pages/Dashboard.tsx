import { Container, Typography, Card, CardContent, Box, Button, Chip, LinearProgress, IconButton, ToggleButton, ToggleButtonGroup, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, InputAdornment, Skeleton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { Add, Refresh, ChevronLeft, ChevronRight, ViewList, ViewModule, Search, Clear } from '@mui/icons-material';
import { getProjectsInProgress, getProjectsPending, getProjectsNotStarted, getProjectsCompleted, getProjectsInPlanning, getProjectsStopped, createProject, updateProject, refreshData } from '../services/api';
import type { Project } from '../types';
import ProjectForm from '../components/ProjectForm';
import ProjectDetailModal from '../components/ProjectDetailModal.tsx';
import { useNotification } from '../contexts/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function Dashboard() {
  // Estados dos dados
  const [projectsInProgress, setProjectsInProgress] = useState<Project[]>([]);
  const [projectsPending, setProjectsPending] = useState<Project[]>([]);
  const [projectsNotStarted, setProjectsNotStarted] = useState<Project[]>([]);
  const [projectsCompleted, setProjectsCompleted] = useState<Project[]>([]);
  const [projectsPlanning, setProjectsPlanning] = useState<Project[]>([]);
  const [projectsStopped, setProjectsStopped] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados da interface
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('inProgress');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Estados de loading
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [chartType, setChartType] = useState<'status' | 'priority' | 'progress'>('status');
  
  // Hooks
  const { showSuccess, showError, showInfo } = useNotification();
  const itemsPerPage = 6;

  // Funções utilitárias
  const getFilteredProjects = (projects: Project[]) => {
    let filtered = projects;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(project => 
        (project.codigo?.toLowerCase() || '').includes(query) ||
        (project.cliente?.toLowerCase() || '').includes(query) ||
        (project.descricao?.toLowerCase() || '').includes(query) ||
        (project.nPedido?.toLowerCase() || '').includes(query)
      );
    }
    
    if (priorityFilter) {
      filtered = filtered.filter(project => 
        project.prioridade?.includes(priorityFilter)
      );
    }
    
    if (clientFilter) {
      filtered = filtered.filter(project => 
        project.cliente?.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getAllActiveProjects = () => {
    const allProjects = [
      ...projectsNotStarted,
      ...projectsPlanning,
      ...projectsInProgress,
      ...projectsStopped,
      ...projectsPending
    ].sort((a, b) => {
      if (a.prioridade !== b.prioridade) {
        return (a.prioridade || 'P2').localeCompare(b.prioridade || 'P2');
      }
      return (a.status || '').localeCompare(b.status || '');
    });
    
    return getFilteredProjects(allProjects);
  };

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

  const calculateKPIs = () => {
    const allProjects = [
      ...projectsNotStarted, ...projectsPlanning, ...projectsInProgress,
      ...projectsStopped, ...projectsPending, ...projectsCompleted
    ];
    
    const completedProjects = projectsCompleted.filter(p => p.dataFim && p.entregaEstimada);
    const onTimeProjects = completedProjects.filter(p => {
      if (!p.dataFim || !p.entregaEstimada) return false;
      const finishDate = new Date(p.dataFim);
      const estimatedDate = new Date(p.entregaEstimada);
      return finishDate <= estimatedDate;
    });
    const onTimeRate = completedProjects.length > 0 ? Math.round((onTimeProjects.length / completedProjects.length) * 100) : 0;
    
    const criticalProjects = [...projectsInProgress, ...projectsStopped, ...projectsPending]
      .filter(p => p.prioridade?.includes('P0') || p.prioridade?.includes('P1'));
    
    const completedWithDates = projectsCompleted.filter(p => 
      p.dataEntradaPlanejamento && p.dataFim
    );
    const avgDays = completedWithDates.length > 0 ? 
      Math.round(completedWithDates.reduce((acc, p) => {
        const start = new Date(p.dataEntradaPlanejamento);
        const end = new Date(p.dataFim);
        const days = Math.abs((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0) / completedWithDates.length) : 0;
    
    return {
      onTimeRate,
      criticalProjects: criticalProjects.length,
      avgDays,
      totalActive: allProjects.length - projectsCompleted.length,
      progressRate: Math.round((projectsCompleted.length / allProjects.length) * 100)
    };
  };

  const getChartData = () => {
    const activeProjects = [
      ...projectsNotStarted, ...projectsPlanning, ...projectsInProgress,
      ...projectsStopped, ...projectsPending
    ];
    
    switch (chartType) {
      case 'status':
        return [
          { name: 'Não Iniciados', value: projectsNotStarted.length, color: '#9e9e9e' },
          { name: 'Planejamento', value: projectsPlanning.length, color: '#2196f3' },
          { name: 'Em Andamento', value: projectsInProgress.length, color: '#4caf50' },
          { name: 'Parados', value: projectsStopped.length, color: '#f44336' },
          { name: 'Pendências', value: projectsPending.length, color: '#ff9800' }
        ].filter(item => item.value > 0);
        
      case 'priority': {
        const priorities = ['P0', 'P1', 'P2', 'P3', 'P4'];
        const colors = ['#f44336', '#ff9800', '#2196f3', '#4caf50', '#9e9e9e'];
        return priorities.map((priority, index) => ({
          name: priority,
          value: activeProjects.filter(p => p.prioridade?.includes(priority)).length,
          color: colors[index]
        })).filter(item => item.value > 0);
      }
        
      case 'progress':
        return [
          { name: '0-25%', value: activeProjects.filter(p => (p.progresso || 0) <= 25).length, color: '#f44336' },
          { name: '26-50%', value: activeProjects.filter(p => (p.progresso || 0) > 25 && (p.progresso || 0) <= 50).length, color: '#ff9800' },
          { name: '51-75%', value: activeProjects.filter(p => (p.progresso || 0) > 50 && (p.progresso || 0) <= 75).length, color: '#2196f3' },
          { name: '76-100%', value: activeProjects.filter(p => (p.progresso || 0) > 75).length, color: '#4caf50' }
        ].filter(item => item.value > 0);
        
      default:
        return [];
    }
  };

  // Funções para indicadores visuais
  const getPriorityColor = (prioridade: string) => {
    if (prioridade.includes('P0')) return 'error';
    if (prioridade.includes('P1')) return 'warning';
    if (prioridade.includes('P2')) return 'info';
    if (prioridade.includes('P3')) return 'success';
    return 'default';
  };

  const getStatusIndicator = (project: Project) => {
    // Projeto P0 com progresso baixo = crítico
    if (project.prioridade?.includes('P0') && (project.progresso || 0) < 50) {
      return { color: 'error', pulse: true };
    }
    // Projeto atrasado (sem data fim mas passou da estimada)
    if (project.entregaEstimada && !project.dataFim) {
      const today = new Date();
      const estimated = new Date(project.entregaEstimada);
      if (today > estimated) {
        return { color: 'warning', pulse: false };
      }
    }
    return null;
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

  // Funções de dados
  const loadData = useCallback(async (showLoadingMessage = false) => {
    try {
      setLoading(true);
      if (showLoadingMessage) {
        showInfo('Carregando dados da planilha...');
      }
      
      const [inProgress, pending, notStarted, planning, stopped, completed] = await Promise.all([
        getProjectsInProgress(),
        getProjectsPending(),
        getProjectsNotStarted(),
        getProjectsInPlanning(),
        getProjectsStopped(),
        getProjectsCompleted()
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

  // Handlers de ações
  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      setIsCreating(true);
      showInfo('Criando novo projeto...');
      await createProject(projectData);
      await refreshData();
      await loadData();
      showSuccess(`Projeto "${projectData.codigo || 'sem código'}" criado com sucesso!`);
      setFormOpen(false);
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

  // Effects
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Render loading
  if (loading) {
    return (
      <Box sx={{ 
  width: '100vw',
  display: 'flex', 
  justifyContent: 'center',
  px: 2,
  mt: 4, 
  mb: 4 
}}>
  <Box sx={{ 
    width: '100%', 
    maxWidth: '1200px'
  }}>        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
  </Box>
</Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3 } }}>      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard - Gestão de Projetos</Typography>
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

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
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
              <MenuItem key={client} value={client}>
                {client.length > 20 ? client.substring(0, 20) + '...' : client}
              </MenuItem>
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

      {/* Cards Executivos */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Projetos Ativos</Typography>
            <Typography variant="h3" color="primary">
              {calculateKPIs().totalActive}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {projectsCompleted.length} concluídos
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Em Andamento</Typography>
            <Typography variant="h3" color="success.main">
              {projectsInProgress.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {projectsStopped.length} parados
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Críticos</Typography>
            <Typography variant="h3" color="error.main">
              {calculateKPIs().criticalProjects}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              P0 e P1 pendentes
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Taxa no Prazo</Typography>
            <Typography variant="h3" color={calculateKPIs().onTimeRate >= 80 ? "success.main" : "warning.main"}>
              {calculateKPIs().onTimeRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Projetos entregues no prazo
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Progresso Geral</Typography>
            <Typography variant="h3" color="info.main">
              {calculateKPIs().progressRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Do portfólio concluído
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Typography variant="h6">Tempo Médio</Typography>
            <Typography variant="h3" color="text.secondary">
              {calculateKPIs().avgDays}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              dias para conclusão
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Seção de Gráficos */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Análise Visual</Typography>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(_, newType) => newType && setChartType(newType)}
            size="small"
          >
            <ToggleButton value="status">Status</ToggleButton>
            <ToggleButton value="priority">Prioridade</ToggleButton>
            <ToggleButton value="progress">Progresso</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Card>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Seção de Projetos */}
      <Box>
        {/* Controles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newViewMode) => {
                if (newViewMode !== null) {
                  setViewMode(newViewMode);
                  setCurrentPage(0);
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

        {/* Conteúdo: Cards ou Lista */}
        {viewMode === 'cards' ? (
          <>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 220px)',
              gap: 2,
              overflow: 'hidden'
            }}>
              {getCurrentProjects().slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((project) => {
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                          {project.codigo || 'Sem código'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getStatusIndicator(project) && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: `${getStatusIndicator(project)?.color}.main`,
                                animation: getStatusIndicator(project)?.pulse ? 'pulse 2s infinite' : 'none',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.5 },
                                  '100%': { opacity: 1 }
                                }
                              }}
                            />
                          )}
                          <Chip 
                            label={project.prioridade || 'P2'} 
                            color={getPriorityColor(project.prioridade || 'P2')}
                            size="small"
                            variant="filled"
                          />
                        </Box>
                      </Box>
                      
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
                      
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          <strong>Cliente:</strong> {(project.cliente || 'Sem cliente').substring(0, 20)}
                          {project.cliente && project.cliente.length > 20 ? '...' : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Pedido:</strong> {project.nPedido || 'Sem pedido'}
                        </Typography>
                      </Box>
                      
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getStatusIndicator(project) && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: `${getStatusIndicator(project)?.color}.main`,
                                animation: getStatusIndicator(project)?.pulse ? 'pulse 2s infinite' : 'none',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.5 },
                                  '100%': { opacity: 1 }
                                }
                              }}
                            />
                          )}
                          <Chip 
                            label={project.prioridade || 'P2'} 
                            color={getPriorityColor(project.prioridade || 'P2')}
                            size="small"
                            variant="filled"
                          />
                        </Box>
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

      {/* Modals */}
      <ProjectDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedProject(null);
        }}
        onUpdate={handleUpdateProject}
        project={selectedProject}
      />

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