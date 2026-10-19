import { Camera, ImagePlus, Wrench, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../../components/layout/Header';
import { SuccessPanel } from '../../components/layout/Success';
import { Button } from '../../components/ui/Button';
import { SectionTitle } from '../../components/ui/Card';
import { Segmented } from '../../components/ui/Choice';
import { Field, Select, TextArea } from '../../components/ui/Field';
import { cx } from '../../components/ui/cx';
import { FLOORS, MAINTENANCE_CATEGORIES, WINGS } from '../../data/catalog';
import { focusFirstInvalid, useRequestSubmit } from '../../hooks/useRequestSubmit';
import { toFa } from '../../lib/persian';
import { minLength } from '../../lib/validators';
import { useUi } from '../../store/ui';

const MAX_PHOTOS = 3;
const MAX_BYTES = 5 * 1024 * 1024;
type Priority = 'low' | 'normal' | 'high';
interface Photo {
  id: string;
  url: string;
  name: string;
}

export function MaintenancePage() {
  const toast = useUi((s) => s.toast);
  const [category, setCategory] = useState<string | null>(null);
  const [wing, setWing] = useState('');
  const [floor, setFloor] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { submit, submitting, ticket, reset } = useRequestSubmit('maintenance');

  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const v = {
    category: !category ? 'نوع خرابی را انتخاب کنید.' : '',
    wing: !wing ? 'بخش پاساژ را انتخاب کنید.' : '',
    floor: !floor ? 'طبقه را انتخاب کنید.' : '',
    description: !minLength(description, 10) ? 'خرابی را حداقل در ۱۰ حرف توضیح دهید.' : '',
  };
  const err = (k: keyof typeof v) => (touched[k] ? v[k] : '');

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: Photo[] = [];
    for (const f of Array.from(files)) {
      if (photos.length + next.length >= MAX_PHOTOS) {
        toast({ tone: 'error', title: `حداکثر ${toFa(MAX_PHOTOS)} عکس` });
        break;
      }
      if (!f.type.startsWith('image/')) {
        toast({ tone: 'error', title: 'فقط فایل تصویری', body: f.name });
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast({ tone: 'error', title: 'حجم عکس بیش از ۵ مگابایت است', body: f.name });
        continue;
      }
      next.push({
        id: `${f.name}-${f.size}-${Math.random()}`,
        url: URL.createObjectURL(f),
        name: f.name,
      });
    }
    setPhotos((p) => [...p, ...next]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (id: string) =>
    setPhotos((p) => {
      const hit = p.find((x) => x.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return p.filter((x) => x.id !== id);
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ category: true, wing: true, floor: true, description: true });
    if (Object.values(v).some(Boolean)) {
      if (v.category) formRef.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
      else focusFirstInvalid(formRef.current);
      return;
    }
    const cat = MAINTENANCE_CATEGORIES.find((c) => c.id === category)!;
    const ok = await submit(`${cat.title} – ${floor}`, [
      wing,
      { low: 'اولویت کم', normal: 'اولویت عادی', high: 'اولویت بالا' }[priority],
      description.trim(),
      ...(photos.length ? [`${toFa(photos.length)} عکس پیوست`] : []),
    ]);
    if (ok) {
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      setCategory(null);
      setWing('');
      setFloor('');
      setDescription('');
      setTouched({});
    }
  };

  return (
    <>
      <PageHeader back title="گزارش خرابی مشاعات" subtitle="آسانسور، پله‌برقی، روشنایی و تهویه" />
      <div className="animate-view flex flex-col gap-4 px-4 pt-4">
        {ticket ? (
          <SuccessPanel
            ticket={ticket}
            message="واحد فنی کاسپین گزارش شما را بررسی و اعزام نیرو می‌کند."
            onNew={reset}
          />
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <section aria-labelledby="cat-title">
              <SectionTitle>
                <span id="cat-title">نوع خرابی</span>
              </SectionTitle>
              <div role="radiogroup" aria-labelledby="cat-title" className="grid grid-cols-2 gap-2">
                {MAINTENANCE_CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const checked = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => {
                        setCategory(c.id);
                        setTouched((t) => ({ ...t, category: true }));
                      }}
                      className={cx(
                        'theme-fade flex min-h-20 items-center gap-3 rounded-2xl border bg-surface p-3 text-start shadow-card transition-transform duration-150 active:scale-95 cursor-pointer',
                        checked ? 'border-gold ring-2 ring-gold/40' : 'border-line',
                      )}
                    >
                      <span
                        className={cx(
                          'inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
                          checked ? 'bg-gold text-on-gold' : 'bg-gold-soft text-gold-ink',
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="text-sm font-bold text-ink">{c.title}</span>
                    </button>
                  );
                })}
              </div>
              {err('category') && (
                <p role="alert" className="mt-2 px-1 text-xs font-bold text-danger">
                  {err('category')}
                </p>
              )}
            </section>

            <div className="grid grid-cols-2 gap-3">
              <Field label="بخش پاساژ" required error={err('wing')}>
                {({ id, describedBy, invalid }) => (
                  <Select
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    aria-required
                    value={wing}
                    onChange={(e) => setWing(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, wing: true }))}
                  >
                    <option value="">انتخاب کنید</option>
                    {WINGS.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="طبقه" required error={err('floor')}>
                {({ id, describedBy, invalid }) => (
                  <Select
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    aria-required
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, floor: true }))}
                  >
                    <option value="">انتخاب کنید</option>
                    {FLOORS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <div className="flex flex-col gap-2">
              <p className="px-1 text-sm font-bold text-ink">اولویت</p>
              <Segmented<Priority>
                label="اولویت"
                value={priority}
                onChange={setPriority}
                options={[
                  { value: 'low', label: 'کم' },
                  { value: 'normal', label: 'عادی' },
                  { value: 'high', label: 'بالا' },
                ]}
              />
            </div>

            <Field
              label="شرح خرابی"
              required
              error={err('description')}
              helper="مثلاً «آسانسور ۲ بین طبقات متوقف می‌شود»"
            >
              {({ id, describedBy, invalid }) => (
                <TextArea
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  aria-required
                  value={description}
                  maxLength={600}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                />
              )}
            </Field>

            <section aria-labelledby="photo-title" className="flex flex-col gap-2">
              <p id="photo-title" className="px-1 text-sm font-bold text-ink">
                عکس خرابی{' '}
                <span className="font-normal text-ink-2">(اختیاری، تا {toFa(MAX_PHOTOS)} عکس)</span>
              </p>
              <input
                ref={fileRef}
                id="photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="sr-only"
                onChange={(e) => addFiles(e.target.files)}
              />
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2"
                  >
                    <img
                      src={p.url}
                      alt={`پیش‌نمایش ${p.name}`}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      aria-label={`حذف عکس ${p.name}`}
                      className="absolute end-1 top-1 inline-flex size-9 items-center justify-center rounded-full bg-scrim text-white cursor-pointer"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label
                    htmlFor="photo-input"
                    className="theme-fade flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-gold/50 bg-gold-soft text-gold-ink transition-transform duration-150 active:scale-95"
                  >
                    {photos.length === 0 ? (
                      <Camera className="size-7" aria-hidden />
                    ) : (
                      <ImagePlus className="size-7" aria-hidden />
                    )}
                    <span className="text-xs font-bold">
                      {photos.length === 0 ? 'گرفتن عکس' : 'افزودن'}
                    </span>
                  </label>
                )}
              </div>
            </section>

            <Button type="submit" size="lg" block icon={Wrench} loading={submitting}>
              ثبت گزارش خرابی
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
