import api from './client';
import type { PaginatedResponse } from '../types/common';
import type { Candidate, CandidateFilter, CreateCandidateRequest, UpdateCandidateRequest } from '../types/candidate';

export const candidatesApi = {
  list: (filter: CandidateFilter = {}) =>
    api.get<PaginatedResponse<Candidate>>('/candidates', { params: filter }).then((r) => r.data),

  get: (id: string) =>
    api.get<Candidate>(`/candidates/${id}`).then((r) => r.data),

  create: (data: CreateCandidateRequest) =>
    api.post<Candidate>('/candidates', data).then((r) => r.data),

  update: (id: string, data: UpdateCandidateRequest) =>
    api.put<Candidate>(`/candidates/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/candidates/${id}`).then((r) => r.data),

  uploadCv: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('cv', file);
    return api.post<Candidate>(`/candidates/${id}/cv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  downloadCvUrl: (id: string) => `/api/candidates/${id}/cv`,
};
