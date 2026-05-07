import { Task } from '../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
}

export function TaskList({ tasks, isLoading }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner large"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No tasks found</h3>
        <p>Try searching with different keywords or platforms</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <div className="list-header">
        <h2>Tasks ({tasks.length})</h2>
        <span className="sort-info">Sorted by reward (low to high)</span>
      </div>
      <div className="task-grid">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
