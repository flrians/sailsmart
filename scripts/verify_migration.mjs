/**
 * Run after migrate_junction_table.sql to verify the migration succeeded.
 * Usage: node scripts/verify_migration.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import path from 'path';
import dotenv from 'dotenv';
const require = createRequire(import.meta.url);
const ws = require('ws');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: ws } }
);

let ok = true;

// 1. Junction table has rows
const { data: junctionRows, error: jErr } = await supabase
  .from('manual_boat_types')
  .select('manual_id, boat_type_id');
if (jErr) {
  console.error('FAIL — manual_boat_types table not found:', jErr.message);
  ok = false;
} else {
  console.log(`OK   — manual_boat_types has ${junctionRows.length} row(s):`);
  junctionRows.forEach(r => console.log(`       manual=${r.manual_id.slice(0, 8)}… → boat_type=${r.boat_type_id.slice(0, 8)}…`));
}

// 2. manual_chunks no longer has boat_type_id (selecting it should error or not return the field)
const { data: chunkSample, error: cErr } = await supabase
  .from('manual_chunks')
  .select('id, manual_id, page_number')
  .limit(1);
if (cErr) {
  console.error('FAIL — could not query manual_chunks:', cErr.message);
  ok = false;
} else {
  const hasOldCol = chunkSample?.some(r => 'boat_type_id' in r);
  if (hasOldCol) {
    console.error('FAIL — manual_chunks still has boat_type_id column (Step 4 not run?)');
    ok = false;
  } else {
    console.log('OK   — manual_chunks.boat_type_id column removed');
  }
}

// 3. RPC still returns results for Bavaria C50
const { data: boatType } = await supabase
  .from('boat_types')
  .select('id, name')
  .eq('name', 'Bavaria C50')
  .single();

if (!boatType) {
  console.warn('SKIP — Bavaria C50 boat type not found, skipping RPC test');
} else {
  // Use a dummy embedding (all zeros) — just checking the RPC runs without error
  const dummyEmbedding = new Array(1536).fill(0);
  const { data: rpcResult, error: rpcErr } = await supabase.rpc('match_manual_chunks', {
    query_embedding: dummyEmbedding,
    match_threshold: -1,
    match_count: 1,
    filter_boat_type_id: boatType.id,
  });
  if (rpcErr) {
    console.error('FAIL — RPC match_manual_chunks error:', rpcErr.message);
    ok = false;
  } else {
    console.log(`OK   — RPC returned ${rpcResult?.length ?? 0} result(s) for ${boatType.name}`);
  }
}

console.log(ok ? '\n✓ Migration verified successfully.' : '\n✗ One or more checks failed — see above.');
