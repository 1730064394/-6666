import { SummaryStats, PlatformDistribution } from '../types';

interface DashboardProps {
  summary: SummaryStats;
  platformDistribution: PlatformDistribution[];
  isLoading: boolean;
}

export function Dashboard({ summary, platformDistribution, isLoading }: DashboardProps) {
  if (isLoading) {
    return (
      <div className="dashboard loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Tasks', value: summary.total_tasks, icon: '📋' },
    { label: 'Avg Reward', value: `$${summary.avg_reward_usd.toFixed(2)}`, icon: '💰' },
    { label: 'Avg Time', value: `${summary.avg_time_minutes.toFixed(1)} min`, icon: '⏱️' },
    { label: 'Platforms', value: summary.platform_count, icon: '🌐' },
  ];

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="platform-summary">
        <h3>Platform Distribution</h3>
        <div className="platform-bars">
          {platformDistribution.map((item) => {
            const maxCount = Math.max(...platformDistribution.map(p => p.count));
            const percentage = (item.count / maxCount) * 100;
            return (
              <div key={item.platform} className="platform-bar-item">
                <span className="platform-name">{item.platform}</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="platform-stats">
                  {item.count} tasks | Avg: ${item.avg_reward.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
