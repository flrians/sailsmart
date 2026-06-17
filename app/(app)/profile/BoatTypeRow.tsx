'use client';

import { useState, useEffect, useActionState } from 'react';
import { updateBoatType } from '@/app/actions/profile';
import { Sailboat, Pencil, X } from 'lucide-react';
import styles from './BoatTypeRow.module.css';

type BoatType = { id: string; name: string };

export default function BoatTypeRow({
  currentBoatTypeId,
  currentBoatTypeName,
  boatTypes,
}: {
  currentBoatTypeId?: string | null;
  currentBoatTypeName: string;
  boatTypes: BoatType[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(updateBoatType, undefined);

  useEffect(() => {
    if (state?.success) setIsEditing(false);
  }, [state]);

  return (
    <div className={styles.row}>
      <div className={styles.iconWrap}>
        <Sailboat size={18} color="#0077BE" />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Current Boat</span>

        {isEditing ? (
          <form action={action} className={styles.editForm}>
            <select
              name="boatTypeId"
              defaultValue={currentBoatTypeId ?? ''}
              className={styles.select}
            >
              <option value="" disabled>Select…</option>
              {boatTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.name}</option>
              ))}
            </select>
            <button type="submit" disabled={pending} className={styles.saveBtn}>
              {pending ? '…' : 'Save'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn}>
              <X size={14} />
            </button>
          </form>
        ) : (
          <div className={styles.valueRow}>
            <span className={styles.fieldValue}>{currentBoatTypeName}</span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={styles.editBtn}
              title="Change boat model"
            >
              <Pencil size={13} />
            </button>
          </div>
        )}

        {state?.error && <p className={styles.error}>{state.error}</p>}
      </div>
    </div>
  );
}
