import { Link, useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Trash2, ExternalLink } from 'lucide-react';
import { usePosition, useDeletePosition } from '../hooks/usePositions';
import { usePositionPipeline } from '../hooks/usePipeline';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { STAGE_LABELS, type PipelineStage } from '../types/pipeline';
import { useAuth } from '../contexts/AuthContext';

export function PositionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: position, isLoading } = usePosition(id);
  const { data: pipeline } = usePositionPipeline(id);
  const deleteMutation = useDeletePosition();

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this position?')) return;
    await deleteMutation.mutateAsync(id);
    navigate('/positions');
  };

  if (isLoading) return <LoadingSpinner />;
  if (!position) return <p>Position not found</p>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/positions" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Positions
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{position.title}</h1>
            <p className="text-gray-500 mt-1">{position.client_name}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/positions/${id}/pipeline`}>
              <Button variant="secondary"><ExternalLink className="h-4 w-4 mr-2" />Pipeline</Button>
            </Link>
            {(user?.role === 'admin' || user?.role === 'recruiter') && (
              <Link to={`/positions/${id}/edit`}>
                <Button variant="secondary"><Edit className="h-4 w-4 mr-2" />Edit</Button>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-1"><Badge variant={position.status === 'open' ? 'green' : 'gray'}>{position.status.replace('_', ' ')}</Badge></dd>
              </div>
              <div>
                <dt className="text-gray-500">Seniority</dt>
                <dd className="mt-1 capitalize">{position.seniority}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Location</dt>
                <dd className="mt-1 capitalize">{position.location_type}{position.location_city ? ` - ${position.location_city}` : ''}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Rate</dt>
                <dd className="mt-1">
                  {position.rate_min || position.rate_max
                    ? `${position.rate_min ?? '?'} - ${position.rate_max ?? '?'} EUR/${position.rate_type ?? 'monthly'}`
                    : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Deadline</dt>
                <dd className="mt-1">{position.deadline ? new Date(position.deadline).toLocaleDateString() : 'No deadline'}</dd>
              </div>
            </dl>
          </div>

          {position.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{position.description}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-3">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {position.required_skills.map((skill) => (
                <Badge key={skill} variant="blue">{skill}</Badge>
              ))}
              {position.required_skills.length === 0 && <p className="text-sm text-gray-500">No skills specified</p>}
            </div>
          </div>

          {position.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{position.notes}</p>
            </div>
          )}
        </div>

        {/* Pipeline summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Pipeline</h2>
          {pipeline ? (
            <div className="space-y-3">
              {Object.entries(pipeline.stages)
                .filter(([_, apps]) => apps.length > 0)
                .map(([stage, apps]) => (
                  <div key={stage} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{STAGE_LABELS[stage as PipelineStage] || stage}</span>
                    <Badge variant="gray">{apps.length}</Badge>
                  </div>
                ))}
              {Object.values(pipeline.stages).every((apps) => apps.length === 0) && (
                <p className="text-sm text-gray-500">No candidates in pipeline</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
