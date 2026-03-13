'use client'

import { Phone, MapPin, Clock, MessageCircle, Instagram, Send, ExternalLink } from 'lucide-react'
import type { PublicCompany } from '@/lib/public-api'
import React from 'react'

interface Props {
  company: PublicCompany
}

export function ContactsContent({ company }: Props) {
  const socialLinks: Record<string, string> = {}
  if (company.social_links) {
    try { Object.assign(socialLinks, JSON.parse(company.social_links)) } catch {}
  }

  const instagramUrl = socialLinks.instagram
    ? (socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace('@', '')}`)
    : null

  const accentColor = company.primary_color || '#C9837A'

  const contactItems = [
    company.phone && {
      href: `tel:${company.phone}`,
      icon: <Phone className="w-4 h-4" />,
      label: 'Телефон',
      value: company.phone,
    },
    company.telegram && {
      href: `https://t.me/${company.telegram.replace('@', '')}`,
      icon: <Send className="w-4 h-4" />,
      label: 'Telegram',
      value: company.telegram,
      external: true,
    },
    instagramUrl && {
      href: instagramUrl,
      icon: <Instagram className="w-4 h-4" />,
      label: 'Instagram',
      value: socialLinks.instagram,
      external: true,
    },
    company.address && {
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`,
      icon: <MapPin className="w-4 h-4" />,
      label: 'Адреса',
      value: company.address,
      external: true,
    },
    company.working_hours && {
      icon: <Clock className="w-4 h-4" />,
      label: 'Графік роботи',
      value: company.working_hours,
      multiline: true,
    },
  ].filter(Boolean) as Array<{
    href?: string
    icon: React.ReactNode
    label: string
    value: string
    external?: boolean
    multiline?: boolean
  }>

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <p className="text-xs tracking-widest uppercase text-neutral-400 mb-1.5 font-medium">Зв&apos;язок</p>
      <h1 className="text-3xl font-bold text-neutral-900 mb-1.5">Контакти</h1>
      <p className="text-neutral-500 text-sm mb-10">Зв&apos;яжіться з нами будь-яким зручним способом</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Contact cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contactItems.map((item, i) => {
            const inner = (
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-neutral-400 mb-0.5">{item.label}</p>
                  <p className={`font-medium text-neutral-900 text-sm ${item.multiline ? 'whitespace-pre-line' : 'truncate'}`}>
                    {item.value}
                  </p>
                </div>
                {item.href && <ExternalLink className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0 mt-0.5" />}
              </div>
            )
            return item.href ? (
              <a
                key={i}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className="block bg-white border border-rose-50 rounded-2xl p-4 hover:shadow-md hover:border-rose-100 transition-all duration-200"
              >
                {inner}
              </a>
            ) : (
              <div key={i} className="bg-white border border-rose-50 rounded-2xl p-4">
                {inner}
              </div>
            )
          })}
        </div>

        {/* Booking CTA */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}28 100%)` }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white"
            style={{ backgroundColor: accentColor }}
          >
            <MessageCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Запишіться на прийом</h2>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
            Оберіть зручний день та час через нашого Telegram-бота
          </p>
          <a
            href={`https://t.me/i_want_procedure_bot?start=${company.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3 text-white rounded-full text-sm font-semibold transition-opacity hover:opacity-85 shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            Записатися онлайн
          </a>
        </div>
      </div>
    </div>
  )
}
