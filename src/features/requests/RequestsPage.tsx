import { ChevronDown, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Choice';
import { EmptyState } from '../../components/ui/Feedback';
import { Button } from '../../components/ui/Button';
import { cx } from '../../components/ui/cx';
import { MODULE_TITLES, SERVICE_TILES } from '../../data/catalog';
import { displayId } from '../../lib/ids';
import { formatJalali, formatTime, relativeTime, toFa } from '../../lib/persian';
import { navigate } from '../../lib/router';
import { isOpen, useTickets } from '../../store/tickets';
import { StatusBadge } from './StatusBadge';

type Filter = 'all' | 'open' | 'closed';

export function RequestsPage() {
  const items = useTickets((s) => s.items);
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const shown = items.filter((t) =>
    filter === 'all' ? true : filter === 'open' ? isOpen(t.status) : !isOpen(t.status),
  );
  const openCount = items.filter((t) => isOpen(t.status)).length;

  return (
    <>
      <PageHeader title="درخواست‌های من" subtitle={`${toFa(openCount)} درخواست در جریان`} />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <Segmented<Filter>
          label="فیلتر درخواست‌ها"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'همه' },
            { value: 'open', label: 'در جریان' },
            { value: 'closed', label: 'بسته‌شده' },
          ]}
        />
        {shown.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="درخواستی در این بخش نیست"
            body="از صفحه خانه یکی از خدمات را انتخاب کنید."
            action={<Button onClick={() => navigate('home')}>رفتن به خانه</Button>}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((t) => {
              const Icon = SERVICE_TILES.find((s) => s.id === t.module)?.icon ?? ClipboardList;
              const isExpanded = expanded === t.id;
              return (
                <li key={t.id}>
                  <Card className="p-0">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={`ticket-${t.id}`}
                      onClick={() => setExpanded(isExpanded ? null : t.id)}
                      className="flex w-full items-center gap-3 p-4 text-start cursor-pointer"
                    >
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-ink">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-bold text-ink">{t.title}</span>
                        <span className="text-xs text-ink-2">
                          {MODULE_TITLES[t.module]} – {relativeTime(t.updatedAt)}
                        </span>
                      </span>
                      <StatusBadge status={t.status} />
                      <ChevronDown
                        className={cx(
                          'size-5 shrink-0 text-ink-2 transition-transform duration-200',
                          isExpanded && 'rotate-180',
                        )}
                        aria-hidden
                      />
                    </button>
                    {isExpanded && (
                      <div
                        id={`ticket-${t.id}`}
                        className="animate-fade border-t border-line px-4 py-3 text-sm"
                      >
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                          <dt className="text-ink-2">کد پیگیری</dt>
                          <dd className="tabular font-bold text-ink" dir="ltr">
                            {displayId(t.id)}
                          </dd>
                          <dt className="text-ink-2">ثبت</dt>
                          <dd className="text-ink">
                            {formatJalali(t.createdAt)} – {formatTime(t.createdAt)}
                          </dd>
                          {t.details.length > 0 && (
                            <>
                              <dt className="text-ink-2">جزئیات</dt>
                              <dd className="text-ink [overflow-wrap:anywhere]">
                                {t.details.join(' – ')}
                              </dd>
                            </>
                          )}
                        </dl>
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
