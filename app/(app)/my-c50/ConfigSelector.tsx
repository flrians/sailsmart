'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { BAVARIA_C50_CONFIGS } from '@/lib/boat-specs';
import { updateConfiguration } from '@/app/actions/profile';
import styles from './ConfigSelector.module.css';

// Sprite sheet dimensions for the 3-col × 4-row grid
// Each cell in the source image is roughly 1/3 wide and 1/4 tall
// The boat image itself occupies ~72% of the cell height (rest is the label text)
const COLS = 3;
const ROWS = 4;
const IMAGE_CROP_HEIGHT_RATIO = 0.72; // fraction of cell to keep (crop out label text)

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

        // CSS sprite: position the background image to show the correct cell
        // background-size: cols × 100% width, rows / IMAGE_CROP_HEIGHT_RATIO × 100% height
        const bgSizeX = COLS * 100;
        const bgSizeY = (ROWS / IMAGE_CROP_HEIGHT_RATIO) * 100;
        const bgPosX = (cfg.col / (COLS - 1)) * 100;
        const bgPosY = (cfg.row / (ROWS - IMAGE_CROP_HEIGHT_RATIO)) * 100;

        return (
          <button
            key={cfg.id}
            onClick={() => handleSelect(cfg.id)}
            disabled={isSaving || isPending}
            className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            aria-label={cfg.label}
            aria-pressed={isSelected}
          >
            <div
              className={styles.image}
              style={{
                backgroundImage: "url('/bavaria_c50_configurations.png')",
                backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
                backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
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
