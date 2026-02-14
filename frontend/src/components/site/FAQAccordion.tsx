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
    <section className="py-12 sm:py-16 relative overflow-hidden">
      <div className="absolute w-80 h-80 bg-purple-200 -top-40 -right-48 rounded-full blur-3xl opacity-30 animate-blob" />

      <div className="max-w-4xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            Часті <span className="gradient-text">запитання</span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl bg-card border border-pink-100 shadow-soft"
              >
                <button
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-pink-50 transition-colors"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-semibold pr-4 text-sm sm:text-base text-foreground">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-pink-500 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-sm sm:text-base text-muted-foreground">
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
