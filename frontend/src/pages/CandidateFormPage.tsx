import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useCandidate, useCreateCandidate, useUpdateCandidate, useUploadCv } from '../hooks/useCandidates';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { consumePendingCvFile } from '../lib/pendingCv';
import type { CreateCandidateRequest } from '../types/candidate';
import type { ParsedCandidate } from '../lib/cvParser';

export function CandidateFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const { data: candidate, isLoading } = useCandidate(id);
  const createMutation = useCreateCandidate();
  const updateMutation = useUpdateCandidate();
  const uploadCvMutation = useUploadCv();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateCandidateRequest>();

  // Pre-fill from existing candidate (edit mode)
  useEffect(() => {
    if (candidate) {
      reset({
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        email: candidate.email || '',
        phone: candidate.phone || '',
        linkedin_url: candidate.linkedin_url || '',
        current_title: candidate.current_title || '',
        skills: candidate.skills as unknown as string[],
        seniority: candidate.seniority || '',
        availability: candidate.availability || undefined,
        salary_expectation: candidate.salary_expectation || undefined,
        salary_currency: candidate.salary_currency || 'EUR',
        source: candidate.source,
        notes: candidate.notes || '',
      });
    }
  }, [candidate, reset]);

  // Pre-fill from CV drop
  useEffect(() => {
    const state = location.state as { fromCvDrop?: boolean; parsedData?: ParsedCandidate } | null;
    if (state?.fromCvDrop && state.parsedData && !isEditing) {
      const p = state.parsedData;
      reset({
        first_name: p.first_name ?? '',
        last_name: p.last_name ?? '',
        email: p.email ?? '',
        phone: p.phone ?? '',
        linkedin_url: p.linkedin_url ?? '',
        current_title: p.current_title ?? '',
        skills: (p.skills?.join(', ') ?? '') as unknown as string[],
        seniority: '',
        availability: undefined,
        source: p.source ?? 'other',
        notes: p.notes ?? '',
      });

      // Place the dropped file directly into the file input
      const pendingFile = consumePendingCvFile();
      if (pendingFile && fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(pendingFile);
        fileInputRef.current.files = dt.files;
      }

      // Clear the navigation state so a page refresh doesn't re-apply
      window.history.replaceState({}, '');
    }
  }, [location.state, reset, isEditing]);

  const onSubmit = async (data: CreateCandidateRequest) => {
    setServerError(null);

    const skills = typeof data.skills === 'string'
      ? (data.skills as unknown as string).split(',').map((s: string) => s.trim()).filter(Boolean)
      : data.skills;

    const payload = { ...data, skills };

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ id, data: payload });
        // Upload CV if selected
        if (fileInputRef.current?.files?.[0]) {
          await uploadCvMutation.mutateAsync({ id, file: fileInputRef.current.files[0] });
        }
        navigate(`/candidates/${id}`);
      } else {
        const created = await createMutation.mutateAsync(payload);
        // Upload CV if present (includes files set via drag-and-drop)
        if (fileInputRef.current?.files?.[0]) {
          await uploadCvMutation.mutateAsync({ id: created.id, file: fileInputRef.current.files[0] });
        }
        navigate(`/candidates/${created.id}`);
      }
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.error) {
        setServerError(err.response.data.error);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  if (isEditing && isLoading) return <LoadingSpinner />;

  return (
    <div>
      <Link to="/candidates" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Candidates
      </Link>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Candidate' : 'New Candidate'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {serverError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              {...register('first_name', { required: 'First name is required' })}
              error={errors.first_name?.message}
            />
            <Input
              label="Last Name *"
              {...register('last_name', { required: 'Last name is required' })}
              error={errors.last_name?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" {...register('email')} placeholder="john@example.com" />
            <Input label="Phone" {...register('phone')} placeholder="+421..." />
          </div>

          <Input label="LinkedIn URL" {...register('linkedin_url')} placeholder="https://linkedin.com/in/..." />
          <Input label="Current Title" {...register('current_title')} placeholder="e.g. Senior Developer at XYZ" />

          <Input
            label="Skills (comma-separated)"
            {...register('skills')}
            placeholder="React, TypeScript, Node.js"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Seniority"
              {...register('seniority')}
              placeholder="Select..."
              options={[
                { value: 'junior', label: 'Junior' },
                { value: 'mid', label: 'Mid' },
                { value: 'senior', label: 'Senior' },
                { value: 'lead', label: 'Lead' },
                { value: 'principal', label: 'Principal' },
              ]}
            />
            <Select
              label="Availability"
              {...register('availability')}
              placeholder="Select..."
              options={[
                { value: 'immediate', label: 'Immediate' },
                { value: '2_weeks', label: '2 Weeks' },
                { value: '1_month', label: '1 Month' },
                { value: '2_months', label: '2 Months' },
                { value: '3_months_plus', label: '3+ Months' },
                { value: 'unknown', label: 'Unknown' },
              ]}
            />
            <Select
              label="Source"
              {...register('source')}
              options={[
                { value: 'linkedin', label: 'LinkedIn' },
                { value: 'profesia', label: 'Profesia' },
                { value: 'referral', label: 'Referral' },
                { value: 'website', label: 'Website' },
                { value: 'manual', label: 'Manual' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Salary Expectation (EUR/month)" type="number" {...register('salary_expectation', { valueAsNumber: true })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload CV</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {isEditing && candidate?.cv_original_name && (
                <p className="text-xs text-gray-500 mt-1">Current: {candidate.cv_original_name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Internal notes..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            isLoading={createMutation.isPending || updateMutation.isPending || uploadCvMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Create Candidate'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
