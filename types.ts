export enum Priority {
  LOW = 'Düşük',
  MEDIUM = 'Orta',
  HIGH = 'Yüksek'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO String YYYY-MM-DD
  time?: string; // HH:mm
  priority: Priority;
  completed: boolean;
  createdAt: number;
  notified?: boolean; // Track if notification was sent
}

export type ViewMode = 'dashboard' | 'calendar' | 'list' | 'reports';

export interface SmartTaskResponse {
  title: string;
  description?: string;
  date?: string; // YYYY-MM-DD
  time?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}