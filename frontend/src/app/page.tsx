import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  CreditCard,
  Globe,
  Heart,
  Package,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import FAQAccordion from '@/components/site/FAQAccordion'
import { HeroCTA, BottomCTA } from '@/components/site/AuthAwareCTA'
import IPhoneMockup from '@/components/landing/IPhoneMockup'

/* ── Bot config ────────────────────────────────────────── */

const clientBotName = process.env.NEXT_PUBLIC_CLIENT_BOT_NAME || 'i_want_procedure_bot'
const doctorBotName = process.env.NEXT_PUBLIC_DOCTOR_BOT_NAME || 'doctor_i_want_procedure_bot'

/* ── Telegram bot messages ─────────────────────────────── */

const clientBotMessages = [
  {
    id: 1,
    from: 'bot' as const,
    text: 'Вітаю! Оберіть дію:',
    buttons: [
      { text: '📅 Записатись на процедуру', highlighted: true },
      { text: '📋 Мої записи' },
    ],
    time: '23:47',
  },
  { id: 2, from: 'user' as const, text: '📅 Записатись на процедуру', time: '23:47' },
  {
    id: 3,
    from: 'bot' as const,
    text: 'Оберіть послугу:',
    buttons: [
      { text: '💆 Чистка обличчя — 800 грн', highlighted: true },
      { text: '💉 Мезотерапія — 1500 грн' },
      { text: '✨ Біоревіталізація — 4000 грн' },
    ],
    time: '23:47',
  },
  { id: 4, from: 'user' as const, text: '💆 Чистка обличчя — 800 грн', time: '23:47' },
  {
    id: 5,
    from: 'bot' as const,
    text: 'Оберіть дату:',
    buttons: [
      { text: '📅 Чт, 10 квітня' },
      { text: '📅 Пт, 11 квітня', highlighted: true },
      { text: '📅 Сб, 12 квітня' },
    ],
    time: '23:48',
  },
  { id: 6, from: 'user' as const, text: '📅 Пт, 11 квітня', time: '23:48' },
  {
    id: 7,
    from: 'bot' as const,
    text: 'Оберіть час:',
    buttons: [
      { text: '10:00' },
      { text: '11:30', highlighted: true },
      { text: '14:00' },
      { text: '16:00' },
    ],
    time: '23:48',
  },
  {
    id: 8,
    from: 'bot' as const,
    text: '✅ Запис створено!\n\n💆 Чистка обличчя\n📅 11.04 о 11:30\n💰 800 грн\n\nОчікуйте підтвердження від спеціаліста.',
    time: '23:48',
  },
]

const doctorBotMessages = [
  {
    id: 1,
    from: 'bot' as const,
    text: '🆕 Новий запис!\n\n👤 Олена Петренко\n💆 Чистка обличчя\n📅 11.04 о 11:30\n💰 800 грн\n📞 +380 67 123 45 67',
    buttons: [
      { text: '✅ Підтвердити', highlighted: true },
      { text: '❌ Скасувати' },
    ],
    time: '23:49',
  },
  { id: 2, from: 'user' as const, text: '✅ Підтвердити', time: '23:49' },
  {
    id: 3,
    from: 'bot' as const,
    text: 'Запис підтверджено ✅\nКлієнт отримає сповіщення.',
    time: '23:49',
  },
  { id: 4, from: 'user' as const, text: '📅 Записи на сьогодні', time: '08:30' },
  {
    id: 5,
    from: 'bot' as const,
    text: '📋 Записи на сьогодні (3):\n\n10:00 — Марія І.\n💆 Мезотерапія · 1500 грн\n\n11:30 — Олена П.\n💆 Чистка обличчя · 800 грн\n\n14:00 — Катерина Л.\n💆 Біоревіталізація · 4000 грн\n\n💰 Всього: 6 300 грн',
    time: '08:30',
  },
]

/* ── Persona data ──────────────────────────────────────── */

