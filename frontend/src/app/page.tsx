import {
  MessageCircle,
  CheckCircle2,
  UserCircle,
  Stethoscope,

  Sparkles,
  Heart,
  CreditCard,
  Clock,
  Zap,
  X,
  Star,
  Shield,
  CalendarCheck
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import TelegramDemo from '@/components/site/TelegramDemo'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import FeatureShowcase from '@/components/landing/FeatureShowcase'
import TargetAudienceSection from '@/components/site/sections/TargetAudienceSection'
import FAQAccordion from '@/components/site/FAQAccordion'
import { HeroCTA, BottomCTA } from '@/components/site/AuthAwareCTA'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden">
        {/* Background: light = soft gradient, dark = deep purple */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50/50 to-white dark:from-[#0f0524] dark:via-[#1a0a2e] dark:to-[#0d001a]" />
        <div className="absolute inset-0 hero-mesh-gradient" />

        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-white/10 backdrop-blur-sm border border-pink-200 dark:border-white/10 text-pink-600 dark:text-pink-300 text-xs font-medium mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CRM для спеціалістів краси та здоров&apos;я</span>
              </div>

              {/* Main headline — problem-oriented */}
              <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] lg:leading-[1.15] font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
                Клієнти пишуть —{' '}
                <span className="gradient-text dark:hero-gradient-text">ви втрачаєте їх</span>
                <br className="hidden sm:block" />
                <span className="text-gray-700 dark:text-white/90"> поки відповідаєте вручну</span>
              </h1>

              {/* Subheadline — solution */}
              <p className="text-base sm:text-lg text-gray-500 dark:text-white/60 max-w-xl mb-6 leading-relaxed">
                Telegram-бот відповідає <span className="text-gray-800 dark:text-white/90 font-medium">за 2 секунди</span>, записує клієнтів у ваш календар і нагадує про візит. Ви отримуєте готові записи — без дзвінків і переписок.
              </p>

              {/* CTA Buttons */}
              <HeroCTA />

              {/* Confidence boosters */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center lg:justify-start text-xs text-gray-400 dark:text-white/40">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500/60 dark:text-green-400/60" /> 14 днів безкоштовно</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500/60 dark:text-green-400/60" /> Без картки</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500/60 dark:text-green-400/60" /> Налаштування за 15 хв</span>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              {/* Glow behind image */}
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 dark:from-pink-500/20 dark:to-purple-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-pink-500/10 border border-pink-100 dark:border-white/10">
                <Image
                  src="/screens/dashboard.png"
                  alt="Beautica CRM — панель управління"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* Feature badge */}
              <div className="absolute -bottom-3 -left-3 sm:left-4 px-4 py-2 bg-white/80 dark:bg-white/10 backdrop-blur-md border border-pink-100 dark:border-white/15 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-green-500 dark:text-green-400" />
                  <span className="text-xs text-gray-600 dark:text-white/80 font-medium">Працює 24/7, навіть коли ви спите</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="py-6 sm:py-8 bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '24/7', label: 'Бот приймає записи', icon: Clock },
              { value: '2 сек', label: 'Час відповіді бота', icon: Zap },
              { value: '0', label: 'Втрачених клієнтів', icon: Shield },
              { value: '15 хв', label: 'На налаштування', icon: CalendarCheck },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold gradient-text mb-0.5">{stat.value}</div>
                <div className="text-muted-foreground dark:text-gray-400 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After Section */}
      <section className="py-10 sm:py-14 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-100 to-green-100 dark:from-red-500/15 dark:to-green-500/15 text-red-600 dark:text-red-400 text-xs font-medium mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Порівняйте</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 dark:text-white">
              Без автоматизації vs <span className="gradient-text">з Beautica</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* WITHOUT — the problem */}
            <div className="relative p-6 rounded-2xl bg-red-50/50 dark:bg-red-500/5 border border-red-200/50 dark:border-red-500/15">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-bold text-red-600 dark:text-red-400">Без автоматизації</h3>
              </div>

              <div className="space-y-3 mb-5">
                {/* Incoming message at night */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center text-[10px]">К</div>
                  <div>
                    <div className="bg-white dark:bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-xs">
                      Доброго вечора! Хочу записатися на чистку обличчя 🙏
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">23:47</div>
                  </div>
                </div>

                {/* Long wait */}
                <div className="flex items-center justify-center gap-2 py-3">
                  <Clock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span className="text-xs text-red-500 font-medium">Ви спите... відповідь через 9 год</span>
                </div>

                {/* Another client */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center text-[10px]">М</div>
                  <div>
                    <div className="bg-white dark:bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-xs">
                      Привіт, скажіть ціну на мезотерапію?
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">00:15</div>
                  </div>
                </div>

                {/* Morning — chaos */}
                <div className="flex gap-2 justify-end">
                  <div>
                    <div className="bg-pink-100 dark:bg-pink-500/20 rounded-xl rounded-tr-sm px-3 py-2 text-xs">
                      Доброго ранку! Вибачте... <br/>Є четвер 14:00, підходить?
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 text-right">09:00</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center text-[10px]">К</div>
                  <div>
                    <div className="bg-white dark:bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-muted-foreground italic">
                      Дякую, вже записалась в інше місце
                    </div>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-100/50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/10">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">2 клієнти втрачені за одну ніч</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-red-100/30 dark:bg-red-500/5">
                    <div className="text-lg font-bold text-red-500">9 год</div>
                    <div className="text-[10px] text-muted-foreground">час відповіді</div>
                  </div>
                  <div className="p-2 rounded-lg bg-red-100/30 dark:bg-red-500/5">
                    <div className="text-lg font-bold text-red-500">0 ₴</div>
                    <div className="text-[10px] text-muted-foreground">заробіток</div>
                  </div>
                </div>
              </div>
            </div>

            {/* WITH — the solution */}
            <div className="relative p-6 rounded-2xl bg-green-50/50 dark:bg-green-500/5 border border-green-200/50 dark:border-green-500/15">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="font-bold text-green-600 dark:text-green-400">З Beautica</h3>
              </div>

              {/* Bot button-based flow */}
              <div className="space-y-3 mb-5">
                {/* Client opens bot */}
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex-shrink-0 flex items-center justify-center">
                    <MessageCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white dark:bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-xs">
                      Привіт! Оберіть дію:
                    </div>
                    {/* Bot buttons */}
                    <div className="mt-1.5 space-y-1 max-w-[220px]">
                      <div className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-[11px] font-medium text-center">📅 Записатись на процедуру</div>
                      <div className="px-3 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 rounded-lg text-[11px] text-center">📋 Мої записи</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">23:47</div>
                  </div>
                </div>

                {/* Service selection */}
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex-shrink-0 flex items-center justify-center">
                    <MessageCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white dark:bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-xs">
                      Оберіть послугу:
                    </div>
                    <div className="mt-1.5 space-y-1 max-w-[220px]">
                      <div className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-[11px] font-medium text-center">💆 Чистка — 800 грн</div>
                      <div className="px-3 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 rounded-lg text-[11px] text-center">💉 Мезотерапія — 1500 грн</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">23:47</div>
                  </div>
                </div>

                {/* Date + time in one compact block */}
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex-shrink-0 flex items-center justify-center">
                    <MessageCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white dark:bg-white/10 rounded-xl rounded-tl-sm px-3 py-2 text-xs">
                      ✅ Чистка обличчя<br/>Оберіть дату:
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-1 max-w-[220px]">
                      <div className="px-2 py-1.5 bg-pink-500 text-white rounded-lg text-[10px] font-medium text-center">Чт, 6</div>
                      <div className="px-2 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 rounded-lg text-[10px] text-center">Пт, 7</div>
                      <div className="px-2 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 rounded-lg text-[10px] text-center">Сб, 8</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">23:48</div>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-100/50 dark:bg-green-500/10 border border-green-200/50 dark:border-green-500/10">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Запис створено за 30 секунд. Ви спите — бот працює.</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-green-100/30 dark:bg-green-500/5">
                    <div className="text-lg font-bold text-green-500">30 сек</div>
                    <div className="text-[10px] text-muted-foreground">час запису</div>
                  </div>
                  <div className="p-2 rounded-lg bg-green-100/30 dark:bg-green-500/5">
                    <div className="text-lg font-bold text-green-500">800 ₴</div>
                    <div className="text-[10px] text-muted-foreground">заробіток</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Telegram Bots Section */}
      <section id="bots" className="py-8 sm:py-10 bg-secondary relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-100 to-yellow-100 dark:from-pink-500/15 dark:to-yellow-500/15 text-pink-600 dark:text-pink-400 text-xs font-medium mb-3">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Telegram інтеграція</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 dark:text-white">
              Два боти — <span className="gradient-text">повна автоматизація</span>
            </h2>
            <p className="text-muted-foreground dark:text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
              Клієнти записуються через бота, ви керуєте записами прямо з телефону
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Client Bot */}
            <div className="group relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border border-pink-100 dark:border-pink-500/20 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-md shadow-pink-500/20 group-hover:scale-110 transition-transform">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 dark:text-white">Бот для клієнтів</h3>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 mb-4">
                  Клієнти записуються без дзвінків — через Telegram у будь-який час доби
                </p>
                <ul className="space-y-2">
                  {[
                    'Каталог послуг з цінами',
                    'Вибір зручної дати та часу',
                    'Перегляд історії записів',
                    'Запис до кількох спеціалістів',
                    'Підтримка UK, RU, EN'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Doctor Bot */}
            <div className="group relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border border-yellow-100 dark:border-yellow-500/20 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-4 shadow-md shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 dark:text-white">Бот для спеціаліста</h3>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 mb-4">
                  Миттєві сповіщення та управління записами прямо з телефону
                </p>
                <ul className="space-y-2">
                  {[
                    'Push-сповіщення про записи',
                    'Підтвердження одним кліком',
                    'Синхронізація з Google Calendar',
                    'Записи на сьогодні та майбутні',
                    'Надсилання реквізитів клієнту'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Telegram Demo */}
          <div className="mt-8 sm:mt-10">
            <TelegramDemo />
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* How It Works */}
      <section className="py-8 sm:py-10 bg-secondary relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 dark:text-white">
              Як <span className="gradient-text">почати?</span>
            </h2>
            <p className="text-muted-foreground dark:text-gray-300 text-sm">4 прості кроки до автоматизації</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Реєстрація', desc: 'Створіть акаунт за 2 хвилини' },
              { num: '2', title: 'Налаштування', desc: 'Додайте послуги та розклад' },
              { num: '3', title: 'Підключення', desc: 'Отримайте посилання на бота' },
              { num: '4', title: 'Готово!', desc: 'Клієнти записуються самі' },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="relative mb-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                    {step.num}
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-pink-300 to-transparent -translate-y-1/2" />
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1 dark:text-white">{step.title}</h3>
                <p className="text-muted-foreground dark:text-gray-400 text-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <TargetAudienceSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-10 sm:py-14 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-500/15 dark:to-pink-500/15 text-purple-600 dark:text-purple-400 text-xs font-medium mb-3">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Тарифи</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 dark:text-white">
              Прозора <span className="gradient-text">ціна</span>
            </h2>
            <p className="text-muted-foreground dark:text-gray-300 text-sm max-w-2xl mx-auto">
              14 днів безкоштовно. Без кредитної картки. Скасувати будь-коли.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
            {/* Individual */}
            <div className="relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border-2 border-pink-200 dark:border-pink-500/30 shadow-soft hover:shadow-lg transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium rounded-full">
                Популярний
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 dark:text-white">Індивідуальний</h3>
              <p className="text-muted-foreground dark:text-gray-400 text-xs mb-3">Для приватних спеціалістів</p>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold dark:text-white">500</span>
                <span className="text-muted-foreground dark:text-gray-400 text-sm"> грн/міс</span>
              </div>
              <ul className="space-y-2 mb-5">
                {['Всі функції платформи', 'Telegram боти', 'Google Calendar', 'Власний мініс-сайт', 'Підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/admin"
                className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/25 transition-all"
              >
                Спробувати 14 днів безкоштовно
              </Link>
            </div>

            {/* Company Small */}
            <div className="relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-soft hover:shadow-lg transition-all">
              <h3 className="text-base sm:text-lg font-bold mb-1 dark:text-white">Компанія</h3>
              <p className="text-muted-foreground dark:text-gray-400 text-xs mb-3">3-9 спеціалістів</p>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold dark:text-white">450</span>
                <span className="text-muted-foreground dark:text-gray-400 text-sm"> грн/спеціаліст</span>
              </div>
              <ul className="space-y-2 mb-5">
                {['Все з індивідуального', 'Декілька спеціалістів', 'Спільна база клієнтів', 'Аналітика по команді', 'Пріоритетна підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/admin"
                className="block w-full text-center px-4 py-2.5 border-2 border-pink-200 dark:border-pink-500/30 text-pink-600 dark:text-pink-400 rounded-xl text-sm font-semibold hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-all"
              >
                Почати безкоштовно
              </Link>
            </div>

            {/* Company Large */}
            <div className="relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-soft hover:shadow-lg transition-all">
              <h3 className="text-base sm:text-lg font-bold mb-1 dark:text-white">Велика компанія</h3>
              <p className="text-muted-foreground dark:text-gray-400 text-xs mb-3">10+ спеціалістів</p>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold dark:text-white">400</span>
                <span className="text-muted-foreground dark:text-gray-400 text-sm"> грн/спеціаліст</span>
              </div>
              <ul className="space-y-2 mb-5">
                {['Все з попередніх', 'Максимальна знижка', 'Індивідуальне налаштування', 'Виділений менеджер', 'SLA підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/admin"
                className="block w-full text-center px-4 py-2.5 border-2 border-gray-200 dark:border-white/15 text-foreground dark:text-white rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                Зв&apos;язатися з нами
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 sm:py-14 bg-secondary relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-pink-100 dark:from-yellow-500/15 dark:to-pink-500/15 text-yellow-600 dark:text-yellow-400 text-xs font-medium mb-3">
              <Star className="w-3.5 h-3.5" />
              <span>Відгуки</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold dark:text-white">
              Що кажуть <span className="gradient-text">спеціалісти</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                name: 'Олена К.',
                role: 'Косметолог, Київ',
                text: 'Раніше витрачала 2 години на день на переписки з клієнтами. Тепер бот робить все сам — я просто бачу готовий розклад вранці. За перший місяць записів стало на 30% більше.',
                stars: 5
              },
              {
                name: 'Марина Д.',
                role: 'Масажний салон, Харків',
                text: 'Підключила 4 спеціалістів. Клієнти обирають майстра та час самі, без дзвінків адміністратору. Google Calendar синхронізується ідеально. Рекомендую!',
                stars: 5
              },
              {
                name: 'Андрій В.',
                role: 'Стоматологія, Львів',
                text: 'Налаштував за один вечір. Бот відповідає клієнтам навіть вночі та у вихідні. Ми перестали втрачати запити — ROI окупився за перший тиждень.',
                stars: 5
              }
            ].map((review, i) => (
              <div key={i} className="p-5 rounded-2xl bg-card dark:bg-white/5 border border-pink-100 dark:border-pink-500/15 shadow-soft">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                {/* Text */}
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300 mb-4 leading-relaxed">
                  &ldquo;{review.text}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold dark:text-white">{review.name}</div>
                    <div className="text-xs text-muted-foreground dark:text-gray-400">{review.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQAccordion />

      {/* CTA Section */}
      <section id="demo" className="py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600" />

        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-medium mb-5 backdrop-blur-sm">
            <Heart className="w-3.5 h-3.5" />
            <span>Перестаньте втрачати клієнтів</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            Ваш перший запис через бота <br className="hidden sm:block" />
            може прийти сьогодні ввечері
          </h2>
          <p className="text-sm sm:text-base text-white/80 mb-7 max-w-2xl mx-auto">
            14 днів безкоштовно. Без кредитної картки. Скасувати будь-коли.<br/>
            Налаштування займає 15 хвилин.
          </p>
          <BottomCTA />
          {/* Confidence line */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center text-xs text-white/35">
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
