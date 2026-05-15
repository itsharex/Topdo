export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  frequency_type: 'daily' | 'weekdays' | 'custom';
  frequency_days?: number[];
  remind_time?: string;
  target_days?: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  checked_at: string;
  checked_time?: string;
  note?: string;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  todayChecked: boolean;
  todayCheckTime?: string;
  weekStatus: ('done' | 'missed' | 'today' | 'future' | 'na')[];
  monthCompletionRate: number;
}
