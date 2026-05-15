export interface DueDateParts {
  date: string;
  time: string;
  hasTime: boolean;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/;

export function splitDueDate(raw: string | undefined): DueDateParts {
  const value = (raw || '').trim();
  if (!value) return { date: '', time: '', hasTime: false };

  const dateTimeMatch = value.match(DATE_TIME_PATTERN);
  if (dateTimeMatch) {
    return { date: dateTimeMatch[1], time: dateTimeMatch[2], hasTime: true };
  }

  if (DATE_ONLY_PATTERN.test(value)) {
    return { date: value, time: '', hasTime: false };
  }

  return { date: '', time: '', hasTime: false };
}

export function buildDueDateValue(date: string, time: string): string {
  const normalizedDate = date.trim();
  const normalizedTime = time.trim();
  if (!normalizedDate) return '';
  return normalizedTime ? `${normalizedDate}T${normalizedTime}` : normalizedDate;
}

export function dueTimestamp(raw: string | undefined): number {
  const value = (raw || '').trim();
  if (!value) return 0;

  const parts = splitDueDate(value);
  if (!parts.date) return 0;

  const text = parts.hasTime ? `${parts.date}T${parts.time}:00` : `${parts.date}T23:59:00`;
  const time = new Date(text).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatDueDate(raw: string | undefined): { label: string; tone: 'today' | 'overdue' | 'future' } | null {
  const timestamp = dueTimestamp(raw);
  if (!timestamp) return null;

  const due = new Date(timestamp);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.floor((dueDayStart.getTime() - todayStart.getTime()) / 86400000);
  const clock = formatClock(due);

  if (timestamp < Date.now()) {
    if (diffDays === 0) return { label: `今天 ${clock} 已过`, tone: 'overdue' };
    return { label: `逾期 ${Math.abs(diffDays)} 天`, tone: 'overdue' };
  }

  if (diffDays === 0) return { label: `今天 ${clock}`, tone: 'today' };
  if (diffDays === 1) return { label: `明天 ${clock}`, tone: 'future' };
  if (diffDays <= 6) {
    return {
      label: `${new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(due)} ${clock}`,
      tone: 'future'
    };
  }
  return { label: `${due.getMonth() + 1}/${due.getDate()} ${clock}`, tone: 'future' };
}
