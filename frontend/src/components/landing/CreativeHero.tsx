'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'

export default function CreativeHero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-pink-50">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Geometric Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-400 to-rose-500 opacity-20 geometric-shape animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 opacity-20 geometric-shape animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-20 triangle-shape animate-float" style={{ animationDelay: '2s' }} />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full glass-tinted mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Zap className="w-4 h-4 text-pink-600" />
          <span className="text-sm font-medium bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Автоматизація бізнесу для beauty-спеціалістів
          </span>
        </div>

        {/* Main Headline */}
        <h1 className={`text-6xl md:text-8xl font-black mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="block">Ваші клієнти</span>
          <span className="block mt-2 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            записуються самі
          </span>
        </h1>

        {/* Subheadline */}
        <p className={`text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          Система, яка об'єднує Telegram-бота, CRM, складський облік та медичні протоколи в один інструмент
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Link
            href="/admin"
            className="group relative px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              Спробувати безкоштовно
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 shimmer" />
          </Link>

          <Link
            href="#features"
            className="px-8 py-4 glass-tinted rounded-2xl font-semibold text-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <Sparkles className="w-5 h-5 text-pink-600" />
            Переглянути функції
          </Link>
        </div>

        {/* Stats */}
        <div className={`mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {[
            { value: '24/7', label: 'Онлайн запис', icon: '🌙' },
            { value: '2', label: 'Telegram боти', icon: '🤖' },
            { value: '100%', label: 'Автоматизація', icon: '⚡' },
            { value: '500+', label: 'Спеціалістів', icon: '❤️' }
          ].map((stat, i) => (
            <div key={i} className="stagger-${i + 1}">
              <div className="glass-tinted rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-pink-400 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-pink-400 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
