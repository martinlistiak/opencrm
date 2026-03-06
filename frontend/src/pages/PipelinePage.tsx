import { useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  LayoutGrid,
  List,
  Plus,
  ArrowLeft,
  GripVertical,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Transition } from '@headlessui/react';
import {
  usePositionPipeline,
  usePipelineList,
  useUpdateStage,
  useCreateApplication,
} from '../hooks/usePipeline';
import { useCandidates } from '../hooks/useCandidates';
import { usePositions } from '../hooks/usePositions';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Pagination } from '../components/ui/Pagination';
import { cn } from '../lib/utils';
import {
  ACTIVE_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  STAGE_HEADER_COLORS,
  type PipelineStage,
  type ApplicationWithDetails,
} from '../types/pipeline';

function daysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const today = new Date();
  const diff = today.getTime() - then.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function KanbanCardContent({
  app,
  isDragOverlay,
}: {
  app: ApplicationWithDetails;
  isDragOverlay?: boolean;
}) {
  const daysInStage = daysSince(app.updated_at);
  const fullName = `${app.candidate_first_name} ${app.candidate_last_name}`;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200/80 p-3.5 transition-all group',
        isDragOverlay
          ? 'shadow-xl ring-2 ring-blue-400/50 rotate-[2deg] scale-105'
          : 'shadow-sm hover:shadow-md hover:border-gray-300',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
            getAvatarColor(fullName),
          )}
        >
          {getInitials(app.candidate_first_name, app.candidate_last_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">
            {fullName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {app.position_title}
          </p>
        </div>
        <GripVertical className="h-4 w-4 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {app.candidate_skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {app.candidate_skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
            >
              {s}
            </span>
          ))}
          {app.candidate_skills.length > 3 && (
            <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
              +{app.candidate_skills.length - 3}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-1 mt-2.5 text-gray-400">
        <Clock className="h-3 w-3" />
        <span className="text-[11px]">
          {daysInStage === 0 ? 'Today' : `${daysInStage}d ago`}
        </span>
      </div>
    </div>
  );
}

function KanbanCard({ app }: { app: ApplicationWithDetails }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: app.id,
      data: { app },
    });
  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab active:cursor-grabbing touch-none',
        isDragging && 'opacity-30',
      )}
    >
      <KanbanCardContent app={app} />
    </div>
  );
}

