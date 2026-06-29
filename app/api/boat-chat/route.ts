import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, qr_token, session_id } = await req.json();

    if (!qr_token) return new Response('Missing qr_token', { status: 400 });

    const { data: boat, error: boatError } = await supabase
      .from('charter_boats')
      .select('*, boat_types(id, name, engine_model), profiles(company_name)')
      .eq('qr_token', qr_token)
      .single();

    if (boatError || !boat) return new Response('Boat not found', { status: 404 });

    const boatTypeId = boat.boat_type_id;
    const boatName = (boat.boat_types as any)?.name ?? 'Bavaria C50';
    const engineModel = (boat.boat_types as any)?.engine_model ?? null;

    const latestMessage = messages[messages.length - 1]?.parts
      ?.filter((p: any) => p.type === 'text')
      .map((p: any) => p.text as string)
      .join('') ?? '';

    let contextText = '';
    let topSimilarity = 0;
    let sourceFilenames: string[] = [];
    let ragChunksUsed = 0;

    if (latestMessage) {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: latestMessage }),
      });

      if (embeddingResponse.ok) {
        const { data: embData } = await embeddingResponse.json();
        const embedding = embData[0].embedding;

        const { data: chunks } = await supabase.rpc('match_manual_chunks', {
          query_embedding: embedding,
          match_threshold: 0.2,
          match_count: 15,
          filter_boat_type_id: boatTypeId,
        });

        if (chunks && chunks.length > 0) {
          topSimilarity = chunks[0].similarity ?? 0;
          ragChunksUsed = chunks.length;
          const manualIds = [...new Set(chunks.map((c: any) => c.manual_id as string))];
          const { data: manualRows } = await supabase.from('manuals').select('id, filename').in('id', manualIds);
          const filenameMap: Record<string, string> = Object.fromEntries((manualRows ?? []).map((m: any) => [m.id, m.filename]));
          chunks.forEach((c: any) => { c.filename = filenameMap[c.manual_id] ?? 'manual.pdf'; });
          sourceFilenames = [...new Set<string>(chunks.map((c: any) => c.filename as string).filter(Boolean))];
          contextText = chunks.map((c: any) => `[Page ${c.page_number} — ${c.filename}]: ${c.content}`).join('\n\n---\n\n');
        }
      }
    }

    // Persist user message + classify topic asynchronously
    if (session_id && latestMessage) {
      const messageIndex = messages.length - 1;
      supabase.from('charter_messages').insert({
        session_id,
        message_index: messageIndex,
        role: 'user',
        content: latestMessage,
      }).then(async () => {
        // Fire-and-forget topic classification
        try {
          const classRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: `Kategorien: navigation|sicherheit|motor|technik|komfort|proviant|wetter|sonstiges\nKlassifiziere diese Frage in genau eine Kategorie. Antworte nur mit dem Kategorienamen.\nFrage: "${latestMessage}"` }],
              max_tokens: 10,
            }),
          });
          if (classRes.ok) {
            const classData = await classRes.json();
            const topic = classData.choices?.[0]?.message?.content?.trim().toLowerCase() ?? 'sonstiges';
            await supabase.from('charter_messages').update({ topic })
              .eq('session_id', session_id)
              .eq('message_index', messageIndex)
              .eq('role', 'user');
          }
        } catch {}
      });
    }

    if (!contextText) {
      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({ type: 'text-start', id: 'not-found' });
          writer.write({ type: 'text-delta', id: 'not-found', delta: `I'm sorry, this information is not covered in the current manuals available for this ${boatName}.` });
          writer.write({ type: 'text-end', id: 'not-found' });
        },
      });
      return createUIMessageStreamResponse({ stream, headers: { 'X-Similarity-Score': '0' } });
    }

    const systemPrompt = `You are SailSmart, a helpful and expert assistant for the ${boatName} sailing yacht.${engineModel ? ` The boat is fitted with a ${engineModel} engine.` : ''}
You will be provided with context from the official manuals to answer the user's question.

CRITICAL INSTRUCTION: You are strictly limited to answering questions related to the ${boatName} sailing yacht and its systems using ONLY the provided manual context.
If the user's message is clearly off-topic, respond with: "I'm SailSmart, your ${boatName} assistant. I can only help with questions about your yacht!"
Do NOT use your general knowledge — rely SOLELY on the "CONTEXT FROM MANUAL" provided below.
If the answer cannot be found in the context, respond with exactly: "This appears to be a diagram or visual in the manual that I cannot read. You can view it directly here: [Page X](/<filename>#page=X)"

CITATION RULES:
- Format citations as: [Page X](/<filename>#page=X)
- Valid filenames: ${sourceFilenames.map(f => `"${f}"`).join(', ')}
- NEVER invent filenames or page numbers

--- CONTEXT FROM MANUAL ---
${contextText}
---------------------------`;

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      onFinish: async ({ text }) => {
        if (session_id) {
          await supabase.from('charter_messages').insert({
            session_id,
            message_index: messages.length,
            role: 'assistant',
            content: text,
            rag_chunks_used: ragChunksUsed,
          });
        }
      },
    });

    return result.toUIMessageStreamResponse({ headers: { 'X-Similarity-Score': String(topSimilarity) } });
  } catch (err) {
    console.error('Boat chat error:', err);
    return new Response('Error processing chat', { status: 500 });
  }
}
