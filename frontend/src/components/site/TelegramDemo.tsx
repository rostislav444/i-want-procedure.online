'use client'

import Image from 'next/image'
import { Send, CheckCheck } from 'lucide-react'

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
}

function TelegramChat({ botName, botAvatar, messages, accentColor }: TelegramChatProps) {
  return (
    <div className="relative">
      {/* Chat window */}
      <div className="w-full bg-card rounded-2xl shadow-2xl border border-pink-100 overflow-hidden">
        {/* Header - Telegram Style */}
        <div className={`${accentColor} px-4 py-2.5 sm:py-3 flex items-center gap-3 shadow-sm`}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white flex-shrink-0 shadow-md">
            <Image
              src={botAvatar}
              alt={botName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-sm sm:text-base truncate">{botName}</h4>
            <p className="text-[10px] sm:text-xs text-white/90 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white"></span>
              онлайн
            </p>
          </div>
        </div>

        {/* Messages - Telegram Background */}
        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 min-h-[320px] max-h-[450px] overflow-y-auto relative" style={{
          background: 'linear-gradient(180deg, #0088cc05 0%, #0088cc03 100%), #e5ddd5',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] sm:max-w-[85%] ${msg.from === 'user'
                ? 'bg-[#dcf8c6] rounded-2xl rounded-br-sm shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
                : 'bg-white rounded-2xl rounded-bl-sm shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                }`}>
                <div className="px-2.5 sm:px-3 py-1.5 sm:py-2">
                  <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-1.5 sm:mt-2 space-y-1">
                      {msg.buttons.map((btn, i) => (
                        <button
                          key={i}
                          className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 font-medium ${btn.selected
                            ? `${accentColor} text-white shadow-md`
                            : 'bg-white border border-gray-200 hover:bg-gray-50 text-foreground'
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

        {/* Input - Telegram Style */}
        <div className="px-2.5 sm:px-3 py-2 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Написати повідомлення..."
              className="flex-1 px-3 sm:px-4 py-2 bg-[#f4f4f5] rounded-full text-xs sm:text-sm border-0 focus:outline-none placeholder:text-gray-400"
              readOnly
            />
            <button className={`w-9 h-9 sm:w-10 sm:h-10 ${accentColor} rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow`}>
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
      text: '🆕 Новий запис!\n\n📋 Мезотерапія\n\n📅  07.01.2026\n⏰  14:00 - 15:00\n💰  1500 грн\n\n━━━━━━━━━━━━━━━\n\n👤  Олена Петренко\n\n📞  +380 67 123 4567\n\n✈️  @olena_p\n\n━━━━━━━━━━━━━━━\n\n📊  ⏳ Очікує',
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
      text: '📋 Мезотерапія\n\n📅  07.01.2026\n⏰  14:00 - 15:00\n💰  1500 грн\n\n━━━━━━━━━━━━━━━\n\n👤  Олена Петренко\n\n📞  +380 67 123 4567\n\n✈️  @olena_p\n\n━━━━━━━━━━━━━━━\n\n📊  ✅ Підтверджено',
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
      text: '📋 Чистка обличчя\n\n📅  07.01.2026\n⏰  10:00 - 11:00\n💰  800 грн\n\n━━━━━━━━━━━━━━━\n\n👤  Марія Іваненко\n\n📞  +380 50 111 2233\n\n━━━━━━━━━━━━━━━\n\n📊  ✅ Підтверджено',
      time: '14:30',
    },
  ]

  return (
    <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-start">
      {/* Client Bot Demo */}
      <div>
        <div className="mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 text-pink-600 text-xs font-medium mb-3">
            👤 Бот для клієнтів
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">Простий запис на процедуру</h3>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Клієнт обирає послугу, дату та час — все за пару кліків
          </p>
        </div>
        <TelegramChat
          botName="Procedure Bot"
          botAvatar="/img/logo-client-telegram-2.png"
          messages={clientBotMessages}
          accentColor="bg-gradient-to-r from-pink-500 to-rose-500"
        />
      </div>

      {/* Doctor Bot Demo */}
      <div>
        <div className="mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-600 text-xs font-medium mb-3">
            👩‍⚕️ Бот для косметолога
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">Миттєві сповіщення</h3>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Отримуйте нові записи та керуйте ними прямо в Telegram
          </p>
        </div>
        <TelegramChat
          botName="Doctor Procedure"
          botAvatar="/img/logo-doctor-telegram.jpg"
          messages={doctorBotMessages}
          accentColor="bg-gradient-to-r from-amber-500 to-orange-500"
        />
      </div>
    </div>
  )
}
