import { Clock } from 'lucide-react';
import { HubHeader } from '../../components/layout/Header';
import { Badge, type Tone } from '../../components/ui/Badge';
import { IconTile } from '../../components/ui/Card';
import { HOME_GROUPS, tileOf, type ModuleId } from '../../data/catalog';
import { useStoreInfo } from '../../store/session';
import { subscriptionSummary } from '../../api/parking';
import { useParking } from '../../hooks/useParking';
import { toFa } from '../../lib/persian';
import { hrefFor, navigate } from '../../lib/router';
import { isOpen, useTickets } from '../../store/tickets';

interface Chip {
  tone: Tone;
  text: string;
}

function useChips(): Partial<Record<ModuleId, Chip>> {
  const tickets = useTickets((s) => s.items);
  const { state } = useParking();
  const chips: Partial<Record<ModuleId, Chip>> = {};
  for (const id of ['services', 'maintenance', 'logistics', 'booth', 'advertising'] as const) {
    const open = tickets.filter((t) => t.module === id && isOpen(t.status)).length;
    if (open > 0) chips[id] = { tone: 'warning', text: `${toFa(open)} در جریان` };
  }
  if (state.status === 'ready') {
    const s = subscriptionSummary(state.data);
    chips.parking =
      s.status === 'expired'
        ? { tone: 'danger', text: 'منقضی' }
        : {
            tone: s.status === 'ending' ? 'warning' : 'success',
            text: `${toFa(s.daysLeft)} روز مانده`,
          };
  }
  return chips;
}

export function HomePage() {
  const STORE = useStoreInfo();
  const chips = useChips();
  return (
    <>
      <HubHeader
        greeting={`سلام ${STORE.manager}`}
        title={STORE.name}
        caption={`پلاک ${STORE.unit} – ${STORE.floor}`}
      />
      <div className="flex flex-col gap-6 px-4">
        {HOME_GROUPS.map((group, gi) => (
          <section key={group.title} aria-labelledby={`group-${gi}`}>
            <h2 id={`group-${gi}`} className="mb-2 px-1 text-base font-semibold text-ink-2">
              {group.title}
            </h2>
            <ul className="grid grid-cols-2 gap-3">
              {group.modules.map((id) => {
                const t = tileOf(id);
                const chip = chips[id];
                const wide = group.modules.length === 1;
                return (
                  <li key={id} className={wide ? 'col-span-2' : undefined}>
                    <a
                      href={hrefFor(id)}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(id);
                      }}
                      className={`theme-fade flex h-full gap-3 rounded-[20px] border border-line bg-card p-4 transition-colors duration-150 hover:bg-row active:bg-row ${
                        wide ? 'items-center' : 'flex-col'
                      }`}
                    >
                      <IconTile icon={t.icon} size="lg" />
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                        {chip && !wide && (
                          <Badge tone={chip.tone} icon={Clock}>
                            {chip.text}
                          </Badge>
                        )}
                        <span className="text-lg font-bold text-ink">{t.title}</span>
                        <span className="text-[13px] text-ink-2">{t.subtitle}</span>
                      </span>
                      {chip && wide && (
                        <Badge tone={chip.tone} icon={Clock}>
                          {chip.text}
                        </Badge>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
