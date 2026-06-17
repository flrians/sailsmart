"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Ship, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useRef, useEffect, useState } from 'react';
import styles from './page.module.css';

export default function ChatClient({
  hasManual,
  boatName,
}: {
  hasManual: boolean;
  boatName: string;
}) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        const score = response.headers.get('X-Similarity-Score');
        console.log(`[SailSmart] Similarity score: ${score ?? 'n/a'}`);
        return response;
      },
    }),
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !hasManual) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className={styles.chatContainer}>
      {!hasManual ? (
        <div className={`${styles.emptyState} animate-fade-in`}>
          <Ship size={64} color="#94A3B8" strokeWidth={1.5} />
          <h2 className={styles.comingSoonTitle}>Coming Soon!</h2>
          <p>
            Currently no information about the <strong>{boatName}</strong> is available —
            but it&apos;s coming soon for sure!
          </p>
          <p className={styles.comingSoonHint}>
            Switch your boat model in the Profile tab to get started.
          </p>
        </div>
      ) : !messages || messages.length === 0 ? (
        <div className={`${styles.emptyState} animate-fade-in`}>
          <Ship size={64} color="#0077BE" strokeWidth={1.5} />
          <h2>Welcome aboard!</h2>
          <p>Ask me anything about the {boatName} manual.</p>
        </div>
      ) : (
        <div className={styles.messagesArea}>
          {messages.map((m) => {
            const displayContent = m.parts
              .filter((p: any) => p.type === 'text')
              .map((p: any) => p.text as string)
              .join('');
            return (
              <div
                key={m.id}
                className={`${styles.messageWrapper} ${
                  m.role === 'user' ? styles.messageUser : styles.messageAssistant
                }`}
              >
                <div className={styles.messageBubble}>
                  {m.role === 'user' ? (
                    <p>{displayContent}</p>
                  ) : (
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'underline', fontWeight: '500' }}
                          />
                        ),
                      }}
                    >
                      {displayContent}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className={`${styles.messageWrapper} ${styles.messageAssistant}`}>
              <div className={styles.messageBubble} style={{ opacity: 0.7 }}>
                <em>Thinking...</em>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className={styles.inputArea}>
        <form onSubmit={handleSubmit} className={`${styles.inputForm} ${!hasManual ? styles.inputFormDisabled : ''}`}>
          <textarea
            className={styles.textarea}
            value={input}
            placeholder={hasManual ? `Ask a question about the ${boatName}…` : 'No manual available for this boat model yet…'}
            onChange={(e) => setInput(e.target.value)}
            disabled={!hasManual}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!input.trim() || isLoading || !hasManual) return;
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading || !input.trim() || !hasManual}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