const personas = [
  {
    key: 'solo',
    title: 'Приватний косметолог',
    emoji: '💆‍♀️',
    gradient: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50 dark:bg-pink-500/5',
    borderLight: 'border-pink-100 dark:border-pink-500/15',
    features: [
      { emoji: '🤖', text: 'Бот записує клієнтів 24/7 — навіть коли ви спите' },
      { emoji: '📋', text: 'Каталог послуг з цінами — клієнт бачить все сам у Telegram' },
      { emoji: '📅', text: 'Один календар: Telegram-записи + Google Calendar' },
      { emoji: '👤', text: 'Картка клієнта з історією всіх візитів і протоколами' },
    ],
  },
  {
    key: 'master',
    title: 'Майстер у салоні',
    emoji: '💇‍♀️',
    gradient: 'from-purple-500 to-violet-500',
    bgLight: 'bg-purple-50 dark:bg-purple-500/5',
    borderLight: 'border-purple-100 dark:border-purple-500/15',
    features: [
      { emoji: '🔔', text: 'Повідомлення в Telegram одразу після бронювання' },
      { emoji: '📅', text: 'Власний розклад завжди під рукою + Google Calendar' },
      { emoji: '💰', text: 'Аналітика доходів і прибутку в реальному часі' },
      { emoji: '📝', text: 'Протоколи процедур — не треба згадувати, що робили' },
    ],
  },
  {
    key: 'owner',
    title: 'Власник салону',
    emoji: '🏢',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50 dark:bg-amber-500/5',
    borderLight: 'border-amber-100 dark:border-amber-500/15',
    features: [
      { emoji: '📊', text: 'Дашборд з записами всіх майстрів і завантаженістю' },
      { emoji: '🤖', text: 'Telegram-бот замінює ресепшен — працює без вихідних' },
      { emoji: '💰', text: 'Фінансова аналітика: дохід, матеріали, маржинальність' },
      { emoji: '👥', text: 'Управління командою: посади, розклади, доступи' },
    ],
  },
]

/* ── Inline SVGs ───────────────────────────────────────── */

function TelegramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function GoogleCalendarIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" fill="#fff" stroke="#4285F4" strokeWidth="1.5" />
      <rect x="3" y="4" width="18" height="5" rx="2" fill="#4285F4" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8.5" cy="13" r="1.2" fill="#34A853" />
      <circle cx="12" cy="13" r="1.2" fill="#FBBC05" />
      <circle cx="15.5" cy="13" r="1.2" fill="#EA4335" />
      <circle cx="8.5" cy="17" r="1.2" fill="#4285F4" />
      <circle cx="12" cy="17" r="1.2" fill="#34A853" />
      <circle cx="15.5" cy="17" r="1.2" fill="#FBBC05" />
    </svg>
  )
}

function MiniTrendChart() {
  return (
    <svg viewBox="0 0 120 40" className="w-full h-10" fill="none">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 35 L15 28 L30 30 L45 22 L60 18 L75 20 L90 12 L105 8 L120 5" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M0 35 L15 28 L30 30 L45 22 L60 18 L75 20 L90 12 L105 8 L120 5 L120 40 L0 40Z" fill="url(#trendGrad)" />
    </svg>
  )
}

