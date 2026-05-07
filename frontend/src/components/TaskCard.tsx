import { useState } from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

const LABEL_COLORS: Record<string, string> = {
  '超值推荐': '#10b981',
  '性价比高': '#3b82f6',
  '正常': '#f59e0b',
  '偏低': '#ef4444',
};

export function TaskCard({ task }: TaskCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(task.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpen = () => {
    window.open(task.url, '_blank');
  };

  return (
    <div className="task-card">
      <div className="task-header">
        <span className="platform-badge">{task.platform}</span>
        <span 
          className="efficiency-badge"
          style={{ backgroundColor: LABEL_COLORS[task.efficiency_label] || '#6b7280' }}
        >
          {task.efficiency_label}
        </span>
      </div>
      
      <h3 className="task-title">{task.title}</h3>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      
      <div className="task-info">
        <div className="reward-info">
          <span className="reward-amount">
            {task.currency} {task.reward.toFixed(2)}
          </span>
          <span className="reward-usd">(${task.reward_usd.toFixed(2)})</span>
        </div>
        
        <div className="time-info">
          <span>⏱️</span>
          <span>{task.estimated_time} min</span>
        </div>
        
        <div className="efficiency-info">
          <span>⚡</span>
          <span>{task.efficiency_score.toFixed(2)}/min</span>
        </div>
      </div>
      
      {task.difficulty && (
        <div className="difficulty-bar">
          <span className="difficulty-label">Difficulty:</span>
          <div 
            className="difficulty-indicator"
            style={{ backgroundColor: DIFFICULTY_COLORS[task.difficulty] }}
          >
            {task.difficulty}
          </div>
        </div>
      )}
      
      {task.rating && (
        <div className="rating-info">
          <span>⭐</span>
          <span>{task.rating.toFixed(1)}</span>
        </div>
      )}
      
      {task.requirements && task.requirements.length > 0 && (
        <div className="requirements">
          <span className="requirements-label">Requirements:</span>
          <div className="requirement-tags">
            {task.requirements.map((req, idx) => (
              <span key={idx} className="requirement-tag">{req}</span>
            ))}
          </div>
        </div>
      )}
      
      <div className="task-actions">
        <button onClick={handleCopy} className="action-btn copy-btn">
          {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
        <button onClick={handleOpen} className="action-btn open-btn">
          🔗 Open Task
        </button>
      </div>
    </div>
  );
}
