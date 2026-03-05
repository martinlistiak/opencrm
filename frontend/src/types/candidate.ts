export type Availability = 'immediate' | '2_weeks' | '1_month' | '2_months' | '3_months_plus' | 'unknown';
export type CandidateSource = 'linkedin' | 'profesia' | 'referral' | 'website' | 'manual' | 'other';

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  current_title: string | null;
  skills: string[];
  seniority: string | null;
  availability: Availability | null;
  salary_expectation: number | null;
  salary_currency: string | null;
  cv_file_path: string | null;
  cv_original_name: string | null;
  source: CandidateSource;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCandidateRequest {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  current_title?: string;
  skills?: string[];
  seniority?: string;
  availability?: Availability;
  salary_expectation?: number;
  salary_currency?: string;
  source?: CandidateSource;
  notes?: string;
}

export interface UpdateCandidateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  current_title?: string;
  skills?: string[];
  seniority?: string;
  availability?: Availability;
  salary_expectation?: number;
  salary_currency?: string;
  source?: CandidateSource;
  notes?: string;
}

export interface CandidateFilter {
  skills?: string;
  seniority?: string;
  availability?: string;
  source?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: string;
}
