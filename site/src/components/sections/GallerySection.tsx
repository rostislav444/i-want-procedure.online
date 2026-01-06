'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

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
}

export function GallerySection({ content, theme, company }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  const title = content.title || 'Галерея'
  const subtitle = content.subtitle
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

  if (images.length === 0) {
    return null
  }

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: 'var(--color-background-alt)' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>

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
      </div>
    </section>
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
    <div className={`grid ${gridCols} gap-4`}>
      {images.map((image, index) => (
        <div
          key={index}
          className="aspect-square overflow-hidden cursor-pointer group"
          style={{ borderRadius: theme.borderRadius.card }}
          onClick={() => onImageClick?.(index)}
        >
          <img
            src={image.url.startsWith('http') ? image.url : `${apiUrl}${image.url}`}
            alt={image.caption || `Gallery image ${index + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      ))}
    </div>
  )
}

function MasonryLayout({ images, theme, apiUrl, columns = 3, onImageClick }: LayoutProps) {
  // Split images into columns
  const columnArrays: GalleryImage[][] = Array.from({ length: columns }, () => [])
  images.forEach((image, index) => {
    columnArrays[index % columns].push(image)
  })

  return (
    <div className="flex gap-4">
      {columnArrays.map((column, colIndex) => (
        <div key={colIndex} className="flex-1 space-y-4">
          {column.map((image, imgIndex) => {
            const originalIndex = imgIndex * columns + colIndex
            return (
              <div
                key={imgIndex}
                className="overflow-hidden cursor-pointer group"
                style={{ borderRadius: theme.borderRadius.card }}
                onClick={() => onImageClick?.(originalIndex)}
              >
                <img
                  src={image.url.startsWith('http') ? image.url : `${apiUrl}${image.url}`}
                  alt={image.caption || `Gallery image ${originalIndex + 1}`}
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
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
    <div className="relative">
      <div
        className="aspect-[16/9] overflow-hidden"
        style={{ borderRadius: theme.borderRadius.card }}
      >
        <img
          src={images[current].url.startsWith('http') ? images[current].url : `${apiUrl}${images[current].url}`}
          alt={images[current].caption || `Gallery image ${current + 1}`}
          className="w-full h-full object-cover"
        />
        {images[current].caption && (
          <div
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
          >
            <p className="text-white text-center">{images[current].caption}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          >
            <ChevronLeft className="w-6 h-6" style={{ color: 'var(--color-text)' }} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          >
            <ChevronRight className="w-6 h-6" style={{ color: 'var(--color-text)' }} />
          </button>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: i === current ? 'var(--color-primary-500)' : 'var(--color-primary-200)',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-white bg-white/10"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white bg-white/10"
            onClick={(e) => { e.stopPropagation(); onPrev() }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white bg-white/10"
            onClick={(e) => { e.stopPropagation(); onNext() }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div className="max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={image.url.startsWith('http') ? image.url : `${apiUrl}${image.url}`}
          alt={image.caption || `Gallery image ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain mx-auto"
        />
        {image.caption && (
          <p className="text-white text-center mt-4">{image.caption}</p>
        )}
        <p className="text-white/60 text-center text-sm mt-2">
          {currentIndex + 1} / {images.length}
        </p>
      </div>
    </div>
  )
}
