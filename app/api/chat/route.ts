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

    const { messages } = await req.json();

    const latestMessage = messages[messages.length - 1]?.parts
      ?.filter((p: any) => p.type === 'text')
      .map((p: any) => p.text as string)
      .join('') ?? '';

    // 1. Pre-filter: classify whether the message is boat-related before running the full pipeline
    if (latestMessage) {
      const classifyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 1,
          messages: [
            {
              role: 'system',
              content: 'You are classifying messages for a Bavaria C50 sailing yacht assistant. The user is already talking to a boat assistant, so short or vague questions are likely about the boat. Reply YES if the message could plausibly be a question about a boat, its systems, equipment, maintenance, navigation, electronics, or sailing in general. Reply NO only if the message is clearly not boat-related — for example pure greetings like "Hi" or "Hello", or completely unrelated topics like cooking, sports, or math. When in doubt, reply YES.',
            },
            { role: 'user', content: latestMessage },
          ],
        }),
      });
      if (classifyResponse.ok) {
        const classifyData = await classifyResponse.json();
        const verdict = classifyData.choices?.[0]?.message?.content?.trim().toUpperCase();
        console.log(`[SailSmart] Classifier verdict: ${verdict}`);
        if (verdict !== 'YES') {
          const stream = createUIMessageStream({
            execute: ({ writer }) => {
              writer.write({ type: 'text-start', id: 'off-topic' });
              writer.write({
                type: 'text-delta',
                id: 'off-topic',
                delta: "I'm SailSmart, your Bavaria C50 assistant. I can only help with questions about the Bavaria C50 yacht. Please ask me something about the boat!",
              });
              writer.write({ type: 'text-end', id: 'off-topic' });
            },
          });
          return createUIMessageStreamResponse({ stream, headers: { 'X-Similarity-Score': '0' } });
        }
      }
    }

    let contextText = '';
    let topSimilarity = 0;

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

        // 2. Perform similarity search in Supabase
        const { data: chunks, error } = await supabase.rpc('match_manual_chunks', {
          query_embedding: embedding,
          match_threshold: 0.2,
          match_count: 15,
        });

        if (error) {
          console.error("Supabase search error:", error);
        }

        if (!error && chunks && chunks.length > 0) {
          topSimilarity = chunks[0].similarity ?? 0;
          console.log(`Found ${chunks.length} chunks. Top similarity: ${topSimilarity.toFixed(3)}`);
          contextText = chunks
            .map((chunk: any) => `[Page ${chunk.page_number}]: ${chunk.content}`)
            .join('\n\n---\n\n');
        } else {
          console.log("No relevant chunks found in Supabase for the query.");
        }
      } else {
        console.error("Failed to fetch embeddings", await embeddingResponse.text());
      }
    }

    // 3. If no manual context found, return honest "not in manual" response without calling GPT
    if (!contextText) {
      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({ type: 'text-start', id: 'not-found' });
          writer.write({
            type: 'text-delta',
            id: 'not-found',
            delta: "I cannot find information about that in the official Bavaria C50 manual. If you have a specific question about another aspect of the yacht, I'm happy to help!",
          });
          writer.write({ type: 'text-end', id: 'not-found' });
        },
      });
      return createUIMessageStreamResponse({ stream, headers: { 'X-Similarity-Score': String(topSimilarity) } });
    }

    // 4. Construct system prompt
    const systemPrompt = `You are SailSmart, a helpful and expert assistant for the Bavaria C50 sailing yacht. 
You will be provided with context from the official manual to answer the user's question.

CRITICAL INSTRUCTION: You are strictly limited to answering questions related to the Bavaria C50 sailing yacht using ONLY the provided manual context. 
If a user asks about ANYTHING else (e.g., cars, other companies, general trivia, coding, etc.), you MUST politely decline to answer.
Do NOT use your general knowledge to answer off-topic questions.
Even for boat-related questions, you MUST NOT use your general knowledge, external information, or search the web. You must rely SOLELY on the "CONTEXT FROM MANUAL" provided below.
If the answer to the user's question cannot be found in the provided manual context, you MUST state: "I cannot find information about that in the official Bavaria C50 manual." Do NOT guess or invent an answer.
Say something like: "I am specifically designed to assist with the Bavaria C50. I cannot answer questions about other topics."

When answering on-topic questions, ALWAYS cite the manual using the exact page numbers provided in the context headers (e.g., if a context block starts with [Page 27]:, you must use 27).
You MUST format citations as Markdown links pointing to the PDF, like this: [Page X](/Bavaria_C50_Manual.pdf#page=X) where X is the actual page number from the context header.
Do NOT confuse item numbers (like "1. LED light") with page numbers. Only use the number from the [Page X] indicator.
IMPORTANT: Never use the citation format example above as real information. Only cite pages that actually appear in the CONTEXT FROM MANUAL section below.

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
