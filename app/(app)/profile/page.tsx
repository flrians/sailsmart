import { createClient } from '@/lib/supabase/server';
import { Mail, Calendar, User } from 'lucide-react';
import BoatTypeRow from './BoatTypeRow';
import styles from './page.module.css';

export default async function ProfilePage() {
  const supabase = await createClient();

  const [{ data: { user } }, { data: profileData }, { data: allBoatTypes }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('boat_type_id, boat_types(name)')
      .single(),
    supabase
      .from('boat_types')
      .select('id, name')
      .eq('available', true)
      .order('name'),
  ]);

  const firstName = (user?.user_metadata?.first_name as string) ?? '';
  const lastName = (user?.user_metadata?.last_name as string) ?? '';
  const email = user?.email ?? '';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  const currentBoatTypeId = (profileData as any)?.boat_type_id as string | null ?? null;
  const currentBoatTypeName = (profileData as any)?.boat_types?.name as string ?? '—';

  return (
    <div className={styles.container}>
      <div className={`${styles.avatarSection} animate-fade-in`}>
        <div className={styles.avatar}>{initials}</div>
        <h1 className={styles.fullName}>{firstName} {lastName}</h1>
        <p className={styles.emailTag}>{email}</p>
      </div>

      <div className={`${styles.infoCard} glass-panel animate-fade-in`}>
        <div className={styles.row}>
          <div className={styles.iconWrap}><User size={18} color="#0077BE" /></div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>First Name</span>
            <span className={styles.fieldValue}>{firstName}</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.row}>
          <div className={styles.iconWrap}><User size={18} color="#0077BE" /></div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Last Name</span>
            <span className={styles.fieldValue}>{lastName}</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.row}>
          <div className={styles.iconWrap}><Mail size={18} color="#0077BE" /></div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <span className={styles.fieldValue}>{email}</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.row}>
          <div className={styles.iconWrap}><Calendar size={18} color="#0077BE" /></div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Member Since</span>
            <span className={styles.fieldValue}>{memberSince}</span>
          </div>
        </div>

        <div className={styles.divider} />

        <BoatTypeRow
          currentBoatTypeId={currentBoatTypeId}
          currentBoatTypeName={currentBoatTypeName}
          boatTypes={allBoatTypes ?? []}
        />
      </div>
    </div>
  );
}
