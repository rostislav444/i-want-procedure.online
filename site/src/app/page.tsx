import {
  Calendar,
  Users,
  Clock,
  MessageCircle,
  Bell,
  CheckCircle2,
  UserCircle,
  Stethoscope,
  ArrowRight,
  Sparkles,
  Heart,
  Star,
  Zap,
  Globe,
  CreditCard,
  CalendarCheck,
  Palette
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ScreenshotGallery from '@/components/ScreenshotGallery'
import TelegramDemo from '@/components/TelegramDemo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WaveDivider from '@/components/WaveDivider'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute w-96 h-96 bg-pink-300 top-20 -left-48 rounded-full blur-3xl opacity-50 animate-blob" />
        <div className="absolute w-80 h-80 bg-yellow-200 top-40 -right-20 rounded-full blur-3xl opacity-50 animate-blob" style={{ animationDelay: '-2s' }} />
        <div className="absolute w-72 h-72 bg-purple-200 bottom-40 left-1/4 rounded-full blur-3xl opacity-40 animate-blob" style={{ animationDelay: '-4s' }} />

        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-6 animate-float">
                <Sparkles className="w-4 h-4" />
                <span>Платформа для спеціалістів</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Більше клієнтів,
                <span className="gradient-text"> менше рутини</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl mb-8">
                Автоматизуйте записи через Telegram-бота та Google Calendar. Для косметологів, масажистів, стоматологів, репетиторів та інших спеціалістів.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/admin"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:shadow-xl hover:shadow-pink-500/30 transition-all hover:-translate-y-1"
                >
                  Спробувати безкоштовно
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#screenshots"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-card border-2 border-pink-200 dark:border-pink-800 text-foreground rounded-full font-medium hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-all"
                >
                  Переглянути демо
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-pink-500/20 border border-pink-100 animate-float" style={{ animationDuration: '4s' }}>
                <Image
                  src="/screens/main.png"
                  alt="Procedure CRM"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 px-4 py-2 bg-card rounded-2xl shadow-lg border border-pink-100 dark:border-pink-900/30 animate-float" style={{ animationDelay: '-1s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="font-medium text-sm">Новий запис!</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 px-4 py-2 bg-card rounded-2xl shadow-lg border border-pink-100 dark:border-pink-900/30 animate-float" style={{ animationDelay: '-2s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                  <span className="font-medium text-sm">+45 послуг</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <WaveDivider />
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '24/7', label: 'Онлайн запис', icon: Clock },
              { value: '2', label: 'Telegram боти', icon: MessageCircle },
              { value: '100%', label: 'Автоматизація', icon: Zap },
              { value: '∞', label: 'Клієнтів', icon: Heart },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telegram Bots Section */}
      <section id="bots" className="py-24 relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-pink-200 -top-20 -right-32 rounded-full blur-3xl opacity-50 animate-blob" />

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-yellow-100 text-pink-600 text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" />
              <span>Telegram інтеграція</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Два боти — <span className="gradient-text">повна автоматизація</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Клієнти записуються через бота, ви керуєте записами прямо з телефону
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Client Bot */}
            <div className="group relative p-8 rounded-3xl bg-card border border-pink-100 dark:border-pink-900/30 shadow-soft hover:shadow-xl hover:shadow-pink-500/10 transition-all hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-100 dark:from-pink-900/30 to-transparent rounded-bl-full opacity-50" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                  <UserCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Бот для клієнтів</h3>
                <p className="text-muted-foreground mb-6">
                  Клієнти записуються без дзвінків — через Telegram у будь-який час доби
                </p>
                <ul className="space-y-3">
                  {[
                    'Каталог послуг з цінами',
                    'Вибір зручної дати та часу',
                    'Перегляд історії записів',
                    'Запис до кількох спеціалістів',
                    'Підтримка UK, RU, EN'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Doctor Bot */}
            <div className="group relative p-8 rounded-3xl bg-card border border-yellow-100 dark:border-yellow-900/30 shadow-soft hover:shadow-xl hover:shadow-yellow-500/10 transition-all hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 dark:from-yellow-900/30 to-transparent rounded-bl-full opacity-50" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Бот для спеціаліста</h3>
                <p className="text-muted-foreground mb-6">
                  Миттєві сповіщення та управління записами прямо з телефону
                </p>
                <ul className="space-y-3">
                  {[
                    'Push-сповіщення про записи',
                    'Підтвердження одним кліком',
                    'Синхронізація з Google Calendar',
                    'Записи на сьогодні та майбутні',
                    'Надсилання реквізитів клієнту'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Telegram Demo */}
          <div className="mt-16">
            <TelegramDemo />
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section id="screenshots" className="py-24 bg-gradient-to-b from-secondary to-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Інтерфейс</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Зручна <span className="gradient-text">CRM-система</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Сучасний інтерфейс для управління записами, клієнтами та послугами
            </p>
          </div>

          <ScreenshotGallery />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute w-80 h-80 bg-yellow-200 -bottom-40 -left-40 rounded-full blur-3xl opacity-40 animate-blob" />

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-pink-100 text-pink-600 text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              <span>Можливості</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Все для вашого <span className="gradient-text">бізнесу</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: 'Календар записів', desc: 'Перегляд по днях, тижнях та місяцях з кольоровим маркуванням', color: 'pink' },
              { icon: CalendarCheck, title: 'Google Calendar', desc: 'Синхронізація записів з вашим Google Calendar в реальному часі', color: 'blue' },
              { icon: Globe, title: 'Ваш сайт', desc: 'Готові шаблони мініс-сайту з послугами та онлайн-записом', color: 'purple' },
              { icon: Users, title: 'База клієнтів', desc: 'Історія візитів, контакти та статистика витрат', color: 'green' },
              { icon: Sparkles, title: 'Каталог послуг', desc: 'Категорії, ціни, тривалість, етапи процедур', color: 'yellow' },
              { icon: CreditCard, title: 'Реквізити оплати', desc: 'Надсилайте реквізити клієнтам для передоплати', color: 'emerald' },
              { icon: Clock, title: 'Розклад роботи', desc: 'Робочі години, вихідні, перерви та особливі дні', color: 'orange' },
              { icon: Palette, title: 'Кастомізація', desc: 'Обирайте кольори, логотип та стиль вашого сайту', color: 'indigo' },
              { icon: Bell, title: 'Сповіщення', desc: 'Миттєві повідомлення про нові записи в Telegram', color: 'rose' },
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-card border border-pink-100 dark:border-pink-900/30 shadow-soft hover:shadow-xl transition-all hover:-translate-y-2">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${feature.color}-400 to-${feature.color}-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                  style={{
                    background: feature.color === 'pink' ? 'linear-gradient(to bottom right, #ec4899, #f43f5e)' :
                               feature.color === 'purple' ? 'linear-gradient(to bottom right, #a855f7, #9333ea)' :
                               feature.color === 'yellow' ? 'linear-gradient(to bottom right, #fbbf24, #f59e0b)' :
                               feature.color === 'green' ? 'linear-gradient(to bottom right, #22c55e, #16a34a)' :
                               feature.color === 'blue' ? 'linear-gradient(to bottom right, #3b82f6, #2563eb)' :
                               feature.color === 'emerald' ? 'linear-gradient(to bottom right, #34d399, #10b981)' :
                               feature.color === 'orange' ? 'linear-gradient(to bottom right, #fb923c, #f97316)' :
                               feature.color === 'indigo' ? 'linear-gradient(to bottom right, #818cf8, #6366f1)' :
                               'linear-gradient(to bottom right, #f43f5e, #e11d48)'
                  }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#ec4899" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Як <span className="gradient-text">почати?</span>
            </h2>
            <p className="text-muted-foreground text-lg">4 прості кроки до автоматизації</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Реєстрація', desc: 'Створіть акаунт за 2 хвилини' },
              { num: '2', title: 'Налаштування', desc: 'Додайте послуги та розклад' },
              { num: '3', title: 'Підключення', desc: 'Отримайте посилання на бота' },
              { num: '4', title: 'Готово!', desc: 'Клієнти записуються самі' },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-pink-500/30 group-hover:scale-110 transition-transform">
                    {step.num}
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-pink-300 to-transparent -translate-y-1/2" />
                  )}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-purple-200 -top-20 -left-32 rounded-full blur-3xl opacity-50 animate-blob" />

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 text-sm font-medium mb-4">
              <CreditCard className="w-4 h-4" />
              <span>Тарифи</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Прозора <span className="gradient-text">ціна</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              14 днів безкоштовно для всіх нових користувачів
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Individual */}
            <div className="relative p-8 rounded-3xl bg-card border-2 border-pink-200 dark:border-pink-800 shadow-soft hover:shadow-xl transition-all">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium rounded-full">
                Популярний
              </div>
              <h3 className="text-xl font-bold mb-2">Індивідуальний</h3>
              <p className="text-muted-foreground text-sm mb-4">Для приватних спеціалістів</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">300</span>
                <span className="text-muted-foreground"> грн/міс</span>
              </div>
              <ul className="space-y-3 mb-6">
                {['Всі функції платформи', 'Telegram боти', 'Google Calendar', 'Власний мініс-сайт', 'Підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Small */}
            <div className="relative p-8 rounded-3xl bg-card border border-gray-200 dark:border-gray-700 shadow-soft hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold mb-2">Компанія</h3>
              <p className="text-muted-foreground text-sm mb-4">3-9 спеціалістів</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">250</span>
                <span className="text-muted-foreground"> грн/спеціаліст</span>
              </div>
              <ul className="space-y-3 mb-6">
                {['Все з індивідуального', 'Декілька спеціалістів', 'Спільна база клієнтів', 'Аналітика по команді', 'Пріоритетна підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Large */}
            <div className="relative p-8 rounded-3xl bg-card border border-gray-200 dark:border-gray-700 shadow-soft hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold mb-2">Велика компанія</h3>
              <p className="text-muted-foreground text-sm mb-4">10+ спеціалістів</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">200</span>
                <span className="text-muted-foreground"> грн/спеціаліст</span>
              </div>
              <ul className="space-y-3 mb-6">
                {['Все з попередніх', 'Максимальна знижка', 'Індивідуальне налаштування', 'Виділений менеджер', 'SLA підтримка'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 animate-gradient" />
        <div className="absolute w-96 h-96 bg-white/20 -top-20 -right-48 rounded-full blur-3xl animate-blob" />
        <div className="absolute w-80 h-80 bg-yellow-300/20 -bottom-20 -left-40 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-3s' }} />

        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6 backdrop-blur-sm">
            <Heart className="w-4 h-4" />
            <span>14 днів безкоштовно</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Готові автоматизувати записи?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Приєднуйтесь до спеціалістів, які вже економлять час на рутині
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://t.me/doctor_i_want_procedure_bot"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-pink-600 rounded-full font-medium hover:shadow-2xl hover:shadow-white/30 transition-all hover:-translate-y-1"
            >
              <MessageCircle className="w-5 h-5" />
              Написати в Telegram
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-full font-medium hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Увійти в кабінет
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
