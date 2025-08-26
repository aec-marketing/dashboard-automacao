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
  Divider
} from '@mui/material';
import { Grid } from '@mui/material';
import { Add } from '@mui/icons-material';

import type { Project } from '../types';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (projectData: Partial<Project>) => void;
  project?: Project | null;
  title: string;
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

function ProjectForm({ open, onClose, onSubmit, project, title }: ProjectFormProps) {
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
    consultor: '',
    observacao: '',
    historico: ''
  });

  const [newHistoryNote, setNewHistoryNote] = useState('');
  const [showHistoryForm, setShowHistoryForm] = useState(false);

  // Atualiza o formulário quando o projeto muda ou quando o modal abre
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
        consultor: project.consultor || '',
        observacao: project.observacao || '',
        historico: project.historico || ''
      });
    } else if (!project && open) {
      // Reset para projeto novo
      setFormData({
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
        consultor: '',
        observacao: '',
        historico: ''
      });
    }
  }, [project, open]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
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

  const parseHistoryEntries = (historyString: string): string[] => {
    if (!historyString || historyString.trim() === '') return [];
    return historyString.split('|').map(item => item.trim()).filter(item => item);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
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
                rows={3}
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
                    Notas do Histórico:
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
                    label="Nota para o histórico"
                    value={newHistoryNote}
                    onChange={(e) => setNewHistoryNote(e.target.value)}
                    placeholder="Ex: Primeira reunião realizada, requisitos definidos..."
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!formData.cliente || !formData.descricao}
        >
          {project ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProjectForm;