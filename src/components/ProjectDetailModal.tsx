import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  DialogContentText
} from '@mui/material';
import { Grid } from '@mui/material';

import { Edit, Close, Delete } from '@mui/icons-material';
import type { Project } from '../types';
import { deleteProject } from '../services/api';

interface ProjectDetailModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (projectData: Partial<Project>) => void;
  onDelete?: () => void;
  project: Project | null;
}

const statusOptions = [
  'S0 - NÃ£o iniciado',
  'S1 - Em Planejamento',
  'S2 - Em Andamento',
  'S3 - Parado',
  'S4 - PendÃªncias externas',
  'S6 - ConcluÃ­do'
];

const priorityOptions = [
  'P0 - Urgente',
  'P1 - Alta',
  'P2 - Normal',
  'P3 - Baixa',
  'P4 - MÃ­nima'
];

function ProjectDetailModal({ open, onClose, onUpdate, onDelete, project }: ProjectDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nPedido: '',
    cliente: '',
    codigo: '',
    quantidade: '',
    descricao: '',
    prioridade: 'P2 - Normal',
    progresso: 0,
    status: 'S0 - NÃ£o iniciado',
    dataEntradaPlanejamento: '',
    entregaEstimada: '',
    dataInicio: '',
    dataFim: '',
    consultor: '',
    faturado: '',
    observacao: ''
  });

  // Atualiza os dados quando o projeto muda
  useEffect(() => {
    if (project && open) {
      setFormData({
        nPedido: project.nPedido || '',
        cliente: project.cliente || '',
        codigo: project.codigo || '',
        quantidade: project.quantidade || '',
        descricao: project.descricao || '',
        prioridade: project.prioridade || 'P2 - Normal',
        progresso: project.progresso || 0,
        status: project.status || 'S0 - NÃ£o iniciado',
        dataEntradaPlanejamento: project.dataEntradaPlanejamento || '',
        entregaEstimada: project.entregaEstimada || '',
        dataInicio: project.dataInicio || '',
        dataFim: project.dataFim || '',
        consultor: project.consultor || '',
        faturado: project.faturado || '',
        observacao: project.observacao || ''
      });
      setIsEditing(false); // Sempre abre em modo visualizaÃ§Ã£o
    }
  }, [project, open]);

  const handleDelete = async () => {
    if (!project) return;
    
    try {
      await deleteProject(project.id);
      setDeleteDialogOpen(false);
      onClose();
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Restaura os dados originais
    if (project) {
      setFormData({
        nPedido: project.nPedido || '',
        cliente: project.cliente || '',
        codigo: project.codigo || '',
        quantidade: project.quantidade || '',
        descricao: project.descricao || '',
        prioridade: project.prioridade || 'P2 - Normal',
        progresso: project.progresso || 0,
        status: project.status || 'S0 - NÃ£o iniciado',
        dataEntradaPlanejamento: project.dataEntradaPlanejamento || '',
        entregaEstimada: project.entregaEstimada || '',
        dataInicio: project.dataInicio || '',
        dataFim: project.dataFim || '',
        consultor: project.consultor || '',
        faturado: project.faturado || '',
        observacao: project.observacao || ''
      });
    }
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const getPriorityColor = (prioridade: string) => {
    if (prioridade?.includes('P0')) return 'error';
    if (prioridade?.includes('P1')) return 'warning';
    if (prioridade?.includes('P2')) return 'info';
    if (prioridade?.includes('P3')) return 'success';
    return 'default';
  };

  const getStatusLabel = (status: string) => {
    if (status?.includes('S0')) return 'NÃ£o Iniciado';
    if (status?.includes('S1')) return 'Planejamento';
    if (status?.includes('S2')) return 'Em Andamento';
    if (status?.includes('S3')) return 'Parado';
    if (status?.includes('S4')) return 'PendÃªncias';
    if (status?.includes('S6')) return 'ConcluÃ­do';
    return status || 'N/A';
  };

  if (!project) return null;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {isEditing ? 'Editando Projeto' : 'Detalhes do Projeto'}
            </Typography>
            <Box>
              {!isEditing && (
                <>
                  <IconButton onClick={() => setIsEditing(true)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => setDeleteDialogOpen(true)} color="error">
                    <Delete />
                  </IconButton>
                </>
              )}
              <IconButton onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {isEditing && (
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                border: 2, 
                borderColor: 'primary.main', 
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.contrastText'
              }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  âœï¸ Modo de EdiÃ§Ã£o Ativo
                </Typography>
                <Typography variant="body2">
                  Modifique os campos abaixo e clique em "Salvar" para confirmar as alteraÃ§Ãµes.
                </Typography>
              </Box>
            )}

            {!isEditing ? (
              // MODO VISUALIZAÃ‡ÃƒO
              <>
                {/* CabeÃ§alho com cÃ³digo e status */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2">
                      {formData.codigo || 'Sem cÃ³digo'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={getStatusLabel(formData.status)} 
                        color={formData.status?.includes('S2') ? 'primary' : 'default'}
                        variant="filled"
                      />
                      <Chip 
                        label={formData.prioridade || 'P2'} 
                        color={getPriorityColor(formData.prioridade)}
                        variant="filled"
                      />
                    </Box>
                  </Box>
                  
                  {/* Progresso */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progresso do Projeto
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formData.progresso}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={formData.progresso} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* InformaÃ§Ãµes principais */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Cliente
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.cliente || 'NÃ£o informado'}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      NÂ° Pedido
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.nPedido || 'NÃ£o informado'}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Quantidade
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.quantidade || 'NÃ£o informado'}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Consultor
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.consultor || 'NÃ£o informado'}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Faturado
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.faturado || 'NÃ£o informado'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Datas */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Cronograma
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Entrada Planejamento
                      </Typography>
                      <Typography variant="body2">
                        {formData.dataEntradaPlanejamento || 'NÃ£o informado'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Entrega Estimada
                      </Typography>
                      <Typography variant="body2">
                        {formData.entregaEstimada || 'NÃ£o informado'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Data InÃ­cio
                      </Typography>
                      <Typography variant="body2">
                        {formData.dataInicio || 'NÃ£o informado'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Data Fim
                      </Typography>
                      <Typography variant="body2">
                        {formData.dataFim || 'NÃ£o informado'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* DescriÃ§Ã£o */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    DescriÃ§Ã£o
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    bgcolor: 'background.paper', 
                    p: 2, 
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider'
                  }}>
                    {formData.descricao || 'Sem descriÃ§Ã£o'}
                  </Typography>
                </Box>

                {/* ObservaÃ§Ãµes */}
                {formData.observacao && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      ObservaÃ§Ãµes
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      bgcolor: 'background.paper', 
                      p: 2, 
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider'
                    }}>
                      {formData.observacao}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              // MODO EDIÃ‡ÃƒO
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* SeÃ§Ã£o 1: InformaÃ§Ãµes BÃ¡sicas */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                    InformaÃ§Ãµes BÃ¡sicas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="NÂ° Pedido"
                        value={formData.nPedido}
                        onChange={(e) => handleChange('nPedido', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="CÃ³digo"
                        value={formData.codigo}
                        onChange={(e) => handleChange('codigo', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Quantidade"
                        value={formData.quantidade}
                        onChange={(e) => handleChange('quantidade', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        fullWidth
                        label="Cliente"
                        value={formData.cliente}
                        onChange={(e) => handleChange('cliente', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Consultor"
                        value={formData.consultor}
                        onChange={(e) => handleChange('consultor', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="DescriÃ§Ã£o do Projeto"
                        multiline
                        rows={3}
                        value={formData.descricao}
                        onChange={(e) => handleChange('descricao', e.target.value)}
                        required
                        helperText="Descreva detalhadamente o que serÃ¡ desenvolvido"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* SeÃ§Ã£o 2: Status e Prioridade */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                    Status e Controle
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Status do Projeto</InputLabel>
                        <Select
                          value={formData.status}
                          label="Status do Projeto"
                          onChange={(e) => handleChange('status', e.target.value)}
                        >
                          {statusOptions.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Prioridade</InputLabel>
                        <Select
                          value={formData.prioridade}
                          label="Prioridade"
                          onChange={(e) => handleChange('prioridade', e.target.value)}
                        >
                          {priorityOptions.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Progresso (%)"
                        type="number"
                        value={formData.progresso}
                        onChange={(e) => handleChange('progresso', parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0, max: 100 }}
                        helperText={`${formData.progresso}% concluÃ­do`}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Projeto Faturado</InputLabel>
                        <Select
                          value={formData.faturado}
                          label="Projeto Faturado"
                          onChange={(e) => handleChange('faturado', e.target.value)}
                        >
                          <MenuItem value="">NÃ£o informado</MenuItem>
                          <MenuItem value="Sim">Sim</MenuItem>
                          <MenuItem value="NÃ£o">NÃ£o</MenuItem>
                          <MenuItem value="Parcial">Parcial</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* SeÃ§Ã£o 3: Cronograma */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                    Cronograma
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Entrada no Planejamento"
                        type="date"
                        value={formData.dataEntradaPlanejamento}
                        onChange={(e) => handleChange('dataEntradaPlanejamento', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="Data de inÃ­cio do planejamento"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Entrega Estimada"
                        type="date"
                        value={formData.entregaEstimada}
                        onChange={(e) => handleChange('entregaEstimada', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="PrevisÃ£o de entrega"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Data de InÃ­cio Real"
                        type="date"
                        value={formData.dataInicio}
                        onChange={(e) => handleChange('dataInicio', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="Quando realmente comeÃ§ou"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Data de FinalizaÃ§Ã£o"
                        type="date"
                        value={formData.dataFim}
                        onChange={(e) => handleChange('dataFim', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="Quando foi finalizado"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* SeÃ§Ã£o 4: ObservaÃ§Ãµes */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                    ObservaÃ§Ãµes Adicionais
                  </Typography>
                  <TextField
                    fullWidth
                    label="ObservaÃ§Ãµes"
                    multiline
                    rows={4}
                    value={formData.observacao}
                    onChange={(e) => handleChange('observacao', e.target.value)}
                    placeholder="Adicione informaÃ§Ãµes importantes, comentÃ¡rios ou anotaÃ§Ãµes sobre o projeto..."
                  />
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          {isEditing ? (
            <>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                variant="contained"
                disabled={!formData.cliente || !formData.descricao}
              >
                Salvar
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="contained" startIcon={<Edit />}>
              Editar Projeto
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmaÃ§Ã£o de exclusÃ£o */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar ExclusÃ£o</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o projeto <strong>{project?.codigo || 'sem cÃ³digo'}</strong>?
            <br />
            <strong>Esta aÃ§Ã£o nÃ£o pode ser desfeita.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ProjectDetailModal;