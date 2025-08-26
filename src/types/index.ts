export interface Project {
  id: number;
  rowIndex?: number;
  nPedido: string;
  cliente: string;
  codigo: string;
  quantidade: string;
  descricao: string;
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