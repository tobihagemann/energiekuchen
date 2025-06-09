'use client';

import { ActivityForm } from '@/app/components/forms/ActivityForm';
import { AddActivity } from '@/app/components/features/AddActivity';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { getColorForLevel } from '@/app/lib/utils/constants';
import { Activity } from '@/app/types';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ActivityListProps {
  chartType: 'positive' | 'negative';
  activities: Activity[];
  className?: string;
}

export function ActivityList({ chartType, activities, className }: ActivityListProps) {
  const { deleteActivity } = useEnergy();
  const { state: uiState, setEditingActivity, setDeleteConfirmation } = useUI();

  const isEditing = uiState.editingActivity?.chartType === chartType;
  const editingActivityId = isEditing ? uiState.editingActivity?.activityId : null;

  const handleEdit = (activityId: string) => {
    setEditingActivity({ chartType, activityId });
  };

  const handleDelete = (activityId: string) => {
    setDeleteConfirmation({ chartType, activityId });
  };

  const confirmDelete = () => {
    if (uiState.deleteConfirmation) {
      try {
        deleteActivity(uiState.deleteConfirmation.chartType, uiState.deleteConfirmation.activityId);
        toast.success('Aktivität gelöscht');
        setDeleteConfirmation(null);
      } catch {
        toast.error('Fehler beim Löschen der Aktivität');
      }
    }
  };

  const handleEditSuccess = () => {
    setEditingActivity(null);
  };

  const handleEditCancel = () => {
    setEditingActivity(null);
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
        <div className="space-y-2" data-testid={`activities-list-${chartType}`}>
          {activities.map(activity => {
            const isCurrentlyEditing = editingActivityId === activity.id;

            if (isCurrentlyEditing) {
              return (
                <div key={activity.id} className="rounded-lg bg-blue-50 p-4" data-testid={`edit-activity-form-${activity.id}`}>
                  <h4 className="mb-3 text-sm font-medium text-gray-700">Aktivität bearbeiten</h4>
                  <ActivityForm chartType={chartType} activity={activity} onSuccess={handleEditSuccess} onCancel={handleEditCancel} />
                </div>
              );
            }

            return (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
                data-testid={`activity-item-${activity.id}`}>
                <div className="flex min-w-0 flex-1 items-center space-x-3" data-testid="activity-item">
                  <div className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: getColorForLevel(activity.value, chartType) }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900" data-testid={`activity-name-${activity.id}`}>
                      {activity.name}
                    </div>
                    <div className="text-xs text-gray-500" data-testid={`activity-value-${activity.id}`}>
                      Energieniveau: {activity.value}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(activity.id)}
                    disabled={isEditing}
                    className="activity-edit-button h-8 w-8 p-0"
                    data-testid={`edit-activity-button-${activity.id}`}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(activity.id)}
                    disabled={isEditing}
                    className="activity-delete-button h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    data-testid={`delete-activity-button-${activity.id}`}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500" data-testid={`empty-activities-${chartType}`}>
          <div className="mb-2 text-4xl">📝</div>
          <div className="text-sm">Noch keine Aktivitäten vorhanden</div>
          <div className="mt-1 text-xs text-gray-400">Klicken Sie auf &ldquo;Hinzufügen&rdquo; um zu beginnen</div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={uiState.deleteConfirmation?.chartType === chartType} onClose={() => setDeleteConfirmation(null)} title="Aktivität löschen" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Möchten Sie diese Aktivität wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
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
