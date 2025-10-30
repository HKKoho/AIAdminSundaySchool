
import React from 'react';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  return (
    <div className="flex items-center p-2 bg-gray-50 rounded-lg">
      <input
        type="checkbox"
        id={`task-${task.id}`}
        checked={task.completed}
        readOnly
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <label
        htmlFor={`task-${task.id}`}
        className={`ml-3 text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}
      >
        {task.text}
      </label>
    </div>
  );
};
