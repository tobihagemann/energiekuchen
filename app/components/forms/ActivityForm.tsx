'use client';

import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Slider } from '@/app/components/ui/Slider';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { CHART_DEFAULTS, getColorForLevel } from '@/app/lib/utils/constants';
import { validateActivity } from '@/app/lib/utils/validation';
import { Activity } from '@/app/types';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface ActivityFormProps {
  chartType: 'positive' | 'negative';
  activity?: Activity;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ActivityForm({ chartType, activity, onSuccess, onCancel }: ActivityFormProps) {
  const { addActivity, updateActivity } = useEnergy();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: activity?.name || '',
    value: activity?.value || CHART_DEFAULTS.defaultLevel,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const isEditing = !!activity;

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name,
        value: activity.value,
      });
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateActivity(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing && activity) {
        await updateActivity(chartType, activity.id, formData);
        toast.success('Aktivität aktualisiert');
      } else {
        await addActivity(chartType, formData);
        toast.success('Aktivität hinzugefügt');
      }

      // Reset form
      setFormData({
        name: '',
        value: CHART_DEFAULTS.defaultLevel,
      });
      setErrors([]);
      onSuccess?.();
    } catch {
      toast.error('Fehler beim Speichern der Aktivität');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      value: CHART_DEFAULTS.defaultLevel,
    });
    setErrors([]);
    onCancel?.();
  };

  const handleValueChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      value,
    }));
  };

  const placeholder = chartType === 'positive' ? 'z.B. Sport, Entspannung, Zeit mit Freunden' : 'z.B. Überstunden, Stress, schwierige Gespräche';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid={`activity-form-${chartType}`}>
      <div>
        <Input
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
        <Slider
          label="Energieniveau"
          value={formData.value}
          onChange={handleValueChange}
          min={CHART_DEFAULTS.minLevel}
          max={CHART_DEFAULTS.maxLevel}
          step={1}
          data-testid="activity-value-slider"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center space-x-3">
          <div
            className="h-10 w-10 rounded-lg border-2 border-gray-300"
            style={{ backgroundColor: getColorForLevel(formData.value, chartType) }}
            aria-label="Ausgewählte Farbe"
          />
          <div className="text-sm text-gray-600">Die Farbe wird automatisch basierend auf dem Energieniveau zugewiesen.</div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3" data-testid="form-errors">
          <div className="text-sm text-red-800">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button type="submit" isLoading={isSubmitting} className="flex-1" data-testid="submit-activity-button">
          {isEditing ? 'Aktualisieren' : 'Hinzufügen'}
        </Button>

        {(isEditing || onCancel) && (
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting} data-testid="cancel-activity-button">
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}
