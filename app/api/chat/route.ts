import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const latestMessage = messages[messages.length - 1]?.parts
      ?.filter((p: any) => p.type === 'text')
      .map((p: any) => p.text as string)
      .join('') ?? '';

    let contextText = '';
    let topSimilarity = 0;

    if (latestMessage) {
      // 1. Generate an embedding for the user's query
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

    // 3. Pre-filter: skip GPT if the best manual match is below the relevance threshold
    if (topSimilarity < 0.35) {
      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({ type: 'text-start', id: 'off-topic' });
          writer.write({
            type: 'text-delta',
            id: 'off-topic',
            delta: "I'm SailSmart, your Bavaria C50 assistant. Your message doesn't seem to be related to the Bavaria C50 manual. Please ask me about the yacht — for example, engine operation, navigation, safety equipment, or maintenance.",
          });
          writer.write({ type: 'text-end', id: 'off-topic' });
        },
      });
      return createUIMessageStreamResponse({ stream });
    }

    // 3. Construct system prompt
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
For example: "To connect to Bluetooth, turn on the receiver ([Page 12](/Bavaria_C50_Manual.pdf#page=12))."

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
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return new Response('An error occurred during chat processing.', { status: 500 });
  }
}
