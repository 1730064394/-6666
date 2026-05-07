export interface Task {
  id: string;
  platform: string;
  task_id: string;
  title: string;
  description?: string;
  reward: number;
  currency: string;
  reward_usd: number;
  estimated_time?: number;
  url: string;
  requirements: string[];
  posted_at?: string;
  scraped_at: string;
  category?: string;
  difficulty?: string;
  rating?: number;
  efficiency_score: number;
  efficiency_label: string;
}

export interface SearchRequest {
  keyword: string;
  platforms: string[];
}

export interface SearchResponse {
  job_id: string;
  status: string;
  message: string;
  keyword: string;
  started_at: string;
  results_count?: number;
}

export interface SummaryStats {
  total_tasks: number;
  avg_reward_usd: number;
  avg_time_minutes: number;
  platform_count: number;
}

export interface PlatformDistribution {
  platform: string;
  count: number;
  avg_reward: number;
}

export interface RewardDistribution {
  range: string;
  count: number;
}

export interface EfficiencyDistribution {
  platform: string;
  avg_efficiency: number;
  count: number;
}

export interface DifficultyDistribution {
  difficulty: string;
  count: number;
  avg_reward: number;
}
