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
