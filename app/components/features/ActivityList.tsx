'use client';

import { ActivityForm } from '@/app/components/forms/ActivityForm';
import { AddActivity } from '@/app/components/features/AddActivity';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { Activity } from '@/app/types';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useState, useEffect, useCallback } from 'react';
import { SortableActivityItem } from './SortableActivityItem';

interface ActivityListProps {
  chartType: 'positive' | 'negative';
  activities: Activity[];
  className?: string;
}

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export function ActivityList({ chartType, activities, className }: ActivityListProps) {
  const { deleteActivity, reorderActivities } = useEnergy();
  const { state: uiState, setEditingActivity, setDeleteConfirmation } = useUI();
  const [activeId, setActiveId] = useState<string | null>(null);

  const isEditing = uiState.editingActivity?.chartType === chartType;
  const editingActivityId = isEditing ? uiState.editingActivity?.activityId : null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleEdit = (activityId: string) => {
    setEditingActivity({ chartType, activityId });
  };

  const handleDelete = (activityId: string) => {
    setDeleteConfirmation({ chartType, activityId });
  };

  const confirmDelete = useCallback(() => {
    if (uiState.deleteConfirmation) {
      try {
        deleteActivity(uiState.deleteConfirmation.chartType, uiState.deleteConfirmation.activityId);
        toast.success('Aktivität gelöscht');
        setDeleteConfirmation(null);
      } catch {
        toast.error('Fehler beim Löschen der Aktivität');
      }
    }
  }, [uiState.deleteConfirmation, deleteActivity, setDeleteConfirmation]);

  const handleEditSuccess = () => {
    setEditingActivity(null);
  };

  const handleEditCancel = () => {
    setEditingActivity(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activities.findIndex(activity => activity.id === active.id);
      const newIndex = activities.findIndex(activity => activity.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderActivities(chartType, oldIndex, newIndex);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && uiState.deleteConfirmation?.chartType === chartType) {
        e.preventDefault();
        confirmDelete();
      }
    };

    if (uiState.deleteConfirmation?.chartType === chartType) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [uiState.deleteConfirmation, chartType, confirmDelete]);

  return (
    <div className={className} data-testid={`activity-list-${chartType}`}>
      <div className="mb-4">
        <h3 className="mb-3 text-lg font-medium text-gray-900">
          Aktivitäten
          {activities.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({activities.length})</span>}
        </h3>
        <AddActivity chartType={chartType} />
      </div>

      {/* Activities list */}
      {activities.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          autoScroll={false}>
          <SortableContext items={activities.map(activity => activity.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2" data-testid={`activities-list-${chartType}`}>
              {activities.map(activity => {
                const isCurrentlyEditing = editingActivityId === activity.id;

                if (isCurrentlyEditing) {
                  return (
                    <div key={activity.id} className="rounded-lg bg-blue-50 p-4" data-testid={`edit-activity-form-${activity.id}`}>
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <PencilIcon className="h-4 w-4" />
                        Aktivität bearbeiten
                      </h4>
                      <ActivityForm chartType={chartType} activity={activity} onSuccess={handleEditSuccess} onCancel={handleEditCancel} />
                    </div>
                  );
                }

                return (
                  <SortableActivityItem
                    key={activity.id}
                    activity={activity}
                    chartType={chartType}
                    isEditing={isEditing}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeId ? (
              <SortableActivityItem
                activity={activities.find(a => a.id === activeId)!}
                chartType={chartType}
                isEditing={false}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="py-8 text-center text-gray-500" data-testid={`empty-activities-${chartType}`}>
          <div className="mb-2 text-4xl">📝</div>
          <div className="text-sm">Noch keine Aktivitäten vorhanden</div>
          <div className="mt-1 text-xs text-gray-400">Füge deine erste Aktivität hinzu, um zu beginnen</div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={uiState.deleteConfirmation?.chartType === chartType} onClose={() => setDeleteConfirmation(null)} title="Aktivität löschen" size="sm">
        <div className="space-y-4" data-testid="activity-delete-confirmation-modal">
          <p className="text-sm text-gray-600">Möchtest du diese Aktivität wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmation(null)}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500">
              Löschen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
