import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Configuração Google Sheets
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Cache dos dados
let cachedData = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// Função para buscar dados do Google Sheets
async function fetchSheetsData() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: process.env.GOOGLE_SHEETS_RANGE,
    });
    
    const rows = response.data.values || [];
    
    return rows.map((row, index) => ({
      id: index + 1,
      rowIndex: index + 9, // Começa na linha 9
      nPedido: row[0] || '',
      cliente: row[1] || '',
      codigo: row[2] || '',
      quantidade: row[3] || '',
      descricao: row[4] || '',
      prioridade: row[5] || '',
      progresso: parseInt(row[6]) || 0,
      status: row[7] || '',
      dataEntradaPlanejamento: row[8] || '',
      entregaEstimada: row[9] || '',
      dataInicio: row[10] || '',
      dataFim: row[11] || '',
      consultor: row[12] || '',
      faturado: row[13] || '',
      observacao: row[14] || ''
    }));
  } catch (error) {
    console.error('Erro ao buscar dados do Google Sheets:', error);
    return [];
  }
}

async function getCachedData() {
  const now = Date.now();
  if (now - lastFetch > CACHE_DURATION) {
    cachedData = await fetchSheetsData();
    lastFetch = now;
  }
  return cachedData;
}

// Função para encontrar a última linha com dados
async function findLastDataRow() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: '01-PAINEL DE CONTROLE!B9:B1000', // Coluna cliente
    });
    
    const rows = response.data.values || [];
    
    // Encontra a última linha que tem dados na coluna cliente
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i] && rows[i][0] && rows[i][0].trim() !== '') {
        return i + 9; // +9 porque começamos na linha 9
      }
    }
    
    return 9; // Se não encontrar nada, usa linha 9
  } catch (error) {
    console.error('Erro ao encontrar última linha:', error);
    return 9;
  }
}

// Função para inserir nova linha na planilha
async function insertNewRowAfter(rowIndex) {
  try {
    console.log(`Inserindo nova linha após a linha ${rowIndex}`);
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: 1675794978, // ID da aba "01-PAINEL DE CONTROLE"
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // Google Sheets usa 0-indexed
                endIndex: rowIndex
              },
              inheritFromBefore: true // Herda formatação da linha anterior
            }
          }
        ]
      }
    });
    
    console.log(`Nova linha inserida com sucesso na posição ${rowIndex}`);
    return true;
  } catch (error) {
    console.error('Erro ao inserir linha:', error);
    throw error;
  }
}

// Função para adicionar projeto na planilha
async function addProjectToSheet(projectData) {
  try {
    console.log('1. Iniciando addProjectToSheet...');
    
    // 1. Encontra a última linha com dados
    const lastDataRow = await findLastDataRow();
    console.log('2. Última linha com dados:', lastDataRow);
    
    // 2. Insere uma nova linha após a última linha com dados
    await insertNewRowAfter(lastDataRow + 1);
    console.log('3. Nova linha inserida na posição:', lastDataRow + 1);
    
    // 3. Preenche a nova linha
    const newRowIndex = lastDataRow + 1;
    
    const values = [[
      projectData.nPedido,
      projectData.cliente,
      projectData.codigo,
      projectData.quantidade,
      projectData.descricao,
      projectData.prioridade,
      projectData.progresso,
      projectData.status,
      projectData.dataEntradaPlanejamento,
      projectData.entregaEstimada,
      projectData.dataInicio,
      projectData.dataFim,
      projectData.consultor,
      projectData.faturado,
      projectData.observacao
    ]];

    const range = `01-PAINEL DE CONTROLE!A${newRowIndex}:O${newRowIndex}`;
    console.log('4. Preenchendo range:', range);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    console.log('5. Projeto adicionado com sucesso!');
    
    // Invalidar cache
    lastFetch = 0;
    
    return true;
  } catch (error) {
    console.error('Erro detalhado ao adicionar projeto:', error);
    throw error;
  }
}

// Função para atualizar projeto na planilha
async function updateProjectInSheet(rowIndex, projectData) {
  try {
    const values = [[
      projectData.nPedido,
      projectData.cliente,
      projectData.codigo,
      projectData.quantidade,
      projectData.descricao,
      projectData.prioridade,
      projectData.progresso,
      projectData.status,
      projectData.dataEntradaPlanejamento,
      projectData.entregaEstimada,
      projectData.dataInicio,
      projectData.dataFim,
      projectData.consultor,
      projectData.faturado,
      projectData.observacao
    ]];

    const range = `01-PAINEL DE CONTROLE!A${rowIndex}:O${rowIndex}`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    // Invalidar cache
    lastFetch = 0;
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    throw error;
  }
}

