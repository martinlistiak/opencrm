export type PositionStatus = 'open' | 'on_hold' | 'closed' | 'filled';
export type Seniority = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
export type LocationType = 'remote' | 'onsite' | 'hybrid';
export type RateType = 'hourly' | 'monthly' | 'yearly';

export interface Position {
  id: string;
  title: string;
  client_name: string;
  description: string | null;
  required_skills: string[];
  seniority: Seniority;
  rate_min: number | null;
  rate_max: number | null;
  rate_type: RateType | null;
  location_type: LocationType;
  location_city: string | null;
  status: PositionStatus;
  deadline: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePositionRequest {
  title: string;
  client_name: string;
  description?: string;
  required_skills?: string[];
  seniority: Seniority;
  rate_min?: number;
  rate_max?: number;
  rate_type?: RateType;
  location_type?: LocationType;
  location_city?: string;
  status?: PositionStatus;
  deadline?: string;
  notes?: string;
}

export interface UpdatePositionRequest {
  title?: string;
  client_name?: string;
  description?: string;
  required_skills?: string[];
  seniority?: Seniority;
  rate_min?: number;
  rate_max?: number;
  rate_type?: RateType;
  location_type?: LocationType;
  location_city?: string;
  status?: PositionStatus;
  deadline?: string;
  notes?: string;
}

export interface PositionFilter {
  status?: string;
  client_name?: string;
  skills?: string;
  seniority?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: string;
}
