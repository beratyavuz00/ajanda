import React from 'react';
import { Task, Priority } from '../types';
import { Check, Clock, Calendar, Trash2, GripVertical } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onToggle, 
  onDelete, 
  draggable = false, 
  onDragStart 
}) => {
  const priorityColors = {
    [Priority.HIGH]: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    [Priority.MEDIUM]: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    [Priority.LOW]: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, task.id);
      // Create a ghost image if needed, or browser default
      e.dataTransfer.effectAllowed = "move";
    }
  };

  return (
    <div 
      draggable={draggable}
      onDragStart={handleDragStart}
      className={`group flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md ${
        task.completed ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50' : ''
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {draggable && (
        <div className="mt-1.5 text-slate-300 dark:text-slate-600 hidden group-hover:block">
          <GripVertical size={14} />
        </div>
      )}

      <button 
        onClick={() => onToggle(task.id)}
        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.completed 
            ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' 
            : 'border-slate-300 hover:border-indigo-500 dark:border-slate-500 dark:hover:border-indigo-400'
        }`}
      >
        {task.completed && <Check size={14} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className={`font-medium truncate ${task.completed ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
            {task.title}
          </h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>
        
        {task.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{new Date(task.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
          </div>
          {task.time && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{task.time}</span>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-opacity"
        aria-label="Sil"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};