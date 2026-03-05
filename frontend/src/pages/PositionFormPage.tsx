import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { usePosition, useCreatePosition, useUpdatePosition } from '../hooks/usePositions';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { CreatePositionRequest } from '../types/position';

export function PositionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { data: position, isLoading } = usePosition(id);
  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePositionRequest>();

  useEffect(() => {
    if (position) {
      reset({
        title: position.title,
        client_name: position.client_name,
        description: position.description || '',
        required_skills: position.required_skills,
        seniority: position.seniority,
        rate_min: position.rate_min || undefined,
        rate_max: position.rate_max || undefined,
        rate_type: position.rate_type || 'monthly',
        location_type: position.location_type,
        location_city: position.location_city || '',
        status: position.status,
        deadline: position.deadline || '',
        notes: position.notes || '',
      });
    }
  }, [position, reset]);

  const onSubmit = async (data: CreatePositionRequest) => {
    const skills = typeof data.required_skills === 'string'
      ? (data.required_skills as unknown as string).split(',').map((s: string) => s.trim()).filter(Boolean)
      : data.required_skills;

    const payload = { ...data, required_skills: skills };

    if (isEditing && id) {
      await updateMutation.mutateAsync({ id, data: payload });
      navigate(`/positions/${id}`);
    } else {
      const created = await createMutation.mutateAsync(payload);
      navigate(`/positions/${created.id}`);
    }
  };

  if (isEditing && isLoading) return <LoadingSpinner />;

  return (
    <div>
      <Link to="/positions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Positions
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Position' : 'New Position'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Title *"
              {...register('title', { required: 'Title is required' })}
              error={errors.title?.message}
              placeholder="e.g. Senior React Developer"
            />
            <Input
              label="Client Name *"
              {...register('client_name', { required: 'Client name is required' })}
              error={errors.client_name?.message}
              placeholder="e.g. SCR"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Position description..."
            />
          </div>

          <Input
            label="Required Skills (comma-separated)"
            {...register('required_skills')}
            placeholder="React, TypeScript, Node.js"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Seniority *"
              {...register('seniority', { required: 'Seniority is required' })}
              error={errors.seniority?.message}
              options={[
                { value: 'junior', label: 'Junior' },
                { value: 'mid', label: 'Mid' },
                { value: 'senior', label: 'Senior' },
                { value: 'lead', label: 'Lead' },
                { value: 'principal', label: 'Principal' },
              ]}
              placeholder="Select..."
            />
            <Select
              label="Location Type"
              {...register('location_type')}
              options={[
                { value: 'remote', label: 'Remote' },
                { value: 'onsite', label: 'Onsite' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
            />
            <Input label="City" {...register('location_city')} placeholder="Bratislava" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Rate Min (EUR)" type="number" {...register('rate_min', { valueAsNumber: true })} />
            <Input label="Rate Max (EUR)" type="number" {...register('rate_max', { valueAsNumber: true })} />
            <Select
              label="Rate Type"
              {...register('rate_type')}
              options={[
                { value: 'hourly', label: 'Hourly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Status"
              {...register('status')}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'on_hold', label: 'On Hold' },
                { value: 'closed', label: 'Closed' },
                { value: 'filled', label: 'Filled' },
              ]}
            />
            <Input label="Deadline" type="date" {...register('deadline')} />
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
          <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
            {isEditing ? 'Save Changes' : 'Create Position'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
