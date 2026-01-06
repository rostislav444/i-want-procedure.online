'use client'

import { Phone, MessageCircle, MapPin, Instagram, Facebook, Clock, ArrowRight, Send } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface ContactContent {
  title?: string
  show_phone?: boolean
  show_telegram?: boolean
  show_email?: boolean
  show_address?: boolean
}

interface Props {
  content: ContactContent
  theme: IndustryTheme
  company: Company
}

export function ContactSection({ content, theme, company }: Props) {
  const title = content.title || 'Контакти'
  const showPhone = content.show_phone !== false
  const showTelegram = content.show_telegram !== false
  const showAddress = content.show_address !== false

  // Generate Telegram bot link
  const telegramBotLink = `https://t.me/i_want_procedure_bot?start=${company.slug || company.id}`

  // Parse social links
  let socialLinks: { instagram?: string; facebook?: string } = {}
  if (company.social_links) {
    try {
      socialLinks = JSON.parse(company.social_links)
    } catch {}
  }

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden" style={{ backgroundColor: 'var(--color-background-alt)' }}>
      {/* Decorative background */}
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 pointer-events-none"
        style={{ background: 'var(--color-primary-500)' }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ background: 'var(--color-secondary-500)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text-on-alt)' }}
          >
            {title}
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Info Card */}
          <div
            className="p-8 md:p-10"
            style={{
              backgroundColor: 'var(--color-surface-on-alt)',
              borderRadius: theme.borderRadius.card,
              boxShadow: theme.shadow.card,
            }}
          >
            <h3 className="text-2xl font-bold mb-8" style={{ color: 'var(--color-text-on-alt)' }}>
              Зв'яжіться з нами
            </h3>

            <div className="space-y-6">
              {showPhone && company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="group flex items-center gap-4"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <Phone className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted-on-alt)' }}>Телефон</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--color-text-on-alt)' }}>{company.phone}</p>
                  </div>
                </a>
              )}

              {showTelegram && company.telegram && (
                <a
                  href={`https://t.me/${company.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <Send className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted-on-alt)' }}>Telegram</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--color-text-on-alt)' }}>{company.telegram}</p>
                  </div>
                </a>
              )}

              {showAddress && company.address && (
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted-on-alt)' }}>Адреса</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--color-text-on-alt)' }}>{company.address}</p>
                  </div>
                </div>
              )}

              {/* Working hours */}
              {company.working_hours && (
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <Clock className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted-on-alt)' }}>Графік роботи</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--color-text-on-alt)' }}>{company.working_hours}</p>
                  </div>
                </div>
              )}

              {/* Social links */}
              {(socialLinks.instagram || socialLinks.facebook) && (
                <div className="pt-6 border-t" style={{ borderColor: 'var(--color-surface-border-on-alt)' }}>
                  <p className="text-sm font-medium mb-4" style={{ color: 'var(--color-text-muted-on-alt)' }}>
                    Ми в соцмережах
                  </p>
                  <div className="flex items-center gap-3">
                    {socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center hover:opacity-90 hover:scale-110 transition-all"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA Card */}
          <div
            className="p-8 md:p-10 flex flex-col justify-center"
            style={{
              background: `linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))`,
              borderRadius: theme.borderRadius.card,
            }}
          >
            <div className="text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Записатися на процедуру
              </h3>
              <p className="text-white/80 text-lg mb-8">
                Швидко та зручно через Telegram бот. Оберіть послугу, час та отримайте підтвердження миттєво.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90">Вибір зручного часу</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90">Миттєве підтвердження</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90">Нагадування про візит</span>
                </div>
              </div>

              {/* CTA Button */}
              <a
                href={telegramBotLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 font-bold text-lg rounded-2xl bg-white hover:bg-white/90 transition-all hover:scale-105 shadow-xl"
                style={{ color: 'var(--color-primary-700)' }}
              >
                <MessageCircle className="w-6 h-6" />
                Записатися в Telegram
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
