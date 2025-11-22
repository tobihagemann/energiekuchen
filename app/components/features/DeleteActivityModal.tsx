'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';
import { useEnergy } from '../../lib/contexts/EnergyContext';
import { useUI } from '../../lib/contexts/UIContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function DeleteActivityModal() {
  const { state: energyState, deleteActivity } = useEnergy();
  const { state: uiState, setDeleteConfirmation } = useUI();
  const [error, setError] = useState('');

  // Get the activity to delete based on deleteConfirmation state
  const activity = uiState.deleteConfirmation
    ? energyState.data[uiState.deleteConfirmation.chartType].activities.find(a => a.id === uiState.deleteConfirmation!.activityId)
    : undefined;

  const handleClose = useCallback(() => {
    setDeleteConfirmation(null);
    setError('');
  }, [setDeleteConfirmation]);

  const handleDelete = useCallback(() => {
    if (uiState.deleteConfirmation && activity) {
      setError('');
      try {
        deleteActivity(uiState.deleteConfirmation.chartType, uiState.deleteConfirmation.activityId);
        handleClose();
      } catch (error) {
        console.error('Error deleting activity:', error);
        setError('Fehler beim Löschen der Aktivität');
      }
    }
  }, [uiState.deleteConfirmation, activity, deleteActivity, handleClose]);

  // Handle Enter key to confirm deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && uiState.deleteConfirmation) {
        e.preventDefault();
        handleDelete();
      }
    };

    if (uiState.deleteConfirmation) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [uiState.deleteConfirmation, handleDelete]);

  if (!uiState.deleteConfirmation || !activity) {
    return null;
  }

  return (
    <Modal isOpen={!!uiState.deleteConfirmation} onClose={handleClose} title="Aktivität löschen" titleIcon={<TrashIcon className="h-5 w-5" />} size="sm">
      <div className="space-y-4 sm:space-y-6" data-testid="activity-delete-confirmation-modal">
        <p className="text-gray-600">
          Möchtest du die Aktivität „<strong>{activity.name}</strong>“ wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        {error && (
          <div role="alert" aria-live="polite" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="delete-error">
            {error}
          </div>
        )}
        <div className="flex">
          <Button variant="danger" onClick={handleDelete} className="flex-1" data-testid="confirm-delete-activity-button">
            Löschen
          </Button>
        </div>
      </div>
    </Modal>
  );
}
