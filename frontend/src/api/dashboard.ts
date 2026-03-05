import api from './client';

export interface DashboardStats {
  open_positions: number;
  total_candidates: number;
  active_pipeline: number;
  placed_this_month: number;
  pipeline_by_stage: Record<string, number>;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),

  getActivity: () =>
    api.get<ActivityLog[]>('/dashboard/activity').then((r) => r.data),
};
