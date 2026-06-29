'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, QrCode, Trash2, X, Download, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import styles from './page.module.css';

type BoatType = { id: string; name: string };
type Boat = {
  id: string;
  boat_name: string;
  configuration: string | null;
  qr_token: string;
  created_at: string;
  boat_types: { name: string } | null;
};

type Props = {
  profile: { company_name: string; company_logo_url?: string | null };
  boatTypes: BoatType[];
  initialBoats: Boat[];
  siteUrl: string;
};

export default function FleetClient({ profile, boatTypes, initialBoats, siteUrl }: Props) {
  const [boats, setBoats] = useState<Boat[]>(initialBoats);
  const [showPanel, setShowPanel] = useState(false);
  const [qrBoat, setQrBoat] = useState<Boat | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const boatUrl = (token: string) => `${siteUrl}/boat/${token}`;

  useEffect(() => {
    if (!qrBoat) return;
    QRCode.toDataURL(boatUrl(qrBoat.qr_token), { width: 240, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [qrBoat, siteUrl]);

  async function handleAddBoat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/fleet/boats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boat_name: fd.get('boat_name'),
        boat_type_id: fd.get('boat_type_id') || null,
        configuration: fd.get('configuration') || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setFormError(json.error ?? 'Error saving boat'); setSaving(false); return; }
    setBoats((prev) => [json.boat, ...prev]);
    setShowPanel(false);
    setSaving(false);
    (e.target as HTMLFormElement).reset();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this boat and all its data?')) return;
    setDeleting(id);
    await fetch(`/api/fleet/boats?id=${id}`, { method: 'DELETE' });
    setBoats((prev) => prev.filter((b) => b.id !== id));
    setDeleting(null);
  }

  function handleDownloadQR() {
    if (!qrDataUrl || !qrBoat) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${qrBoat.boat_name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  }

  function handleCopyLink() {
    if (!qrBoat) return;
    navigator.clipboard.writeText(boatUrl(qrBoat.qr_token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fleet</h1>
          <p className={styles.subtitle}>{profile.company_name} · {boats.length} boat{boats.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowPanel(true)}>
          <Plus size={16} strokeWidth={2.5} /> Add Boat
        </button>
      </div>

      {boats.length === 0 ? (
        <div className={styles.empty}>
          <QrCode size={40} strokeWidth={1.25} color="var(--ocean)" />
          <p className={styles.emptyTitle}>No boats yet</p>
          <p className={styles.emptyDesc}>Add your first boat to generate a QR code for guests.</p>
          <button className={styles.addBtn} onClick={() => setShowPanel(true)}>
            <Plus size={16} strokeWidth={2.5} /> Add Boat
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {boats.map((boat) => (
            <div key={boat.id} className={`${styles.card} glass-panel`}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.boatName}>{boat.boat_name}</div>
                  <div className={styles.boatMeta}>
                    {(boat.boat_types as any)?.name ?? '—'}
                    {boat.configuration && <> · {boat.configuration}</>}
                  </div>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(boat.id)}
                  disabled={deleting === boat.id}
                  title="Delete boat"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <button
                className={styles.qrBtn}
                onClick={() => { setQrBoat(boat); setCopied(false); }}
              >
                <QrCode size={15} strokeWidth={2} /> Show QR Code
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add boat slide-over */}
      {showPanel && (
        <div className={styles.overlay} onClick={() => setShowPanel(false)}>
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Add Boat</h2>
              <button className={styles.closeBtn} onClick={() => setShowPanel(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddBoat} className={styles.panelForm}>
              <div className={styles.field}>
                <label className={styles.label}>Boat Name *</label>
                <input name="boat_name" type="text" placeholder='e.g. "Aurora"' required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Boat Type</label>
                <select name="boat_type_id" className={styles.select}>
                  <option value="">Select type…</option>
                  {boatTypes.map((bt) => (
                    <option key={bt.id} value={bt.id}>{bt.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Interior Configuration</label>
                <input name="configuration" type="text" placeholder='e.g. "3-cabin layout"' className={styles.input} />
              </div>
              {formError && <p className={styles.error}>{formError}</p>}
              <button type="submit" disabled={saving} className={styles.saveBtn}>
                {saving ? 'Saving…' : 'Save Boat'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR modal */}
      {qrBoat && (
        <div className={styles.overlay} onClick={() => setQrBoat(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} style={{ alignSelf: 'flex-end' }} onClick={() => setQrBoat(null)}><X size={18} /></button>
            <div className={styles.modalBoatName}>{qrBoat.boat_name}</div>
            {qrDataUrl
              ? <div className={styles.qrWrapper}><img src={qrDataUrl} alt="QR Code" width={240} height={240} /></div>
              : <div className={styles.qrPlaceholder}>Generating…</div>
            }
            <div
              className={styles.qrUrl}
              onClick={handleCopyLink}
              title="Click to copy"
            >
              {boatUrl(qrBoat.qr_token)}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={handleCopyLink}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
              </button>
              <button className={styles.btnPrimary} onClick={handleDownloadQR} disabled={!qrDataUrl}>
                <Download size={14} /> Download QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
