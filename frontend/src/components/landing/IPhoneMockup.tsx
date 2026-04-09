'use client'

import { CheckCheck } from 'lucide-react'

interface ChatMessage {
  id: number
  from: 'bot' | 'user'
  text: string
  buttons?: Array<{ text: string; highlighted?: boolean }>
  time: string
}

interface IPhoneMockupProps {
  botName: string
  messages: ChatMessage[]
  className?: string
}

function TelegramDarkChat({ botName, messages }: { botName: string; messages: ChatMessage[] }) {
  return (
    <div className="flex flex-col h-full bg-[#0e1621] text-white">
      {/* Telegram header */}
      <div className="flex items-center gap-2.5 px-3 py-2 bg-[#17212b] border-b border-[#0e1621]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {botName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-white truncate">{botName}</div>
          <div className="text-[10px] text-[#6ab2f2] flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6ab2f2]" />
            online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='20' cy='20' r='0.5' fill='%23ffffff' opacity='0.03'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='%230e1621'/%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E")`,
      }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-lg px-2 py-1.5 ${
              msg.from === 'user'
                ? 'bg-[#2b5278] rounded-br-sm'
                : 'bg-[#182533] rounded-bl-sm'
            }`}>
              <p className="text-[11px] leading-[1.4] whitespace-pre-line text-[#f5f5f5]">{msg.text}</p>
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {msg.buttons.map((btn, i) => (
                    <div
                      key={i}
                      className={`w-full px-2 py-1 text-[10px] text-center rounded font-medium ${
                        btn.highlighted
                          ? 'bg-[#2b5278] text-[#6ab2f2]'
                          : 'bg-[#2b5278]/50 text-[#6ab2f2]'
                      }`}
                    >
                      {btn.text}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                <span className="text-[9px] text-[#6e8a9e]">{msg.time}</span>
                {msg.from === 'user' && <CheckCheck className="w-2.5 h-2.5 text-[#4fae4e]" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-2 py-1.5 bg-[#17212b] border-t border-[#0e1621] flex items-center gap-1.5">
        <div className="flex-1 px-2.5 py-1 bg-[#242f3d] rounded-full text-[10px] text-[#6e8a9e]">
          Написати повідомлення...
        </div>
        <div className="w-6 h-6 rounded-full bg-[#6ab2f2] flex items-center justify-center">
          <svg className="w-3 h-3 text-[#17212b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function IPhoneMockup({ botName, messages, className = '' }: IPhoneMockupProps) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 286, height: 586 }}>
      <div className="absolute -left-[2px] top-28 h-12 w-[3px] rounded-r-full bg-[#555]/80" />
      <div className="absolute -left-[2px] top-44 h-20 w-[3px] rounded-r-full bg-[#555]/80" />
      <div className="absolute -right-[2px] top-36 h-24 w-[3px] rounded-l-full bg-[#555]/80" />

      <div className="absolute inset-0 rounded-[44px] bg-gradient-to-b from-[#4c4c4c] via-[#111] to-[#3f3f3f] p-[3px] shadow-[0_35px_90px_rgba(16,12,10,0.35)]">
        <div className="relative h-full w-full rounded-[41px] border border-white/10 bg-black p-[2px]">
          <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-[#0e1621]">
            <div className="absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-black/55 to-transparent" />

            <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2">
              <div className="h-[27px] w-[94px] rounded-b-[15px] rounded-t-[18px] bg-black" />
            </div>

            <div className="relative z-10 flex items-center justify-between px-5 pt-[11px] pb-1 bg-[#17212b]">
              <span className="text-[10px] font-semibold text-white">9:41</span>
              <div className="flex items-center gap-0.5">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <rect x="2" y="12" width="3" height="6" rx="0.5" />
                  <rect x="7" y="8" width="3" height="10" rx="0.5" />
                  <rect x="12" y="4" width="3" height="14" rx="0.5" />
                  <rect x="17" y="1" width="3" height="17" rx="0.5" opacity="0.3" />
                </svg>
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 15a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-4.3-3.3a6 6 0 018.6 0l-1.4 1.4a4 4 0 00-5.8 0l-1.4-1.4zm-3-3a10 10 0 0114.6 0l-1.4 1.4a8 8 0 00-11.8 0L2.7 8.7z" />
                </svg>
                <svg className="w-5 h-3 text-white" viewBox="0 0 28 14" fill="currentColor">
                  <rect x="0.5" y="0.5" width="23" height="13" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
                  <rect x="2" y="2" width="18" height="10" rx="1" />
                  <rect x="25" y="4" width="2" height="6" rx="1" opacity="0.4" />
                </svg>
              </div>
            </div>

            <div className="h-[calc(100%-34px)]">
              <TelegramDarkChat botName={botName} messages={messages} />
            </div>

            <div className="absolute bottom-1.5 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-white/70" />
          </div>
        </div>
      </div>
    </div>
  )
}
