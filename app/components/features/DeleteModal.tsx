'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useEnergy } from '../../lib/contexts/EnergyContext';
import { useUI } from '../../lib/contexts/UIContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function DeleteModal() {
  const { state: uiState, closeDeleteModal } = useUI();
  const { dispatch } = useEnergy();

  const handleClearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
    toast.success('Alle Daten wurden gelöscht');
    closeDeleteModal();
  }, [dispatch, closeDeleteModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && uiState.isDeleteModalOpen) {
        e.preventDefault();
        handleClearAll();
      }
    };

    if (uiState.isDeleteModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [uiState.isDeleteModalOpen, handleClearAll]);

  return (
    <Modal isOpen={uiState.isDeleteModalOpen} onClose={closeDeleteModal} title="Energiekuchen löschen" titleIcon={<TrashIcon className="h-5 w-5" />} size="sm">
      <div className="space-y-4" data-testid="delete-modal">
        <p className="text-gray-600">Diese Aktion löscht alle deine Aktivitäten und setzt die Anwendung zurück. Sie kann nicht rückgängig gemacht werden.</p>

        <Button onClick={handleClearAll} variant="danger" className="w-full">
          Daten löschen
        </Button>
      </div>
    </Modal>
  );
}
