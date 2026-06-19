"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Ship, Send, Plus, MessageCircle, ChevronRight, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useRef, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSession, saveMessage, generateSessionTitle, getSessions, getSessionMessages } from '@/app/actions/chat';
import styles from './page.module.css';
import PdfPageModal from './PdfPageModal';

function parsePdfLink(href?: string, linkText?: string): { filename: string; page: number } | null {
  if (!href || /^https?:\/\//i.test(href)) return null;
  const m = href.match(/([^/#?]+\.pdf)(?:#page=(\d+))?/i);
  if (!m) return null;
  const pageFromHash = m[2] ? parseInt(m[2], 10) : null;
  if (pageFromHash) return { filename: m[1], page: pageFromHash };
  const pageInText = linkText?.match(/\bpage\s+(\d+)\b/i);
  return { filename: m[1], page: pageInText ? parseInt(pageInText[1], 10) : 1 };
}

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
  const dateLabel = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  if (diffDays === 0) return `${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · ${dateLabel}`;
  if (diffDays === 1) return `Yesterday · ${dateLabel}`;
  if (diffDays < 7) return `${date.toLocaleDateString('en-US', { weekday: 'long' })} · ${dateLabel}`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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
  const titleGeneratedRef = useRef(storedMessages.length > 0);

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
  const [pdfModal, setPdfModal] = useState<{ filename: string; page: number; autoScroll?: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'conversations'>('chat');

  // Restore PDF viewer from URL on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pdf = params.get('pdf');
    const pdfPage = params.get('pdfPage');
    if (pdf && pdfPage) setPdfModal({ filename: pdf, page: parseInt(pdfPage, 10) });
  }, []);

  // Sync PDF modal state to URL so a refresh re-opens it.
  // Always sets autoScroll: true — only link clicks go through here.
  const openPdfModal = (modal: { filename: string; page: number } | null) => {
    setPdfModal(modal ? { ...modal, autoScroll: true } : null);
    const url = new URL(window.location.href);
    if (modal) {
      url.searchParams.set('pdf', modal.filename);
      url.searchParams.set('pdfPage', String(modal.page));
    } else {
      url.searchParams.delete('pdf');
      url.searchParams.delete('pdfPage');
    }
    window.history.replaceState(null, '', url.toString());
  };
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

  useEffect(() => {
    if (pdfModal) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pdfModal]);

  // Persist new messages once streaming is complete
  useEffect(() => {
    if (status !== 'ready') return;
    const newMessages = messages.slice(messageCountRef.current);
    if (newMessages.length === 0) return;
    (async () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      let savedAssistant = false;
      for (const msg of newMessages) {
        if (savedIdsRef.current.has(msg.id)) continue;
        const content = msg.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text as string)
          .join('');
        if (!content) continue;
        await saveMessage(sid, msg.role as 'user' | 'assistant', content);
        savedIdsRef.current.add(msg.id);
        if (msg.role === 'assistant') savedAssistant = true;
      }
      messageCountRef.current = messages.length;
      if (savedAssistant && !titleGeneratedRef.current) {
        titleGeneratedRef.current = true;
        generateSessionTitle(sid);
      }
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
                            a: ({ node, ...props }) => {
                              const linkText = typeof props.children === 'string'
                                ? props.children
                                : Array.isArray(props.children)
                                ? (props.children as any[]).filter((c) => typeof c === 'string').join('')
                                : '';
                              const pdf = parsePdfLink(props.href, linkText);
                              if (pdf) {
                                return (
                                  <a
                                    href={props.href}
                                    onClick={(e) => { e.preventDefault(); openPdfModal(pdf); }}
                                    style={{ textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}
                                  >
                                    {props.children}
                                  </a>
                                );
                              }
                              return (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ textDecoration: 'underline', fontWeight: '500' }}
                                />
                              );
                            },
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
              {pdfModal && (
                <div className={`${styles.messageWrapper} ${styles.messageAssistant}`}>
                  <PdfPageModal
                    filename={pdfModal.filename}
                    page={pdfModal.page}
                    autoScroll={pdfModal.autoScroll ?? false}
                    onClose={() => openPdfModal(null)}
                  />
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