function KanbanColumn({
  stage,
  apps,
}: {
  stage: PipelineStage;
  apps: ApplicationWithDetails[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const colors = STAGE_HEADER_COLORS[stage];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border transition-all duration-200 min-w-[260px] w-[260px] md:w-auto md:flex-1',
        isOver
          ? 'border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-100/50 ring-1 ring-blue-400/30'
          : `${colors.border} bg-gray-50/50`,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2.5 px-3.5 py-3 rounded-t-xl border-b',
          colors.bg,
          colors.border,
        )}
      >
        <div className={cn('w-2.5 h-2.5 rounded-full', colors.dot)} />
        <h3 className="text-sm font-semibold text-gray-700 flex-1 truncate">
          {STAGE_LABELS[stage]}
        </h3>
        <span className="inline-flex items-center justify-center rounded-full bg-white/80 border border-gray-200/60 min-w-[22px] h-[22px] px-1.5 text-[11px] font-semibold text-gray-500">
          {apps.length}
        </span>
      </div>
      <div className="flex-1 p-2.5 space-y-2 min-h-[120px] overflow-y-auto max-h-[calc(100vh-260px)]">
        {apps.map((app) => (
          <KanbanCard key={app.id} app={app} />
        ))}
        {apps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <User className="h-6 w-6 text-gray-300 mb-1.5" />
            <p className="text-xs text-gray-400">No candidates</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AssignModal({
  isOpen,
  onClose,
  positionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  positionId?: string;
}) {
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(positionId || '');
  const [search, setSearch] = useState('');
  const { data: candidates } = useCandidates({
    search: search || undefined,
    per_page: 10,
  });
  const { data: positions } = usePositions({ status: 'open', per_page: 50 });
  const createApp = useCreateApplication();

  const handleAssign = async () => {
    if (!selectedCandidate || !selectedPosition) return;
    await createApp.mutateAsync({
      candidate_id: selectedCandidate,
      position_id: selectedPosition,
    });
    onClose();
    setSelectedCandidate('');
    setSearch('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Candidate to Position">
      <div className="space-y-4">
        {!positionId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Position
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select a position...</option>
              {positions?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} - {p.client_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Search Candidate
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        {candidates && candidates.data.length > 0 && (
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y">
            {candidates.data.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCandidate(c.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2.5',
                  selectedCandidate === c.id
                    ? 'bg-blue-50 font-medium text-blue-900'
                    : 'hover:bg-gray-50',
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0',
                    getAvatarColor(`${c.first_name} ${c.last_name}`),
                  )}
                >
                  {getInitials(c.first_name, c.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="truncate block">
                    {c.first_name} {c.last_name}
                  </span>
                  {c.current_title && (
                    <span className="text-gray-400 text-xs block truncate">
                      {c.current_title}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleAssign}
            isLoading={createApp.isPending}
            disabled={!selectedCandidate || !selectedPosition}
          >
            Assign
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function MobileKanbanView({
  kanbanData,
  updateStage,
}: {
  kanbanData: { stages: Record<string, ApplicationWithDetails[]> };
  updateStage: ReturnType<typeof useUpdateStage>;
}) {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const stage = ACTIVE_STAGES[activeStageIdx];
  const apps = kanbanData.stages[stage] || [];
  const colors = STAGE_HEADER_COLORS[stage];

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setActiveStageIdx((i) => Math.max(0, i - 1))}
          disabled={activeStageIdx === 0}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full', colors.dot)} />
          <h3 className="text-base font-semibold text-gray-800">
            {STAGE_LABELS[stage]}
          </h3>
          <span className="inline-flex items-center justify-center rounded-full bg-gray-100 min-w-[22px] h-[22px] px-1.5 text-[11px] font-semibold text-gray-500">
            {apps.length}
          </span>
        </div>
        <button
          onClick={() =>
            setActiveStageIdx((i) => Math.min(ACTIVE_STAGES.length - 1, i + 1))
          }
          disabled={activeStageIdx === ACTIVE_STAGES.length - 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {ACTIVE_STAGES.map((s, i) => (
          <button
            key={s}
            onClick={() => setActiveStageIdx(i)}
            className={cn(
              'flex-none px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
              i === activeStageIdx
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
            )}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {apps.map((app) => {
          const daysInStage = daysSince(app.updated_at);
          const fullName = `${app.candidate_first_name} ${app.candidate_last_name}`;

          return (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                    getAvatarColor(fullName),
                  )}
                >
                  {getInitials(
                    app.candidate_first_name,
                    app.candidate_last_name,
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    {fullName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {app.position_title}
                  </p>
                </div>
              </div>
              {app.candidate_skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {app.candidate_skills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span className="text-[11px]">
                    {daysInStage === 0
                      ? 'Today'
                      : `${daysInStage}d ago`}
                  </span>
                </div>
                <select
                  value={stage}
                  onChange={async (e) => {
                    try {
                      await updateStage.mutateAsync({
                        id: app.id,
                        data: {
                          stage: e.target.value as PipelineStage,
                        },
                      });
                    } catch {
                      /* handled by react-query */
                    }
                  }}
                  className="text-xs font-medium rounded-lg px-2.5 py-1.5 border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  {ACTIVE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      Move to {STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
        {apps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">
              No candidates in this stage
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PipelinePage() {
  const { id: positionId } = useParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(
    positionId ? 'kanban' : 'table',
  );
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [tableFilter, setTableFilter] = useState({ page: 1, per_page: 20 });
  const [activeDragApp, setActiveDragApp] =
    useState<ApplicationWithDetails | null>(null);

  const { data: kanbanData, isLoading: kanbanLoading } = usePositionPipeline(
    viewMode === 'kanban' ? positionId : undefined,
  );
  const { data: tableData, isLoading: tableLoading } = usePipelineList(
    viewMode === 'table' ? tableFilter : { page: 0 },
  );
  const updateStage = useUpdateStage();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const app = event.active.data.current?.app as
      | ApplicationWithDetails
      | undefined;
    if (app) setActiveDragApp(app);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragApp(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const appId = active.id as string;
    const newStage = over.id as PipelineStage;

    try {
      await updateStage.mutateAsync({ id: appId, data: { stage: newStage } });
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {positionId && (
            <Link
              to="/pipeline"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Pipeline
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-2 rounded-md transition-all',
                viewMode === 'kanban'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700',
              )}
              disabled={!positionId}
              title={
                !positionId ? 'Select a position to use Kanban view' : ''
              }
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 rounded-md transition-all',
                viewMode === 'table'
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setShowAssignModal(true)} size="sm">
            <Plus className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Assign Candidate</span>
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' &&
        positionId &&
        (kanbanLoading ? (
          <LoadingSpinner />
        ) : kanbanData ? (
          <>
            {/* Desktop: drag-and-drop board */}
            <div className="hidden md:block">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
                  {ACTIVE_STAGES.map((stage) => (
                    <KanbanColumn
                      key={stage}
                      stage={stage}
                      apps={kanbanData.stages[stage] || []}
                    />
                  ))}
                </div>
                <DragOverlay dropAnimation={null}>
                  {activeDragApp && (
                    <div className="w-[260px]">
                      <KanbanCardContent
                        app={activeDragApp}
                        isDragOverlay
                      />
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Mobile: swipeable single-column view */}
            <MobileKanbanView
              kanbanData={kanbanData}
              updateStage={updateStage}
            />
          </>
        ) : (
          <p className="text-gray-500 text-center py-12">No data</p>
        ))}

      {/* Table View */}
      {viewMode === 'table' &&
        (tableLoading ? (
          <LoadingSpinner />
        ) : tableData && tableData.data.length > 0 ? (
          <Transition
            appear
            show
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
          >
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tableData.data.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/candidates/${app.candidate_id}`}
                            className="flex items-center gap-2.5 group"
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                                getAvatarColor(
                                  `${app.candidate_first_name} ${app.candidate_last_name}`,
                                ),
                              )}
                            >
                              {getInitials(
                                app.candidate_first_name,
                                app.candidate_last_name,
                              )}
                            </div>
                            <span className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                              {app.candidate_first_name}{' '}
                              {app.candidate_last_name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          <Link
                            to={`/positions/${app.position_id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {app.position_title}
                          </Link>
                          <span className="text-gray-400 ml-1.5 text-xs">
                            ({app.position_client_name})
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={app.stage}
                            onChange={async (e) => {
                              try {
                                await updateStage.mutateAsync({
                                  id: app.id,
                                  data: {
                                    stage: e.target.value as PipelineStage,
                                  },
                                });
                              } catch {
                                /* handled by react-query */
                              }
                            }}
                            className={cn(
                              'text-xs font-medium rounded-full px-3 py-1.5 border-0 cursor-pointer transition-colors',
                              STAGE_COLORS[
                                app.stage as PipelineStage
                              ] || '',
                            )}
                          >
                            {Object.entries(STAGE_LABELS).map(
                              ([val, label]) => (
                                <option key={val} value={val}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">
                          {new Date(app.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-gray-100">
                {tableData.data.map((app) => (
                  <div key={app.id} className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                          getAvatarColor(
                            `${app.candidate_first_name} ${app.candidate_last_name}`,
                          ),
                        )}
                      >
                        {getInitials(
                          app.candidate_first_name,
                          app.candidate_last_name,
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/candidates/${app.candidate_id}`}
                          className="font-medium text-sm text-gray-900 hover:text-blue-600 block truncate"
                        >
                          {app.candidate_first_name}{' '}
                          {app.candidate_last_name}
                        </Link>
                        <Link
                          to={`/positions/${app.position_id}`}
                          className="text-xs text-gray-500 hover:text-blue-600 block truncate"
                        >
                          {app.position_title}
                          <span className="text-gray-400 ml-1">
                            ({app.position_client_name})
                          </span>
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <select
                        value={app.stage}
                        onChange={async (e) => {
                          try {
                            await updateStage.mutateAsync({
                              id: app.id,
                              data: {
                                stage: e.target.value as PipelineStage,
                              },
                            });
                          } catch {
                            /* handled by react-query */
                          }
                        }}
                        className={cn(
                          'text-xs font-medium rounded-full px-3 py-1 border-0',
                          STAGE_COLORS[
                            app.stage as PipelineStage
                          ] || '',
                        )}
                      >
                        {Object.entries(STAGE_LABELS).map(
                          ([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                      <span className="text-xs text-gray-400">
                        {new Date(app.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                page={tableData.page}
                totalPages={tableData.total_pages}
                onPageChange={(p) =>
                  setTableFilter((f) => ({ ...f, page: p }))
                }
              />
            </div>
          </Transition>
        ) : (
          <div className="text-center py-16">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">
              No applications in pipeline yet.
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Assign your first candidate to a position to get started.
            </p>
            <Button onClick={() => setShowAssignModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Assign First Candidate
            </Button>
          </div>
        ))}

      <AssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        positionId={positionId}
      />
    </div>
  );
}
