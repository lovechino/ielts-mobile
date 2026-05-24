import { apiFetch } from './client';
import type { DashboardStatsDTO, StreakDTO } from './types';

export function getDashboard(): Promise<DashboardStatsDTO> {
  return apiFetch<DashboardStatsDTO>('/stats/dashboard');
}

export function getStreak(): Promise<StreakDTO> {
  return apiFetch<StreakDTO>('/stats/streak');
}

export function recordActivity(timezone?: string): Promise<StreakDTO> {
  return apiFetch<StreakDTO>('/stats/activity', {
    method: 'POST',
    body: JSON.stringify({ timezone: timezone || 'Asia/Ho_Chi_Minh' }),
  });
}
