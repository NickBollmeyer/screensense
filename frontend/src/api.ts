const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function get<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

async function put<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

async function del<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export type CategoryMeta = {
  id: string;
  name: string;
  type: 'task' | 'fun';
  color: string;
  icon: string;
  apps: string[];
};

export type AppUsage = {
  app_name: string;
  package_name: string;
  category_id: string;
  duration_seconds: number;
  launches: number;
};

export type CategoryBreakdown = {
  id: string;
  name: string;
  type: 'task' | 'fun';
  color: string;
  icon: string;
  duration_seconds: number;
  app_count: number;
  goal_minutes?: number;
  goal_progress?: number;
  goal_exceeded?: boolean;
};

export type TodayUsage = {
  date: string;
  total_seconds: number;
  task_seconds: number;
  fun_seconds: number;
  call_seconds: number;
  call_count: number;
  pickups: number;
  notifications: number;
  categories: CategoryBreakdown[];
  apps: AppUsage[];
};

export type WeekDay = {
  date: string;
  day_label: string;
  total_seconds: number;
  task_seconds: number;
  fun_seconds: number;
  categories: Record<string, number>;
};

export type MonthDay = {
  date: string;
  day: number;
  weekday: number;
  total_seconds: number;
  task_seconds: number;
  fun_seconds: number;
};

export type MonthUsage = {
  days: MonthDay[];
  summary: {
    total_seconds: number;
    avg_seconds: number;
    best_day: MonthDay | null;
    worst_day: MonthDay | null;
  };
};

export type Insight = {
  id: string;
  date: string;
  summary: string;
  highlights: string[];
  recommendations: string[];
  score: number;
};

export type Goal = {
  id: string;
  category_id: string;
  daily_limit_minutes: number;
};

export type FocusMode = {
  enabled: boolean;
  start_hour: number;
  end_hour: number;
  silenced_categories: string[];
};

export type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  created_at: string;
};

export const api = {
  getCategories: () => get<CategoryMeta[]>('/categories'),
  getToday: () => get<TodayUsage>('/usage/today'),
  getWeek: () => get<{ days: WeekDay[] }>('/usage/week'),
  getMonth: () => get<MonthUsage>('/usage/month'),
  getCategoryDetail: (id: string) => get(`/usage/category/${id}`),
  generateInsights: () => post<Insight>('/insights/generate'),
  getTodayInsights: () => get<Insight>('/insights/today'),
  getGoals: () => get<Goal[]>('/goals'),
  createGoal: (category_id: string, daily_limit_minutes: number) =>
    post<Goal>('/goals', { category_id, daily_limit_minutes }),
  deleteGoal: (id: string) => del(`/goals/${id}`),
  getFocusMode: () => get<FocusMode>('/focus_mode'),
  updateFocusMode: (patch: Partial<FocusMode>) => put<FocusMode>('/focus_mode', patch),
  listMessages: () => get<ChatMsg[]>('/coach/messages'),
  sendMessage: (text: string) =>
    post<{ user_message: ChatMsg; assistant_message: ChatMsg }>('/coach/chat', { text }),
  clearMessages: () => del('/coach/messages'),
  seed: () => post('/seed'),
};
