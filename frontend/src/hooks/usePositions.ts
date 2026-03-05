import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { positionsApi } from '../api/positions';
import type { CreatePositionRequest, PositionFilter, UpdatePositionRequest } from '../types/position';

export function usePositions(filter: PositionFilter = {}) {
  return useQuery({
    queryKey: ['positions', filter],
    queryFn: () => positionsApi.list(filter),
  });
}

export function usePosition(id: string | undefined) {
  return useQuery({
    queryKey: ['positions', id],
    queryFn: () => positionsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePositionRequest) => positionsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['positions'] }),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePositionRequest }) =>
      positionsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['positions'] }),
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => positionsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['positions'] }),
  });
}
