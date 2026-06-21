'use client';

import { useState } from 'react';
import { Anchor, Ruler, Weight, Wind, Gauge, Pencil } from 'lucide-react';
import type { BoatSpec } from '@/lib/boat-specs';
import { BAVARIA_C50_CONFIGS } from '@/lib/boat-specs';
import BoatSVG from './BoatSVG';
import ConfigSelector from './ConfigSelector';
import styles from './page.module.css';

const SPEC_ICONS = [Ruler, Ruler, Gauge, Weight, Wind];

interface Props {
  boatName: string;
  engineModel: string | null;
  spec: BoatSpec;
  configuration: string | null;
}

export default function MyC50Client({ boatName, engineModel, spec, configuration }: Props) {
  const [activeConfig, setActiveConfig] = useState<string | null>(configuration);
  const [editingConfig, setEditingConfig] = useState(!configuration);

  const selectedVariant = BAVARIA_C50_CONFIGS.find(c => c.id === activeConfig) ?? null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={`${styles.heroCard} glass-panel`}>
        <div className={styles.heroContent}>
          <Anchor size={28} color="#0077BE" strokeWidth={1.5} />
          <div className={styles.heroText}>
            <h1 className={styles.boatName}>{boatName}</h1>
            {engineModel && (
              <span className={styles.engineBadge}>{engineModel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Key Specs */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Key Specs</p>
        <div className={`${styles.specsCard} glass-panel`}>
          {spec.specs.map((row, i) => {
            const Icon = SPEC_ICONS[i] ?? Ruler;
            return (
              <div key={row.label}>
                <div className={styles.specRow}>
                  <div className={styles.iconWrap}>
                    <Icon size={16} color="#0077BE" strokeWidth={2} />
                  </div>
                  <div className={styles.specField}>
                    <span className={styles.specLabel}>{row.label}</span>
                    <span className={styles.specValue}>{row.value}</span>
                  </div>
                </div>
                {i < spec.specs.length - 1 && <div className={styles.divider} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interior Layout / Configuration */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Interior Layout</p>
          {selectedVariant && !editingConfig && (
            <button
              className={styles.editBtn}
              onClick={() => setEditingConfig(true)}
              aria-label="Change configuration"
            >
              <Pencil size={12} strokeWidth={2.5} />
              Edit
            </button>
          )}
        </div>

        {!editingConfig && selectedVariant ? (
          /* Selected configuration display */
          <div className={`${styles.configCard} glass-panel`}>
            <div
              className={styles.configImage}
              style={{
                backgroundImage: "url('/bavaria_c50_configurations.png')",
                backgroundSize: `${3 * 100}% ${(4 / 0.72) * 100}%`,
                backgroundPosition: `${(selectedVariant.col / 2) * 100}% ${(selectedVariant.row / (4 - 0.72)) * 100}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className={styles.configMeta}>
              <span className={styles.configLabel}>{selectedVariant.label}</span>
            </div>
          </div>
        ) : (
          /* Configuration selector grid */
          <div className={`${styles.selectorCard} glass-panel`}>
            {!selectedVariant && (
              <p className={styles.selectorPrompt}>Select your boat's interior configuration:</p>
            )}
            <ConfigSelector
              current={activeConfig}
              onSaved={(id) => { setActiveConfig(id); setEditingConfig(false); }}
            />
            {selectedVariant && (
              <button
                className={styles.cancelBtn}
                onClick={() => setEditingConfig(false)}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fallback SVG when no config image available */}
      {!selectedVariant && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Floor Plan (generic)</p>
          <div className={`${styles.svgCard} glass-panel`}>
            <div className={styles.svgWrap}>
              <BoatSVG zones={spec.zones} />
            </div>
            <p className={styles.svgCaption}>Select a configuration above to see your exact layout</p>
          </div>
        </div>
      )}
    </div>
  );
}
