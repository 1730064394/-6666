import axios from 'axios';
import { Task, SearchRequest, SearchResponse, SummaryStats, PlatformDistribution, RewardDistribution, EfficiencyDistribution, DifficultyDistribution } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchApi = {
  search: async (request: SearchRequest): Promise<SearchResponse> => {
    const response = await api.post('/search', request);
    return response.data;
  },
  
  getTasks: async (params?: {
    keyword?: string;
    platform?: string;
    min_reward?: number;
    max_reward?: number;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    limit?: number;
  }): Promise<Task[]> => {
    const response = await api.get('/search/tasks', { params });
    return response.data;
  },
};

export const tasksApi = {
  getAll: async (page?: number, limit?: number): Promise<Task[]> => {
    const response = await api.get('/tasks', { params: { page, limit } });
    return response.data;
  },
  
  getCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/tasks/count');
    return response.data;
  },
  
  delete: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },
  
  clearAll: async (): Promise<void> => {
    await api.delete('/tasks');
  },
};

export const analyticsApi = {
  getSummary: async (): Promise<SummaryStats> => {
    const response = await api.get('/analytics/summary');
    return response.data;
  },
  
  getPlatformDistribution: async (): Promise<PlatformDistribution[]> => {
    const response = await api.get('/analytics/platform-distribution');
    return response.data;
  },
  
  getRewardDistribution: async (): Promise<RewardDistribution[]> => {
    const response = await api.get('/analytics/reward-distribution');
    return response.data;
  },
  
  getEfficiencyDistribution: async (): Promise<EfficiencyDistribution[]> => {
    const response = await api.get('/analytics/efficiency-distribution');
    return response.data;
  },
  
  getDifficultyDistribution: async (): Promise<DifficultyDistribution[]> => {
    const response = await api.get('/analytics/difficulty-distribution');
    return response.data;
  },
  
  getRecommendations: async (limit?: number): Promise<Task[]> => {
    const response = await api.get('/analytics/recommendations', { params: { limit } });
    return response.data;
  },
};
