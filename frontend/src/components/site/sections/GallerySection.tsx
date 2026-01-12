'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Camera } from 'lucide-react'
import { Company } from '../types'
import { IndustryTheme } from '../types'

interface GalleryImage {
  url: string
  caption?: string
}

interface GalleryContent {
  title?: string
  subtitle?: string
  images?: GalleryImage[]
  layout?: 'grid' | 'masonry' | 'slider'
  columns?: 2 | 3 | 4
}

interface Props {
  content: GalleryContent
  theme: IndustryTheme
  company: Company
  sectionIndex?: number
  isAltBackground?: boolean
}

export function GallerySection({ content, theme, company, isAltBackground = false }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  const title = content.title || 'Мої роботи'
  const subtitle = content.subtitle || 'Результати процедур'
  const images = content.images || []
  const layout = content.layout || 'grid'
  const columns = content.columns || 3

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const nextImage = () => setCurrentIndex((c) => (c + 1) % images.length)
  const prevImage = () => setCurrentIndex((c) => (c - 1 + images.length) % images.length)

  // Dynamic colors
  const bgColor = isAltBackground ? 'var(--color-background-alt)' : 'var(--color-background)'
  const textColor = isAltBackground ? 'var(--color-text-on-alt)' : 'var(--color-text)'
  const textMutedColor = isAltBackground ? 'var(--color-text-muted-on-alt)' : 'var(--color-text-muted)'

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Decorative gradient */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-10 pointer-events-none"
        style={{ background: 'var(--color-primary-500)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-accent)', color: textColor }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: textMutedColor }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Empty state or gallery */}
        {images.length === 0 ? (
          <EmptyState theme={theme} />
        ) : (
          <>
            {/* Gallery */}
            {layout === 'grid' && (
              <GridLayout
                images={images}
                theme={theme}
                apiUrl={apiUrl}
                columns={columns}
                onImageClick={openLightbox}
              />
            )}

            {layout === 'masonry' && (
              <MasonryLayout
                images={images}
                theme={theme}
                apiUrl={apiUrl}
                columns={columns}
                onImageClick={openLightbox}
              />
            )}

            {layout === 'slider' && (
              <SliderLayout
                images={images}
                theme={theme}
                apiUrl={apiUrl}
              />
            )}

            {/* Lightbox */}
            {lightboxOpen && (
              <Lightbox
                images={images}
                currentIndex={currentIndex}
                apiUrl={apiUrl}
                onClose={closeLightbox}
                onNext={nextImage}
                onPrev={prevImage}
              />
            )}
          </>
        )}
      </div>

    </section>
  )
}

function EmptyState({ theme }: { theme: IndustryTheme }) {
  return (
    <div
      className="max-w-2xl mx-auto text-center p-12"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: theme.borderRadius.card,
        boxShadow: theme.shadow.card,
      }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: 'var(--color-primary-100)' }}
      >
        <Camera className="w-10 h-10" style={{ color: 'var(--color-primary-500)' }} />
      </div>
      <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
        Фото скоро з'являться
      </h3>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Результати процедур будуть додані найближчим часом
      </p>
    </div>
  )
}

interface LayoutProps {
  images: GalleryImage[]
  theme: IndustryTheme
  apiUrl: string
  columns?: number
  onImageClick?: (index: number) => void
}

function GridLayout({ images, theme, apiUrl, columns = 3, onImageClick }: LayoutProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-2 md:grid-cols-3'

  return (
    <div className={`grid ${gridCols} gap-4 md:gap-6`}>
      {images.map((image, index) => (
        <div
          key={index}
          className="aspect-square overflow-hidden cursor-pointer group relative"
          style={{ borderRadius: theme.borderRadius.card }}
          onClick={() => onImageClick?.(index)}
        >
          <img
            src={image.url.startsWith('http') ? image.url : `${apiUrl}${image.url}`}
            alt={image.caption || `Gallery image ${index + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Hover overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          {/* Caption */}
          {image.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}
            >
              <p className="text-white text-sm">{image.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MasonryLayout({ images, theme, apiUrl, columns = 3, onImageClick }: LayoutProps) {
  const columnArrays: GalleryImage[][] = Array.from({ length: columns }, () => [])
  images.forEach((image, index) => {
    columnArrays[index % columns].push(image)
  })

  return (
    <div className="flex gap-4 md:gap-6">
      {columnArrays.map((column, colIndex) => (
        <div key={colIndex} className="flex-1 space-y-4 md:space-y-6">
          {column.map((image, imgIndex) => {
            const originalIndex = imgIndex * columns + colIndex
            return (
              <div
                key={imgIndex}
                className="overflow-hidden cursor-pointer group relative"
                style={{ borderRadius: theme.borderRadius.card }}
                onClick={() => onImageClick?.(originalIndex)}
              >
                <img
                  src={image.url.startsWith('http') ? image.url : `${apiUrl}${image.url}`}
                  alt={image.caption || `Gallery image ${originalIndex + 1}`}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.4)' }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary-500)' }}
                  >
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function SliderLayout({ images, theme, apiUrl }: LayoutProps) {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((c) => (c + 1) % images.length)
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)

  return (
    <div className="relative max-w-4xl mx-auto">
      <div
        className="aspect-[16/10] overflow-hidden"
        style={{ borderRadius: theme.borderRadius.card }}
      >
        <img
          src={images[current].url.startsWith('http') ? images[current].url : `${apiUrl}${images[current].url}`}
          alt={images[current].caption || `Gallery image ${current + 1}`}
          className="w-full h-full object-cover"
        />
        {images[current].caption && (
          <div
            className="absolute bottom-0 left-0 right-0 p-6"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}
          >
            <p className="text-white text-lg text-center">{images[current].caption}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
          >
            <ChevronLeft className="w-6 h-6" style={{ color: 'var(--color-text)' }} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
          >
            <ChevronRight className="w-6 h-6" style={{ color: 'var(--color-text)' }} />
          </button>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  backgroundColor: i === current ? 'var(--color-primary-500)' : 'var(--color-primary-200)',
                  transform: i === current ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface LightboxProps {
  images: GalleryImage[]
  currentIndex: number
  apiUrl: string
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

function Lightbox({ images, currentIndex, apiUrl, onClose, onNext, onPrev }: LightboxProps) {
  const image = images[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition-colors"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); onPrev() }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); onNext() }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div className="max-w-6xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={image.url.startsWith('http') ? image.url : `${apiUrl}${image.url}`}
          alt={image.caption || `Gallery image ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg"
        />
        {image.caption && (
          <p className="text-white text-center mt-6 text-lg">{image.caption}</p>
        )}
        <p className="text-white/50 text-center text-sm mt-2">
          {currentIndex + 1} / {images.length}
        </p>
      </div>
    </div>
  )
}
