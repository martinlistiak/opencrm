import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Search, Filter, ChevronDown } from 'lucide-react';
import { Disclosure, Transition } from '@headlessui/react';
import { usePositions } from '../hooks/usePositions';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { cn } from '../lib/utils';
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

  const hasActiveFilters = !!(filter.status || filter.seniority);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Positions</h1>
        <Link to="/positions/new">
          <Button size="sm">
            <Plus className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">New Position</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 mb-4 shadow-sm">
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search positions..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>
          <Button variant="secondary" onClick={handleSearch} className="shrink-0">
            Search
          </Button>
        </div>

        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex items-center gap-1.5 mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <Filter className="h-3.5 w-3.5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                    !
                  </span>
                )}
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform -translate-y-1 opacity-0"
                enterTo="transform translate-y-0 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform translate-y-0 opacity-100"
                leaveTo="transform -translate-y-1 opacity-0"
              >
                <Disclosure.Panel className="flex flex-wrap gap-2 sm:gap-3 mt-3 pt-3 border-t border-gray-100">
                  <select
                    value={filter.status || ''}
                    onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">All Seniority</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="principal">Principal</option>
                  </select>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No positions found"
          description="Create your first position to get started"
          action={<Link to="/positions/new"><Button>Create Position</Button></Link>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Skills</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Seniority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((pos) => (
                  <tr key={pos.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => window.location.href = `/positions/${pos.id}`}>
                    <td className="px-5 py-3.5">
                      <Link to={`/positions/${pos.id}`} className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors">
                        {pos.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{pos.client_name}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusColors[pos.status as PositionStatus] || 'gray'}>
                        {pos.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {pos.required_skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="blue">{skill}</Badge>
                        ))}
                        {pos.required_skills.length > 3 && (
                          <Badge variant="gray">+{pos.required_skills.length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{pos.seniority}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {pos.deadline ? new Date(pos.deadline).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-100">
            {data.data.map((pos) => (
              <Link key={pos.id} to={`/positions/${pos.id}`} className="block p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-900">{pos.title}</span>
                  <Badge variant={statusColors[pos.status as PositionStatus] || 'gray'}>
                    {pos.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">{pos.client_name}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {pos.required_skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="blue">{skill}</Badge>
                  ))}
                  {pos.required_skills.length > 3 && (
                    <Badge variant="gray">+{pos.required_skills.length - 3}</Badge>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="capitalize">{pos.seniority}</span>
                  {pos.deadline && (
                    <span>Due {new Date(pos.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              </Link>
            ))}
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
