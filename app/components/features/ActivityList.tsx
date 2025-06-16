'use client';

import { AddActivity } from '@/app/components/features/AddActivity';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { Activity } from '@/app/types';
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DropAnimation,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
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
  const { reorderActivities } = useEnergy();
  const { setEditingActivity, setDeleteConfirmation, openEditModal } = useUI();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleEdit = (activityId: string) => {
    setEditingActivity({ chartType, activityId });
    openEditModal();
  };

  const handleDelete = (activityId: string) => {
    setDeleteConfirmation({ chartType, activityId });
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
              {activities.map(activity => (
                <SortableActivityItem
                  key={activity.id}
                  activity={activity}
                  chartType={chartType}
                  isEditing={false}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
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
    </div>
  );
}
