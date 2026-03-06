export type PipelineStage =
  | 'sourced'
  | 'contacted'
  | 'submitted'
  | 'interview'
  | 'offered'
  | 'placed'
  | 'rejected'
  | 'withdrawn';

export const ACTIVE_STAGES: PipelineStage[] = [
  'sourced',
  'contacted',
  'submitted',
  'interview',
  'offered',
  'placed',
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  sourced: 'Sourced',
  contacted: 'Contacted',
  submitted: 'Submitted to Client',
  interview: 'Interview',
  offered: 'Offered',
  placed: 'Placed',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const STAGE_COLORS: Record<PipelineStage, string> = {
  sourced: 'bg-gray-100 text-gray-800',
  contacted: 'bg-blue-100 text-blue-800',
  submitted: 'bg-indigo-100 text-indigo-800',
  interview: 'bg-yellow-100 text-yellow-800',
  offered: 'bg-purple-100 text-purple-800',
  placed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-orange-100 text-orange-800',
};

export const STAGE_HEADER_COLORS: Record<PipelineStage, { bg: string; border: string; dot: string }> = {
  sourced: { bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
  contacted: { bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-400' },
  submitted: { bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-400' },
  interview: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  offered: { bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-400' },
  placed: { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  rejected: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400' },
  withdrawn: { bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-400' },
};

export interface Application {
  id: string;
  candidate_id: string;
  position_id: string;
  stage: PipelineStage;
  rejection_reason: string | null;
  notes: string | null;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithDetails extends Application {
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string | null;
  candidate_skills: string[];
  position_title: string;
  position_client_name: string;
}

export interface StageHistory {
  id: string;
  application_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_by: string;
  notes: string | null;
  created_at: string;
}

export interface CreateApplicationRequest {
  candidate_id: string;
  position_id: string;
  notes?: string;
}

export interface UpdateStageRequest {
  stage: PipelineStage;
  notes?: string;
  rejection_reason?: string;
}

export interface PipelineKanbanResponse {
  position_id: string;
  stages: Record<string, ApplicationWithDetails[]>;
}

export interface PipelineFilter {
  position_id?: string;
  candidate_id?: string;
  stage?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
