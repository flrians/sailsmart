"use client";

import { useChat } from '@ai-sdk/react';
import { Ship, Send, Anchor } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useRef, useEffect, useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Anchor size={28} color="#0077BE" />
          SailSmart
        </div>
      </header>

      <div className={styles.chatContainer}>
        {messages?.length === 0 || !messages ? (
          <div className={`${styles.emptyState} animate-fade-in`}>
            <Ship size={64} color="#0077BE" strokeWidth={1.5} />
            <h2>Welcome aboard!</h2>
            <p>
              I am your SailSmart assistant. Ask me anything about the Bavaria C50 manual—from connecting to Bluetooth to changing the engine oil.
            </p>
          </div>
        ) : (
          <div className={styles.messagesArea}>
            {messages?.map((m) => {
              const displayContent = m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text as string).join('');
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
                            <a {...props} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline', fontWeight: '500'}} />
                          )
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
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <textarea
              className={styles.textarea}
              value={input || ''}
              placeholder="Ask a question about the Bavaria C50..."
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!input?.trim() || isLoading) return;
                  const form = e.currentTarget.form;
                  if (form && typeof form.requestSubmit === 'function') {
                    form.requestSubmit();
                  }
                }
              }}
              rows={1}
            />
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading || !input?.trim()}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
