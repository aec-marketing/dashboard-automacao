export interface Project {
  id: number;
  rowIndex?: number;
  nPedido: string;
  cliente: string;
  codigo: string;
  organizacaoPedidos: string; // Novo campo
  quantidade: string;
  descricao: string;
  categoria: string; // Novo campo
  prioridade: string;
  progresso: number;
  status: string;
  dataEntradaPlanejamento: string;
  entregaEstimada: string;
  dataInicio: string;
  dataFim: string;
  consultor: string;
  faturado: string;
  observacao: string;
  historico: string;
}