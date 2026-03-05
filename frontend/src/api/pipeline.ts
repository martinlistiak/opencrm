import api from './client';
import type { PaginatedResponse } from '../types/common';
import type {
  Application,
  ApplicationWithDetails,
  CreateApplicationRequest,
  PipelineFilter,
  PipelineKanbanResponse,
  StageHistory,
  UpdateStageRequest,
} from '../types/pipeline';

export const pipelineApi = {
  getPositionPipeline: (positionId: string) =>
    api.get<PipelineKanbanResponse>(`/pipeline/position/${positionId}`).then((r) => r.data),

  list: (filter: PipelineFilter = {}) =>
    api.get<PaginatedResponse<ApplicationWithDetails>>('/pipeline', { params: filter }).then((r) => r.data),

  createApplication: (data: CreateApplicationRequest) =>
    api.post<Application>('/applications', data).then((r) => r.data),

  updateStage: (id: string, data: UpdateStageRequest) =>
    api.put<Application>(`/applications/${id}/stage`, data).then((r) => r.data),

  deleteApplication: (id: string) =>
    api.delete(`/applications/${id}`).then((r) => r.data),

  getHistory: (id: string) =>
    api.get<StageHistory[]>(`/applications/${id}/history`).then((r) => r.data),
};
