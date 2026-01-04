'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Send, Check, CheckCheck } from 'lucide-react'

interface Message {
  id: number
  from: 'bot' | 'user'
  text: string
  buttons?: Array<{ text: string; selected?: boolean }>
  time: string
}

interface TelegramChatProps {
  botName: string
  botAvatar: string
  messages: Message[]
  accentColor: string
  notification?: { text: string; subtext: string }
}

function TelegramChat({ botName, botAvatar, messages, accentColor, notification }: TelegramChatProps) {
  return (
    <div className="relative">
      {/* Notification popup */}
      {notification && (
        <div className="absolute -top-2 -right-2 z-10 px-4 py-2 bg-card rounded-2xl shadow-lg border border-green-200 dark:border-green-800 animate-float" style={{ animationDelay: '-1s' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-sm">{notification.text}</p>
              <p className="text-xs text-muted-foreground">{notification.subtext}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat window */}
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-pink-100 dark:border-pink-900/30 overflow-hidden">
        {/* Header */}
        <div className={`${accentColor} px-4 py-3 flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex-shrink-0">
            <Image
              src={botAvatar}
              alt={botName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{botName}</h4>
            <p className="text-xs text-white/80">онлайн</p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-3 space-y-3 bg-[#e5ddd5] dark:bg-slate-900 min-h-[320px] max-h-[400px] overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.from === 'user'
                ? 'bg-[#dcf8c6] dark:bg-green-900/50 rounded-2xl rounded-br-md'
                : 'bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md'
                } shadow-sm`}>
                <div className="px-3 py-2">
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.buttons.map((btn, i) => (
                        <button
                          key={i}
                          className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${btn.selected
                            ? `${accentColor} text-white`
                            : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-foreground'
                            }`}
                        >
                          {btn.text}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={`flex items-center justify-end gap-1 mt-1 ${msg.from === 'user' ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="text-[10px]">{msg.time}</span>
                    {msg.from === 'user' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-3 py-2 bg-[#f0f0f0] dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Написати повідомлення..."
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 rounded-full text-sm border-0 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
              readOnly
            />
            <button className={`w-10 h-10 ${accentColor} rounded-full flex items-center justify-center text-white`}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TelegramDemo() {
  const clientBotMessages: Message[] = [
    {
      id: 1,
      from: 'bot',
      text: 'Привіт! Я бот для запису на косметологічні процедури.\n\nОберіть дію:',
      buttons: [
        { text: '📅 Записатись на процедуру', selected: true },
        { text: '📋 Мої записи' },
        { text: '🌐 Змінити мову' },
      ],
      time: '14:22',
    },
    {
      id: 2,
      from: 'user',
      text: '📅 Записатись на процедуру',
      time: '14:22',
    },
    {
      id: 3,
      from: 'bot',
      text: 'Оберіть послугу:',
      buttons: [
        { text: '💆 Чистка обличчя — 800 грн' },
        { text: '💉 Мезотерапія — 1500 грн', selected: true },
        { text: '✨ Пілінг — 600 грн' },
        { text: '← Назад' },
      ],
      time: '14:22',
    },
    {
      id: 4,
      from: 'user',
      text: '💉 Мезотерапія — 1500 грн',
      time: '14:23',
    },
    {
      id: 5,
      from: 'bot',
      text: 'Оберіть дату:',
      buttons: [
        { text: '📅 Пн, 6 січня' },
        { text: '📅 Вт, 7 січня', selected: true },
        { text: '📅 Ср, 8 січня' },
        { text: '← Назад' },
      ],
      time: '14:23',
    },
  ]

  const doctorBotMessages: Message[] = [
    {
      id: 1,
      from: 'bot',
      text: '🆕 Новий запис!\n\n━━━━━━━━━━━━━━━\n\n📋 Мезотерапія\n📅 07.01.2026\n⏰ 14:00 - 15:00\n💰 1500 грн\n\n━━━━━━━━━━━━━━━\n\n👤 Олена Петренко\n📱 +380 67 123 4567\n💬 @olena_p',
      buttons: [
        { text: '✅ Підтвердити', selected: true },
        { text: '❌ Скасувати' },
      ],
      time: '14:24',
    },
    {
      id: 2,
      from: 'user',
      text: '✅ Підтвердити',
      time: '14:25',
    },
    {
      id: 3,
      from: 'bot',
      text: '✅ Запис підтверджено!\n\nКлієнт отримав сповіщення.',
      time: '14:25',
    },
    {
      id: 4,
      from: 'user',
      text: '/today',
      time: '14:30',
    },
    {
      id: 5,
      from: 'bot',
      text: '📅 Записи на сьогодні:\n\n1️⃣ 10:00 — Чистка обличчя\n    👤 Марія Іваненко\n    ✅ Підтверджено\n\n2️⃣ 14:00 — Мезотерапія\n    👤 Олена Петренко\n    ✅ Підтверджено\n\n3️⃣ 16:30 — Пілінг\n    👤 Анна Сидоренко\n    ⏳ Очікує',
      time: '14:30',
    },
  ]

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-start">
      {/* Client Bot Demo */}
      <div>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 text-xs font-medium mb-3">
            👤 Бот для клієнтів
          </div>
          <h3 className="text-xl font-bold mb-2">Простий запис на процедуру</h3>
          <p className="text-muted-foreground text-sm">
            Клієнт обирає послугу, дату та час — все за пару кліків
          </p>
        </div>
        <TelegramChat
          botName="Procedure Bot"
          botAvatar="/img/logo-client-telegram-2.png"
          messages={clientBotMessages}
          accentColor="bg-gradient-to-r from-pink-500 to-rose-500"
          notification={{ text: 'Запис створено!', subtext: 'Мезотерапія, 7 січня' }}
        />
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Команди:</p>
          <div className="flex flex-wrap gap-2">
            {['/start', '/book', '/appointments', '/language'].map((cmd) => (
              <code key={cmd} className="px-2 py-1 bg-muted rounded text-xs">{cmd}</code>
            ))}
          </div>
        </div>
      </div>

      {/* Doctor Bot Demo */}
      <div>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs font-medium mb-3">
            👩‍⚕️ Бот для косметолога
          </div>
          <h3 className="text-xl font-bold mb-2">Миттєві сповіщення</h3>
          <p className="text-muted-foreground text-sm">
            Отримуйте нові записи та керуйте ними прямо в Telegram
          </p>
        </div>
        <TelegramChat
          botName="Doctor Procedure"
          botAvatar="/img/logo-doctor-telegram.jpg"
          messages={doctorBotMessages}
          accentColor="bg-gradient-to-r from-amber-500 to-orange-500"
          notification={{ text: 'Запис підтверджено', subtext: 'Олена отримала сповіщення' }}
        />
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Команди:</p>
          <div className="flex flex-wrap gap-2">
            {['/start', '/today', '/week', '/appointments'].map((cmd) => (
              <code key={cmd} className="px-2 py-1 bg-muted rounded text-xs">{cmd}</code>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
