import { Anchor, Mail } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function VerifyEmailPage() {
  return (
    <main className={styles.main}>
      <div className={`${styles.card} glass-panel animate-fade-in`}>
        <div className={styles.logoRow}>
          <Anchor size={28} color="#0077BE" />
          <span className={styles.logoText}>SailSmart</span>
        </div>

        <div className={styles.iconWrap}>
          <Mail size={48} color="#0077BE" strokeWidth={1.5} />
        </div>

        <h1 className={styles.title}>Check your inbox</h1>
        <p className={styles.body}>
          We&apos;ve sent a confirmation link to your email address. Click the link to activate your account and start using SailSmart.
        </p>
        <p className={styles.note}>
          Didn&apos;t receive it? Check your spam folder or{' '}
          <Link href="/register">try again</Link>.
        </p>
      </div>
    </main>
  );
}
