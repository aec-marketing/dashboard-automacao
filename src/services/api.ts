import axios from 'axios';
import type { Project } from '../types';

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://dashboard-projetos-api.onrender.com/api'
  : 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getProjects = async (filters?: { status?: string; prioridade?: string }): Promise<Project[]> => {
  const response = await api.get<Project[]>('/projects', { params: filters });
  return response.data;
};

export const createProject = async (projectData: Partial<Project>): Promise<void> => {
  await api.post('/projects', projectData);
};

export const updateProject = async (id: number, projectData: Partial<Project>): Promise<void> => {
  await api.put(`/projects/${id}`, projectData);
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const refreshData = async (): Promise<void> => {
  await api.post('/refresh');
};

// Funções de filtro específicas
export const getProjectsInProgress = (): Promise<Project[]> => getProjects({ status: 'S2 - Em Andamento' });
export const getProjectsPending = (): Promise<Project[]> => getProjects({ status: 'S4 - Pendências externas' });
export const getProjectsNotStarted = (): Promise<Project[]> => getProjects({ status: 'S0 - Não iniciado' });
export const getProjectsCompleted = (): Promise<Project[]> => getProjects({ status: 'S6 - Concluído' });
export const getProjectsInPlanning = (): Promise<Project[]> => getProjects({ status: 'S1 - Em Planejamento' });
export const getProjectsStopped = (): Promise<Project[]> => getProjects({ status: 'S3 - Parado' });