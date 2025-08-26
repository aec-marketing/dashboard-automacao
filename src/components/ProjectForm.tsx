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

import type { Project } from '../types';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (projectData: Partial<Project>) => void;
  project?: Project | null;
  title: string;
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

function ProjectForm({ open, onClose, onSubmit, project, title }: ProjectFormProps) {
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
    consultor: '',
    observacao: ''
  });

  // Atualiza o formulÃ¡rio quando o projeto muda ou quando o modal abre
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
        consultor: project.consultor || '',
        observacao: project.observacao || ''
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
        status: 'S0 - NÃ£o iniciado',
        dataEntradaPlanejamento: '',
        entregaEstimada: '',
        consultor: '',
        observacao: ''
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
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
        rows={3}
        value={formData.observacao}
        onChange={(e) => handleChange('observacao', e.target.value)}
        placeholder="Adicione informaÃ§Ãµes importantes, comentÃ¡rios ou anotaÃ§Ãµes sobre o projeto..."
      />
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