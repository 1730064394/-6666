import { useState, useEffect, useCallback } from 'react';
import { Task, SearchRequest, SummaryStats, PlatformDistribution, RewardDistribution, EfficiencyDistribution, DifficultyDistribution } from './types';
import { searchApi, analyticsApi } from './api';
import { SearchForm } from './components/SearchForm';
import { TaskList } from './components/TaskList';
import { Dashboard } from './components/Dashboard';
import { Charts } from './components/Charts';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  
  const [summary, setSummary] = useState<SummaryStats>({
    total_tasks: 0,
    avg_reward_usd: 0,
    avg_time_minutes: 0,
    platform_count: 0,
  });
  
  const [platformDistribution, setPlatformDistribution] = useState<PlatformDistribution[]>([]);
  const [rewardDistribution, setRewardDistribution] = useState<RewardDistribution[]>([]);
  const [efficiencyDistribution, setEfficiencyDistribution] = useState<EfficiencyDistribution[]>([]);
  const [difficultyDistribution, setDifficultyDistribution] = useState<DifficultyDistribution[]>([]);

  const loadAnalytics = useCallback(async () => {
    try {
      const [
        summaryData,
        platformData,
        rewardData,
        efficiencyData,
        difficultyData,
      ] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getPlatformDistribution(),
        analyticsApi.getRewardDistribution(),
        analyticsApi.getEfficiencyDistribution(),
        analyticsApi.getDifficultyDistribution(),
      ]);
      
      setSummary(summaryData);
      setPlatformDistribution(platformData);
      setRewardDistribution(rewardData);
      setEfficiencyDistribution(efficiencyData);
      setDifficultyDistribution(difficultyData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }, []);

  const loadTasks = useCallback(async (keyword?: string) => {
    setIsLoading(true);
    try {
      const fetchedTasks = await searchApi.getTasks({
        keyword,
        sort_by: 'reward_usd',
        sort_order: 'asc',
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadAnalytics();
  }, [loadTasks, loadAnalytics]);

  const handleSearch = async (request: SearchRequest) => {
    setIsLoading(true);
    try {
      await searchApi.search(request);
      
      setTimeout(() => {
        loadTasks(request.keyword);
        loadAnalytics();
      }, 1000);
    } catch (error) {
      console.error('Search failed:', error);
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTasks();
    loadAnalytics();
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="app-title">🎯 Survey Hunter</h1>
          <p className="app-subtitle">有奖问卷任务采集与对比工具</p>
        </div>
        <button onClick={handleRefresh} className="refresh-btn" disabled={isLoading}>
          🔄 Refresh
        </button>
      </header>
      
      <main className="main-content">
        <section className="search-section">
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </section>
        
        <section className="dashboard-section">
          <Dashboard 
            summary={summary} 
            platformDistribution={platformDistribution}
            isLoading={isLoading}
          />
        </section>
        
        <section className="charts-toggle">
          <button 
            onClick={() => setShowCharts(!showCharts)}
            className="toggle-btn"
          >
            {showCharts ? '📈 Hide Charts' : '📈 Show Charts'}
          </button>
        </section>
        
        {showCharts && (
          <section className="charts-section">
            <Charts 
              rewardDistribution={rewardDistribution}
              efficiencyDistribution={efficiencyDistribution}
              difficultyDistribution={difficultyDistribution}
              isLoading={isLoading}
            />
          </section>
        )}
        
        <section className="tasks-section">
          <TaskList tasks={tasks} isLoading={isLoading} />
        </section>
      </main>
      
      <footer className="footer">
        <p>Survey Hunter - Collect and compare survey tasks from multiple platforms</p>
      </footer>
    </div>
  );
}

export default App;
