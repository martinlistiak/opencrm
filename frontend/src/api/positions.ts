import api from './client';
import type { PaginatedResponse } from '../types/common';
import type { CreatePositionRequest, Position, PositionFilter, UpdatePositionRequest } from '../types/position';

export const positionsApi = {
  list: (filter: PositionFilter = {}) =>
    api.get<PaginatedResponse<Position>>('/positions', { params: filter }).then((r) => r.data),

  get: (id: string) =>
    api.get<Position>(`/positions/${id}`).then((r) => r.data),

  create: (data: CreatePositionRequest) =>
    api.post<Position>('/positions', data).then((r) => r.data),

  update: (id: string, data: UpdatePositionRequest) =>
    api.put<Position>(`/positions/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/positions/${id}`).then((r) => r.data),
};