// Rotas
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dashboard API funcionando com Service Account!' });
});

app.get('/api/projects', async (req, res) => {
  try {
    const data = await getCachedData();
    const { status, prioridade } = req.query;
    
    let filtered = data;
    
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    if (prioridade) {
      filtered = filtered.filter(p => p.prioridade === prioridade);
    }
    
    filtered.sort((a, b) => {
      const aPrio = a.prioridade.includes('P0') ? 0 : a.prioridade.includes('P1') ? 1 : a.prioridade.includes('P2') ? 2 : a.prioridade.includes('P3') ? 3 : 4;
      const bPrio = b.prioridade.includes('P0') ? 0 : b.prioridade.includes('P1') ? 1 : b.prioridade.includes('P2') ? 2 : b.prioridade.includes('P3') ? 3 : 4;
      return aPrio - bPrio;
    });
    
    res.json(filtered);
  } catch (error) {
    console.error('Erro na rota /api/projects:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/refresh', async (req, res) => {
  try {
    cachedData = await fetchSheetsData();
    lastFetch = Date.now();
    res.json({ message: 'Cache atualizado com sucesso', count: cachedData.length });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cache' });
  }
});

// POST - Criar novo projeto
app.post('/api/projects', async (req, res) => {
  try {
    const projectData = {
      nPedido: req.body.nPedido || '',
      cliente: req.body.cliente || '',
      codigo: req.body.codigo || '',
      quantidade: req.body.quantidade || '',
      descricao: req.body.descricao || '',
      prioridade: req.body.prioridade || 'P2 - Normal',
      progresso: req.body.progresso || 0,
      status: req.body.status || 'S0 - Não iniciado',
      dataEntradaPlanejamento: req.body.dataEntradaPlanejamento || '',
      entregaEstimada: req.body.entregaEstimada || '',
      dataInicio: req.body.dataInicio || '',
      dataFim: req.body.dataFim || '',
      consultor: req.body.consultor || '',
      faturado: req.body.faturado || '',
      observacao: req.body.observacao || ''
    };

    await addProjectToSheet(projectData);
    res.json({ message: 'Projeto criado com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

// PUT - Atualizar projeto existente
app.put('/api/projects/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    // Buscar o projeto atual para pegar o rowIndex
    const currentData = await getCachedData();
    const project = currentData.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const projectData = {
      nPedido: req.body.nPedido || '',
      cliente: req.body.cliente || '',
      codigo: req.body.codigo || '',
      quantidade: req.body.quantidade || '',
      descricao: req.body.descricao || '',
      prioridade: req.body.prioridade || 'P2 - Normal',
      progresso: req.body.progresso || 0,
      status: req.body.status || 'S0 - Não iniciado',
      dataEntradaPlanejamento: req.body.dataEntradaPlanejamento || '',
      entregaEstimada: req.body.entregaEstimada || '',
      dataInicio: req.body.dataInicio || '',
      dataFim: req.body.dataFim || '',
      consultor: req.body.consultor || '',
      faturado: req.body.faturado || '',
      observacao: req.body.observacao || ''
    };

    await updateProjectInSheet(project.rowIndex, projectData);
    res.json({ message: 'Projeto atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
});
// DELETE - Deletar projeto existente
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    // Buscar o projeto atual para pegar o rowIndex
    const currentData = await getCachedData();
    const project = currentData.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    // Deletar a linha na planilha
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 1675794978, // ID da aba "01-PAINEL DE CONTROLE"
                dimension: 'ROWS',
                startIndex: project.rowIndex - 1, // Google Sheets usa 0-indexed
                endIndex: project.rowIndex
              }
            }
          }
        ]
      }
    });
    
    // Invalidar cache
    lastFetch = 0;
    
    res.json({ message: 'Projeto deletado com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({ error: 'Erro ao deletar projeto' });
  }
});
// Debug - Descobrir sheetId
app.get('/api/debug/sheets', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    });
    
    const sheetsInfo = response.data.sheets.map(sheet => ({
      title: sheet.properties.title,
      sheetId: sheet.properties.sheetId
    }));
    
    res.json(sheetsInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug - Ver breakdown de status
app.get('/api/debug/status', async (req, res) => {
  try {
    const data = await getCachedData();
    
    const statusCount = {};
    data.forEach(project => {
      const status = project.status || 'VAZIO';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    res.json({
      totalProjects: data.length,
      statusBreakdown: statusCount,
      sampleProject: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});