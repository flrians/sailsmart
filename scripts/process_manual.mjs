import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key to insert without RLS
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error("Missing environment variables. Please check .env.local.");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY");
  process.exit(1);
}

global.WebSocket = require('ws');
const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// The path to the PDF you want to process
const PDF_PATH = process.argv[2] || './Bavaria_C50_Manual.pdf';

async function processManual() {
  try {
    console.log(`Processing ${PDF_PATH}...`);
    const dataBuffer = fs.readFileSync(PDF_PATH);
    
    // Parse the PDF
    const data = await pdfParse(dataBuffer);
    const text = data.text;
    
    // A simplistic chunking strategy: split by double newlines or paragraphs
    // A more robust approach would use LangChain's RecursiveCharacterTextSplitter
    const chunks = text.split(/\n\s*\n/).map(c => c.trim()).filter(c => c.length > 50);
    
    console.log(`Extracted ${chunks.length} text chunks. Saving to Supabase...`);

    // Create a manual record
    const { data: manual, error: manualError } = await supabase
      .from('manuals')
      .insert({ title: 'Bavaria C50 Manual', filename: path.basename(PDF_PATH) })
      .select()
      .single();

    if (manualError) throw manualError;

    // Process chunks in batches to avoid API limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} / ${Math.ceil(chunks.length / BATCH_SIZE)}...`);
      
      // Get embeddings for the batch
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batchChunks,
      });

      const embeddings = embeddingResponse.data;

      // Prepare records for Supabase
      const records = batchChunks.map((content, idx) => ({
        manual_id: manual.id,
        // Since pdf-parse doesn't easily map text back to page numbers without custom rendering,
        // we use a rough estimate or simply store 0 for now. 
        // For a true page-level mapping, we would process the PDF page-by-page.
        page_number: 1, 
        content,
        embedding: embeddings[idx].embedding
      }));

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('manual_chunks')
        .insert(records);

      if (insertError) throw insertError;
    }

    console.log('Successfully processed and uploaded manual!');
  } catch (err) {
    console.error('Error processing manual:', err);
  }
}

processManual();
