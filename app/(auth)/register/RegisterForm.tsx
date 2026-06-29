'use client';

import { useActionState, useState } from 'react';
import { signUp } from '@/app/actions/auth';
import { Anchor, User, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type BoatType = { id: string; name: string };

export default function RegisterForm({ boatTypes }: { boatTypes: BoatType[] }) {
  const [accountType, setAccountType] = useState<'personal' | 'commercial' | null>(null);
  const [state, action, pending] = useActionState(signUp, undefined);
  const router = useRouter();

  if (!accountType) {
    return (
      <main className={styles.main}>
        <div className={`${styles.card} glass-panel animate-fade-in`}>
          <div className={styles.logoRow}>
            <Anchor size={22} color="#0077BE" strokeWidth={1.75} />
            <span className={styles.logoText}>
              <span className={styles.logoTextSail}>Sail</span><span className={styles.logoTextSmart}>Smart</span>
            </span>
          </div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Choose your account type</p>

          <div className={styles.choiceGrid}>
            <button
              type="button"
              className={styles.choiceCard}
              onClick={() => setAccountType('personal')}
            >
              <div className={styles.choiceIcon}><User size={20} color="#0077BE" strokeWidth={1.75} /></div>
              <div className={styles.choiceLabel}>Personal</div>
              <div className={styles.choiceDesc}>For individual sailors. Connect your boat and get AI assistance.</div>
            </button>

            <button
              type="button"
              className={styles.choiceCard}
              onClick={() => router.push('/register/commercial')}
            >
              <div className={styles.choiceIcon}><Building2 size={20} color="#0077BE" strokeWidth={1.75} /></div>
              <div className={styles.choiceLabel}>Company</div>
              <div className={styles.choiceDesc}>For charter companies. Manage a fleet with QR codes for guests.</div>
            </button>
          </div>

          <p className={styles.switchLink}>
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={`${styles.card} glass-panel animate-fade-in`}>
        <div className={styles.logoRow}>
          <Anchor size={22} color="#0077BE" strokeWidth={1.75} />
          <span className={styles.logoText}>
            <span className={styles.logoTextSail}>Sail</span><span className={styles.logoTextSmart}>Smart</span>
          </span>
        </div>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join your yacht assistant</p>

        <form action={action} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName" className={styles.label}>First Name</label>
              <input id="firstName" name="firstName" type="text" placeholder="Max" required className={styles.input} />
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName" className={styles.label}>Last Name</label>
              <input id="lastName" name="lastName" type="text" placeholder="Müller" required className={styles.input} />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input id="password" name="password" type="password" placeholder="Min. 8 characters" required minLength={8} className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="boatTypeId" className={styles.label}>Your Boat</label>
            <select id="boatTypeId" name="boatTypeId" required className={styles.select}>
              <option value="">Select your boat model…</option>
              {boatTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.name}</option>
              ))}
            </select>
          </div>

          {state?.error && <p className={styles.error}>{state.error}</p>}

          <button type="submit" disabled={pending} className={styles.btn}>
            {pending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <button type="button" onClick={() => setAccountType(null)} className={styles.backLink}>
          ← Back
        </button>

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
