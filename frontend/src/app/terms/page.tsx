'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-pink-500 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            На головну
          </Link>

          <h1 className="text-4xl font-bold mb-8">Умови використання</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Останнє оновлення: {new Date().toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Загальні положення</h2>
            <p>
              Ці Умови використання ("Умови") регулюють використання сервісу Procedure
              ("Сервіс", "Платформа") — онлайн-платформи для управління записами на процедури
              з інтеграцією Telegram-ботів та Google Calendar.
            </p>
            <p>
              Використовуючи наш Сервіс, ви погоджуєтесь з цими Умовами. Якщо ви не погоджуєтесь
              з будь-якою частиною Умов, будь ласка, не використовуйте Сервіс.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Опис сервісу</h2>
            <p>Procedure надає:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>CRM-систему для управління записами клієнтів</li>
              <li>Telegram-бота для клієнтів для онлайн-запису</li>
              <li>Telegram-бота для спеціалістів для управління записами</li>
              <li>Інтеграцію з Google Calendar</li>
              <li>Конструктор міні-сайту для бізнесу</li>
              <li>Базу клієнтів та історію відвідувань</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Реєстрація та акаунт</h2>
            <p>
              Для використання Сервісу необхідно створити акаунт. Ви зобов'язуєтесь:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Надавати достовірну та актуальну інформацію</li>
              <li>Зберігати конфіденційність даних доступу до акаунту</li>
              <li>Негайно повідомляти про несанкціонований доступ до акаунту</li>
              <li>Нести відповідальність за всі дії, здійснені через ваш акаунт</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Права та обов'язки користувача</h2>
            <p>Користувач має право:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Використовувати всі функції Сервісу відповідно до обраного тарифу</li>
              <li>Отримувати технічну підтримку</li>
              <li>Видалити свій акаунт у будь-який час</li>
            </ul>
            <p className="mt-4">Користувач зобов'язується:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Не використовувати Сервіс для незаконної діяльності</li>
              <li>Не порушувати права інших користувачів</li>
              <li>Не намагатися отримати несанкціонований доступ до системи</li>
              <li>Не поширювати шкідливе програмне забезпечення</li>
              <li>Дотримуватися законодавства України</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Оплата та тарифи</h2>
            <p>
              Сервіс пропонує різні тарифні плани. Деталі тарифів вказані на сторінці цін.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Оплата здійснюється щомісячно</li>
              <li>Новим користувачам надається безкоштовний пробний період 14 днів</li>
              <li>Ми залишаємо за собою право змінювати тарифи з попереднім повідомленням</li>
              <li>Повернення коштів можливе протягом 7 днів після оплати</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Інтелектуальна власність</h2>
            <p>
              Всі права на Сервіс, включаючи програмний код, дизайн, логотипи та контент,
              належать Procedure. Користувачам надається обмежена ліцензія на використання
              Сервісу відповідно до цих Умов.
            </p>
            <p>
              Контент, створений користувачами (інформація про послуги, клієнтів тощо),
              залишається власністю користувачів.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Обмеження відповідальності</h2>
            <p>
              Сервіс надається "як є". Ми докладаємо максимум зусиль для забезпечення
              безперебійної роботи, але не гарантуємо:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>100% доступність Сервісу</li>
              <li>Відсутність технічних помилок</li>
              <li>Збереження даних у разі форс-мажорних обставин</li>
            </ul>
            <p className="mt-4">
              Ми не несемо відповідальності за непрямі збитки, втрачений прибуток або
              пошкодження репутації, що виникли внаслідок використання Сервісу.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Конфіденційність</h2>
            <p>
              Обробка персональних даних регулюється нашою{' '}
              <Link href="/privacy" className="text-pink-500 hover:underline">
                Політикою конфіденційності
              </Link>, яка є невід'ємною частиною цих Умов.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Припинення використання</h2>
            <p>
              Ви можете припинити використання Сервісу в будь-який час, видаливши свій акаунт.
            </p>
            <p>
              Ми залишаємо за собою право призупинити або припинити доступ до Сервісу у випадку:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Порушення цих Умов</li>
              <li>Незаконної діяльності</li>
              <li>Неоплати послуг</li>
              <li>На вимогу компетентних органів</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Зміни до умов</h2>
            <p>
              Ми можемо змінювати ці Умови. Про суттєві зміни ми повідомимо за 30 днів
              через електронну пошту або в інтерфейсі Сервісу. Продовження використання
              Сервісу після змін означає прийняття нових Умов.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Застосовне право</h2>
            <p>
              Ці Умови регулюються законодавством України. Всі спори вирішуються шляхом
              переговорів, а в разі недосягнення згоди — у судах України.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Контакти</h2>
            <p>
              З питань щодо цих Умов звертайтесь:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Telegram: <a href="https://t.me/doctor_i_want_procedure_bot" className="text-pink-500 hover:underline">@doctor_i_want_procedure_bot</a></li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
