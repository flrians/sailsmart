'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Anchor, Ship, MessageCircle, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './page.module.css';

type Boat = {
  id: string;
  boat_name: string;
  configuration: string | null;
  qr_token: string;
  boat_types: { id: string; name: string } | null;
  profiles: { company_name: string; company_logo_url?: string | null } | null;
};

type Props = { boat: Boat; sessionId: string | null; qrToken: string };
type Tab = 'chat' | 'info';

export default function GuestBoatClient({ boat, sessionId, qrToken }: Props) {
  const [tab, setTab] = useState<Tab>('chat');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const company = (boat.profiles as any);
  const boatType = (boat.boat_types as any);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/boat-chat',
      body: { qr_token: qrToken, session_id: sessionId },
    }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(text?: string) {
    const content = text ?? input.trim();
    if (!content) return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: content }] });
    setInput('');
  }

  const suggestions = [
    'How do I start the engine?',
    'Where are the life jackets?',
    'How does the navigation system work?',
  ];

  return (
    <div className={styles.shell}>
      {/* Branding bar */}
      <div className={styles.brandingBar}>
        {company?.company_logo_url ? (
          <img src={company.company_logo_url} alt={company.company_name} className={styles.companyLogo} />
        ) : (
          <div className={styles.companyInitial}>{company?.company_name?.[0] ?? 'C'}</div>
        )}
        <span className={styles.companyName}>{company?.company_name ?? 'Charter'}</span>
        <span className={styles.poweredBy}>
          <Anchor size={10} strokeWidth={2} /> SailSmart
        </span>
      </div>

      {/* Boat hero */}
      <div className={styles.hero}>
        <h1 className={styles.boatName}>{boat.boat_name}</h1>
        {boatType && <span className={styles.boatBadge}>{boatType.name}</span>}
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${tab === 'chat' ? styles.tabActive : ''}`}
          onClick={() => setTab('chat')}
        >
          <MessageCircle size={15} strokeWidth={tab === 'chat' ? 2.5 : 1.75} /> Assistant
        </button>
        <button
          className={`${styles.tab} ${tab === 'info' ? styles.tabActive : ''}`}
          onClick={() => setTab('info')}
        >
          <Ship size={15} strokeWidth={tab === 'info' ? 2.5 : 1.75} /> Boat Info
        </button>
      </div>

      {/* Chat tab */}
      {tab === 'chat' && (
        <div className={styles.chatWrapper}>
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.welcome}>
                <p className={styles.welcomeText}>
                  Ask me anything about <strong>{boat.boat_name}</strong>.
                </p>
                <div className={styles.suggestions}>
                  {suggestions.map((s) => (
                    <button key={s} className={styles.suggestionBtn} onClick={() => handleSend(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgAI}`}>
                {m.parts?.map((part, i) =>
                  part.type === 'text' ? (
                    <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
                  ) : null
                )}
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.msg} ${styles.msgAI}`}>
                <Loader2 size={16} className={styles.spinner} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className={styles.inputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask about your boat…"
              className={styles.chatInput}
              disabled={isLoading}
            />
            <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className={styles.sendBtn}>
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Boat info tab */}
      {tab === 'info' && (
        <div className={styles.infoPanel}>
          <div className={`${styles.infoCard} glass-panel`}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Boat</span>
              <span className={styles.infoValue}>{boat.boat_name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Type</span>
              <span className={styles.infoValue}>{boatType?.name ?? '—'}</span>
            </div>
            {boat.configuration && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Configuration</span>
                <span className={styles.infoValue}>{boat.configuration}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Operated by</span>
              <span className={styles.infoValue}>{company?.company_name ?? '—'}</span>
            </div>
          </div>
          <p className={styles.infoHint}>
            Switch to the <strong>Assistant</strong> tab to ask questions about this boat.
          </p>
        </div>
      )}
    </div>
  );
}
