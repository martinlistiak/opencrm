import { Link, useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Trash2, Download, Linkedin } from 'lucide-react';
import { useCandidate, useDeleteCandidate } from '../hooks/useCandidates';
import { candidatesApi } from '../api/candidates';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: candidate, isLoading } = useCandidate(id);
  const deleteMutation = useDeleteCandidate();

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this candidate?')) return;
    await deleteMutation.mutateAsync(id);
    navigate('/candidates');
  };

  if (isLoading) return <LoadingSpinner />;
  if (!candidate) return <p>Candidate not found</p>;

  const canEdit = user?.role === 'admin' || user?.role === 'recruiter';

  return (
    <div>
      <div className="mb-6">
        <Link to="/candidates" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Candidates
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {candidate.first_name} {candidate.last_name}
            </h1>
            <p className="text-gray-500 mt-1">{candidate.current_title || 'No current title'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {candidate.linkedin_url && (
              <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm"><Linkedin className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">LinkedIn</span></Button>
              </a>
            )}
            {candidate.cv_file_path && id && (
              <a href={candidatesApi.downloadCvUrl(id)} download>
                <Button variant="secondary" size="sm"><Download className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">CV</span></Button>
              </a>
            )}
            {canEdit && (
              <Link to={`/candidates/${id}/edit`}>
                <Button variant="secondary" size="sm"><Edit className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Edit</span></Button>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Button variant="danger" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Delete</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="mt-1 break-all">{candidate.email || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="mt-1">{candidate.phone || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Source</dt>
                <dd className="mt-1"><Badge variant="indigo">{candidate.source}</Badge></dd>
              </div>
              <div>
                <dt className="text-gray-500">Added</dt>
                <dd className="mt-1">{new Date(candidate.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Professional Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Seniority</dt>
                <dd className="mt-1 capitalize">{candidate.seniority || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Availability</dt>
                <dd className="mt-1">{candidate.availability?.replace(/_/g, ' ') || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Salary Expectation</dt>
                <dd className="mt-1">
                  {candidate.salary_expectation
                    ? `${candidate.salary_expectation} ${candidate.salary_currency || 'EUR'}/month`
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">CV</dt>
                <dd className="mt-1">{candidate.cv_original_name || 'Not uploaded'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <Badge key={skill} variant="blue">{skill}</Badge>
              ))}
              {candidate.skills.length === 0 && <p className="text-sm text-gray-500">No skills listed</p>}
            </div>
          </div>

          {candidate.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{candidate.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Quick Info</h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <Badge variant="green">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Availability</span>
              <span className="capitalize">{candidate.availability?.replace(/_/g, ' ') || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Source</span>
              <span className="capitalize">{candidate.source}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
