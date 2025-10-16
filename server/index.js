import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

// Configuração de mapeamento das colunas da planilha
const COLUMN_MAPPING = {
  nPedido: 'A',
  cliente: 'B', 
  codigo: 'C',
  organizacaoPedidos: 'D',  // Nova coluna 
  quantidade: 'E',          // Moveu de D para E
  categoria: 'F',           // Moveu de E para F
  descricao: 'G',           // Nova coluna 
  prioridade: 'H',          // Moveu de F para H
  progresso: 'I',           // Moveu de G para I
  status: 'J',              // Moveu de H para J
  dataEntradaPlanejamento: 'K', // Moveu de I para K
  entregaEstimada: 'L',         // Moveu de J para L
  dataInicio: 'M',              // Moveu de K para M
  dataFim: 'N',                 // Moveu de L para N
  consultor: 'O',               // Moveu de M para O
  faturado: 'P',                // Moveu de N para P
  observacao: 'Q',              // Moveu de O para Q
  historico: 'R'                // Moveu de P para R
};

// Função utilitária para converter letra da coluna em índice
function columnToIndex(column) {
  return column.charCodeAt(0) - 'A'.charCodeAt(0);
}

// Função utilitária para gerar o range dinamicamente
function generateRange(rowIndex) {
  const columns = Object.values(COLUMN_MAPPING);
  const firstCol = columns[0]; // A
  const lastCol = columns[columns.length - 1]; // O
  return `01-PAINEL DE CONTROLE!${firstCol}${rowIndex}:${lastCol}${rowIndex}`;
}

const app = express();
const PORT = process.env.PORT || 3001;
// Função para converter data DD/MM/YYYY para YYYY-MM-DD
function convertDateToISO(dateString) {
  if (!dateString || dateString.trim() === '') return '';
  
  // Se já está no formato ISO, retorna como está
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
  
  // Converte DD/MM/YYYY para YYYY-MM-DD
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  return dateString; // Se não conseguir converter, retorna original
}

// Função para converter data YYYY-MM-DD para DD/MM/YYYY
function convertDateToBR(dateString) {
  if (!dateString || dateString.trim() === '') return '';
  
  // Se já está no formato BR, retorna como está
  if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateString;
  
  // Converte YYYY-MM-DD para DD/MM/YYYY
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  }
  
  return dateString; // Se não conseguir converter, retorna original
}


// Função para gerar data no formato DD/MM
function getCurrentDateBR() {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

// Função para adicionar nova nota ao histórico
function addToHistory(currentHistory, newNote) {
  if (!newNote || newNote.trim() === '') return currentHistory;
  
  const datePrefix = getCurrentDateBR();
  const formattedNote = `${datePrefix} - ${newNote.trim()}`;
  
  if (!currentHistory || currentHistory.trim() === '') {
    return formattedNote;
  }
  
  return `${currentHistory} | ${formattedNote}`;
}

// Função para parsear histórico em array
function parseHistory(historyString) {
  if (!historyString || historyString.trim() === '') return [];
  
  return historyString.split('|').map(item => item.trim()).filter(item => item);
}
// Middlewares
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin === 'null') {
      // Permite apps Tizen sem origin
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        'https://dashboard-automacao.vercel.app',
        /^https:\/\/dashboard-automacao.*\.vercel\.app$/,
        // Pode manter esse, mas ele provavelmente nunca vai bater
        'tizen://auto123456.DashboardTV' 
      ];

      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        }
        return allowedOrigin.test(origin);
      });

      return callback(null, isAllowed);
    } else {
      const allowedOrigins = [
        'http://localhost:5173', 
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        null
      ];
      return callback(null, allowedOrigins.includes(origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(morgan('combined'));
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  credentials: process.env.NODE_ENV === 'production' 
    ? JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf-8'))
    : undefined,
  keyFile: process.env.NODE_ENV === 'production' ? undefined : process.env.GOOGLE_APPLICATION_CREDENTIALS,
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
      nPedido: row[columnToIndex(COLUMN_MAPPING.nPedido)] || '',
      cliente: row[columnToIndex(COLUMN_MAPPING.cliente)] || '',
      codigo: row[columnToIndex(COLUMN_MAPPING.codigo)] || '',
      organizacaoPedidos: row[columnToIndex(COLUMN_MAPPING.organizacaoPedidos)] || '',
      quantidade: row[columnToIndex(COLUMN_MAPPING.quantidade)] || '',
      categoria: row[columnToIndex(COLUMN_MAPPING.categoria)] || '',
      descricao: row[columnToIndex(COLUMN_MAPPING.descricao)] || '',
      prioridade: row[columnToIndex(COLUMN_MAPPING.prioridade)] || '',
      progresso: parseInt(row[columnToIndex(COLUMN_MAPPING.progresso)]) || 0,
      status: row[columnToIndex(COLUMN_MAPPING.status)] || '',
      dataEntradaPlanejamento: convertDateToISO(row[columnToIndex(COLUMN_MAPPING.dataEntradaPlanejamento)] || ''),
      entregaEstimada: convertDateToISO(row[columnToIndex(COLUMN_MAPPING.entregaEstimada)] || ''),
      dataInicio: convertDateToISO(row[columnToIndex(COLUMN_MAPPING.dataInicio)] || ''),
      dataFim: convertDateToISO(row[columnToIndex(COLUMN_MAPPING.dataFim)] || ''),
      consultor: row[columnToIndex(COLUMN_MAPPING.consultor)] || '',
      faturado: row[columnToIndex(COLUMN_MAPPING.faturado)] || '',
      observacao: row[columnToIndex(COLUMN_MAPPING.observacao)] || '',
      historico: row[columnToIndex(COLUMN_MAPPING.historico)] || ''
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
    const clienteColumn = COLUMN_MAPPING.cliente;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `01-PAINEL DE CONTROLE!${clienteColumn}9:${clienteColumn}1000`,
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
      projectData.organizacaoPedidos,
      projectData.quantidade,
      projectData.categoria,
      projectData.descricao,
      projectData.prioridade,
      projectData.progresso,
      projectData.status,
      convertDateToBR(projectData.dataEntradaPlanejamento),
      convertDateToBR(projectData.entregaEstimada),
      convertDateToBR(projectData.dataInicio),
      convertDateToBR(projectData.dataFim),
      projectData.consultor,
      projectData.faturado,
      projectData.observacao,
      projectData.historico || ''
    ]];

const range = generateRange(newRowIndex);
    
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
      projectData.organizacaoPedidos,
      projectData.quantidade,
      projectData.categoria,
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
      projectData.observacao,
      projectData.historico || ''
    ]];

const range = generateRange(rowIndex);
    
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
      organizacaoPedidos: req.body.organizacaoPedidos || '',
      quantidade: req.body.quantidade || '',
      categoria: req.body.categoria || '',
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
      observacao: req.body.observacao || '',
      historico: req.body.historico || ''
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
      organizacaoPedidos: req.body.organizacaoPedidos || '',
      quantidade: req.body.quantidade || '',
      categoria: req.body.categoria || '',
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
      observacao: req.body.observacao || '',
      historico: req.body.historico || ''
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