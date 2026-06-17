import { Sailboat } from 'lucide-react';
import styles from './page.module.css';

export default function MyC50Page() {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} animate-fade-in`}>
        <Sailboat size={64} color="#0077BE" strokeWidth={1.25} />
        <h1 className={styles.title}>My C50</h1>
        <p className={styles.text}>
          Your personalised Bavaria C50 dashboard is on its way. Check back soon!
        </p>
        <span className={styles.badge}>Coming Soon</span>
      </div>
    </div>
  );
}
