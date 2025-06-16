'use client';

import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { InputGroup } from '@/app/components/ui/InputGroup';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { CHART_DEFAULTS } from '@/app/lib/utils/constants';
import { validateActivity } from '@/app/lib/utils/validation';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface AddActivityProps {
  chartType: 'positive' | 'negative';
  className?: string;
}

export function AddActivity({ chartType, className }: AddActivityProps) {
  const { addActivity } = useEnergy();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholder = chartType === 'positive' ? 'z.B. Sport, Entspannung, Zeit mit Freunden' : 'z.B. Überstunden, Stress, schwierige Gespräche';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const newActivity = {
      name: name.trim(),
      value: CHART_DEFAULTS.defaultLevel,
    };

    const validation = validateActivity(newActivity);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      await addActivity(chartType, newActivity);
      toast.success('Aktivität hinzugefügt');
      setName('');
      // Small delay to ensure DOM updates are complete
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch {
      toast.error('Fehler beim Hinzufügen der Aktivität');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} data-testid={`quick-add-form-${chartType}`}>
      <InputGroup>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          disabled={isSubmitting}
          data-testid={`quick-add-input-${chartType}`}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          isLoading={isSubmitting}
          data-testid={`quick-add-button-${chartType}`}
          className="shrink-0">
          <PlusIcon className="h-4 w-4" />
          <span className="ml-1">Hinzufügen</span>
        </Button>
      </InputGroup>
    </form>
  );
}
