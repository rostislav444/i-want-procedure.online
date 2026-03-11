'use client'

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
  return (
    <div className="py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className={`grid lg:grid-cols-2 gap-6 sm:gap-8 items-center ${feature.reversed ? 'lg:flex-row-reverse' : ''}`}>
          {/* Content */}
          <div className={feature.reversed ? 'lg:order-2' : ''}>
            {/* Title with Icon */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl sm:text-3xl">{feature.icon}</span>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold dark:text-white">
                {feature.title}
              </h2>
            </div>
            <p className={`text-sm font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent mb-2`}>
              {feature.subtitle}
            </p>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              {feature.description}
            </p>

            {/* Benefits */}
            <div className="space-y-2">
              {feature.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`mt-0.5 w-5 h-5 rounded-md bg-gradient-to-r ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Screenshot */}
          <div className={feature.reversed ? 'lg:order-1' : ''}>
            <div className="relative group">
              {/* Screenshot container */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-white/50 dark:border-white/10 group-hover:scale-[1.01] transition-transform duration-500">
                <Image
                  src={feature.screenshot}
                  alt={feature.title}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
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
    <section id="features" className="py-8 sm:py-10 bg-gradient-to-b from-white to-slate-50 dark:from-background dark:to-background">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto px-4 text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-tinted mb-3">
          <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">Функціонал</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 dark:text-white">
          Все для вашого <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">бізнесу</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
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
