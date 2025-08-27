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

import { Edit, Close, Delete, Add, ContentCopy } from '@mui/icons-material';
import type { Project } from '../types';
import { deleteProject } from '../services/api';
import { createProject, refreshData } from '../services/api';
interface ProjectDetailModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (projectData: Partial<Project>) => void;
  onDelete?: () => void;
  project: Project | null;
}

const statusOptions = [
  'S0 - Não iniciado',
  'S1 - Em Planejamento',
  'S2 - Em Andamento',
  'S3 - Parado',
  'S4 - Pendências externas',
  'S6 - Concluído'
];

const priorityOptions = [
  'P0 - Urgente',
  'P1 - Alta',
  'P2 - Normal',
  'P3 - Baixa',
  'P4 - Mínima'
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
    status: 'S0 - Não iniciado',
    dataEntradaPlanejamento: '',
    entregaEstimada: '',
    dataInicio: '',
    dataFim: '',
    consultor: '',
    faturado: '',
    observacao: '',
    historico: ''
  });
  
  const [newHistoryNote, setNewHistoryNote] = useState('');
  const [showHistoryForm, setShowHistoryForm] = useState(false);
const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
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
        status: project.status || 'S0 - Não iniciado',
        dataEntradaPlanejamento: project.dataEntradaPlanejamento || '',
        entregaEstimada: project.entregaEstimada || '',
        dataInicio: project.dataInicio || '',
        dataFim: project.dataFim || '',
        consultor: project.consultor || '',
        faturado: project.faturado || '',
        observacao: project.observacao || '',
        historico: project.historico || ''
      });
      setIsEditing(false);
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
    if (project) {
      setFormData({
        nPedido: project.nPedido || '',
        cliente: project.cliente || '',
        codigo: project.codigo || '',
        quantidade: project.quantidade || '',
        descricao: project.descricao || '',
        prioridade: project.prioridade || 'P2 - Normal',
        progresso: project.progresso || 0,
        status: project.status || 'S0 - Não iniciado',
        dataEntradaPlanejamento: project.dataEntradaPlanejamento || '',
        entregaEstimada: project.entregaEstimada || '',
        dataInicio: project.dataInicio || '',
        dataFim: project.dataFim || '',
        consultor: project.consultor || '',
        faturado: project.faturado || '',
        observacao: project.observacao || '',
        historico: project.historico || ''
      });
    }
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const parseHistoryEntries = (historyString: string) => {
    if (!historyString || historyString.trim() === '') return [];
    return historyString.split('|').map(item => item.trim()).filter(item => item);
  };

  const handleAddHistoryNote = () => {
    if (!newHistoryNote.trim()) return;
    
    const currentHistory = formData.historico || '';
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const datePrefix = `${day}/${month}`;
    const formattedNote = `${datePrefix} - ${newHistoryNote.trim()}`;
    
    const updatedHistory = currentHistory 
      ? `${currentHistory} | ${formattedNote}`
      : formattedNote;
    
    setFormData(prev => ({ ...prev, historico: updatedHistory }));
    setNewHistoryNote('');
    setShowHistoryForm(false);
  };

  const getPriorityColor = (prioridade: string) => {
    if (prioridade?.includes('P0')) return 'error';
    if (prioridade?.includes('P1')) return 'warning';
    if (prioridade?.includes('P2')) return 'info';
    if (prioridade?.includes('P3')) return 'success';
    return 'default';
  };