function StockLevelBars() {
  return (
    <div className="flex items-end gap-0.5 h-6">
      {[85, 60, 35, 90, 45].map((h, i) => (
        <div key={i} className="w-2 rounded-t-sm" style={{
          height: `${h}%`,
          backgroundColor: h < 40 ? '#ef4444' : h < 60 ? '#f59e0b' : '#22c55e',
        }} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════ */

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Header />

      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-24 sm:pt-28 pb-10 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50/50 to-white dark:from-[#0f0524] dark:via-[#1a0a2e] dark:to-[#0d001a]" />
        <div className="absolute inset-0 hero-mesh-gradient" />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-white/10 backdrop-blur-sm border border-pink-200 dark:border-white/10 text-pink-600 dark:text-pink-300 text-xs font-medium mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Telegram-бот + CRM для спеціалістів краси</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
              Ваш бот записує клієнтів{' '}
              <span className="gradient-text dark:hero-gradient-text">поки ви відпочиваєте</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-500 dark:text-white/60 max-w-2xl mx-auto mb-6 leading-relaxed">
              Telegram-бот для запису + CRM для управління.{' '}
              <span className="text-gray-800 dark:text-white/90 font-medium">Без програмування. 15 хвилин на налаштування.</span>
            </p>

            <HeroCTA />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center text-xs text-gray-400 dark:text-white/40">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500/60" /> 14 днів безкоштовно</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500/60" /> Без картки</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500/60" /> Налаштування за 15 хв</span>
            </div>
          </div>

          {/* Two iPhones */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400 text-xs font-semibold">
                  <Smartphone className="w-3.5 h-3.5" />
                  Що бачить клієнт
                </div>
              </div>
              <IPhoneMockup botName="Beautica Bot" messages={clientBotMessages} />
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Спробуйте самі — відкрийте бота</p>
                <Link
                  href={`https://t.me/${clientBotName}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2AABEE]/10 text-[#2AABEE] text-xs font-medium hover:bg-[#2AABEE]/20 transition-colors"
                >
                  <TelegramIcon />
                  @{clientBotName}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <Smartphone className="w-3.5 h-3.5" />
                  Що бачить спеціаліст
                </div>
              </div>
              <IPhoneMockup botName="Doctor Beautica" messages={doctorBotMessages} />
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Підтвердження одним кліком</p>
                <Link
                  href={`https://t.me/${doctorBotName}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2AABEE]/10 text-[#2AABEE] text-xs font-medium hover:bg-[#2AABEE]/20 transition-colors"
                >
                  <TelegramIcon />
                  @{doctorBotName}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ═══════ PERSONA SCREENS ═══════ */}
      {personas.map((persona, idx) => (
        <section
          key={persona.key}
          className={`py-16 sm:py-24 ${idx % 2 === 0 ? 'bg-secondary' : 'bg-background'}`}
        >
          <div className="max-w-5xl mx-auto px-4">
            <div className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${idx % 2 !== 0 ? 'md:[direction:rtl] md:[&>*]:direction-ltr' : ''}`}>
              {/* Visual side */}
              <div className="flex justify-center">
                <div className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center shadow-2xl`}>
                  <span className="text-[7rem] sm:text-[9rem] select-none drop-shadow-lg">{persona.emoji}</span>
                  {/* Floating feature badges */}
                  <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 shadow-lg text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-white/10">
                    {persona.features[0].emoji} 24/7
                  </div>
                  <div className="absolute -bottom-3 -left-3 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 shadow-lg text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-white/10">
                    {persona.features[2].emoji} Google Calendar
                  </div>
                </div>
              </div>

              {/* Text side */}
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 dark:text-white">
                  {persona.title}
                </h2>
                <div className="space-y-4">
                  {persona.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm text-xl">
                        {f.emoji}
                      </div>
                      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed pt-2">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ═══════ CRM FEATURES: infographic cards ═══════ */}
      <section id="features" className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-500/15 dark:to-purple-500/15 text-pink-600 dark:text-pink-400 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Один інтерфейс — повний контроль</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 dark:text-white">
              Не просто бот — <span className="gradient-text">повна CRM-система</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Замініть блокнот, Excel, Google Sheets та 5 різних додатків — одним
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">

            {/* Calendar + Google Calendar — full width */}
            <div className="sm:col-span-2 p-8 rounded-3xl bg-card dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-soft hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                      <GoogleCalendarIcon className="w-5 h-5" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Sync</span>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 dark:text-white">Розумний календар</h3>
                  <p className="text-base text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                    Записи автоматично з&apos;являються у <strong className="text-gray-700 dark:text-gray-200">Google Calendar</strong>. Один календар для бота і для особистих справ. Перегляд по дню, тижню або місяцю.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium">День / Тиждень / Місяць</span>
                    <span className="px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">Вихідні та винятки</span>
                    <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">Google Calendar</span>
                  </div>
                </div>
                {/* Mini calendar visual */}
                <div className="hidden md:flex flex-col items-center justify-center w-52">
                  <div className="w-full rounded-2xl bg-gradient-to-b from-orange-50 to-white dark:from-orange-500/10 dark:to-transparent border border-orange-100 dark:border-orange-500/20 p-4">
                    <div className="text-sm font-bold text-orange-600 dark:text-orange-400 text-center mb-3">Квітень 2026</div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map((d, i) => (
                        <span key={i} className="text-[10px] text-gray-400 font-medium">{d}</span>
                      ))}
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                        <span key={d} className={`text-[10px] rounded py-0.5 ${
                          [10, 11, 14, 15, 17].includes(d)
                            ? 'bg-pink-200 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300 font-bold'
                            : d === 12 ? 'bg-blue-200 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CRM */}
            <div className="p-8 rounded-3xl bg-card dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-soft hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 dark:text-white">CRM клієнтів</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                Повна історія кожного клієнта: процедури, протоколи, контакти. Наступний запис — в один клік.
              </p>
              <div className="rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">ОП</div>
                  <div>
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Олена Петренко</div>
                    <div className="text-xs text-gray-400">12 візитів</div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600 dark:text-green-400 font-medium">Остання: 05.04</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Наступна: 11.04</span>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="p-8 rounded-3xl bg-card dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-soft hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
                <Package className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 dark:text-white">Склад та матеріали</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                Автоматичне списання при кожній процедурі. Ви завжди знаєте, коли замовляти.
              </p>
              <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Рівень запасів</span>
                  <StockLevelBars />
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Достатньо</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Мало</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Замовити</span>
                </div>
              </div>
            </div>

            {/* Analytics — full width */}
            <div className="sm:col-span-2 p-8 rounded-3xl bg-card dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-soft hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 dark:text-white">Фінанси та аналітика</h3>
                  <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                    Дохід, витрати на матеріали, прибуток — по кожній послузі та майстру. Фіксовані витрати, середній чек і топ послуг за доходом.
                  </p>
                </div>
                <div className="w-full md:w-72 flex-shrink-0">
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Дохід за місяць</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">+23%</span>
                    </div>
                    <MiniTrendChart />
                  </div>
                </div>
              </div>
            </div>

            {/* Website & Marketplace */}
            <div className="sm:col-span-2 p-8 rounded-3xl bg-card dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-soft hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">Сайт та маркетплейс</h3>
                  <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                    Персональна сторінка з послугами та кнопкою запису. Клієнти знаходять вас у каталозі Beautica.
                  </p>
                </div>
                <Link href="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors flex-shrink-0">
                  Переглянути маркетплейс
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ REAL SCREENS ═══════ */}
      <section className="py-14 sm:py-20 bg-secondary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 dark:text-white">
              Як виглядає <span className="gradient-text">адмінка</span> зсередини
            </h2>
          </div>

          <div className="space-y-14 sm:space-y-24">
            {[
              { src: '/screens/dashboard.png', label: 'Дашборд', emoji: '📊', desc: 'Записи, виручка і клієнти — все на одному екрані' },
              { src: '/screens/schedule-calendar.png', label: 'Календар', emoji: '📅', desc: 'Графік роботи, записи, винятки і синхронізація з Google Calendar' },
              { src: '/screens/clients-list.png', label: 'Клієнти', emoji: '👥', desc: 'Історія візитів, контакти і наступний запис' },
              { src: '/screens/client-card.png', label: 'Картка клієнта', emoji: '👤', desc: 'Повна інформація по кожному клієнту' },
              { src: '/screens/services-list.png', label: 'Послуги', emoji: '💆', desc: 'Каталог з цінами, категоріями і тривалістю' },
              { src: '/screens/inventory-warehouse.png', label: 'Склад', emoji: '📦', desc: 'Матеріали, партії, залишки і списання' },
              { src: '/screens/protocol-details.png', label: 'Протоколи', emoji: '📝', desc: 'Документація процедури крок за кроком' },
              { src: '/screens/team-management.png', label: 'Команда', emoji: '🤝', desc: 'Спеціалісти, посади і розклади' },
              { src: '/screens/links-generation.png', label: 'Посилання', emoji: '🔗', desc: 'Deep links для клієнтів, команди і послуг' },
            ].map((screen) => (
              <div key={screen.src}>
                {/* Title: centered, emoji inline with label */}
                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold dark:text-white inline-flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-4xl">{screen.emoji}</span>
                    {screen.label}
                  </h3>
                </div>

                {/* Screenshot */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-200 via-purple-200 to-pink-200 dark:from-pink-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-[20px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden group-hover:shadow-[0_20px_60px_rgba(236,72,153,0.15)] transition-shadow duration-500">
                    <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                      <Image
                        src={screen.src}
                        alt={screen.label}
                        fill
                        sizes="(min-width: 1024px) 64rem, 100vw"
                        className="object-cover object-left-top group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Description below, centered */}
                <p className="mt-3 sm:mt-4 text-center text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto">{screen.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-500/15 dark:to-pink-500/15 text-purple-600 dark:text-purple-400 text-xs font-medium mb-3">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Тарифи</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 dark:text-white">
              Прозора <span className="gradient-text">ціна</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              14 днів безкоштовно. Без кредитної картки. Скасувати будь-коли.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
            <div className="relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border-2 border-pink-200 dark:border-pink-500/30 shadow-soft hover:shadow-lg transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium rounded-full">
                Популярний
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 dark:text-white">Індивідуальний</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">Для приватних спеціалістів</p>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold dark:text-white">500</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm"> грн/міс</span>
              </div>
              <ul className="space-y-2 mb-5">
                {['Telegram-боти (клієнт + спеціаліст)', 'Google Calendar синхронізація', 'CRM клієнтів', 'Каталог послуг', 'Склад та облік', 'Протоколи процедур', 'Фінансова аналітика', 'Власна сторінка в каталозі'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/admin" className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all">
                Спробувати 14 днів безкоштовно
              </Link>
            </div>

            <div className="relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-soft hover:shadow-lg transition-all">
              <h3 className="text-base sm:text-lg font-bold mb-1 dark:text-white">Компанія</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">3-9 спеціалістів</p>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold dark:text-white">450</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm"> грн/спеціаліст</span>
              </div>
              <ul className="space-y-2 mb-5">
                {['Все з індивідуального', 'Декілька спеціалістів', 'Спільна база клієнтів', 'Аналітика по команді', 'Пріоритетна підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/admin" className="block w-full text-center px-4 py-2.5 border-2 border-pink-200 dark:border-pink-500/30 text-pink-600 dark:text-pink-400 rounded-xl text-sm font-semibold hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-all">
                Почати безкоштовно
              </Link>
            </div>

            <div className="relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-soft hover:shadow-lg transition-all">
              <h3 className="text-base sm:text-lg font-bold mb-1 dark:text-white">Велика компанія</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">10+ спеціалістів</p>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold dark:text-white">400</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm"> грн/спеціаліст</span>
              </div>
              <ul className="space-y-2 mb-5">
                {['Все з попередніх', 'Максимальна знижка', 'Індивідуальне налаштування', 'Виділений менеджер', 'SLA підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/admin" className="block w-full text-center px-4 py-2.5 border-2 border-gray-200 dark:border-white/15 text-foreground dark:text-white rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                Зв&apos;язатися з нами
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <FAQAccordion />

      {/* ═══════ BOTTOM CTA ═══════ */}
      <section id="demo" className="py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-medium mb-5 backdrop-blur-sm">
            <Heart className="w-3.5 h-3.5" />
            <span>Перший запис може прийти сьогодні</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            Спробуйте — це безкоштовно <br className="hidden sm:block" />
            перші 14 днів
          </h2>
          <p className="text-sm sm:text-base text-white/80 mb-7 max-w-2xl mx-auto">
            Без кредитної картки. Скасувати будь-коли.<br />
            Налаштування займає 15 хвилин.
          </p>
          <BottomCTA />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center text-xs text-white/35 mt-4">
            <span>Налаштування за 15 хвилин</span>
            <span>·</span>
            <span>Працює 24/7</span>
            <span>·</span>
            <span>Підтримка в Telegram</span>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
