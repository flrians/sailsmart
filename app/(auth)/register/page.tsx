'use client';

import { useActionState } from 'react';
import { signUp } from '@/app/actions/auth';
import { Anchor } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <main className={styles.main}>
      <div className={`${styles.card} glass-panel animate-fade-in`}>
        <div className={styles.logoRow}>
          <Anchor size={28} color="#0077BE" />
          <span className={styles.logoText}>SailSmart</span>
        </div>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join your Bavaria C50 assistant</p>

        <form action={action} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName" className={styles.label}>First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Max"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName" className={styles.label}>Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Müller"
                required
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              required
              minLength={8}
              className={styles.input}
            />
          </div>

          {state?.error && (
            <p className={styles.error}>{state.error}</p>
          )}

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
