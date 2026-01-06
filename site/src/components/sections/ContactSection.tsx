'use client'

import { Phone, MessageCircle, Mail, MapPin, Instagram, Facebook } from 'lucide-react'
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
  const showEmail = content.show_email !== false
  const showAddress = content.show_address !== false

  // Parse social links
  let socialLinks: { instagram?: string; facebook?: string } = {}
  if (company.social_links) {
    try {
      socialLinks = JSON.parse(company.social_links)
    } catch {}
  }

  return (
    <section className="py-16" style={{ backgroundColor: 'var(--color-background-alt)' }}>
      <div className="max-w-5xl mx-auto px-4">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
        >
          {title}
        </h2>

        <div
          className="p-8 md:p-12"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: theme.borderRadius.card,
            boxShadow: theme.shadow.card,
          }}
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact info */}
            <div className="space-y-6">
              {showPhone && company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-4 group"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-colors group-hover:scale-105"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <Phone className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Телефон</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{company.phone}</p>
                  </div>
                </a>
              )}

              {showTelegram && company.telegram && (
                <a
                  href={`https://t.me/${company.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-sky-500/20 transition-colors group-hover:scale-105">
                    <MessageCircle className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Telegram</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{company.telegram}</p>
                  </div>
                </a>
              )}

              {showAddress && company.address && (
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Адреса</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{company.address}</p>
                  </div>
                </div>
              )}

              {/* Social links */}
              {(socialLinks.instagram || socialLinks.facebook) && (
                <div className="flex items-center gap-3 pt-4">
                  {socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col justify-center items-center md:items-end text-center md:text-right">
              <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Записуйтесь на процедури онлайн через Telegram бот
              </p>
              {company.telegram && (
                <a
                  href={`https://t.me/${company.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 font-semibold hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: 'var(--color-primary-500)',
                    color: 'var(--color-primary-contrast)',
                    borderRadius: theme.borderRadius.button,
                  }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Записатися в Telegram
                </a>
              )}

              {/* Working hours */}
              {company.working_hours && (
                <div className="mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <p className="font-medium">Графік роботи:</p>
                  <p>{company.working_hours}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
