'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { BAVARIA_C50_CONFIGS } from '@/lib/boat-specs';
import { updateConfiguration } from '@/app/actions/profile';
import styles from './ConfigSelector.module.css';

interface Props {
  current: string | null;
  onSaved?: (id: string) => void;
}

export default function ConfigSelector({ current, onSaved }: Props) {
  const [selected, setSelected] = useState<string | null>(current);
  const [saving, setSaving] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(id: string) {
    if (id === selected || saving) return;
    setSaving(id);
    startTransition(async () => {
      await updateConfiguration(id);
      setSelected(id);
      setSaving(null);
      onSaved?.(id);
    });
  }

  return (
    <div className={styles.grid}>
      {BAVARIA_C50_CONFIGS.map((cfg) => {
        const isSelected = selected === cfg.id;
        const isSaving = saving === cfg.id;

        return (
          <button
            key={cfg.id}
            onClick={() => handleSelect(cfg.id)}
            disabled={isSaving || isPending}
            className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            aria-label={cfg.label}
            aria-pressed={isSelected}
          >
            <div className={styles.imageWrap}>
              <img
                src={`/api/c50-config/${cfg.id}`}
                alt={cfg.label}
                className={styles.image}
              />
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.cardLabel}>
                {cfg.cabins}-Cabin
              </span>
              <span className={styles.cardCode}>{cfg.id}</span>
            </div>
            {isSelected && (
              <div className={styles.checkBadge}>
                <Check size={10} strokeWidth={3} color="white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
