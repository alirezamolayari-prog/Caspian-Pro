import {
  ArrowUpDown,
  Box,
  Car,
  Briefcase,
  ConciergeBell,
  Fan,
  Globe,
  Lightbulb,
  LifeBuoy,
  Megaphone,
  MonitorPlay,
  SquareParking,
  ShieldCheck,
  Store,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/** The tenant this device belongs to. Comes from the server after login. */
export const STORE = {
  name: 'مبلمان رویال',
  unit: '۲۴',
  floor: 'همکف',
  manager: 'آقای رضایی',
  category: 'مبلمان لوکس',
} as const;

export type ModuleId =
  | 'services'
  | 'logistics'
  | 'parking'
  | 'security'
  | 'booth'
  | 'advertising'
  | 'maintenance'
  | 'support';

export interface ServiceTile {
  id: ModuleId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export const SERVICE_TILES: ServiceTile[] = [
  {
    id: 'services',
    title: 'خدمات کاسپین',
    subtitle: 'انبار، دکوراسیون، تاسیسات',
    icon: ConciergeBell,
  },
  {
    id: 'logistics',
    title: 'بارگیری و تخلیه',
    subtitle: 'رزرو نوبت درب‌ها',
    icon: Truck,
  },
  {
    id: 'parking',
    title: 'پارکینگ',
    subtitle: 'وضعیت اشتراک پارکینگ',
    icon: Car,
  },
  {
    id: 'security',
    title: 'حراست و انتظامات',
    subtitle: 'کارت تردد و اضطراری',
    icon: ShieldCheck,
  },
  {
    id: 'booth',
    title: 'رزرو فضای فروش',
    subtitle: 'لابی و فضای ویژه',
    icon: Store,
  },
  {
    id: 'advertising',
    title: 'درخواست تبلیغات',
    subtitle: 'دیجیتال و محیطی',
    icon: Megaphone,
  },
  {
    id: 'maintenance',
    title: 'گزارش خرابی مشاعات',
    subtitle: 'آسانسور، روشنایی، تهویه',
    icon: Wrench,
  },
  {
    id: 'support',
    title: 'پشتیبانی و قوانین',
    subtitle: 'مقررات و تماس',
    icon: LifeBuoy,
  },
];

/** Home groups: unrelated services live in separate sections. */
export const HOME_GROUPS: Array<{ title: string; modules: ModuleId[] }> = [
  { title: 'درخواست‌ها و خدمات', modules: ['services', 'maintenance'] },
  { title: 'تردد و خودرو', modules: ['logistics', 'parking'] },
  { title: 'امنیت', modules: ['security'] },
  { title: 'فروش و تبلیغات', modules: ['booth', 'advertising'] },
  { title: 'راهنما', modules: ['support'] },
];

export const tileOf = (id: ModuleId) => SERVICE_TILES.find((t) => t.id === id)!;

export const MODULE_TITLES: Record<ModuleId, string> = Object.fromEntries(
  SERVICE_TILES.map((t) => [t.id, t.title]),
) as Record<ModuleId, string>;

export interface ServiceCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  items: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'warehouse',
    title: 'انبار و کالا',
    icon: Box,
    items: ['ورود کالا', 'خروج کالا', 'درخواست انبار', 'انتقال داخلی بین طبقات'],
  },
  {
    id: 'decor',
    title: 'دکوراسیون',
    icon: Briefcase,
    items: ['تغییر دکوراسیون غرفه', 'نظافت ویژه', 'جمع‌آوری کارتن و ضایعات'],
  },
  {
    id: 'facility',
    title: 'تاسیسات و برق',
    icon: Lightbulb,
    items: ['مشکل برق داخلی غرفه', 'مشکل سیستم تهویه/تاسیسات'],
  },
];

export type GateId = 'asadnejad' | 'safarkhani' | 'parking';

export interface Gate {
  id: GateId;
  title: string;
  capacity: number;
  /** Mock live occupancy (other tenants). */
  busy: number;
}

export const GATES: Gate[] = [
  { id: 'asadnejad', title: 'درب اسدنژاد', capacity: 1, busy: 1 },
  { id: 'safarkhani', title: 'درب صفرخانی', capacity: 3, busy: 1 },
  { id: 'parking', title: 'پارکینگ اختصاصی', capacity: 1, busy: 0 },
];

export const gateTitle = (id: GateId) => GATES.find((g) => g.id === id)?.title ?? id;

export const SLOT_MINUTES = [15, 30, 45, 60] as const;

