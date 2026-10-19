import { Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip, Segmented } from '../../components/ui/Choice';
import { Field, TextArea } from '../../components/ui/Field';
import { SERVICE_CATEGORIES } from '../../data/catalog';
import { focusFirstInvalid, useRequestSubmit } from '../../hooks/useRequestSubmit';
import { toFa } from '../../lib/persian';

type Urgency = 'normal' | 'urgent';

export function ServicesPage() {
  const [tab, setTab] = useState(SERVICE_CATEGORIES[0]!.id);
  const [selected, setSelected] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('normal');
  const [tried, setTried] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { submit, submitting, ticket, reset } = useRequestSubmit('services');

  const category = SERVICE_CATEGORIES.find((c) => c.id === tab)!;
  const toggle = (item: string) =>
    setSelected((s) => (s.includes(item) ? s.filter((x) => x !== item) : [...s, item]));
  const error = tried && selected.length === 0 ? 'حداقل یک خدمت را انتخاب کنید.' : '';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (selected.length === 0) {
      formRef.current?.querySelector<HTMLElement>('[aria-pressed]')?.focus();
      focusFirstInvalid(formRef.current);
      return;
    }
    const title =
      selected.length === 1
        ? selected[0]!
        : `${selected[0]} و ${toFa(selected.length - 1)} مورد دیگر`;
    const ok = await submit(title, [
      ...selected,
      urgency === 'urgent' ? 'فوری' : 'عادی',
      ...(description.trim() ? [description.trim()] : []),
    ]);
    if (ok) {
      setSelected([]);
      setDescription('');
      setUrgency('normal');
      setTried(false);
    }
  };

  return (
    <>
      <PageHeader back title="خدمات کاسپین" subtitle="درخواست خدمات انبار، دکوراسیون و تاسیسات" />
      <div className="animate-view flex flex-col gap-4 px-4 pt-4">
        {ticket ? (
          <SuccessPanel
            ticket={ticket}
            message="واحد خدمات کاسپین درخواست شما را بررسی می‌کند."
            onNew={reset}
          />
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div role="tablist" aria-label="دسته خدمات" className="grid grid-cols-3 gap-2">
              {SERVICE_CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = c.id === tab;
                const count = c.items.filter((i) => selected.includes(i)).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    id={`tab-${c.id}`}
                    aria-selected={active}
                    aria-controls="service-panel"
                    onClick={() => setTab(c.id)}
                    className={`theme-fade relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-xs font-bold transition-transform duration-150 active:scale-95 cursor-pointer ${
                      active
                        ? 'border-gold bg-gold-soft text-gold-ink'
                        : 'border-line bg-surface text-ink-2'
                    }`}
                  >
                    <Icon className="size-6" aria-hidden />
                    {c.title}
                    {count > 0 && (
                      <span className="absolute -top-1.5 -start-1.5 inline-flex size-6 items-center justify-center rounded-full bg-gold text-[11px] font-extrabold text-on-gold">
                        {toFa(count)}
                        <span className="sr-only"> مورد انتخاب‌شده</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Card
              id="service-panel"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              className="flex flex-col gap-3"
            >
              <p className="text-sm font-bold text-ink">
                {category.title}: موارد مورد نیاز را انتخاب کنید
              </p>
              <div className="flex flex-wrap gap-2">
                {category.items.map((item) => (
                  <Chip key={item} selected={selected.includes(item)} onToggle={() => toggle(item)}>
                    {item}
                  </Chip>
                ))}
              </div>
              {error && (
                <p role="alert" className="text-xs font-bold text-danger">
                  {error}
                </p>
              )}
            </Card>

            {selected.length > 0 && (
              <Card className="flex flex-col gap-2">
                <p className="text-sm font-bold text-ink">
                  {toFa(selected.length)} خدمت انتخاب شده
                </p>
                <ul className="flex flex-wrap gap-2">
                  {selected.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => toggle(s)}
                        aria-label={`حذف ${s}`}
                        className="inline-flex min-h-10 items-center gap-1 rounded-full bg-surface-2 px-3 text-xs font-bold text-ink cursor-pointer"
                      >
                        {s}
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Segmented<Urgency>
              label="اولویت"
              value={urgency}
              onChange={setUrgency}
              options={[
                { value: 'normal', label: 'عادی' },
                { value: 'urgent', label: 'فوری' },
              ]}
            />

            <Field label="توضیحات" helper="مثلاً تعداد اقلام، ساعت مناسب یا طبقه مقصد">
              {({ id, describedBy }) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  value={description}
                  maxLength={500}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات تکمیلی…"
                />
              )}
            </Field>

            <Button type="submit" size="lg" block icon={Send} loading={submitting}>
              ثبت درخواست
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
