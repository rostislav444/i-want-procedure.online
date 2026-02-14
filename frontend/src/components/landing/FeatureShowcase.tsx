'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'

interface Feature {
  id: string
  title: string
  subtitle: string
  description: string
  benefits: string[]
  screenshot: string
  gradient: string
  icon: string
  reversed?: boolean
}

const features: Feature[] = [
  {
    id: 'dashboard',
    title: 'Інтелектуальний Dashboard',
    subtitle: 'Вся інформація в одному місці',
    description: 'Бачте сьогоднішні записи, загальну статистику та швидкі дії прямо на головній сторінці. Система автоматично показує найважливіше.',
    benefits: [
      'Записи сьогодні та на тиждень',
      'Виручка та статистика клієнтів',
      'Швидкі дії (Записи, Послуги, Клієнти, Розклад)',
      'Найближчі клієнти з деталями'
    ],
    screenshot: '/screens/dashboard.png',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '📊'
  },
  {
    id: 'team',
    title: 'Управління командою',
    subtitle: 'Для клінік та студій',
    description: 'Запрошуйте спеціалістів, розподіляйте посади, керуйте доступом. Кожен має свій розклад та статистику.',
    benefits: [
      'Декілька спеціалістів в одній системі',
      'Ролі: Косметолог, Масажист, Менеджер',
      'Запрошення через посилання',
      'Розклад та послуги для кожного'
    ],
    screenshot: '/screens/team-management.png',
    gradient: 'from-purple-500 to-pink-500',
    icon: '👥',
    reversed: true
  },
  {
    id: 'services',
    title: 'Каталог послуг',
    subtitle: 'Гнучка система послуг',
    description: 'Створюйте послуги з категоріями, встановлюйте ціни та тривалість. Система підтримує варіації для різних спеціалістів.',
    benefits: [
      'Категорії (Чистки, Пілінги, Догляд)',
      'Ціна та тривалість кожної послуги',
      'Етапи процедури',
      'Прив\'язка до спеціалістів'
    ],
    screenshot: '/screens/services-catalog.png',
    gradient: 'from-pink-500 to-rose-500',
    icon: '✨'
  },
  {
    id: 'schedule',
    title: 'Розумний розклад',
    subtitle: 'Календар та робочі години',
    description: 'Встановіть стандартний розклад на тиждень. Система автоматично покаже вільні слоти клієнтам для запису.',
    benefits: [
      'Робочі дні та години',
      'Календар на тиждень/місяць',
      'Автоматичні вільні слоти',
      'Синхронізація з Google Calendar'
    ],
    screenshot: '/screens/schedule-calendar.png',
    gradient: 'from-orange-500 to-red-500',
    icon: '📅',
    reversed: true
  },
  {
    id: 'clients',
    title: 'CRM для клієнтів',
    subtitle: 'Повна історія кожного клієнта',
    description: 'Детальні картки клієнтів з історією візитів, статистикою витрат та запланованими процедурами.',
    benefits: [
      'Контакти (телефон, Telegram)',
      'Історія візитів з датами',
      'Статистика витрат та процедур',
      'Запис прямо з картки'
    ],
    screenshot: '/screens/client-card.png',
    gradient: 'from-green-500 to-emerald-500',
    icon: '👤'
  },
  {
    id: 'protocols',
    title: 'Протоколи процедур',
    subtitle: 'Медична документація',
    description: 'Створюйте детальні протоколи з консультацією клієнта, описом процедури, використаними техніками та деталями.',
    benefits: [
      'Консультація клієнта',
      'Рівень стресу/напруження (1-10)',
      'Проблемні зони (обличчя, тіло)',
      'Використані техніки та препарати'
    ],
    screenshot: '/screens/protocol-details.png',
    gradient: 'from-teal-500 to-blue-500',
    icon: '📋',
    reversed: true
  },
  {
    id: 'inventory',
    title: 'Складський облік',
    subtitle: 'Інвентаризація та товари',
    description: 'Повний облік товарів на складі з категоріями, брендами, варіантами та історією руху.',
    benefits: [
      '354 номенклатури, 20 категорій',
      'Бренди та колекції',
      'Варіанти (30мл, 50мл, Pack)',
      'Історія руху та залишки'
    ],
    screenshot: '/screens/inventory-warehouse.png',
    gradient: 'from-violet-500 to-purple-500',
    icon: '📦'
  },
  {
    id: 'links',
    title: 'Генерація посилань',
    subtitle: 'Автоматизація запрошень',
    description: 'Створюйте посилання для запрошення клієнтів, спеціалістів в команду та запису на конкретну послугу.',
    benefits: [
      'Посилання для клієнтів',
      'Запрошення в команду',
      'Запис на послугу',
      'Будь-який власний посил'
    ],
    screenshot: '/screens/links-generation.png',
    gradient: 'from-cyan-500 to-blue-500',
    icon: '🔗',
    reversed: true
  }
]

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`py-12 sm:py-16 lg:py-20 transition-all duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={`grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center ${feature.reversed ? 'lg:flex-row-reverse' : ''}`}>
          {/* Content */}
          <div className={`${feature.reversed ? 'lg:order-2' : ''} ${isVisible ? 'animate-reveal-left' : ''}`}>
            {/* Icon & Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass-tinted mb-6">
              <span className="text-3xl">{feature.icon}</span>
              <span className={`text-sm font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                Функція #{index + 1}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black mb-3 sm:mb-4">
              {feature.title}
            </h2>
            <p className={`text-base sm:text-lg lg:text-xl font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent mb-4 sm:mb-6`}>
              {feature.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              {feature.description}
            </p>

            {/* Benefits */}
            <div className="space-y-3">
              {feature.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className={`mt-1 w-6 h-6 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Screenshot */}
          <div className={`${feature.reversed ? 'lg:order-1' : ''} ${isVisible ? 'animate-reveal-right' : ''}`}>
            <div className="relative group">
              {/* Glow effect */}
              <div className={`absolute -inset-4 bg-gradient-to-r ${feature.gradient} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity rounded-3xl`} />

              {/* Screenshot container */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 group-hover:scale-[1.02] transition-transform duration-500">
                <Image
                  src={feature.screenshot}
                  alt={feature.title}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />

                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Floating badge */}
              <div className={`absolute -top-4 -right-4 px-4 py-2 bg-gradient-to-r ${feature.gradient} text-white rounded-2xl shadow-xl font-bold animate-pulse-ring`}>
                {feature.icon}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeatureShowcase() {
  return (
    <section id="features" className="py-8 sm:py-12 bg-gradient-to-b from-white to-slate-50">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto px-4 text-center mb-10 sm:mb-16 lg:mb-20">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-tinted mb-6">
          <Sparkles className="w-5 h-5 text-pink-600" />
          <span className="text-sm font-semibold text-pink-600">Функціонал</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-6">
          Все для вашого <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">бізнесу</span>
        </h2>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600">
          Повноцінна система управління, яка замінює 10+ різних інструментів
        </p>
      </div>

      {/* Feature Cards */}
      {features.map((feature, index) => (
        <FeatureCard key={feature.id} feature={feature} index={index} />
      ))}
    </section>
  )
}
