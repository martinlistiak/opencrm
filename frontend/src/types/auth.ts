export type Role = 'admin' | 'recruiter' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: Role;
}

export interface UpdateUserRequest {
  full_name?: string;
  role?: Role;
  is_active?: boolean;
}
