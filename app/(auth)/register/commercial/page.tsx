'use client';

import { useActionState } from 'react';
import { commercialSignUp } from '@/app/actions/auth';
import { Anchor } from 'lucide-react';
import Link from 'next/link';
import styles from '../page.module.css';

export default function CommercialRegisterPage() {
  const [state, action, pending] = useActionState(commercialSignUp, undefined);

  return (
    <main className={styles.main}>
      <div className={`${styles.card} glass-panel animate-fade-in`} style={{ maxWidth: 440 }}>
        <div className={styles.logoRow}>
          <Anchor size={22} color="#0077BE" strokeWidth={1.75} />
          <span className={styles.logoText}>
            <span className={styles.logoTextSail}>Sail</span><span className={styles.logoTextSmart}>Smart</span>
          </span>
        </div>
        <h1 className={styles.title}>Company Account</h1>
        <p className={styles.subtitle}>Fleet management with QR codes for your guests</p>

        <form action={action} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="companyName" className={styles.label}>Company Name</label>
            <input id="companyName" name="companyName" type="text" placeholder="Adriatic Charter GmbH" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input id="email" name="email" type="email" placeholder="info@yourcompany.com" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input id="password" name="password" type="password" placeholder="Min. 8 characters" required minLength={8} className={styles.input} />
          </div>

          <div className={styles.field}>
            <label htmlFor="companyLogoUrl" className={styles.label}>
              Logo URL <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
            </label>
            <input
              id="companyLogoUrl"
              name="companyLogoUrl"
              type="url"
              placeholder="https://yourcompany.com/logo.png"
              className={styles.input}
            />
          </div>

          {state?.error && <p className={styles.error}>{typeof state.error === 'string' ? state.error : 'Registration failed. Please try again.'}</p>}

          <button type="submit" disabled={pending} className={styles.btn}>
            {pending ? 'Creating account…' : 'Create Company Account'}
          </button>
        </form>

        <p className={styles.switchLink} style={{ marginTop: '0.75rem' }}>
          <Link href="/register">← Back to account type</Link>
        </p>
        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
