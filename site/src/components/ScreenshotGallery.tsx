'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Screenshot {
  src: string
  title: string
  desc: string
}

const screenshots: Screenshot[] = [
  { src: '/screens/main.png', title: 'Головна панель', desc: 'Статистика та розклад на день' },
  { src: '/screens/appointments.png', title: 'Календар записів', desc: 'Перегляд по днях, тижнях, місяцях' },
  { src: '/screens/servioces.png', title: 'Каталог послуг', desc: 'Категорії, ціни, тривалість' },
  { src: '/screens/clients.png', title: 'База клієнтів', desc: 'Контакти та історія візитів' },
  { src: '/screens/client.png', title: 'Картка клієнта', desc: 'Детальна інформація та статистика' },
  { src: '/screens/schedule.png', title: 'Управління розкладом', desc: 'Робочі години та вихідні' },
]

export default function ScreenshotGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const openModal = (index: number) => {
    setSelectedIndex(index)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setSelectedIndex(null)
    document.body.style.overflow = ''
  }

  const goToPrevious = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === 0 ? screenshots.length - 1 : selectedIndex - 1)
  }

  const goToNext = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === screenshots.length - 1 ? 0 : selectedIndex + 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeModal()
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screenshots.map((screen, i) => (
          <button
            key={i}
            onClick={() => openModal(i)}
            className="group relative rounded-2xl overflow-hidden bg-card border border-pink-100 dark:border-pink-900/30 shadow-soft hover:shadow-xl transition-all hover:-translate-y-2 text-left cursor-pointer"
          >
            <div className="aspect-video overflow-hidden">
              <Image
                src={screen.src}
                alt={screen.title}
                width={600}
                height={400}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">{screen.title}</h3>
              <p className="text-sm text-muted-foreground">{screen.desc}</p>
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/10 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Content */}
          <div className="relative w-full max-w-6xl mx-4 animate-scale-in">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Закрити"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image container */}
            <div className="relative rounded-2xl overflow-hidden bg-white shadow-2xl">
              <Image
                src={screenshots[selectedIndex].src}
                alt={screenshots[selectedIndex].title}
                width={1920}
                height={1080}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Caption */}
            <div className="mt-4 text-center text-white">
              <h3 className="text-xl font-semibold">{screenshots[selectedIndex].title}</h3>
              <p className="text-white/70">{screenshots[selectedIndex].desc}</p>
              <p className="text-white/50 text-sm mt-2">
                {selectedIndex + 1} / {screenshots.length}
              </p>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={goToPrevious}
              className="absolute top-1/2 -left-4 md:-left-16 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              aria-label="Попередній"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={goToNext}
              className="absolute top-1/2 -right-4 md:-right-16 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              aria-label="Наступний"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
