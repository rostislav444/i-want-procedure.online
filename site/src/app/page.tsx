import {
  Calendar,
  Users,
  Clock,
  MessageCircle,
  Bell,
  CheckCircle2,
  BarChart3,
  Settings,
  Bot,
  UserCircle,
  Stethoscope,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-background" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Платформа для косметологів</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Автоматизація запису
              <span className="text-blue-500"> на процедури</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              CRM-система з Telegram-ботами для клієнтів та косметологів.
              Онлайн-запис, управління розкладом, база клієнтів — все в одному місці.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors"
              >
                Спробувати безкоштовно
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-full font-medium transition-colors"
              >
                Детальніше
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-500 mb-2">24/7</div>
              <div className="text-muted-foreground">Онлайн запис</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-500 mb-2">2</div>
              <div className="text-muted-foreground">Telegram боти</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-500 mb-2">100%</div>
              <div className="text-muted-foreground">Автоматизація</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-500 mb-2">0</div>
              <div className="text-muted-foreground">Пропущених записів</div>
            </div>
          </div>
        </div>
      </section>

      {/* Telegram Bots Section */}
      <section id="bots" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 text-sky-600 text-sm font-medium mb-4">
              <Bot className="w-4 h-4" />
              <span>Telegram інтеграція</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Два боти для повної автоматизації
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Клієнти записуються через бота, а ви отримуєте сповіщення та керуєте записами прямо в Telegram
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Client Bot */}
            <div className="relative p-8 rounded-3xl border bg-gradient-to-br from-blue-500/5 to-transparent">
              <div className="absolute top-8 right-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Бот для клієнтів</h3>
              <p className="text-muted-foreground mb-6">
                Ваші клієнти записуються на процедури без дзвінків та очікування —
                просто через Telegram в будь-який час.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Вибір послуги з каталогу з цінами</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Вибір дати та вільного часу</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Перегляд своїх записів та історії</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Підтримка 3 мов: UK, RU, EN</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Автоматична реєстрація клієнта</span>
                </li>
              </ul>
            </div>

            {/* Doctor Bot */}
            <div className="relative p-8 rounded-3xl border bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="absolute top-8 right-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Бот для косметолога</h3>
              <p className="text-muted-foreground mb-6">
                Миттєві сповіщення про нові записи та можливість керувати ними
                прямо з телефону.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Push-сповіщення про нові записи</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Підтвердження або скасування запису</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Перегляд записів на сьогодні</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Список всіх майбутніх записів</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Контакти клієнта в один клік</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CRM Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-card border-y">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium mb-4">
              <Settings className="w-4 h-4" />
              <span>CRM система</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Повний контроль над бізнесом
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Веб-панель для управління всіма аспектами вашої косметологічної практики
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border bg-background">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Календар записів</h3>
              <p className="text-muted-foreground">
                Перегляд по днях, тижнях та місяцях. Кольорове маркування статусів записів.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-background">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">База клієнтів</h3>
              <p className="text-muted-foreground">
                Історія візитів, контакти, статистика витрат кожного клієнта.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-background">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Каталог послуг</h3>
              <p className="text-muted-foreground">
                Категорії, ціни, тривалість, етапи процедур та використані препарати.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-background">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Управління розкладом</h3>
              <p className="text-muted-foreground">
                Робочі години, вихідні, перерви, особливі дні — повний контроль.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-background">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Статистика</h3>
              <p className="text-muted-foreground">
                Виручка за день, кількість записів, популярні послуги.
              </p>
            </div>

            <div className="p-6 rounded-2xl border bg-background">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-sky-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Сповіщення</h3>
              <p className="text-muted-foreground">
                Автоматичні нагадування клієнтам про майбутні візити.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Як це працює
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Простий процес від реєстрації до першого клієнта
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Реєстрація</h3>
              <p className="text-muted-foreground text-sm">
                Створіть акаунт та налаштуйте профіль компанії
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Налаштування</h3>
              <p className="text-muted-foreground text-sm">
                Додайте послуги, ціни та налаштуйте розклад
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Підключення</h3>
              <p className="text-muted-foreground text-sm">
                Отримайте посилання на бота для ваших клієнтів
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Робота</h3>
              <p className="text-muted-foreground text-sm">
                Клієнти записуються, ви отримуєте сповіщення
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="py-20 sm:py-28 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Готові автоматизувати записи?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Почніть використовувати систему вже сьогодні.
            Безкоштовний пробний період 14 днів.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://t.me/your_bot"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-full font-medium hover:bg-white/90 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Написати в Telegram
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/20 rounded-full font-medium hover:bg-white/20 transition-colors"
            >
              Зареєструватися
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground">
              &copy; {new Date().getFullYear()} Procedure. Всі права захищені.
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Політика конфіденційності
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Умови використання
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
