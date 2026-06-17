'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ship, MessageCircle, User } from 'lucide-react';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { href: '/my-c50', label: 'My C50', Icon: Ship },
  { href: '/', label: 'Chat', Icon: MessageCircle },
  { href: '/profile', label: 'Profile', Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map(({ href, label, Icon }) => {
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
