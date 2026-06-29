'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ship, MessageCircle, User, Anchor, BarChart3 } from 'lucide-react';
import styles from './BottomNav.module.css';

const PERSONAL_NAV = [
  { href: '/my-c50', label: 'My C50', Icon: Ship },
  { href: '/', label: 'Chat', Icon: MessageCircle },
  { href: '/profile', label: 'Profile', Icon: User },
];

const COMMERCIAL_NAV = [
  { href: '/fleet', label: 'Fleet', Icon: Anchor },
  { href: '/', label: 'Chat', Icon: MessageCircle },
  { href: '/analytics', label: 'Analytics', Icon: BarChart3 },
  { href: '/profile', label: 'Profile', Icon: User },
];

export default function BottomNav({ accountType = 'personal' }: { accountType?: string }) {
  const pathname = usePathname();
  const items = accountType === 'commercial' ? COMMERCIAL_NAV : PERSONAL_NAV;

  return (
    <nav className={styles.nav}>
      {items.map(({ href, label, Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.item} ${isActive ? styles.active : ''}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
