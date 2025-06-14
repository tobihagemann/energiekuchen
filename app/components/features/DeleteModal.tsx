'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useEnergy } from '../../lib/contexts/EnergyContext';
import { useUI } from '../../lib/contexts/UIContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function DeleteModal() {
  const { state: uiState, closeDeleteModal } = useUI();
  const { dispatch } = useEnergy();

  const handleClearAll = () => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
    toast.success('Alle Daten wurden gelöscht');
    closeDeleteModal();
  };

  return (
    <Modal isOpen={uiState.isDeleteModalOpen} onClose={closeDeleteModal} title="Löschen" titleIcon={<TrashIcon className="h-5 w-5" />} size="sm">
      <div className="space-y-4" data-testid="delete-modal">
        <p className="text-gray-600">Diese Aktion löscht alle deine Aktivitäten und setzt die Anwendung zurück. Sie kann nicht rückgängig gemacht werden.</p>

        <Button onClick={handleClearAll} variant="danger" className="w-full">
          Daten löschen
        </Button>
      </div>
    </Modal>
  );
}
