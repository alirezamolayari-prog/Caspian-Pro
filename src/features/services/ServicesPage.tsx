import { Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip, Segmented } from '../../components/ui/Choice';
import { Field, TextArea } from '../../components/ui/Field';
import { SERVICE_CATEGORIES } from '../../data/catalog';
import { useRequestSubmit } from '../../hooks/useRequestSubmit';
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
      <PageHeader back title="خدمات کاسپین" subtitle="انبار و کالا، دکوراسیون، تاسیسات" />
      <div className="animate-view flex flex-col gap-4 px-4 pt-2">
        {ticket ? (
          <SuccessPanel
            ticket={ticket}
            message="واحد خدمات کاسپین درخواست شما را بررسی می‌کند."
            onNew={reset}
          />
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
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
                    className={`theme-fade relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-[20px] border p-2 text-[13px] font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-primary bg-primary-soft text-on-primary-soft'
                        : 'border-line bg-card text-ink'
                    }`}
                  >
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                    {c.title}
                    {count > 0 && (
                      <span className="absolute top-1.5 start-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-primary">
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
              <p className="font-semibold text-ink">{category.title}</p>
              <div className="flex flex-wrap gap-2">
                {category.items.map((item) => (
                  <Chip key={item} selected={selected.includes(item)} onToggle={() => toggle(item)}>
                    {item}
                  </Chip>
                ))}
              </div>
              {error && (
                <p role="alert" className="text-[13px] font-semibold text-danger">
                  {error}
                </p>
              )}
            </Card>

            {selected.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="px-1 text-[15px] font-semibold text-ink">
                  {toFa(selected.length)} خدمت انتخاب شده
                </p>
                <ul className="flex flex-wrap gap-2">
                  {selected.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => toggle(s)}
                        aria-label={`حذف ${s}`}
                        className="inline-flex min-h-10 items-center gap-1 rounded-[10px] bg-field px-3 text-[13px] font-medium text-ink cursor-pointer"
                      >
                        {s}
                        <X className="size-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <p className="px-2 text-[15px] font-semibold text-ink">اولویت</p>
              <Segmented<Urgency>
                label="اولویت"
                value={urgency}
                onChange={setUrgency}
                options={[
                  { value: 'normal', label: 'عادی' },
                  { value: 'urgent', label: 'فوری' },
                ]}
              />
            </div>

            <Field label="توضیحات" helper="مثلاً تعداد اقلام، ساعت مناسب یا طبقه مقصد">
              {({ id, describedBy }) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  value={description}
                  maxLength={500}
                  onChange={(e) => setDescription(e.target.value)}
                />
              )}
            </Field>

            <Button type="submit" block icon={Send} loading={submitting}>
              ثبت درخواست
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
