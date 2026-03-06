import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Search, Filter, ChevronDown } from 'lucide-react';
import { Disclosure, Transition } from '@headlessui/react';
import { useCandidates } from '../hooks/useCandidates';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { cn } from '../lib/utils';
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

  const hasActiveFilters = !!(filter.seniority || filter.availability || filter.source);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Candidates</h1>
        <Link to="/candidates/new">
          <Button size="sm">
            <Plus className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">New Candidate</span>
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
                placeholder="Search candidates..."
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
                    value={filter.seniority || ''}
                    onChange={(e) => setFilter((f) => ({ ...f, seniority: e.target.value || undefined, page: 1 }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">All Sources</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="profesia">Profesia</option>
                    <option value="referral">Referral</option>
                    <option value="manual">Manual</option>
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
          title="No candidates found"
          description="Add your first candidate to build your database"
          action={<Link to="/candidates/new"><Button>Add Candidate</Button></Link>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Skills</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Seniority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Availability</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => window.location.href = `/candidates/${c.id}`}>
                    <td className="px-5 py-3.5">
                      <Link to={`/candidates/${c.id}`} className="font-medium text-sm text-gray-900 hover:text-blue-600 transition-colors">
                        {c.first_name} {c.last_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{c.email || '-'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="blue">{skill}</Badge>
                        ))}
                        {c.skills.length > 3 && <Badge variant="gray">+{c.skills.length - 3}</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{c.seniority || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {availabilityLabels[c.availability || 'unknown'] || c.availability}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="indigo">{c.source}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-100">
            {data.data.map((c) => (
              <Link key={c.id} to={`/candidates/${c.id}`} className="block p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-sm text-gray-900">
                    {c.first_name} {c.last_name}
                  </span>
                  <Badge variant="indigo">{c.source}</Badge>
                </div>
                {c.email && (
                  <p className="text-xs text-gray-500 mb-2">{c.email}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-2">
                  {c.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="blue">{skill}</Badge>
                  ))}
                  {c.skills.length > 3 && <Badge variant="gray">+{c.skills.length - 3}</Badge>}
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  {c.seniority && <span className="capitalize">{c.seniority}</span>}
                  <span>{availabilityLabels[c.availability || 'unknown'] || c.availability}</span>
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
