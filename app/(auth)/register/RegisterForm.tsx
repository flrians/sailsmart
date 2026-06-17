'use client';

import { useActionState } from 'react';
import { signUp } from '@/app/actions/auth';
import { Anchor } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

type BoatType = { id: string; name: string };

export default function RegisterForm({ boatTypes }: { boatTypes: BoatType[] }) {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <main className={styles.main}>
      <div className={`${styles.card} glass-panel animate-fade-in`}>
        <div className={styles.logoRow}>
          <Anchor size={28} color="#0077BE" />
          <span className={styles.logoText}>SailSmart</span>
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

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
