// НОВЫЙ ФАЙЛ: src/types.ts
// Здесь хранятся все общие типы данных для вашего приложения.

import { v4 as uuidv4 } from 'uuid';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  children: ChecklistItem[];
}

export interface Status {
  _id: string;
  name: string;
}

export interface Column {
  _id: string;
  name: string;
  statusIds: string[];
}

export interface Project {
  _id: string;
  name: string;
  columns: Column[];
  statuses: Status[];
}

export interface User {
  _id:string;
  login: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  assignee?: User;
  createdAt: string;
  priority: number;
  activityLog: ActivityLog[];
  checklist: ChecklistItem[];
}

export interface ActivityLog {
  user: { login: string };
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}