'use client';

import { Button } from '@/app/components/ui/Button';
import { getColorForLevel } from '@/app/lib/utils/constants';
import { Activity } from '@/app/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon, MinusCircleIcon, PencilIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface SortableActivityItemProps {
  activity: Activity;
  chartType: 'positive' | 'negative';
  isEditing: boolean;
  onEdit: (activityId: string) => void;
  onDelete: (activityId: string) => void;
}

export function SortableActivityItem({ activity, chartType, isEditing, onEdit, onDelete }: SortableActivityItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 ${isDragging ? 'opacity-50' : ''}`}
      data-testid={`activity-item-${activity.id}`}>
      <div className="flex min-w-0 flex-1 items-center space-x-3" data-testid="activity-item">
        {!isEditing && (
          <button ref={setActivatorNodeRef} className="cursor-move touch-none p-1 text-gray-400 hover:text-gray-600" {...attributes} {...listeners}>
            <Bars3Icon className="h-4 w-4" />
          </button>
        )}
        <div className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: getColorForLevel(activity.value, chartType) }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-gray-900" data-testid={`activity-name-${activity.id}`}>
            {activity.name}
          </div>
          <div className="flex items-center text-xs text-gray-500" data-testid={`activity-value-${activity.id}`}>
            {Array.from({ length: activity.value }, (_, i) => (
              <span key={i} className="inline-block">
                {chartType === 'positive' ? <PlusCircleIcon className="h-4 w-4" /> : <MinusCircleIcon className="h-4 w-4" />}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(activity.id)}
          disabled={isEditing}
          className="activity-edit-button h-8 w-8 p-0"
          data-testid={`edit-activity-button-${activity.id}`}>
          <PencilIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(activity.id)}
          disabled={isEditing}
          className="activity-delete-button h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
          data-testid={`delete-activity-button-${activity.id}`}>
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
