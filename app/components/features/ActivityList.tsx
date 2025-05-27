'use client';

import { ActivityForm } from '@/app/components/forms/ActivityForm';
import { Button } from '@/app/components/ui/Button';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { Activity } from '@/app/types';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ActivityListProps {
  chartType: 'positive' | 'negative';
  activities: Activity[];
  className?: string;
}

export function ActivityList({ chartType, activities, className }: ActivityListProps) {
  const { deleteActivity } = useEnergy();
  const { state: uiState, setEditingActivity } = useUI();
  const [showAddForm, setShowAddForm] = useState(false);

  const isEditing = uiState.editingActivity?.chartType === chartType;
  const editingActivityId = isEditing ? uiState.editingActivity?.activityId : null;

  const handleEdit = (activityId: string) => {
    setEditingActivity({ chartType, activityId });
  };

  const handleDelete = async (activityId: string) => {
    if (window.confirm('Möchten Sie diese Aktivität wirklich löschen?')) {
      try {
        await deleteActivity(chartType, activityId);
        toast.success('Aktivität gelöscht');
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

  const handleAddSuccess = () => {
    setShowAddForm(false);
  };

  const handleAddCancel = () => {
    setShowAddForm(false);
  };

  const title = chartType === 'positive' ? 'Energiequellen' : 'Energieverbraucher';

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <Button size="sm" onClick={() => setShowAddForm(true)} disabled={showAddForm || isEditing}>
          Hinzufügen
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">Neue Aktivität hinzufügen</h4>
          <ActivityForm chartType={chartType} onSuccess={handleAddSuccess} onCancel={handleAddCancel} />
        </div>
      )}

      {/* Activities list */}
      {activities.length > 0 ? (
        <div className="space-y-2">
          {activities.map(activity => {
            const isCurrentlyEditing = editingActivityId === activity.id;

            if (isCurrentlyEditing) {
              return (
                <div key={activity.id} className="rounded-lg bg-blue-50 p-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">Aktivität bearbeiten</h4>
                  <ActivityForm chartType={chartType} activity={activity} onSuccess={handleEditSuccess} onCancel={handleEditCancel} />
                </div>
              );
            }

            return (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50">
                <div className="flex min-w-0 flex-1 items-center space-x-3">
                  <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: activity.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">{activity.name}</div>
                    <div className="text-xs text-gray-500">Energie: {activity.value}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(activity.id)} disabled={showAddForm || isEditing} className="h-8 w-8 p-0">
                    <PencilIcon className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(activity.id)}
                    disabled={showAddForm || isEditing}
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <div className="mb-2 text-4xl">📝</div>
          <div className="text-sm">Noch keine Aktivitäten vorhanden</div>
          <div className="mt-1 text-xs text-gray-400">Klicken Sie auf &ldquo;Hinzufügen&rdquo; um zu beginnen</div>
        </div>
      )}
    </div>
  );
}
