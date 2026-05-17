'use client';

import { PencilIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useEnergy } from '../../lib/contexts/EnergyContext';
import { useUI } from '../../lib/contexts/UIContext';
import { cn } from '../../lib/utils/cn';
import { NEGATIVE_COLOR, POSITIVE_COLOR } from '../../lib/utils/constants';
import { getFloor } from '../../lib/utils/floor';
import { redistributeProportionalAll } from '../../lib/utils/redistribution';
import { validateActivity } from '../../lib/utils/validation';
import { Polarity } from '../../types';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Slider } from '../ui/Slider';
import { Textarea } from '../ui/Textarea';

export function EditActivityModal() {
  const { state: energyState, updateActivity, setActivityWeights, togglePolarity } = useEnergy();
  const { state: uiState, closeEditModal, setEditingActivity } = useUI();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const positivePolarityRef = useRef<HTMLButtonElement>(null);
  const negativePolarityRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activity = uiState.editingActivity
    ? energyState.data[uiState.editingActivity.chartType].activities.find(a => a.id === uiState.editingActivity!.activityId)
    : undefined;
  const chartType = uiState.editingActivity?.chartType;

  // Snapshot the pre-edit chart composition at modal open time so polarity toggles
  // in the form don't reshape the slider's bounds underneath the user.
  const snapshot = useMemo(() => {
    if (!activity || !chartType) return null;
    const activities = energyState.data[chartType].activities;
    const chartTotal = activities.reduce((sum, a) => sum + a.weight, 0);
    const otherCount = activities.length - 1;
    const floor = getFloor(chartTotal);
    const floorExactPct = chartTotal > 0 ? floor / chartTotal : 0.01;
    const floorPct = Math.max(1, Math.ceil(floorExactPct * 100));
    const initialPct = chartTotal > 0 ? Math.round((activity.weight / chartTotal) * 100) : 100;

    return {
      chartTotal,
      otherCount,
      floor,
      floorExactPct,
      floorPct,
      initialPct,
      currentActivities: activities,
    };
    // Only recompute when the modal opens for a new activity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.id, chartType]);

  const sliderMaxFromFloor = snapshot ? Math.max(snapshot.floorPct, Math.floor((1 - snapshot.otherCount * snapshot.floorExactPct) * 100)) : 100;
  const sliderMaxFromWeightCap = snapshot && snapshot.chartTotal > 0 ? Math.max(snapshot.floorPct, Math.floor((10000 / snapshot.chartTotal) * 100)) : 100;
  const sliderMax = snapshot ? Math.min(sliderMaxFromFloor, sliderMaxFromWeightCap) : 100;
  const sliderMin = snapshot ? snapshot.floorPct : 1;
  const clampedInitial = snapshot ? Math.min(sliderMax, Math.max(sliderMin, snapshot.initialPct)) : 100;

  const [formData, setFormData] = useState<{ name: string; sliderPercent: number; polarity: Polarity; details: string }>({
    name: activity?.name || '',
    sliderPercent: clampedInitial,
    polarity: activity?.polarity || 'positive',
    details: activity?.details || '',
  });
  const initialSliderPercentRef = useRef(clampedInitial);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (activity && snapshot) {
      const clamped = Math.min(sliderMax, Math.max(sliderMin, snapshot.initialPct));
      setFormData({
        name: activity.name,
        sliderPercent: clamped,
        polarity: activity.polarity,
        details: activity.details || '',
      });
      initialSliderPercentRef.current = clamped;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.id]);

  useEffect(() => {
    if (uiState.isEditModalOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [uiState.isEditModalOpen]);

  const selectPolarity = (next: Polarity) => {
    setFormData(prev => ({ ...prev, polarity: next }));
    // WAI-ARIA APG radiogroup: focus follows selection.
    (next === 'positive' ? positivePolarityRef : negativePolarityRef).current?.focus();
  };

  const handlePolarityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      selectPolarity(formData.polarity === 'positive' ? 'negative' : 'positive');
    }
  };

  const handleClose = useCallback(() => {
    closeEditModal();
    setEditingActivity(null);
    setFormData({ name: '', sliderPercent: 100, polarity: 'positive', details: '' });
    setErrors([]);
  }, [closeEditModal, setEditingActivity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiState.editingActivity || !activity || !snapshot || !chartType) return;

    setIsSubmitting(true);

    const targetWeight = snapshot.chartTotal > 0 ? (formData.sliderPercent / 100) * snapshot.chartTotal : activity.weight;
    const candidate = {
      id: activity.id,
      name: formData.name,
      weight: targetWeight,
      polarity: formData.polarity,
      details: formData.details,
    };

    const validation = validateActivity(candidate);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const nameChanged = formData.name !== activity.name;
      const detailsChanged = (formData.details || '') !== (activity.details || '');
      if (nameChanged || detailsChanged) {
        updateActivity(chartType, activity.id, {
          name: formData.name,
          details: formData.details || undefined,
        });
      }

      if (formData.sliderPercent !== initialSliderPercentRef.current && snapshot.currentActivities.length > 1) {
        const newWeights = redistributeProportionalAll(
          snapshot.currentActivities.map(a => ({ id: a.id, weight: a.weight })),
          activity.id,
          targetWeight,
          snapshot.floor
        );
        setActivityWeights(chartType, newWeights);
      }

      if (formData.polarity !== activity.polarity) {
        togglePolarity(chartType, activity.id);
      }

      handleClose();
    } catch (error) {
      console.error('Error updating activity:', error);
      setErrors(['Fehler beim Speichern der Aktivität']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!uiState.editingActivity || !activity || !chartType || !snapshot) {
    return null;
  }

  const placeholder = chartType === 'current' ? 'z.B. Sport, Überstunden, schwierige Gespräche' : 'z.B. Entspannung, Zeit mit Freunden, Hobby';
  const sliderColor = formData.polarity === 'positive' ? POSITIVE_COLOR : NEGATIVE_COLOR;
  const isSingleActivity = snapshot.otherCount === 0;
  const displayPercent = isSingleActivity ? 100 : formData.sliderPercent;

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
            <Textarea
              label="Details (optional)"
              value={formData.details}
              onChange={e => setFormData(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Zusätzliche Informationen zur Aktivität"
              maxLength={150}
              rows={3}
              error={errors.find(error => error.includes('Details'))}
              data-testid="activity-details-input"
            />
          </div>

          <div>
            <div id="polarity-group-label" className="mb-2 block text-sm font-medium text-gray-700">
              Polarität
            </div>
            {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- ARIA radiogroup: focus lives on individual radio children via roving tabindex */}
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="polarity-group-label" onKeyDown={handlePolarityKeyDown}>
              <button
                ref={positivePolarityRef}
                type="button"
                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- styled toggle group; native radios can't host the colored panel design
                role="radio"
                aria-checked={formData.polarity === 'positive'}
                tabIndex={formData.polarity === 'positive' ? 0 : -1}
                onClick={() => selectPolarity('positive')}
                className={cn(
                  'rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors',
                  formData.polarity === 'positive' ? 'border-transparent bg-green-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                )}
                data-testid="polarity-positive-button">
                Energiequelle
              </button>
              <button
                ref={negativePolarityRef}
                type="button"
                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- styled toggle group; native radios can't host the colored panel design
                role="radio"
                aria-checked={formData.polarity === 'negative'}
                tabIndex={formData.polarity === 'negative' ? 0 : -1}
                onClick={() => selectPolarity('negative')}
                className={cn(
                  'rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors',
                  formData.polarity === 'negative' ? 'border-transparent bg-red-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                )}
                data-testid="polarity-negative-button">
                Energieräuber
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>Anteil:</span>
              <span data-testid="activity-percentage-readout">{displayPercent} %</span>
            </div>
            <Slider
              value={isSingleActivity ? 100 : formData.sliderPercent}
              onChange={pct => setFormData(prev => ({ ...prev, sliderPercent: pct }))}
              min={sliderMin}
              max={sliderMax}
              step={1}
              color={sliderColor}
              ariaLabel="Anteil"
              ariaValuetext={`${displayPercent} Prozent`}
              disabled={isSingleActivity}
              data-testid="activity-value-slider"
            />
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
