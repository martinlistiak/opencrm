import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pipelineApi } from '../api/pipeline';
import type { CreateApplicationRequest, PipelineFilter, UpdateStageRequest } from '../types/pipeline';

export function usePositionPipeline(positionId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline', 'position', positionId],
    queryFn: () => pipelineApi.getPositionPipeline(positionId!),
    enabled: !!positionId,
  });
}

export function usePipelineList(filter: PipelineFilter = {}) {
  return useQuery({
    queryKey: ['pipeline', filter],
    queryFn: () => pipelineApi.list(filter),
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApplicationRequest) => pipelineApi.createApplication(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useUpdateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStageRequest }) =>
      pipelineApi.updateStage(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipelineApi.deleteApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });
}

export function useStageHistory(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline', 'history', applicationId],
    queryFn: () => pipelineApi.getHistory(applicationId!),
    enabled: !!applicationId,
  });
}
