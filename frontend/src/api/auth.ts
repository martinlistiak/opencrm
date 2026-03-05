import api from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, UpdateUserRequest, User } from '../types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<User>('/auth/register', data).then((r) => r.data),

  me: () =>
    api.get<User>('/auth/me').then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    api.put<User>('/auth/me', data).then((r) => r.data),

  listUsers: () =>
    api.get<User[]>('/users').then((r) => r.data),

  updateUser: (id: string, data: UpdateUserRequest) =>
    api.put<User>(`/users/${id}`, data).then((r) => r.data),
};
