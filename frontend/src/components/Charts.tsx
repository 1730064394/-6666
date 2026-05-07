import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { RewardDistribution, EfficiencyDistribution, DifficultyDistribution } from '../types';

interface ChartsProps {
  rewardDistribution: RewardDistribution[];
  efficiencyDistribution: EfficiencyDistribution[];
  difficultyDistribution: DifficultyDistribution[];
  isLoading: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Charts({ rewardDistribution, efficiencyDistribution, difficultyDistribution, isLoading }: ChartsProps) {
  if (isLoading) {
    return (
      <div className="charts loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="charts">
      <div className="chart-section">
        <h3>Reward Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={rewardDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`${value} tasks`]} />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              {rewardDistribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-row">
        <div className="chart-section">
          <h3>Platform Efficiency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={efficiencyDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="platform" type="category" width={100} />
              <Tooltip formatter={(value: number) => [`${value.toFixed(3)}/min`]} />
              <Bar dataKey="avg_efficiency" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-section">
          <h3>Difficulty Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={difficultyDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {difficultyDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} tasks`]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="chart-section">
        <h3>Efficiency vs Count</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={efficiencyDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="platform" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="avg_efficiency" stroke="#3b82f6" name="Efficiency" />
            <Line yAxisId="right" type="monotone" dataKey="count" stroke="#10b981" name="Task Count" />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
