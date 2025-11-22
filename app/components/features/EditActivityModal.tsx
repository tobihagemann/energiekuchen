'use client';

import { PencilIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEnergy } from '../../lib/contexts/EnergyContext';
import { useUI } from '../../lib/contexts/UIContext';
import { validateActivity } from '../../lib/utils/validation';
import { ActivityValueIndicator } from '../ui/ActivityValueIndicator';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Slider } from '../ui/Slider';

export function EditActivityModal() {
  const { state: energyState, updateActivity } = useEnergy();
  const { state: uiState, closeEditModal, setEditingActivity } = useUI();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the activity to edit based on editingActivity state
  const activity = uiState.editingActivity
    ? energyState.data[uiState.editingActivity.chartType].activities.find(a => a.id === uiState.editingActivity!.activityId)
    : undefined;

  const [formData, setFormData] = useState({
    name: activity?.name || '',
    value: activity?.value || 1,
  });

  const [errors, setErrors] = useState<string[]>([]);

  // Update form data when activity changes
  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name,
        value: activity.value,
      });
    }
  }, [activity]);

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (uiState.isEditModalOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [uiState.isEditModalOpen]);

  const handleClose = useCallback(() => {
    closeEditModal();
    setEditingActivity(null);
    setFormData({ name: '', value: 1 });
    setErrors([]);
  }, [closeEditModal, setEditingActivity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiState.editingActivity || !activity) return;

    setIsSubmitting(true);

    const validation = validateActivity(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await updateActivity(uiState.editingActivity.chartType, activity.id, formData);
      handleClose();
    } catch (error) {
      console.error('Error updating activity:', error);
      setErrors(['Fehler beim Speichern der Aktivität']);
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValueChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      value,
    }));
  };

  if (!uiState.editingActivity || !activity) {
    return null;
  }

  const chartType = uiState.editingActivity.chartType;
  const placeholder = chartType === 'current' ? 'z.B. Sport, Überstunden, schwierige Gespräche' : 'z.B. Entspannung, Zeit mit Freunden, Hobby';

  return (
    <Modal isOpen={uiState.isEditModalOpen} onClose={handleClose} title="Aktivität bearbeiten" titleIcon={<PencilIcon className="h-5 w-5" />} size="md">
      <div data-testid="edit-activity-modal">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" data-testid={`activity-form-${chartType}`}>
          <div>
            <Input
              ref={nameInputRef}
              label="Aktivitätsname"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={placeholder}
              maxLength={50}
              error={errors.find(error => error.includes('name') || error.includes('Name'))}
              data-testid="activity-name-input"
            />
          </div>

          <div>
            <div className="mb-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <span>Energieniveau:</span>
                <ActivityValueIndicator value={formData.value} />
              </div>
            </div>
            <Slider value={formData.value} onChange={handleValueChange} min={-5} max={5} step={1} data-testid="activity-value-slider" />
          </div>

          <ErrorMessage error={errors} testId="form-errors" />

          <div className="flex">
            <Button type="submit" isLoading={isSubmitting} className="flex-1" data-testid="submit-activity-button">
              Aktualisieren
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
