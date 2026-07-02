import { differenceInCalendarDays, format, parseISO, startOfDay, subDays } from "date-fns";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

const DATE_FORMAT = "yyyy-MM-dd";

// Computed on-the-fly from user_activity_days rather than stored as
// denormalized columns — see supabase/migrations/0001_schema.sql for why.
export function computeStreaks(activityDates: string[], today: Date = new Date()): StreakResult {
  if (activityDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
  }

  const uniqueDates = Array.from(new Set(activityDates)).sort();
  const dateSet = new Set(uniqueDates);
  const todayStr = format(startOfDay(today), DATE_FORMAT);

  // If today has no activity yet, start counting from yesterday so the
  // streak doesn't look broken before the day is even over.
  let cursor = dateSet.has(todayStr) ? startOfDay(today) : subDays(startOfDay(today), 1);
  let currentStreak = 0;
  while (dateSet.has(format(cursor, DATE_FORMAT))) {
    currentStreak += 1;
    cursor = subDays(cursor, 1);
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = differenceInCalendarDays(parseISO(uniqueDates[i]), parseISO(uniqueDates[i - 1]));
    run = diff === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: uniqueDates[uniqueDates.length - 1],
  };
}
