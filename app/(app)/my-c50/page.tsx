import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { BOAT_SPECS } from '@/lib/boat-specs';
import MyC50Client from './MyC50Client';
import styles from './page.module.css';

const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function MyC50Page() {
  const supabase = await createClient();
  const { data: profileData } = await supabase
    .from('profiles')
    .select('boat_type_id, configuration, boat_types(name, engine_model)')
    .single();

  const boatName: string = (profileData as any)?.boat_types?.name ?? null;
  const engineModel: string | null = (profileData as any)?.boat_types?.engine_model ?? null;
  const configuration: string | null = (profileData as any)?.configuration ?? null;

  if (!boatName) {
    return (
      <div className={styles.fallbackContainer}>
        <p className={styles.fallbackText}>Select a boat model in your Profile to see your dashboard.</p>
      </div>
    );
  }

  const spec = BOAT_SPECS[boatName];
  if (!spec) {
    return (
      <div className={styles.fallbackContainer}>
        <p className={styles.fallbackText}>
          Detailed specs for the <strong>{boatName}</strong> are coming soon.
        </p>
      </div>
    );
  }

  return (
    <MyC50Client
      boatName={boatName}
      engineModel={engineModel}
      spec={spec}
      configuration={configuration}
    />
  );
}
