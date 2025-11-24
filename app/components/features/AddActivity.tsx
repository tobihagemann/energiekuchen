'use client';

import { Button } from '@/app/components/ui/Button';
import { ErrorMessage } from '@/app/components/ui/ErrorMessage';
import { Input } from '@/app/components/ui/Input';
import { InputGroup } from '@/app/components/ui/InputGroup';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { validateActivity } from '@/app/lib/utils/validation';
import { ChartType } from '@/app/types';
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';

interface AddActivityProps {
  chartType: ChartType;
  className?: string;
}

export function AddActivity({ chartType, className }: AddActivityProps) {
  const { addActivity } = useEnergy();
  const [positiveName, setPositiveName] = useState('');
  const [negativeName, setNegativeName] = useState('');
  const [isSubmittingPositive, setIsSubmittingPositive] = useState(false);
  const [isSubmittingNegative, setIsSubmittingNegative] = useState(false);
  const [positiveError, setPositiveError] = useState('');
  const [negativeError, setNegativeError] = useState('');
  const positiveInputRef = useRef<HTMLInputElement>(null);
  const negativeInputRef = useRef<HTMLInputElement>(null);

  const positivePlaceholder = chartType === 'current' ? 'Energiequelle (z.B. Hobby)' : 'Energiequelle (z.B. Sport)';
  const negativePlaceholder = chartType === 'current' ? 'Energieräuber (z.B. Pendeln)' : 'Energieräuber (z.B. Meetings)';

  const handleSubmitPositive = async (e: React.FormEvent) => {
    e.preventDefault();
    setPositiveError('');

    if (!positiveName.trim()) return;

    const newActivity = {
      name: positiveName.trim(),
      value: 3,
    };

    const validation = validateActivity(newActivity);
    if (!validation.isValid) {
      setPositiveError(validation.errors[0]);
      return;
    }

    setIsSubmittingPositive(true);

    try {
      addActivity(chartType, newActivity);
      setPositiveName('');
      setTimeout(() => {
        positiveInputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Error adding positive activity:', error);
      setPositiveError('Fehler beim Hinzufügen der Aktivität');
    } finally {
      setIsSubmittingPositive(false);
    }
  };

  const handleSubmitNegative = async (e: React.FormEvent) => {
    e.preventDefault();
    setNegativeError('');

    if (!negativeName.trim()) return;

    const newActivity = {
      name: negativeName.trim(),
      value: -3,
    };

    const validation = validateActivity(newActivity);
    if (!validation.isValid) {
      setNegativeError(validation.errors[0]);
      return;
    }

    setIsSubmittingNegative(true);

    try {
      addActivity(chartType, newActivity);
      setNegativeName('');
      setTimeout(() => {
        negativeInputRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Error adding negative activity:', error);
      setNegativeError('Fehler beim Hinzufügen der Aktivität');
    } finally {
      setIsSubmittingNegative(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        {/* Positive activities form */}
        <form onSubmit={handleSubmitPositive} className="flex-1" data-testid={`quick-add-form-positive-${chartType}`}>
          <InputGroup>
            <Input
              ref={positiveInputRef}
              placeholder={positivePlaceholder}
              value={positiveName}
              onChange={e => setPositiveName(e.target.value)}
              maxLength={50}
              disabled={isSubmittingPositive}
              data-testid={`quick-add-input-positive-${chartType}`}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="positive"
              disabled={!positiveName.trim() || isSubmittingPositive}
              isLoading={isSubmittingPositive}
              data-testid={`quick-add-button-positive-${chartType}`}
              className="shrink-0">
              <PlusCircleIcon className="h-4 w-4" />
            </Button>
          </InputGroup>
          <ErrorMessage error={positiveError} testId={`quick-add-error-positive-${chartType}`} className="mt-2 p-2" />
        </form>

        {/* Negative activities form */}
        <form onSubmit={handleSubmitNegative} className="flex-1" data-testid={`quick-add-form-negative-${chartType}`}>
          <InputGroup>
            <Input
              ref={negativeInputRef}
              placeholder={negativePlaceholder}
              value={negativeName}
              onChange={e => setNegativeName(e.target.value)}
              maxLength={50}
              disabled={isSubmittingNegative}
              data-testid={`quick-add-input-negative-${chartType}`}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="negative"
              disabled={!negativeName.trim() || isSubmittingNegative}
              isLoading={isSubmittingNegative}
              data-testid={`quick-add-button-negative-${chartType}`}
              className="shrink-0">
              <MinusCircleIcon className="h-4 w-4" />
            </Button>
          </InputGroup>
          <ErrorMessage error={negativeError} testId={`quick-add-error-negative-${chartType}`} className="mt-2 p-2" />
        </form>
      </div>
    </div>
  );
}
