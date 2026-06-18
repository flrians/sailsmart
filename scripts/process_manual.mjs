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

// CLI: <pdf-path> [--title <title>] [--boat-type-name <name>] [--engine-model <model>]
const args = process.argv.slice(2);
const PDF_PATH = args[0];
if (!PDF_PATH) { console.error('Usage: node process_manual.mjs <pdf-path> [--title ...] [--boat-type-name ...] [--engine-model ...]'); process.exit(1); }

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const MANUAL_TITLE    = getArg('--title') || path.basename(PDF_PATH, path.extname(PDF_PATH));
const BOAT_TYPE_NAME  = getArg('--boat-type-name');
const ENGINE_MODEL    = getArg('--engine-model'); // optional: sets boat_types.engine_model

async function processManual() {
  try {
    let boatTypeId = null;
    if (BOAT_TYPE_NAME) {
      const { data: boatType, error } = await supabase
        .from('boat_types')
        .select('id')
        .eq('name', BOAT_TYPE_NAME)
        .single();
      if (error || !boatType) {
        console.error(`Boat type "${BOAT_TYPE_NAME}" not found:`, error?.message);
        process.exit(1);
      }
      boatTypeId = boatType.id;
      console.log(`Boat type: ${BOAT_TYPE_NAME} (${boatTypeId})`);
    } else {
      console.warn('No --boat-type-name provided. Chunks will not be linked to a boat type.');
    }

    // Store engine model if provided
    if (ENGINE_MODEL && boatTypeId) {
      await supabase.from('boat_types').update({ engine_model: ENGINE_MODEL }).eq('id', boatTypeId);
      console.log(`Engine model set: ${ENGINE_MODEL}`);
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
      .insert({ title: MANUAL_TITLE, filename: path.basename(PDF_PATH), boat_type_id: boatTypeId })
      .select()
      .single();
    if (manualError) throw manualError;

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
        boat_type_id: boatTypeId,
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
