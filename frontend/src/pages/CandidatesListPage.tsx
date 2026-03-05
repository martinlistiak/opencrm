import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { useCandidates } from '../hooks/useCandidates';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import type { CandidateFilter } from '../types/candidate';

const availabilityLabels: Record<string, string> = {
  immediate: 'Immediate',
  '2_weeks': '2 Weeks',
  '1_month': '1 Month',
  '2_months': '2 Months',
  '3_months_plus': '3+ Months',
  unknown: 'Unknown',
};

export function CandidatesListPage() {
  const [filter, setFilter] = useState<CandidateFilter>({ page: 1, per_page: 20 });
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading } = useCandidates(filter);

  const handleSearch = () => {
    setFilter((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <Link to="/candidates/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Candidate</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <select
            value={filter.seniority || ''}
            onChange={(e) => setFilter((f) => ({ ...f, seniority: e.target.value || undefined, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Seniority</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
          <select
            value={filter.availability || ''}
            onChange={(e) => setFilter((f) => ({ ...f, availability: e.target.value || undefined, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Availability</option>
            <option value="immediate">Immediate</option>
            <option value="2_weeks">2 Weeks</option>
            <option value="1_month">1 Month</option>
            <option value="3_months_plus">3+ Months</option>
          </select>
          <select
            value={filter.source || ''}
            onChange={(e) => setFilter((f) => ({ ...f, source: e.target.value || undefined, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Sources</option>
            <option value="linkedin">LinkedIn</option>
            <option value="profesia">Profesia</option>
            <option value="referral">Referral</option>
            <option value="manual">Manual</option>
          </select>
          <Button variant="secondary" onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No candidates found"
          description="Add your first candidate to build your database"
          action={<Link to="/candidates/new"><Button>Add Candidate</Button></Link>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Skills</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Seniority</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Availability</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.data.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/candidates/${c.id}`}>
                    <td className="px-6 py-4">
                      <Link to={`/candidates/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {c.first_name} {c.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.email || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="blue">{skill}</Badge>
                        ))}
                        {c.skills.length > 3 && <Badge variant="gray">+{c.skills.length - 3}</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{c.seniority || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {availabilityLabels[c.availability || 'unknown'] || c.availability}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="indigo">{c.source}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            totalPages={data.total_pages}
            onPageChange={(p) => setFilter((f) => ({ ...f, page: p }))}
          />
        </div>
      )}
    </div>
  );
}
