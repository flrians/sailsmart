import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing environment variables. Check .env.local.');
  process.exit(1);
}

global.WebSocket = require('ws');
const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// CLI: <pdf-path> [--title <title>] [--boat-type-name <name>] (repeatable) [--engine-model <model>]
const args = process.argv.slice(2);
const PDF_PATH = args[0];
if (!PDF_PATH) {
  console.error('Usage: node process_manual.mjs <pdf-path> [--title ...] [--boat-type-name ...] [--engine-model ...]');
  console.error('  --boat-type-name can be repeated to link one manual to multiple boat types.');
  process.exit(1);
}

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

function getAllArgs(flag) {
  const values = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && args[i + 1]) values.push(args[i + 1]);
  }
  return values;
}

const MANUAL_TITLE   = getArg('--title') || path.basename(PDF_PATH, path.extname(PDF_PATH));
const BOAT_TYPE_NAMES = getAllArgs('--boat-type-name');
const ENGINE_MODEL   = getArg('--engine-model');

async function processManual() {
  try {
    // Resolve all boat type IDs
    const boatTypeIds = [];
    for (const name of BOAT_TYPE_NAMES) {
      const { data: boatType, error } = await supabase
        .from('boat_types')
        .select('id')
        .eq('name', name)
        .single();
      if (error || !boatType) {
        console.error(`Boat type "${name}" not found:`, error?.message);
        process.exit(1);
      }
      boatTypeIds.push(boatType.id);
      console.log(`Boat type: ${name} (${boatType.id})`);

      if (ENGINE_MODEL) {
        await supabase.from('boat_types').update({ engine_model: ENGINE_MODEL }).eq('id', boatType.id);
        console.log(`Engine model set for ${name}: ${ENGINE_MODEL}`);
      }
    }

    if (BOAT_TYPE_NAMES.length === 0) {
      console.warn('No --boat-type-name provided. Manual will not be linked to any boat type.');
    }

    console.log(`Parsing ${PDF_PATH}...`);
    const dataBuffer = fs.readFileSync(PDF_PATH);
    const data = await pdfParse(dataBuffer);

    const chunks = data.text
      .split(/\n\s*\n/)
      .map(c => c.trim())
      .filter(c => c.length > 50);

    console.log(`${chunks.length} chunks extracted. Embedding and storing...`);

    const { data: manual, error: manualError } = await supabase
      .from('manuals')
      .insert({ title: MANUAL_TITLE, filename: path.basename(PDF_PATH) })
      .select()
      .single();
    if (manualError) throw manualError;

    // Link manual to all specified boat types via junction table
    if (boatTypeIds.length > 0) {
      const { error: junctionError } = await supabase
        .from('manual_boat_types')
        .insert(boatTypeIds.map(boat_type_id => ({ manual_id: manual.id, boat_type_id })));
      if (junctionError) throw junctionError;
      console.log(`Linked to ${boatTypeIds.length} boat type(s).`);
    }

    const BATCH_SIZE = 100;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(chunks.length / BATCH_SIZE)}...`);

      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });

      const records = batch.map((content, idx) => ({
        manual_id: manual.id,
        page_number: 1,
        content,
        embedding: embeddingResponse.data[idx].embedding,
      }));

      const { error: insertError } = await supabase.from('manual_chunks').insert(records);
      if (insertError) throw insertError;
    }

    console.log(`\nDone! Stored ${chunks.length} chunks for "${MANUAL_TITLE}".`);
  } catch (err) {
    console.error('Error:', err);
  }
}

processManual();
