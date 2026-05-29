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

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
  value: number;
  /** Chỉ có ở streak leaderboard */
  longest?: number;
  is_me: boolean;
}

export interface LeaderboardDTO {
  type: 'streak' | 'lessons' | 'vocab';
  entries: LeaderboardEntry[];
  /** Rank của user hiện tại — null nếu không nằm trong top 20 */
  my_rank: number | null;
}

export function getLeaderboard(type: 'streak' | 'lessons' | 'vocab'): Promise<LeaderboardDTO> {
  return apiFetch<LeaderboardDTO>(`/stats/leaderboard/${type}`);
}
