import { ChevronLeft, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HomeHeader } from '../../components/layout/Header';
import { Card, SectionTitle } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/Feedback';
import { cx } from '../../components/ui/cx';
import { SERVICE_TILES } from '../../data/catalog';
import { relativeTime } from '../../lib/persian';
import { hrefFor, navigate } from '../../lib/router';
import { useTickets } from '../../store/tickets';
import { StatusBadge } from '../requests/StatusBadge';
import { LoadingTimerCard } from './LoadingTimerCard';

export function HomePage() {
  const [query, setQuery] = useState('');
  const tickets = useTickets((s) => s.items);
  const tiles = useMemo(() => {
    const q = query.trim();
    if (!q) return SERVICE_TILES;
    return SERVICE_TILES.filter((t) => `${t.title} ${t.subtitle} ${t.keywords}`.includes(q));
  }, [query]);

  return (
    <>
      <HomeHeader query={query} onQuery={setQuery} />
      <div className="relative -mt-12 flex flex-col gap-6 px-4">
        {!query && <LoadingTimerCard />}

        <section aria-labelledby="services-title">
          <SectionTitle>
            <span id="services-title">{query ? 'نتایج جستجو' : 'دسترسی سریع'}</span>
          </SectionTitle>
          {tiles.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="خدمتی پیدا نشد"
              body="عبارت دیگری مثل «تبلیغات» یا «آسانسور» را امتحان کنید."
            />
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {tiles.map((t, i) => {
                const featured = i === 0 && !query;
                const Icon = t.icon;
                return (
                  <li key={t.id} className={cx(featured && 'col-span-2')}>
                    <a
                      href={hrefFor(t.id)}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(t.id);
                      }}
                      className={cx(
                        'theme-fade group flex h-full min-h-28 rounded-2xl border border-line bg-surface p-4 shadow-card transition-transform duration-150 active:scale-95',
                        featured ? 'items-center gap-4' : 'flex-col justify-between gap-3',
                      )}
                    >
                      <span
                        className={cx(
                          'inline-flex shrink-0 items-center justify-center rounded-2xl bg-gold-soft text-gold-ink ring-1 ring-gold/25',
                          featured ? 'size-14' : 'size-12',
                        )}
                      >
                        <Icon className={featured ? 'size-7' : 'size-6'} aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-extrabold text-ink">{t.title}</span>
                        <span className="text-xs text-ink-2">{t.subtitle}</span>
                      </span>
                      {featured && <ChevronLeft className="size-5 text-ink-2" aria-hidden />}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {!query && tickets.length > 0 && (
          <section aria-labelledby="recent-title">
            <SectionTitle
              action={
                <a
                  href={hrefFor('requests')}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('requests');
                  }}
                  className="inline-flex min-h-11 items-center gap-1 px-2 text-sm font-bold text-gold-ink"
                >
                  همه <ChevronLeft className="size-4" aria-hidden />
                </a>
              }
            >
              <span id="recent-title">آخرین درخواست‌ها</span>
            </SectionTitle>
            <Card className="divide-y divide-line p-0">
              {tickets.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{t.title}</p>
                    <p className="text-xs text-ink-2">{relativeTime(t.updatedAt)}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
