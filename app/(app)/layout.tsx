import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions/auth';
import { Anchor, LogOut } from 'lucide-react';
import BottomNav from './components/BottomNav';
import styles from './layout.module.css';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const firstName = user?.user_metadata?.first_name as string | undefined;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Anchor size={20} color="#0077BE" strokeWidth={1.75} />
          <span className={styles.wordmark}>
            <span className={styles.logoSail}>Sail</span><span className={styles.logoSmart}>Smart</span>
          </span>
        </div>
        <div className={styles.headerRight}>
          {firstName && <span className={styles.userName}>Hi, {firstName}</span>}
          <form action={signOut}>
            <button type="submit" className={styles.logoutBtn} title="Sign out">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <main className={styles.content}>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
