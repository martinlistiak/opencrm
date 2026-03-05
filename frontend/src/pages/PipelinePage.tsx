import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { LayoutGrid, List, Plus, ArrowLeft } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { usePositionPipeline, usePipelineList, useUpdateStage, useCreateApplication } from '../hooks/usePipeline';
import { useCandidates } from '../hooks/useCandidates';
import { usePositions } from '../hooks/usePositions';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Pagination } from '../components/ui/Pagination';
import {
  ACTIVE_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  type PipelineStage,
  type ApplicationWithDetails,
} from '../types/pipeline';

// Kanban Card (draggable)
function KanbanCard({ app }: { app: ApplicationWithDetails }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
    data: { app },
  });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <p className="font-medium text-sm text-gray-900">
        {app.candidate_first_name} {app.candidate_last_name}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{app.position_title}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {app.candidate_skills.slice(0, 2).map((s) => (
          <Badge key={s} variant="blue">{s}</Badge>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">{daysSinceUpdate}d in stage</p>
    </div>
  );
}

// Kanban Column (droppable)
function KanbanColumn({
  stage,
  apps,
}: {
  stage: PipelineStage;
  apps: ApplicationWithDetails[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[250px] bg-gray-50 rounded-xl p-3 ${isOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{STAGE_LABELS[stage]}</h3>
        <Badge variant="gray">{apps.length}</Badge>
      </div>
      <div className="space-y-2 min-h-[100px]">
        {apps.map((app) => (
          <KanbanCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

// Assign Candidate Modal
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
  const { data: candidates } = useCandidates({ search: search || undefined, per_page: 10 });
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select a position...</option>
              {positions?.data.map((p) => (
                <option key={p.id} value={p.id}>{p.title} - {p.client_name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Candidate</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {candidates && candidates.data.length > 0 && (
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y">
            {candidates.data.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCandidate(c.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${selectedCandidate === c.id ? 'bg-blue-50 font-medium' : ''}`}
              >
                {c.first_name} {c.last_name}
                {c.current_title && <span className="text-gray-400 ml-2">- {c.current_title}</span>}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleAssign} isLoading={createApp.isPending} disabled={!selectedCandidate || !selectedPosition}>
            Assign
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

export function PipelinePage() {
  const { id: positionId } = useParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(positionId ? 'kanban' : 'table');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [tableFilter, setTableFilter] = useState({ page: 1, per_page: 20 });

  const { data: kanbanData, isLoading: kanbanLoading } = usePositionPipeline(
    viewMode === 'kanban' ? positionId : undefined
  );
  const { data: tableData, isLoading: tableLoading } = usePipelineList(
    viewMode === 'table' ? tableFilter : { page: 0 }
  );
  const updateStage = useUpdateStage();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {positionId && (
            <Link to="/pipeline" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              disabled={!positionId}
              title={!positionId ? 'Select a position to use Kanban view' : ''}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setShowAssignModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Assign Candidate
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && positionId && (
        kanbanLoading ? (
          <LoadingSpinner />
        ) : kanbanData ? (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {ACTIVE_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  apps={kanbanData.stages[stage] || []}
                />
              ))}
            </div>
          </DndContext>
        ) : (
          <p>No data</p>
        )
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        tableLoading ? (
          <LoadingSpinner />
        ) : tableData && tableData.data.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Candidate</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tableData.data.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link to={`/candidates/${app.candidate_id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {app.candidate_first_name} {app.candidate_last_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <Link to={`/positions/${app.position_id}`} className="hover:text-blue-600">
                          {app.position_title}
                        </Link>
                        <span className="text-gray-400 ml-1">({app.position_client_name})</span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={app.stage}
                          onChange={async (e) => {
                            try {
                              await updateStage.mutateAsync({
                                id: app.id,
                                data: { stage: e.target.value as PipelineStage },
                              });
                            } catch {}
                          }}
                          className={`text-xs font-medium rounded-full px-3 py-1 border-0 ${STAGE_COLORS[app.stage as PipelineStage] || ''}`}
                        >
                          {Object.entries(STAGE_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(app.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={tableData.page}
              totalPages={tableData.total_pages}
              onPageChange={(p) => setTableFilter((f) => ({ ...f, page: p }))}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No applications in pipeline yet.</p>
            <Button className="mt-4" onClick={() => setShowAssignModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> Assign First Candidate
            </Button>
          </div>
        )
      )}

      <AssignModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        positionId={positionId}
      />
    </div>
  );
}
