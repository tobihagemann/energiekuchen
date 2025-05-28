'use client';

import { Button } from '@/app/components/ui/Button';
import { ColorPicker } from '@/app/components/ui/ColorPicker';
import { Input } from '@/app/components/ui/Input';
import { Slider } from '@/app/components/ui/Slider';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { COLOR_PALETTES } from '@/app/lib/utils/constants';
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
    value: activity?.value || 10,
    color: activity?.color || COLOR_PALETTES[chartType][0],
  });

  const [errors, setErrors] = useState<string[]>([]);

  const isEditing = !!activity;
  const colorPresets = COLOR_PALETTES[chartType];

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name,
        value: activity.value,
        color: activity.color,
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
        value: 10,
        color: COLOR_PALETTES[chartType][0],
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
      value: 10,
      color: COLOR_PALETTES[chartType][0],
    });
    setErrors([]);
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid={`activity-form-${chartType}`}>
      <div>
        <Input
          label="Aktivitätsname"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="z.B. Sport, Entspannung, Überstunden..."
          maxLength={50}
          error={errors.find(error => error.includes('name') || error.includes('Name'))}
          data-testid="activity-name-input"
        />
      </div>

      <div>
        <Slider
          label="Energiewert"
          value={formData.value}
          onChange={value => setFormData(prev => ({ ...prev, value }))}
          min={1}
          max={100}
          step={1}
          data-testid="activity-value-slider"
        />
      </div>

      <div>
        <ColorPicker
          label="Farbe"
          color={formData.color}
          onChange={color => setFormData(prev => ({ ...prev, color }))}
          presets={colorPresets}
          data-testid="activity-color-picker"
        />
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
