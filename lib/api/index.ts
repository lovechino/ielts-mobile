import { apiFetch } from './client';
import * as courses from './courses';
import * as lessons from './lessons';
import * as vocabulary from './vocabulary';
import * as stats from './stats';
import * as speaking from './speaking';
import * as progress from './progress';
import * as tests from './tests';
import * as notifications from './notifications';
import * as vault from './vault';

export const api = {
  get: async <T = any>(url: string, options?: any) => apiFetch<T>(url, { ...options, method: 'GET' }),
  post: async <T = any>(url: string, body?: any, options?: any) => apiFetch<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: async <T = any>(url: string, body?: any, options?: any) => apiFetch<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: async <T = any>(url: string, options?: any) => apiFetch<T>(url, { ...options, method: 'DELETE' }),

  courses,
  lessons,
  vocabulary,
  stats,
  speaking,
  progress,
  tests,
  notifications,
  vault,
};
