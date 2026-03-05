import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi } from '../api/candidates';
import type { CandidateFilter, CreateCandidateRequest, UpdateCandidateRequest } from '../types/candidate';

export function useCandidates(filter: CandidateFilter = {}) {
  return useQuery({
    queryKey: ['candidates', filter],
    queryFn: () => candidatesApi.list(filter),
  });
}

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: ['candidates', id],
    queryFn: () => candidatesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCandidateRequest) => candidatesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCandidateRequest }) =>
      candidatesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => candidatesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
}

export function useUploadCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      candidatesApi.uploadCv(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
}
