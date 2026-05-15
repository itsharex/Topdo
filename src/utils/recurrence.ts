import type { RecurrenceRule, Task } from '../types';

export interface RecurringInstanceInput {
  template: Task;
  name: string;
  priority: string;
  status: string;
  due_date: string;
  recurrence_parent_id: string;
  recurrence_index: number;
  reminder_before: number | null;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function createdAtDateKey(raw: string): string {
  const n = Number(raw);
  const d = Number.isFinite(n) ? new Date(n > 1e12 ? n : n * 1000) : new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return dateKey(d);
}

export function parseRecurrenceRule(value: unknown): RecurrenceRule | null {
  const raw = typeof value === 'string'
    ? (() => {
        try { return JSON.parse(value); } catch { return null; }
      })()
    : value;
  if (!raw || typeof raw !== 'object') return null;
  const rule = raw as Partial<RecurrenceRule>;
  if (!['daily', 'weekly', 'monthly', 'weekdays', 'custom'].includes(String(rule.type))) return null;
  return {
    type: rule.type as RecurrenceRule['type'],
    interval: Number(rule.interval || 1) || 1,
    daysOfWeek: Array.isArray(rule.daysOfWeek) ? rule.daysOfWeek.map(Number).filter((v) => v >= 0 && v <= 6) : undefined,
    dayOfMonth: rule.dayOfMonth ? Number(rule.dayOfMonth) : undefined,
    endDate: rule.endDate || null,
    endCount: rule.endCount ? Number(rule.endCount) : null
  };
}

export function recurrenceLabel(rule: RecurrenceRule | null | undefined): string {
  if (!rule) return '';
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  if (rule.type === 'daily') return '每天';
  if (rule.type === 'weekdays') return '工作日';
  if (rule.type === 'monthly') return `每月${rule.dayOfMonth || 1}日`;
  if (rule.type === 'weekly' || rule.type === 'custom') {
    const selected = (rule.daysOfWeek?.length ? rule.daysOfWeek : [new Date().getDay()]).map((d) => days[d]).join('、');
    return `每周${selected}`;
  }
  return '自定义';
}

export function matchesRule(date: Date, rule: RecurrenceRule): boolean {
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();
  switch (rule.type) {
    case 'daily': return true;
    case 'weekly': return rule.daysOfWeek?.includes(dayOfWeek) ?? false;
    case 'monthly': return dayOfMonth === (rule.dayOfMonth || 1);
    case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'custom': return rule.daysOfWeek?.includes(dayOfWeek) ?? false;
    default: return false;
  }
}

function getNextIndex(tasks: Task[], parentId: string): number {
  const max = tasks
    .filter((task) => task.recurrence_parent_id === parentId)
    .reduce((acc, task) => Math.max(acc, Number(task.recurrence_index || 0)), 0);
  return max + 1;
}

export function generateRecurringInstances(tasks: Task[], today = new Date()): RecurringInstanceInput[] {
  const todayStr = dateKey(today);
  const templates = tasks.filter((task) => task.recurrence_rule && !task.recurrence_parent_id);
  const instances: RecurringInstanceInput[] = [];

  for (const template of templates) {
    const rule = parseRecurrenceRule(template.recurrence_rule);
    if (!rule) continue;
    if (rule.endDate && rule.endDate < todayStr) continue;
    if (rule.endCount) {
      const existingCount = tasks.filter((task) => task.recurrence_parent_id === (template.id || template.record_id)).length;
      if (existingCount >= rule.endCount) continue;
    }
    if (!matchesRule(today, rule)) continue;

    const templateId = template.id || template.record_id;
    const alreadyExists = tasks.some(
      (task) => task.recurrence_parent_id === templateId && createdAtDateKey(task.created_at) === todayStr
    );
    if (alreadyExists) continue;

    instances.push({
      template,
      name: template.name,
      priority: template.priority || '普通',
      status: '待处理',
      due_date: template.due_date || todayStr,
      recurrence_parent_id: templateId,
      recurrence_index: getNextIndex(tasks, templateId),
      reminder_before: template.reminder_before ?? null
    });
  }
  return instances;
}
