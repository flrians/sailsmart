'use client';

import { useActionState } from 'react';
import { signIn } from '@/app/actions/auth';
import { Anchor } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <main className={styles.main}>
      <div className={`${styles.card} glass-panel animate-fade-in`}>
        <div className={styles.logoRow}>
          <Anchor size={28} color="#0077BE" />
          <span className={styles.logoText}>SailSmart</span>
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your Bavaria C50 assistant</p>

        <form action={action} className={styles.form}>
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
              placeholder="Your password"
              required
              className={styles.input}
            />
          </div>

          {state?.error && (
            <p className={styles.error}>{state.error}</p>
          )}

          <button type="submit" disabled={pending} className={styles.btn}>
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Don&apos;t have an account?{' '}
          <Link href="/register">Create one</Link>
        </p>
      </div>
    </main>
  );
}
