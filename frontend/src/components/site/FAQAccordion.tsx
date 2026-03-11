'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'Як працює безкоштовний період?',
    answer: '14 днів повного доступу без обмежень. Кредитна картка не потрібна. Після пробного періоду обирайте тариф або продовжуйте безкоштовно.'
  },
  {
    question: 'Чи складно налаштувати систему?',
    answer: 'Середній час налаштування — 15 хвилин. Додайте послуги, встановіть розклад, отримайте посилання на бота. Готово!'
  },
  {
    question: 'Чи потрібні технічні знання?',
    answer: 'Ні. Інтерфейс інтуїтивний. Якщо вмієте користуватись Telegram та Google Calendar, впораєтесь.'
  },
  {
    question: 'Що якщо мої клієнти не користуються Telegram?',
    answer: 'Крім Telegram-бота, ви отримуєте власний мініс-сайт з онлайн-записом. Клієнти можуть записатись через сайт.'
  },
  {
    question: 'Чи можна підключити кілька спеціалістів?',
    answer: 'Так. Тарифи \'Компанія\' дозволяють підключити від 3 до 10+ спеціалістів. Кожен має свій розклад.'
  },
  {
    question: 'Як працює синхронізація з Google Calendar?',
    answer: 'Після підключення всі записи автоматично додаються в ваш Google Calendar. Двостороння синхронізація в реальному часі.'
  },
  {
    question: 'Чи безпечні дані моїх клієнтів?',
    answer: 'Так. Дані зберігаються на захищених серверах. SSL-шифрування. Відповідність GDPR.'
  },
  {
    question: 'Чи можу я скасувати підписку будь-коли?',
    answer: 'Так, без жодних штрафів. Просто скасуйте в налаштуваннях.'
  }
]

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-8 sm:py-10 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-500/15 dark:to-pink-500/15 text-purple-600 dark:text-purple-400 text-xs font-medium mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold dark:text-white">
            Часті <span className="gradient-text">запитання</span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="overflow-hidden rounded-xl bg-card dark:bg-white/5 border border-pink-100 dark:border-pink-500/20 shadow-soft"
              >
                <button
                  className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-colors"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-semibold pr-4 text-xs sm:text-sm text-foreground dark:text-white">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-pink-500 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
                    {item.answer}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
