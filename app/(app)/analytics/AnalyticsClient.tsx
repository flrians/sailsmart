'use client';

import { useState, useEffect } from 'react';
import { BarChart3, MessageCircle, Ship, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import styles from './page.module.css';

type Period = '7' | '30' | 'all';

type AnalyticsData = {
  totalSessions: number;
  totalMessages: number;
  avgMessages: number;
  answeredRate: number;
  topTopics: { topic: string; count: number; pct: number }[];
  hourly: { hour: number; count: number }[];
  boatStats: { id: string; name: string; sessions: number; messages: number }[];
  trend: number | null;
  totalBoats: number;
};

const TOPIC_COLORS: Record<string, string> = {
  navigation: '#0077BE', sicherheit: '#e53e3e', motor: '#d97706',
  technik: '#7c3aed', komfort: '#059669', proviant: '#db2777',
  wetter: '#2563eb', sonstiges: '#94a3b8',
};

const TOPIC_LABELS: Record<string, string> = {
  navigation: 'Navigation', sicherheit: 'Safety', motor: 'Engine',
  technik: 'Technical', komfort: 'Comfort', proviant: 'Provisions',
  wetter: 'Weather', sonstiges: 'Other',
};

function Skeleton({ w = '100%', h = 20 }: { w?: string; h?: number }) {
  return <div className={styles.skeleton} style={{ width: w, height: h }} />;
}

export default function AnalyticsClient({ companyName }: { companyName: string }) {
  const [period, setPeriod] = useState<Period>('7');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period === 'all' ? '3650' : period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const maxHourly = data ? Math.max(...data.hourly.map((h) => h.count), 1) : 1;
  const maxBoatSessions = data ? Math.max(...data.boatStats.map((b) => b.sessions), 1) : 1;
  const topHours = data ? [...data.hourly].sort((a, b) => b.count - a.count).slice(0, 3).map((h) => h.hour) : [];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>{companyName}</p>
        </div>
        <div className={styles.periodFilter}>
          {(['7', '30', 'all'] as Period[]).map((p) => (
            <button key={p} className={`${styles.periodBtn} ${period === p ? styles.periodActive : ''}`} onClick={() => setPeriod(p)}>
              {p === '7' ? '7d' : p === '30' ? '30d' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIcon}><MessageCircle size={16} color="#0077BE" strokeWidth={1.75} /></div>
            {data?.trend != null && (
              <span className={`${styles.trend} ${data.trend >= 0 ? styles.trendUp : styles.trendDown}`}>
                {data.trend >= 0 ? '+' : ''}{data.trend}%
              </span>
            )}
          </div>
          {loading ? <Skeleton h={36} w="60%" /> : <div className={styles.kpiValue}>{data?.totalSessions ?? 0}<span className={styles.kpiUnit}> chats</span></div>}
          <div className={styles.kpiLabel}>{period === '7' ? 'Last 7 days' : period === '30' ? 'Last 30 days' : 'All time'}</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIcon}><Ship size={16} color="#0077BE" strokeWidth={1.75} /></div>
          </div>
          {loading ? <Skeleton h={36} w="50%" /> : <div className={styles.kpiValue}>{data?.totalBoats ?? 0}<span className={styles.kpiUnit}> boats</span></div>}
          <div className={styles.kpiLabel}>Fleet size</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIcon}><TrendingUp size={16} color="#0077BE" strokeWidth={1.75} /></div>
          </div>
          {loading ? <Skeleton h={36} w="45%" /> : <div className={styles.kpiValue}>{data?.avgMessages ?? 0}<span className={styles.kpiUnit}> msgs</span></div>}
          <div className={styles.kpiLabel}>Avg. session length</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={styles.kpiIcon}><CheckCircle size={16} color="#0077BE" strokeWidth={1.75} /></div>
          </div>
          {loading ? <Skeleton h={36} w="55%" /> : <div className={styles.kpiValue}>{data?.answeredRate ?? 0}<span className={styles.kpiUnit}>%</span></div>}
          <div className={styles.kpiLabel}>Questions answered</div>
        </div>
      </div>

      {/* Topics + Hourly */}
      <div className={styles.chartsGrid}>
        <div className={`${styles.chartCard} glass-panel`}>
          <h2 className={styles.chartTitle}><BarChart3 size={15} strokeWidth={1.75} /> Top Topics</h2>
          {loading ? (
            <div className={styles.skeletonGroup}>
              {[80, 65, 50, 40, 30].map((w, i) => <Skeleton key={i} h={12} w={`${w}%`} />)}
            </div>
          ) : data?.topTopics.length === 0 ? (
            <div className={styles.noData}>No questions yet</div>
          ) : (
            <div className={styles.topicList}>
              {data?.topTopics.map(({ topic, count, pct }) => (
                <div key={topic} className={styles.topicRow}>
                  <span className={styles.topicName}>{TOPIC_LABELS[topic] ?? topic}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${pct}%`, background: TOPIC_COLORS[topic] ?? '#0077BE' }}
                    />
                  </div>
                  <span className={styles.topicPct}>{pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.chartCard} glass-panel`}>
          <h2 className={styles.chartTitle}><Clock size={15} strokeWidth={1.75} /> Active Hours</h2>
          {loading ? (
            <div className={styles.hourlyPlaceholder}>
              {Array(12).fill(0).map((_, i) => <Skeleton key={i} h={Math.random() * 60 + 20} w="6%" />)}
            </div>
          ) : (
            <div className={styles.hourlyChart}>
              {data?.hourly.map(({ hour, count }) => {
                const isTop = topHours.includes(hour);
                const pct = maxHourly > 0 ? (count / maxHourly) * 100 : 0;
                return (
                  <div key={hour} className={styles.hourCol} title={`${hour}:00 — ${count} msgs`}>
                    <div className={styles.hourBarWrap}>
                      <div
                        className={styles.hourBar}
                        style={{
                          height: `${Math.max(pct, 2)}%`,
                          background: isTop ? '#0077BE' : 'rgba(0,119,190,0.2)',
                        }}
                      />
                    </div>
                    {hour % 6 === 0 && <span className={styles.hourLabel}>{hour}</span>}
                  </div>
                );
              })}
            </div>
          )}
          {!loading && topHours.length > 0 && (
            <p className={styles.chartHint}>Peak: {topHours[0]}:00</p>
          )}
        </div>
      </div>

      {/* Boat ranking */}
      <div className={`${styles.chartCard} ${styles.fullWidth} glass-panel`}>
        <h2 className={styles.chartTitle}><Ship size={15} strokeWidth={1.75} /> Fleet Activity</h2>
        {loading ? (
          <div className={styles.skeletonGroup}>
            {[100, 70, 45].map((w, i) => <Skeleton key={i} h={14} w={`${w}%`} />)}
          </div>
        ) : data?.boatStats.length === 0 ? (
          <div className={styles.noData}>No activity yet — share your QR codes with guests.</div>
        ) : (
          <div className={styles.boatList}>
            {data?.boatStats.map((boat) => (
              <div key={boat.id} className={styles.boatRow}>
                <span className={styles.boatRowName}>{boat.name}</span>
                <div className={styles.barTrack} style={{ flex: 1 }}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(boat.sessions / maxBoatSessions) * 100}%`, background: '#0077BE' }}
                  />
                </div>
                <span className={styles.boatRowCount}>{boat.sessions}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
