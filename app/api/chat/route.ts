import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient as createAuthClient } from '@/lib/supabase/server';

// Admin client for vector search (service role bypasses RLS — only used server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createSupabaseAdmin(supabaseUrl, supabaseKey);

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Auth guard: reject unauthenticated requests
    const authClient = await createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Fetch user's boat type for manual filtering
    const { data: profile } = await supabase
      .from('profiles')
      .select('boat_type_id, boat_types(name, engine_model)')
      .eq('id', user.id)
      .single();

    const boatTypeId: string | null = (profile as any)?.boat_type_id ?? null;
    const boatName: string = (profile as any)?.boat_types?.name ?? 'Bavaria C50';
    const engineModel: string | null = (profile as any)?.boat_types?.engine_model ?? null;

    // Check if any manual chunks exist for this boat type before running any API calls
    if (boatTypeId) {
      const { count } = await supabase
        .from('manual_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('boat_type_id', boatTypeId);

      if (!count || count === 0) {
        const stream = createUIMessageStream({
          execute: ({ writer }) => {
            writer.write({ type: 'text-start', id: 'no-manual' });
            writer.write({
              type: 'text-delta',
              id: 'no-manual',
              delta: `The manual for your **${boatName}** is not yet available in SailSmart. Currently only the **Bavaria C50** manual is loaded.\n\nYou can switch your boat model in your [Profile](/profile).`,
            });
            writer.write({ type: 'text-end', id: 'no-manual' });
          },
        });
        return createUIMessageStreamResponse({ stream, headers: { 'X-Similarity-Score': '0' } });
      }
    }

    const { messages } = await req.json();

    const latestMessage = messages[messages.length - 1]?.parts
      ?.filter((p: any) => p.type === 'text')
      .map((p: any) => p.text as string)
      .join('') ?? '';

    let contextText = '';
    let topSimilarity = 0;
    let sourceFilenames: string[] = [];
    let queryEmbedding: number[] | null = null;

    if (latestMessage) {
      // 2. Generate an embedding for the user's query
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: latestMessage,
        }),
      });

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;
        queryEmbedding = embedding;

        // 2. Perform similarity search in Supabase
        const { data: chunks, error } = await supabase.rpc('match_manual_chunks', {
          query_embedding: embedding,
          match_threshold: 0.2,
          match_count: 15,
          filter_boat_type_id: boatTypeId,
        });

        if (error) {
          console.error("Supabase search error:", error);
        }

        if (!error && chunks && chunks.length > 0) {
          topSimilarity = chunks[0].similarity ?? 0;
          console.log(`Found ${chunks.length} chunks. Top similarity: ${topSimilarity.toFixed(3)}`);

          // Always resolve filename from DB — never trust the RPC return alone
          const manualIds = [...new Set(chunks.map((c: any) => c.manual_id as string))];
          const { data: manualRows } = await supabase
            .from('manuals')
            .select('id, filename')
            .in('id', manualIds);
          const filenameMap: Record<string, string> = Object.fromEntries(
            (manualRows ?? []).map((m: any) => [m.id, m.filename])
          );
          chunks.forEach((c: any) => { c.filename = filenameMap[c.manual_id] ?? c.filename ?? 'manual.pdf'; });
          sourceFilenames = [...new Set<string>(chunks.map((c: any) => c.filename as string).filter(Boolean))];

          contextText = chunks
            .map((chunk: any) => `[Page ${chunk.page_number} — ${chunk.filename}]: ${chunk.content}`)
            .join('\n\n---\n\n');
        } else {
          console.log("No relevant chunks found in Supabase for the query.");
        }
      } else {
        console.error("Failed to fetch embeddings", await embeddingResponse.text());
      }
    }

    // 3. If no manual context found, find the closest page and link directly to it
    if (!contextText) {
      let pageLink = '';
      if (queryEmbedding && boatTypeId) {
        // Search with threshold 0 to always get the best-guess page regardless of similarity
        const { data: bestChunks } = await supabase.rpc('match_manual_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: 0,
          match_count: 1,
          filter_boat_type_id: boatTypeId,
        });
        if (bestChunks && bestChunks.length > 0) {
          const best = bestChunks[0];
          const { data: manualRow } = await supabase
            .from('manuals')
            .select('title, filename')
            .eq('id', best.manual_id)
            .single();
          if (manualRow) {
            pageLink = ` You can view it directly here: [${manualRow.title} — Page ${best.page_number}](/${manualRow.filename}#page=${best.page_number})`;
          }
        }
      }
      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({ type: 'text-start', id: 'not-found' });
          writer.write({
            type: 'text-delta',
            id: 'not-found',
            delta: `This information may be a diagram or chart that I cannot read from the PDF.${pageLink}`,
          });
          writer.write({ type: 'text-end', id: 'not-found' });
        },
      });
      return createUIMessageStreamResponse({ stream, headers: { 'X-Similarity-Score': String(topSimilarity) } });
    }


    // 4. Construct system prompt
    const systemPrompt = `You are SailSmart, a helpful and expert assistant for the ${boatName} sailing yacht.${engineModel ? ` The boat is fitted with a ${engineModel} engine.` : ''}
You will be provided with context from the official manuals to answer the user's question.

CRITICAL INSTRUCTION: You are strictly limited to answering questions related to the ${boatName} sailing yacht and its systems using ONLY the provided manual context.
If the user's message is clearly off-topic (e.g. cooking, sports, coding, unrelated companies), respond with: "I'm SailSmart, your ${boatName} assistant. I can only help with questions about your yacht!"
Do NOT use your general knowledge to answer any questions — rely SOLELY on the "CONTEXT FROM MANUAL" provided below.
If the answer to the user's question cannot be found in the provided manual context (e.g. it is a diagram, image, or chart), respond with exactly this format:
"This appears to be a diagram or visual in the manual that I cannot read. You can view it directly here: [Page X](/<filename>#page=X)"
Use the page number and filename from the most relevant context block. Do NOT say you cannot find it without providing this link.

CITATION RULES — follow exactly:
- Every context block starts with a header like: [Page 27 — somefile.pdf]
- When you cite something, use ONLY the page number and filename from that exact header
- Format: [Page X](/<filename>#page=X) — where X and <filename> come verbatim from the header
- The ONLY valid filenames in this session are: ${sourceFilenames.map(f => `"${f}"`).join(', ')}
- NEVER use any other filename. NEVER invent or guess a filename.
- NEVER use a page number that appears inside the text content itself (e.g. from a table of contents or a page footer). The ONLY valid page number is the one in the [Page X] header.
- Do NOT confuse list item numbers, figure numbers, or section numbers with page numbers. Only the number in [Page X] is the page number.

Be extremely polite, maintain a nautical tone when appropriate, and be concise but comprehensive.

--- CONTEXT FROM MANUAL ---
${contextText}
---------------------------
`;

    // 4. Stream the text using Vercel AI SDK core
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });
    return result.toUIMessageStreamResponse({ headers: { 'X-Similarity-Score': String(topSimilarity) } });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response('An error occurred during chat processing.', { status: 500 });
  }
}
