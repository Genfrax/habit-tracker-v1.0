export const todayKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const dayOffsetKey = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return todayKey(d);
};

export const computeStreak = (completions: string[]): number => {
  if (!completions.length) return 0;
  const set = new Set(completions);
  let streak = 0;
  let i = 0;
  while (set.has(dayOffsetKey(-i))) {
    streak++;
    i++;
  }
  return streak;
};

export const weekCompletion = (completions: string[]): boolean[] => {
  const set = new Set(completions);
  const todayIdx = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const offset = i - todayIdx;
    return set.has(dayOffsetKey(offset));
  });
};
