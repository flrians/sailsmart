"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Ship, Send, Plus, MessageCircle, ChevronRight, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useRef, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSession, saveMessage, getSessions, getSessionMessages } from '@/app/actions/chat';
import styles from './page.module.css';

type StoredMessage = { id: string; role: string; content: string };
type Session = { id: string; title: string | null; updated_at: string };

function toUIMessages(stored: StoredMessage[]) {
  return stored.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: m.content }],
  }));
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function ChatClient({
  hasManual,
  boatName,
  sessionId: initialSessionId,
  initialMessages: storedMessages,
}: {
  hasManual: boolean;
  boatName: string;
  sessionId: string | null;
  initialMessages: StoredMessage[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sessionIdRef = useRef<string | null>(initialSessionId);
  const savedIdsRef = useRef<Set<string>>(new Set(storedMessages.map((m) => m.id)));
  const messageCountRef = useRef(storedMessages.length);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        console.log(`[SailSmart] Similarity: ${response.headers.get('X-Similarity-Score') ?? 'n/a'}`);
        return response;
      },
    }),
    messages: toUIMessages(storedMessages),
  });

  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'conversations'>('chat');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<ReturnType<typeof toUIMessages> | null>(null);
  const [isSwitchingSession, setIsSwitchingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  // While a session switch navigation is in flight, show the eagerly-fetched messages
  const effectiveMessages = isPending && pendingMessages !== null ? pendingMessages : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [effectiveMessages]);

  // Persist new messages once streaming is complete
  useEffect(() => {
    if (status !== 'ready') return;
    const newMessages = messages.slice(messageCountRef.current);
    if (newMessages.length === 0) return;
    (async () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      for (const msg of newMessages) {
        if (savedIdsRef.current.has(msg.id)) continue;
        const content = msg.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text as string)
          .join('');
        if (!content) continue;
        await saveMessage(sid, msg.role as 'user' | 'assistant', content);
        savedIdsRef.current.add(msg.id);
      }
      messageCountRef.current = messages.length;
    })();
  }, [status]);

  const handleTabChange = async (tab: 'chat' | 'conversations') => {
    setActiveTab(tab);
    if (tab === 'conversations' && sessions.length === 0) {
      setSessionsLoading(true);
      const data = await getSessions();
      setSessions(data as Session[]);
      setSessionsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !hasManual) return;
    const text = input;
    setInput('');
    if (!sessionIdRef.current) {
      const newId = await createSession();
      if (newId) {
        sessionIdRef.current = newId;
        window.history.replaceState(null, '', `/?session=${newId}`);
      }
    }
    sendMessage({ text });
  };

  return (
    <div className={styles.chatContainer}>

      {/* Tab bar — only when manual is available */}
      {hasManual && (
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            Chat
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'conversations' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabChange('conversations')}
          >
            Conversations
          </button>
        </div>
      )}

      {/* ── CHAT TAB ──────────────────────────────── */}
      {activeTab === 'chat' && (
        <>
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
          ) : isSwitchingSession ? (
            <div className={styles.sessionLoading}>
              <Loader2 size={32} className={styles.spinner} />
            </div>
          ) : !effectiveMessages || effectiveMessages.length === 0 ? (
            <div className={`${styles.emptyState} animate-fade-in`}>
              <Ship size={64} color="#0077BE" strokeWidth={1.5} />
              <h2>Welcome aboard!</h2>
              <p>Ask me anything about the {boatName} manual.</p>
            </div>
          ) : (
            <div className={styles.messagesArea}>
              {effectiveMessages.map((m) => {
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

          <div className={styles.newChatRow}>
            <button className={styles.newChatCornerBtn} onClick={() => { if (effectiveMessages && effectiveMessages.length > 0) setIsSwitchingSession(true); startTransition(() => router.push('/')); }} title="New conversation">
              <Plus size={16} />
            </button>
          </div>

          <div className={styles.inputArea}>
            <form
              onSubmit={handleSubmit}
              className={`${styles.inputForm} ${!hasManual ? styles.inputFormDisabled : ''}`}
            >
              <textarea
                className={styles.textarea}
                value={input}
                placeholder={
                  hasManual
                    ? `Ask a question about the ${boatName}…`
                    : 'No manual available for this boat model yet…'
                }
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
        </>
      )}

      {/* ── CONVERSATIONS TAB ─────────────────────── */}
      {activeTab === 'conversations' && (
        <div className={styles.convTab}>
          {sessionsLoading ? (
            <p className={styles.convEmpty}>Loading…</p>
          ) : sessions.length === 0 ? (
            <div className={styles.convEmptyState}>
              <MessageCircle size={40} color="#94A3B8" strokeWidth={1.5} />
              <p>No past conversations yet.</p>
            </div>
          ) : (
            <ul className={styles.sessionList}>
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    className={`${styles.sessionRow} ${initialSessionId === s.id ? styles.sessionRowActive : ''}`}
                    onClick={async () => {
                      setActiveTab('chat');
                      setIsSwitchingSession(true);
                      const msgs = await getSessionMessages(s.id);
                      setIsSwitchingSession(false);
                      setPendingMessages(toUIMessages(msgs));
                      startTransition(() => {
                        router.push(`/?session=${s.id}`);
                      });
                    }}
                  >
                    <div className={styles.sessionIcon}>
                      <MessageCircle size={17} color="#0077BE" strokeWidth={1.75} />
                    </div>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionTitle}>{s.title ?? 'New conversation'}</span>
                      <span className={styles.sessionDate}>{formatDate(s.updated_at)}</span>
                    </div>
                    <ChevronRight size={15} color="#CBD5E1" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

    </div>
  );
}
