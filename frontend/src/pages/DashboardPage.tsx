import { Briefcase, Users, GitBranch, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardStats, useActivity } from '../hooks/useDashboard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { STAGE_LABELS } from '../types/pipeline';

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useActivity();

  if (statsLoading) return <LoadingSpinner />;

  const statCards = [
    { label: 'Open Positions', value: stats?.open_positions ?? 0, icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Candidates', value: stats?.total_candidates ?? 0, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Active Pipeline', value: stats?.active_pipeline ?? 0, icon: GitBranch, color: 'text-purple-600 bg-purple-50' },
    { label: 'Placed This Month', value: stats?.placed_this_month ?? 0, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const chartData = stats?.pipeline_by_stage
    ? Object.entries(stats.pipeline_by_stage)
        .filter(([stage]) => !['rejected', 'withdrawn'].includes(stage))
        .map(([stage, count]) => ({
          name: STAGE_LABELS[stage as keyof typeof STAGE_LABELS] || stage,
          count,
        }))
    : [];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Overview</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No pipeline data yet</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {activityLoading ? (
            <LoadingSpinner />
          ) : activity && activity.length > 0 ? (
            <div className="space-y-3">
              {activity.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">{item.user_name}</span>{' '}
                    <span className="text-gray-500">{item.action.replace(/_/g, ' ')}</span>
                    <p className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No activity yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
