import { getSessions } from '@/app/actions/chat';
import Link from 'next/link';
import { MessageCircle, Plus, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  } else {
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

export default async function HistoryPage() {
  const sessions = await getSessions();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Conversations</h1>
        <Link href="/" className={styles.newBtn}>
          <Plus size={18} />
          New
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className={styles.empty}>
          <MessageCircle size={48} color="#94A3B8" strokeWidth={1.5} />
          <p>No conversations yet.</p>
          <Link href="/" className={styles.startBtn}>Start your first chat</Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/?session=${s.id}`} className={styles.sessionItem}>
                <div className={styles.sessionIcon}>
                  <MessageCircle size={20} color="#0077BE" strokeWidth={1.75} />
                </div>
                <div className={styles.sessionContent}>
                  <span className={styles.sessionTitle}>
                    {s.title ?? 'New conversation'}
                  </span>
                  <span className={styles.sessionDate}>{formatDate(s.updated_at)}</span>
                </div>
                <ChevronRight size={16} color="#94A3B8" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