export const BOOTH_ZONES = [
  { id: 'main-lobby', title: 'لابی ورودی اصلی', area: '۴۰ متر', free: true },
  { id: 'atrium', title: 'آتریوم مرکزی', area: '۶۰ متر', free: true },
  { id: 'escalator', title: 'فضای جلوی پله‌برقی همکف', area: '۲۰ متر', free: false },
  { id: 'f1-corridor', title: 'راهروی طبقه اول', area: '۲۵ متر', free: true },
] as const;

export interface AdChannel {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const AD_CHANNELS: AdChannel[] = [
  {
    id: 'digital',
    title: 'تبلیغات اینترنتی و دیجیتال',
    description: 'صفحه اینستاگرام و وب‌سایت کاسپین',
    icon: Globe,
  },
  {
    id: 'halls',
    title: 'سالن‌ها و راهروهای پاساژ',
    description: 'بنر و استند در مسیرهای پرتردد',
    icon: Store,
  },
  {
    id: 'parking',
    title: 'پارکینگ طبقاتی',
    description: 'تابلو در ورودی و طبقات پارکینگ',
    icon: SquareParking,
  },
  {
    id: 'elevators',
    title: 'نمایشگر و استند آسانسورها',
    description: 'نمایشگرهای داخل و کنار آسانسور',
    icon: MonitorPlay,
  },
];

export const AD_DURATIONS = ['۱ هفته', '۲ هفته', '۱ ماه', '۳ ماه'] as const;

export const MAINTENANCE_CATEGORIES = [
  { id: 'elevator', title: 'آسانسور', icon: ArrowUpDown },
  { id: 'escalator', title: 'پله‌برقی', icon: ArrowUpDown },
  { id: 'lighting', title: 'روشنایی و لامپ', icon: Lightbulb },
  { id: 'hvac', title: 'تهویه مطبوع', icon: Fan },
] as const;

export const WINGS = ['بال شرقی', 'بال غربی', 'بال شمالی', 'بال جنوبی', 'بخش مرکزی'] as const;

/** Public floors of the mall, top to bottom. */
export const FLOORS = [
  'طبقه سوم',
  'طبقه دوم',
  'طبقه اول',
  'همکف',
  'زیرهمکف',
  'پارکینگ ۱',
  'پارکینگ ۲',
] as const;

export const STAFF_ROLES = ['فروشنده', 'نصاب', 'باربر', 'پیمانکار', 'سایر'] as const;

export const MALL_RULES = [
  {
    title: 'ساعات کاری پاساژ',
    body: 'شنبه تا پنجشنبه ۱۰ تا ۲۲ و جمعه‌ها ۱۶ تا ۲۲. ورود پرسنل غرفه‌ها از ساعت ۹ مجاز است.',
  },
  {
    title: 'بارگیری و تخلیه',
    body: 'بارگیری فقط با نوبت ثبت‌شده و از درب‌های تعیین‌شده انجام می‌شود. ساعت ۱۲ تا ۱۴ و ۱۸ تا ۲۱ بارگیری از درب اسدنژاد ممنوع است.',
  },
  {
    title: 'پارکینگ',
    body: 'هر غرفه با اشتراک فعال می‌تواند خودروهای ثبت‌شده را در طبقه تعیین‌شده پارک کند. تمدید اشتراک در دفتر پارکینگ انجام می‌شود.',
  },
  {
    title: 'تبلیغات و تابلو',
    body: 'نصب هر نوع تابلو، بنر یا استند در مشاعات فقط با تایید واحد تبلیغات کاسپین مجاز است.',
  },
  {
    title: 'ایمنی و حراست',
    body: 'پرسنل موقت باید کارت تردد معتبر داشته باشند. مسیرهای اضطراری و جلوی شیرهای آتش‌نشانی همیشه باید باز بمانند.',
  },
  {
    title: 'دکوراسیون و تغییرات',
    body: 'هر تغییر در دکوراسیون غرفه نیازمند ارسال نقشه و تایید واحد فنی است. کارهای پرسروصدا فقط پیش از ساعت ۱۰ صبح.',
  },
] as const;

export const SUPPORT_CONTACTS = [
  { title: 'مدیریت پاساژ', phone: '02100000001', hours: 'شنبه تا پنجشنبه ۹ تا ۱۸' },
  { title: 'حراست (شبانه‌روزی)', phone: '02100000002', hours: '۲۴ ساعته' },
  { title: 'واحد فنی و تاسیسات', phone: '02100000003', hours: '۹ تا ۲۲' },
] as const;
