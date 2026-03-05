import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { usePositions } from '../hooks/usePositions';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import type { PositionFilter, PositionStatus } from '../types/position';

const statusColors: Record<PositionStatus, 'green' | 'yellow' | 'gray' | 'blue'> = {
  open: 'green',
  on_hold: 'yellow',
  closed: 'gray',
  filled: 'blue',
};

export function PositionsListPage() {
  const [filter, setFilter] = useState<PositionFilter>({ page: 1, per_page: 20 });
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading } = usePositions(filter);

  const handleSearch = () => {
    setFilter((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Positions</h1>
        <Link to="/positions/new">
          <Button><Plus className="h-4 w-4 mr-2" /> New Position</Button>
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
                placeholder="Search positions..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <select
            value={filter.status || ''}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="on_hold">On Hold</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
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
            <option value="principal">Principal</option>
          </select>
          <Button variant="secondary" onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No positions found"
          description="Create your first position to get started"
          action={<Link to="/positions/new"><Button>Create Position</Button></Link>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Skills</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Seniority</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.data.map((pos) => (
                  <tr key={pos.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/positions/${pos.id}`}>
                    <td className="px-6 py-4">
                      <Link to={`/positions/${pos.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {pos.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pos.client_name}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusColors[pos.status as PositionStatus] || 'gray'}>
                        {pos.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {pos.required_skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="blue">{skill}</Badge>
                        ))}
                        {pos.required_skills.length > 3 && (
                          <Badge variant="gray">+{pos.required_skills.length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{pos.seniority}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pos.deadline ? new Date(pos.deadline).toLocaleDateString() : '-'}
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
