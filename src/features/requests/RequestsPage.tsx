import { ChevronDown, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { IconTile, ZebraList } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Choice';
import { EmptyState } from '../../components/ui/Feedback';
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
      <div className="flex flex-col gap-4 px-4 pt-2">
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
          <ZebraList label="درخواست‌ها">
            {shown.map((t) => {
              const Icon = SERVICE_TILES.find((s) => s.id === t.module)?.icon ?? ClipboardList;
              const isExpanded = expanded === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`ticket-${t.id}`}
                    onClick={() => setExpanded(isExpanded ? null : t.id)}
                    className="flex min-h-18 w-full items-center gap-3 px-4 py-3 text-start cursor-pointer"
                  >
                    <IconTile icon={Icon} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-semibold text-ink">{t.title}</span>
                      <span className="text-[13px] text-ink-2">
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
                    <dl
                      id={`ticket-${t.id}`}
                      className="animate-fade grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-4 pb-4 text-[13px]"
                    >
                      <dt className="text-ink-2">کد پیگیری</dt>
                      <dd className="tabular font-semibold text-ink" dir="ltr">
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
                  )}
                </li>
              );
            })}
          </ZebraList>
        )}
      </div>
    </>
  );
}
