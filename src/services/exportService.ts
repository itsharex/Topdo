import { invoke } from '@tauri-apps/api/core';
import type { Task } from '../types';
import type { Habit } from '../types/habit';

export type ExportFormat = 'json' | 'csv' | 'markdown';

function normalizeStatus(status: string): 'todo' | 'doing' | 'done' {
  if (status.includes('已完成')) return 'done';
  if (status.includes('进行中')) return 'doing';
  return 'todo';
}

function escapeCsv(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function buildExportContent(format: ExportFormat, tasks: Task[], habits: Habit[]) {
  if (format === 'json') {
    return JSON.stringify({ version: '2.5', exportedAt: new Date().toISOString(), tasks, habits }, null, 2);
  }

  if (format === 'csv') {
    const headers = ['ID', '标题', '优先级', '状态', '截止日期', '创建日期', '完成日期', '重复规则'];
    const rows = tasks.map((task) => [
      task.record_id || task.id || '',
      task.name,
      task.priority,
      task.status,
      task.due_date || '',
      task.created_at,
      task.completed_at || '',
      task.recurrence_rule ? JSON.stringify(task.recurrence_rule) : ''
    ]);
    return `\ufeff${[headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')}`;
  }

  const todo = tasks.filter((task) => normalizeStatus(task.status) !== 'done');
  const done = tasks.filter((task) => normalizeStatus(task.status) === 'done');
  let markdown = `# Topdo 导出 - ${new Date().toLocaleDateString()}\n\n`;
  markdown += `## 待办 (${todo.length})\n\n`;
  todo.forEach((task) => {
    markdown += `- [ ] ${task.name}${task.due_date ? ` (${task.due_date})` : ''}\n`;
  });
  markdown += `\n## 已完成 (${done.length})\n\n`;
  done.forEach((task) => {
    markdown += `- [x] ${task.name}\n`;
  });
  if (habits.length) {
    markdown += `\n## 习惯\n\n`;
    habits.forEach((habit) => {
      markdown += `- ${habit.emoji || '🎯'} ${habit.name}\n`;
    });
  }
  return markdown;
}

export async function exportDataFile(format: ExportFormat, tasks: Task[], habits: Habit[]) {
  return invoke<string>('export_data_file', {
    format,
    content: buildExportContent(format, tasks, habits)
  });
}

export async function runDailyBackup(tasks: Task[], habits: Habit[], retentionDays: number) {
  return invoke<string>('run_backup', {
    content: buildExportContent('json', tasks, habits),
    retentionDays
  });
}

export async function openBackupFolder() {
  return invoke('open_backup_folder');
}

export async function openExportFolder() {
  return invoke('open_export_folder');
}