const handleDuplicate = async () => {
  if (!project) return;
  
  const duplicatedProject = {
    nPedido: project.nPedido || '',
    cliente: project.cliente || '',
    codigo: `${project.codigo}_COPY`,
    quantidade: project.quantidade || '',
    descricao: project.descricao || '',
    prioridade: project.prioridade || 'P2 - Normal',
    progresso: 0,
    status: 'S0 - Não iniciado',
    dataEntradaPlanejamento: project.dataEntradaPlanejamento || '',
    entregaEstimada: project.entregaEstimada || '',
    dataInicio: '',
    dataFim: '',
    consultor: project.consultor || '',
    faturado: '',
    observacao: project.observacao ? `[DUPLICADO] ${project.observacao}` : '[DUPLICADO]',
    historico: ''
  };
  
  try {
    await createProject(duplicatedProject);
    await refreshData();
    setShowDuplicateConfirm(false);
    onClose(); // Fecha o modal após duplicar
  } catch (error) {
    console.error('Erro ao duplicar projeto:', error);
  }
};
  const getStatusLabel = (status: string) => {
    if (status?.includes('S0')) return 'Não Iniciado';
    if (status?.includes('S1')) return 'Planejamento';
    if (status?.includes('S2')) return 'Em Andamento';
    if (status?.includes('S3')) return 'Parado';
    if (status?.includes('S4')) return 'Pendências';
    if (status?.includes('S6')) return 'Concluído';
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
    <IconButton onClick={() => setShowDuplicateConfirm(true)} color="info">
      <ContentCopy />
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
                  Modo de Edição Ativo
                </Typography>
                <Typography variant="body2">
                  Modifique os campos abaixo e clique em "Salvar" para confirmar as alterações.
                </Typography>
              </Box>
            )}

            {!isEditing ? (
              // MODO VISUALIZAÇÃO
              <>
                {/* Cabeçalho com código e status */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2">
                      {formData.codigo || 'Sem código'}
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

                {/* Informações principais */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Cliente
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.cliente || 'Não informado'}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      N° Pedido
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.nPedido || 'Não informado'}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Quantidade
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.quantidade || 'Não informado'}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Consultor
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.consultor || 'Não informado'}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Faturado
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formData.faturado || 'Não informado'}
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
                        {formData.dataEntradaPlanejamento || 'Não informado'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Entrega Estimada
                      </Typography>
                      <Typography variant="body2">
                        {formData.entregaEstimada || 'Não informado'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Data Início
                      </Typography>
                      <Typography variant="body2">
                        {formData.dataInicio || 'Não informado'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Data Fim
                      </Typography>
                      <Typography variant="body2">
                        {formData.dataFim || 'Não informado'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Descrição */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Descrição
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    bgcolor: 'background.paper', 
                    p: 2, 
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider'
                  }}>
                    {formData.descricao || 'Sem descrição'}
                  </Typography>
                </Box>

                {/* Observações */}
                {formData.observacao && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Observações
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

                {/* Histórico */}
                {(formData.historico || parseHistoryEntries(formData.historico).length > 0) && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Histórico do Projeto
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'background.paper', 
                      p: 2, 
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider'
                    }}>
                      {parseHistoryEntries(formData.historico).map((entry, index) => (
                        <Typography 
                          key={index} 
                          variant="body2" 
                          sx={{ 
                            mb: index < parseHistoryEntries(formData.historico).length - 1 ? 1 : 0,
                            '&:before': {
                              content: '"•"',
                              marginRight: 1,
                              color: 'primary.main',
                              fontWeight: 'bold'
                            }
                          }}
                        >
                          {entry}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              // MODO EDIÇÃO
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Seção 1: Informações Básicas */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                    Informações Básicas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="N° Pedido"
                        value={formData.nPedido}
                        onChange={(e) => handleChange('nPedido', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Código"
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
                        label="Descrição do Projeto"
                        multiline
                        rows={3}
                        value={formData.descricao}
                        onChange={(e) => handleChange('descricao', e.target.value)}
                        required
                        helperText="Descreva detalhadamente o que será desenvolvido"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Seção 2: Status e Prioridade */}
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
                        helperText={`${formData.progresso}% concluído`}
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
                          <MenuItem value="">Não informado</MenuItem>
                          <MenuItem value="Sim">Sim</MenuItem>
                          <MenuItem value="Não">Não</MenuItem>
                          <MenuItem value="Parcial">Parcial</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Seção 3: Cronograma */}
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
                        helperText="Data de início do planejamento"
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
                        helperText="Previsão de entrega"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Data de Início Real"
                        type="date"
                        value={formData.dataInicio}
                        onChange={(e) => handleChange('dataInicio', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="Quando realmente começou"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Data de Finalização"
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

                {/* Seção 4: Observações */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                    Observações Adicionais
                  </Typography>
                  <TextField
                    fullWidth
                    label="Observações"
                    multiline
                    rows={4}
                    value={formData.observacao}
                    onChange={(e) => handleChange('observacao', e.target.value)}
                    placeholder="Adicione informações importantes, comentários ou anotações sobre o projeto..."
                  />
                </Box>

                <Divider />

                {/* Seção 5: Histórico */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                      Histórico do Projeto
                    </Typography>
                    <Button
                      startIcon={<Add />}
                      onClick={() => setShowHistoryForm(!showHistoryForm)}
                      size="small"
                      variant="outlined"
                    >
                      {showHistoryForm ? 'Cancelar' : 'Adicionar Nota'}
                    </Button>
                  </Box>
                  
                  {/* Histórico existente */}
                  {parseHistoryEntries(formData.historico).length > 0 && (
                    <Box sx={{ 
  mb: 2, 
  p: 2, 
  borderRadius: 1,
  border: 1,
  borderColor: 'divider',
  bgcolor: 'background.paper'
}}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Notas Anteriores:
                      </Typography>
                      {parseHistoryEntries(formData.historico).map((entry, index) => (
                        <Typography 
                          key={index} 
                          variant="body2" 
                          sx={{ 
                            mb: 0.5,
                            '&:before': {
                              content: '"•"',
                              marginRight: 1,
                              color: 'primary.main'
                            }
                          }}
                        >
                          {entry}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  
                  {/* Formulário para nova nota */}
                  {showHistoryForm && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField
                        fullWidth
                        label="Nova nota do histórico"
                        value={newHistoryNote}
                        onChange={(e) => setNewHistoryNote(e.target.value)}
                        placeholder="Ex: Material chegou, reunião realizada..."
                        helperText={`Data será adicionada automaticamente: ${new Date().getDate().toString().padStart(2, '0')}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}`}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddHistoryNote}
                        disabled={!newHistoryNote.trim()}
                      >
                        Adicionar
                      </Button>
                    </Box>
                  )}
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
{/* Dialog de confirmação de duplicação */}
<Dialog open={showDuplicateConfirm} onClose={() => setShowDuplicateConfirm(false)}>
  <DialogTitle>Duplicar Projeto</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Deseja criar uma cópia do projeto <strong>{project?.codigo}</strong>?
      <br />
      A cópia terá progresso zerado e status "Não iniciado".
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowDuplicateConfirm(false)}>
      Cancelar
    </Button>
    <Button onClick={handleDuplicate} variant="contained" startIcon={<ContentCopy />}>
      Duplicar
    </Button>
  </DialogActions>
</Dialog>
      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o projeto <strong>{project?.codigo || 'sem código'}</strong>?
            <br />
            <strong>Esta ação não pode ser desfeita.</strong>
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