import {
  MessageCircle,
  CheckCircle2,
  UserCircle,
  Stethoscope,
  ArrowRight,
  Sparkles,
  Heart,
  CreditCard,
  Clock,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import TelegramDemo from '@/components/site/TelegramDemo'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import WaveDivider from '@/components/site/WaveDivider'
import FeatureShowcase from '@/components/landing/FeatureShowcase'
import TargetAudienceSection from '@/components/site/sections/TargetAudienceSection'
import FAQAccordion from '@/components/site/FAQAccordion'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-8 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute w-72 h-72 bg-pink-300 dark:bg-pink-500/20 top-10 -left-36 rounded-full blur-3xl opacity-40 animate-blob" />
        <div className="absolute w-64 h-64 bg-yellow-200 dark:bg-yellow-500/15 top-20 -right-16 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '-2s' }} />

        <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400 text-xs font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Платформа для спеціалістів</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3 dark:text-white">
                Більше клієнтів,
                <span className="gradient-text"> менше рутини</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground dark:text-gray-300 max-w-xl mb-5">
                Автоматизуйте записи через Telegram-бота та Google Calendar. Для косметологів, масажистів, стоматологів та інших спеціалістів.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/admin"
                  className="group inline-flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all hover:-translate-y-0.5"
                >
                  Спробувати безкоштовно
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-card dark:bg-white/10 border border-pink-200 dark:border-pink-500/30 text-foreground dark:text-white rounded-full text-sm font-medium hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-white/15 transition-all"
                >
                  Переглянути функції
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-pink-500/15 border border-pink-100 dark:border-pink-500/20">
                <Image
                  src="/screens/dashboard.png"
                  alt="Procedure CRM"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        <WaveDivider />
      </section>

      {/* Stats Section */}
      <section className="py-6 sm:py-8 bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '24/7', label: 'Онлайн запис', icon: Clock },
              { value: '2', label: 'Telegram боти', icon: MessageCircle },
              { value: '100%', label: 'Автоматизація', icon: Zap },
              { value: '500+', label: 'Спеціалістів', icon: Heart },
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

      {/* Telegram Bots Section */}
      <section id="bots" className="py-8 sm:py-10 relative overflow-hidden">
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

      {/* Feature Showcase - функціональні секції */}
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
      <section id="pricing" className="py-8 sm:py-10 relative overflow-hidden">
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
              14 днів безкоштовно для всіх нових користувачів
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
              <ul className="space-y-2">
                {['Всі функції платформи', 'Telegram боти', 'Google Calendar', 'Власний мініс-сайт', 'Підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Small */}
            <div className="relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-soft hover:shadow-lg transition-all">
              <h3 className="text-base sm:text-lg font-bold mb-1 dark:text-white">Компанія</h3>
              <p className="text-muted-foreground dark:text-gray-400 text-xs mb-3">3-9 спеціалістів</p>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold dark:text-white">450</span>
                <span className="text-muted-foreground dark:text-gray-400 text-sm"> грн/спеціаліст</span>
              </div>
              <ul className="space-y-2">
                {['Все з індивідуального', 'Декілька спеціалістів', 'Спільна база клієнтів', 'Аналітика по команді', 'Пріоритетна підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Large */}
            <div className="relative p-5 sm:p-6 rounded-2xl bg-card dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-soft hover:shadow-lg transition-all">
              <h3 className="text-base sm:text-lg font-bold mb-1 dark:text-white">Велика компанія</h3>
              <p className="text-muted-foreground dark:text-gray-400 text-xs mb-3">10+ спеціалістів</p>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold dark:text-white">400</span>
                <span className="text-muted-foreground dark:text-gray-400 text-sm"> грн/спеціаліст</span>
              </div>
              <ul className="space-y-2">
                {['Все з попередніх', 'Максимальна знижка', 'Індивідуальне налаштування', 'Виділений менеджер', 'SLA підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs sm:text-sm dark:text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQAccordion />

      {/* CTA Section */}
      <section id="demo" className="py-10 sm:py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600" />

        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-medium mb-4 backdrop-blur-sm">
            <Heart className="w-3.5 h-3.5" />
            <span>14 днів безкоштовно</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            Готові автоматизувати записи?
          </h2>
          <p className="text-sm sm:text-base text-white/80 mb-6 max-w-2xl mx-auto">
            Приєднуйтесь до спеціалістів, які вже економлять час на рутині
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="https://t.me/doctor_i_want_procedure_bot"
              className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-pink-600 rounded-full text-sm font-medium hover:shadow-xl hover:shadow-white/30 transition-all hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4" />
              Написати в Telegram
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 text-white border border-white/30 rounded-full text-sm font-medium hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Увійти в кабінет
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
