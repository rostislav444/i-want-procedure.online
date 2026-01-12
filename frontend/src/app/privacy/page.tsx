'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'

export default function PrivacyPage() {
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

          <h1 className="text-4xl font-bold mb-8">Політика конфіденційності</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Останнє оновлення: {new Date().toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Загальні положення</h2>
            <p>
              Ця Політика конфіденційності описує, як сервіс Procedure ("ми", "наш", "сервіс")
              збирає, використовує та захищає вашу персональну інформацію при використанні
              нашої платформи для управління записами на процедури.
            </p>
            <p>
              Використовуючи наш сервіс, ви погоджуєтесь з умовами цієї Політики конфіденційності.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Яку інформацію ми збираємо</h2>
            <p>Ми можемо збирати наступну інформацію:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Особиста інформація:</strong> ім'я, прізвище, електронна пошта, номер телефону
              </li>
              <li>
                <strong>Дані авторизації:</strong> інформація з вашого Google-акаунту (ім'я, email, фото профілю)
              </li>
              <li>
                <strong>Дані Telegram:</strong> Telegram ID, ім'я користувача, ім'я
              </li>
              <li>
                <strong>Інформація про записи:</strong> дати, час, обрані послуги, історія відвідувань
              </li>
              <li>
                <strong>Технічна інформація:</strong> IP-адреса, тип браузера, дані про пристрій
              </li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Як ми використовуємо інформацію</h2>
            <p>Зібрана інформація використовується для:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Надання послуг платформи та обробки записів</li>
              <li>Надсилання сповіщень про записи через Telegram</li>
              <li>Синхронізації з Google Calendar (за вашим дозволом)</li>
              <li>Покращення якості сервісу та користувацького досвіду</li>
              <li>Зв'язку з вами щодо питань підтримки</li>
              <li>Забезпечення безпеки вашого акаунту</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Зберігання та захист даних</h2>
            <p>
              Ми вживаємо всіх необхідних технічних та організаційних заходів для захисту
              вашої персональної інформації від несанкціонованого доступу, зміни, розкриття
              або знищення.
            </p>
            <p>
              Ваші дані зберігаються на захищених серверах. Ми використовуємо шифрування
              для передачі конфіденційної інформації.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Передача даних третім особам</h2>
            <p>
              Ми не продаємо, не обмінюємо та не передаємо вашу персональну інформацію
              третім особам без вашої згоди, за винятком випадків:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Коли це необхідно для надання послуг (наприклад, Telegram API, Google API)</li>
              <li>Коли це вимагається законодавством України</li>
              <li>Для захисту наших прав та безпеки користувачів</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Інтеграції з третіми сервісами</h2>
            <p>Наш сервіс інтегрується з:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google:</strong> для авторизації та синхронізації календаря.
                Використання даних Google регулюється{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">
                  Політикою конфіденційності Google
                </a>.
              </li>
              <li>
                <strong>Telegram:</strong> для роботи ботів та надсилання сповіщень.
                Використання регулюється{' '}
                <a href="https://telegram.org/privacy" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline">
                  Політикою конфіденційності Telegram
                </a>.
              </li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Ваші права</h2>
            <p>Ви маєте право:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Отримати доступ до своїх персональних даних</li>
              <li>Виправити неточну інформацію</li>
              <li>Видалити свій акаунт та всі пов'язані дані</li>
              <li>Відкликати згоду на обробку даних</li>
              <li>Отримати копію своїх даних</li>
            </ul>
            <p>
              Для реалізації цих прав зверніться до нас через Telegram-бота або електронну пошту.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Файли cookie</h2>
            <p>
              Ми використовуємо файли cookie та подібні технології для забезпечення
              роботи сервісу, збереження ваших налаштувань та покращення користувацького досвіду.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Зміни до політики</h2>
            <p>
              Ми можемо оновлювати цю Політику конфіденційності час від часу.
              Про суттєві зміни ми повідомимо через сервіс або електронну пошту.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Контакти</h2>
            <p>
              Якщо у вас є питання щодо цієї Політики конфіденційності, зверніться до нас:
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
