'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { HexColorPicker } from 'react-colorful'
import { Eye, Layout, Type, Image, Users, Star, MessageSquare, HelpCircle, Megaphone, Grid, DollarSign, MapPin, Heart, ChevronRight, X, RotateCcw, Sun, Moon, ImageIcon, User, Sparkles, Monitor, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { companyApi, Company } from '@/lib/api'
import { getTheme, IndustryTheme } from '@/lib/themes'
import { generateShades, getContrastColor, hexToHsl } from '@/lib/colors'
import { HeroSection } from '@/components/site/sections/HeroSection'
import { ServicesSection } from '@/components/site/sections/ServicesSection'
import { AboutSection } from '@/components/site/sections/AboutSection'
import { TeamSection } from '@/components/site/sections/TeamSection'
import { GallerySection } from '@/components/site/sections/GallerySection'
import { TestimonialsSection } from '@/components/site/sections/TestimonialsSection'
import { BenefitsSection } from '@/components/site/sections/BenefitsSection'
import { FAQSection } from '@/components/site/sections/FAQSection'
import { ContactSection } from '@/components/site/sections/ContactSection'
import { CTASection } from '@/components/site/sections/CTASection'
import { PricingSection } from '@/components/site/sections/PricingSection'
import { MapSection } from '@/components/site/sections/MapSection'

// Demo images for previews
const demoImages = {
  masters: [
    'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop',
  ],
  backgrounds: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1920&h=1080&fit=crop',
  ],
  gallery: [
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552693673-1bf958298935?w=400&h=400&fit=crop',
  ],
}

// Mock company data for previews
const mockCompany = {
  id: 1,
  name: 'Центр краси "Аврора"',
  slug: 'aurora-beauty',
  description: 'Професійний догляд за вашою красою. Сучасні методики та індивідуальний підхід до кожного клієнта.',
  phone: '+380 67 123 45 67',
  address: 'м. Київ, вул. Хрещатик, 22',
  specialization: 'Косметологія',
  industry_theme: 'cosmetology',
  primary_color: '#e91e63',
  secondary_color: '#9c27b0',
  accent_color: '#f06292',
  cover_image_url: demoImages.backgrounds[0],
  logo_url: demoImages.masters[0],
}

// Mock services
const mockServices = [
  { id: 1, name: 'Чистка обличчя', description: 'Глибоке очищення шкіри', duration_minutes: 60, price: 1200, category_id: 1 },
  { id: 2, name: 'Мезотерапія', description: 'Омолодження шкіри', duration_minutes: 45, price: 1800, category_id: 1 },
  { id: 3, name: 'Пілінг', description: 'Хімічний пілінг', duration_minutes: 30, price: 800, category_id: 2 },
  { id: 4, name: 'Масаж обличчя', description: 'Розслаблюючий масаж', duration_minutes: 40, price: 600, category_id: 2 },
]

const mockCategories = [
  { id: 1, name: 'Догляд за обличчям' },
  { id: 2, name: 'Пілінги та маски' },
]

// Variant requirement types
type RequirementType = 'photo' | 'background' | 'text' | 'services' | 'team' | 'gallery' | 'testimonials' | 'faq' | 'benefits' | 'pricing'

interface VariantDef {
  id: string
  name: string
  description: string
  requirements?: RequirementType[]
}

// Section type definitions with variants and requirements
const sectionTypes: Array<{
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  variants: VariantDef[]
}> = [
  {
    id: 'hero',
    name: 'Hero',
    description: 'Головна секція з заголовком, описом та кнопкою дії',
    icon: Layout,
    variants: [
      { id: 'modern', name: 'Modern', description: 'Асиметричний дизайн з картками', requirements: ['text', 'photo'] },
      { id: 'gradient', name: 'Gradient', description: 'Яскравий градієнтний фон', requirements: ['text', 'background'] },
      { id: 'minimal', name: 'Minimal', description: 'Чистий мінімалістичний стиль', requirements: ['text'] },
      { id: 'split', name: 'Split', description: '50/50 текст та зображення', requirements: ['text', 'photo'] },
      { id: 'stats', name: 'Stats', description: 'З великими статистичними числами', requirements: ['text', 'background'] },
      { id: 'cards', name: 'Cards', description: 'З плаваючими картками послуг', requirements: ['text', 'services', 'background'] },
      { id: 'testimonial', name: 'Testimonial', description: 'З відгуком клієнта', requirements: ['text', 'testimonials', 'background'] },
      { id: 'elegant', name: 'Elegant', description: 'Елегантний люксовий стиль', requirements: ['text', 'background'] },
    ],
  },
  {
    id: 'services',
    name: 'Послуги',
    description: 'Каталог послуг з цінами та описом',
    icon: Grid,
    variants: [
      { id: 'bento', name: 'Bento', description: 'Асиметрична сітка карток', requirements: ['services'] },
      { id: 'grid', name: 'Grid', description: 'Рівна сітка карток', requirements: ['services'] },
      { id: 'cards', name: 'Cards', description: 'Горизонтальні картки', requirements: ['services'] },
      { id: 'list', name: 'List', description: 'Компактний список по категоріях', requirements: ['services'] },
    ],
  },
  {
    id: 'about',
    name: 'Про нас',
    description: 'Інформація про компанію або спеціаліста',
    icon: Type,
    variants: [
      { id: 'text-only', name: 'Text Only', description: 'Тільки текст по центру', requirements: ['text'] },
      { id: 'image-left', name: 'Image Left', description: 'Зображення зліва', requirements: ['text', 'photo'] },
      { id: 'image-right', name: 'Image Right', description: 'Зображення справа', requirements: ['text', 'photo'] },
    ],
  },
  {
    id: 'team',
    name: 'Команда',
    description: 'Список спеціалістів з фото та описом',
    icon: Users,
    variants: [
      { id: 'grid', name: 'Grid', description: 'Сітка карток команди', requirements: ['team'] },
      { id: 'carousel', name: 'Carousel', description: 'Карусель з фото', requirements: ['team'] },
      { id: 'featured', name: 'Featured', description: 'Виділений спеціаліст', requirements: ['team', 'photo'] },
    ],
  },
  {
    id: 'gallery',
    name: 'Галерея',
    description: 'Фотогалерея робіт',
    icon: Image,
    variants: [
      { id: 'grid', name: 'Grid', description: 'Рівна сітка', requirements: ['gallery'] },
      { id: 'masonry', name: 'Masonry', description: 'Мозаїчна сітка', requirements: ['gallery'] },
      { id: 'slider', name: 'Slider', description: 'Горизонтальний слайдер', requirements: ['gallery'] },
    ],
  },
  {
    id: 'testimonials',
    name: 'Відгуки',
    description: 'Відгуки клієнтів',
    icon: Star,
    variants: [
      { id: 'carousel', name: 'Carousel', description: 'Карусель відгуків', requirements: ['testimonials'] },
      { id: 'grid', name: 'Grid', description: 'Сітка карток', requirements: ['testimonials'] },
      { id: 'stacked', name: 'Stacked', description: 'Вертикальний список', requirements: ['testimonials'] },
    ],
  },
  {
    id: 'benefits',
    name: 'Переваги',
    description: 'Список переваг вашого сервісу',
    icon: Heart,
    variants: [
      { id: 'grid', name: 'Grid', description: 'Сітка з іконками', requirements: ['benefits'] },
      { id: 'list', name: 'List', description: 'Список з описами', requirements: ['benefits'] },
      { id: 'alternating', name: 'Alternating', description: 'Чередування ліво/право', requirements: ['benefits'] },
    ],
  },
  {
    id: 'faq',
    name: 'FAQ',
    description: 'Часті запитання та відповіді',
    icon: HelpCircle,
    variants: [
      { id: 'accordion', name: 'Accordion', description: 'Розгортаємий список', requirements: ['faq'] },
      { id: 'grid', name: 'Grid', description: 'Сітка карток', requirements: ['faq'] },
    ],
  },
  {
    id: 'contact',
    name: 'Контакти',
    description: 'Контактна інформація',
    icon: MessageSquare,
    variants: [
      { id: 'default', name: 'Default', description: 'Стандартний вигляд', requirements: ['text'] },
    ],
  },
  {
    id: 'cta',
    name: 'CTA',
    description: 'Заклик до дії з кнопкою',
    icon: Megaphone,
    variants: [
      { id: 'gradient', name: 'Gradient', description: 'Градієнтний фон', requirements: ['text'] },
      { id: 'solid', name: 'Solid', description: 'Однотонний фон', requirements: ['text'] },
      { id: 'image', name: 'Image', description: 'З фоновим зображенням', requirements: ['text', 'background'] },
    ],
  },
  {
    id: 'pricing',
    name: 'Ціни',
    description: 'Прайс-лист або тарифи',
    icon: DollarSign,
    variants: [
      { id: 'default', name: 'Default', description: 'Картки тарифів', requirements: ['pricing'] },
    ],
  },
  {
    id: 'map',
    name: 'Карта',
    description: 'Інтерактивна карта з місцезнаходженням',
    icon: MapPin,
    variants: [
      { id: 'default', name: 'Default', description: 'Карта з адресою', requirements: ['text'] },
    ],
  },
]

// Requirement labels and icons
const requirementLabels: Record<RequirementType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  photo: { label: 'Фото', icon: User },
  background: { label: 'Фон', icon: ImageIcon },
  text: { label: 'Текст', icon: Type },
  services: { label: 'Послуги', icon: Grid },
  team: { label: 'Команда', icon: Users },
  gallery: { label: 'Галерея', icon: Image },
  testimonials: { label: 'Відгуки', icon: Star },
  faq: { label: 'FAQ', icon: HelpCircle },
  benefits: { label: 'Переваги', icon: Sparkles },
  pricing: { label: 'Ціни', icon: DollarSign },
}

// 24 preset accent colors
const accentColors = [
  // Reds & Pinks
  '#e91e63', '#f44336', '#ff4081', '#ec407a',
  // Purples
  '#9c27b0', '#673ab7', '#7c4dff', '#ab47bc',
  // Blues
  '#2196f3', '#03a9f4', '#00bcd4', '#3f51b5',
  // Greens
  '#4caf50', '#8bc34a', '#009688', '#00e676',
  // Oranges & Yellows
  '#ff9800', '#ff5722', '#ffc107', '#ffab00',
  // Neutrals & Others
  '#795548', '#607d8b', '#9e9e9e', '#000000',
]

// Light mode background colors
const lightBackgrounds = [
  '#ffffff', '#fafafa', '#f5f5f5', '#f0f0f0',
  '#fff8f8', '#f8fff8', '#f8f8ff', '#fffef8',
  '#fdf2f8', '#f0f9ff', '#f0fdf4', '#fefce8',
]

// Dark mode background colors
const darkBackgrounds = [
  '#1a1a2e', '#16213e', '#0f0f23', '#1e1e1e',
  '#121212', '#1a1a1a', '#2d2d2d', '#0d1117',
  '#1f2937', '#111827', '#18181b', '#0c0a09',
]

// Reusable Color Picker Component
function ColorPicker({
  colors,
  value,
  onChange,
  columns = 6,
  showCustom = true,
}: {
  colors: string[]
  value: string
  onChange: (color: string) => void
  columns?: number
  showCustom?: boolean
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const size = 32
  const gap = 8
  const padding = 12
  const width = columns * size + (columns - 1) * gap + padding * 2

  return (
    <div
      className="absolute top-full left-0 mt-2 rounded-xl shadow-xl border bg-popover border-border"
      style={{ width: showAdvanced ? 232 : width, padding, zIndex: 9999 }}
      onClick={(e) => e.stopPropagation()}
    >
      {!showAdvanced ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, ${size}px)`,
              gap,
            }}
          >
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => onChange(color)}
                style={{
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: 8,
                  border: value === color ? '2px solid var(--ring)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
          </div>
          {showCustom && (
            <button
              onClick={() => setShowAdvanced(true)}
              className="w-full mt-2 pt-2 border-t border-border text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Вибрати інший колір...
            </button>
          )}
        </>
      ) : (
        <div style={{ width: 208 }}>
          <HexColorPicker color={value} onChange={onChange} style={{ width: '100%', height: 160 }} />
          <div className="flex items-center gap-2 mt-3">
            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: value,
                borderRadius: 6,
                border: '1px solid var(--border)',
              }}
            />
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const val = e.target.value
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) onChange(val)
              }}
              className="flex-1 px-2 py-1 text-sm rounded border border-border bg-background text-foreground font-mono"
              placeholder="#000000"
            />
          </div>
          <button
            onClick={() => setShowAdvanced(false)}
            className="w-full mt-2 pt-2 border-t border-border text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            ← Назад до пресетів
          </button>
        </div>
      )}
    </div>
  )
}

// Reusable Image Picker Component
function ImagePicker({
  images,
  value,
  onChange,
  columns = 3,
  imageSize = 48,
  uploadedCount = 0,
}: {
  images: string[]
  value: string
  onChange: (img: string) => void
  columns?: number
  imageSize?: number
  uploadedCount?: number // Number of uploaded images at the start of the list
}) {
  const gap = 8
  const padding = 8
  const width = columns * imageSize + (columns - 1) * gap + padding * 2

  return (
    <div
      className="absolute top-full left-0 mt-2 rounded-xl shadow-xl border bg-popover border-border"
      style={{ width, padding, zIndex: 9999 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Uploaded images label */}
      {uploadedCount > 0 && (
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span>Ваші зображення</span>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, ${imageSize}px)`,
          gap,
        }}
      >
        {images.map((img, idx) => {
          const isUploaded = idx < uploadedCount
          return (
            <button
              key={idx}
              onClick={() => onChange(img)}
              className="relative"
              style={{
                width: imageSize,
                height: imageSize,
                borderRadius: 8,
                overflow: 'hidden',
                border: value === img ? '2px solid var(--ring)' : isUploaded ? '2px solid #22c55e' : '1px solid var(--border)',
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <img src={img} alt={`Option ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {isUploaded && (
                <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
      {/* Demo images label */}
      {uploadedCount > 0 && uploadedCount < images.length && (
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
          Демо зображення
        </div>
      )}
    </div>
  )
}

// Generate theme styles from colors
function generateThemeStyles(primaryColor: string, secondaryColor: string, backgroundColor: string): React.CSSProperties {
  const primary = generateShades(primaryColor)
  const secondary = generateShades(secondaryColor)
  const bg = generateShades(backgroundColor)

  const primaryContrast = getContrastColor(primaryColor)
  const bgHsl = hexToHsl(backgroundColor)
  const isDarkBackground = bgHsl.l < 50

  const textColor = isDarkBackground ? '#f9fafb' : '#1a1a1a'
  const textMuted = isDarkBackground ? '#9ca3af' : '#666666'
  const surfaceColor = isDarkBackground ? '#1f2937' : '#ffffff'
  const backgroundAlt = isDarkBackground ? bg[100] : bg[100]

  return {
    ['--color-primary-50' as string]: primary[50],
    ['--color-primary-100' as string]: primary[100],
    ['--color-primary-200' as string]: primary[200],
    ['--color-primary-300' as string]: primary[300],
    ['--color-primary-400' as string]: primary[400],
    ['--color-primary-500' as string]: primary[500],
    ['--color-primary-600' as string]: primary[600],
    ['--color-primary-700' as string]: primary[700],
    ['--color-primary-contrast' as string]: primaryContrast,
    ['--color-secondary-100' as string]: secondary[100],
    ['--color-secondary-200' as string]: secondary[200],
    ['--color-secondary-500' as string]: secondary[500],
    ['--color-background' as string]: backgroundColor,
    ['--color-background-alt' as string]: backgroundAlt,
    ['--color-surface' as string]: surfaceColor,
    ['--color-surface-border' as string]: isDarkBackground ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    ['--color-surface-on-alt' as string]: '#ffffff',
    ['--color-text' as string]: textColor,
    ['--color-text-muted' as string]: textMuted,
    ['--color-text-on-alt' as string]: '#1a1a1a',
    ['--color-text-muted-on-alt' as string]: '#666666',
    ['--font-accent' as string]: "'Inter', sans-serif",
    ['--font-body' as string]: "'Inter', sans-serif",
    ['--shadow-card' as string]: '0 10px 40px rgba(0, 0, 0, 0.06)',
    ['--shadow-elevated' as string]: '0 20px 60px rgba(0, 0, 0, 0.08)',
  }
}

// Component to render section preview
function SectionPreview({
  sectionType,
  variant,
  theme,
  selectedPhoto,
  selectedBackground,
  heroSettings,
}: {
  sectionType: string
  variant: string
  theme: IndustryTheme
  selectedPhoto?: string
  selectedBackground?: string
  heroSettings?: HeroBackgroundSettings
}) {
  const content = getContentForSection(sectionType, variant, selectedPhoto, selectedBackground, heroSettings)

  switch (sectionType) {
    case 'hero':
      return (
        <HeroSection
          content={{ ...content, style: variant } as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={false}
        />
      )
    case 'services':
      return (
        <ServicesSection
          content={{ ...content, display_mode: variant } as any}
          theme={theme}
          company={mockCompany as any}
          services={mockServices as any}
          categories={mockCategories as any}
          sectionIndex={0}
          isAltBackground={false}
        />
      )
    case 'about':
      return (
        <AboutSection
          content={{ ...content, layout: variant } as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={true}
        />
      )
    case 'team':
      return (
        <TeamSection
          content={{ ...content, layout: variant } as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={false}
        />
      )
    case 'gallery':
      return (
        <GallerySection
          content={{ ...content, layout: variant } as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={true}
        />
      )
    case 'testimonials':
      return (
        <TestimonialsSection
          content={{ ...content, layout: variant } as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={false}
        />
      )
    case 'benefits':
      return (
        <BenefitsSection
          content={{ ...content, layout: variant } as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={true}
        />
      )
    case 'faq':
      return (
        <FAQSection
          content={{ ...content, layout: variant } as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={false}
        />
      )
    case 'contact':
      return (
        <ContactSection
          content={content as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={true}
        />
      )
    case 'cta':
      return (
        <CTASection
          content={{ ...content, background: variant } as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={false}
        />
      )
    case 'pricing':
      return (
        <PricingSection
          content={content as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={true}
        />
      )
    case 'map':
      return (
        <MapSection
          content={content as any}
          theme={theme}
          company={mockCompany as any}
          sectionIndex={0}
          isAltBackground={false}
        />
      )
    default:
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <p className="text-gray-500">Preview not available</p>
        </div>
      )
  }
}

// Hero background settings interface
interface HeroBackgroundSettings {
  backgroundMode: HeroBackgroundMode
  gradientType: HeroGradientType
  gradientColor: HeroGradientColor
  overlayEnabled: boolean
  overlayOpacity: number
}

// Get mock content for each section type
function getContentForSection(
  sectionType: string,
  variant: string,
  selectedPhoto?: string,
  selectedBackground?: string,
  heroSettings?: HeroBackgroundSettings
): Record<string, unknown> {
  switch (sectionType) {
    case 'hero':
      // Variants that use person/product images: modern, split
      const usePhoto = variant === 'split' || variant === 'modern' || variant === 'asymmetric'
      // Variants that use background images: elegant, gradient, stats, cards, testimonial
      const useBackground = variant === 'elegant' || variant === 'gradient' || variant === 'stats' || variant === 'cards' || variant === 'testimonial'
      return {
        title: 'Центр краси "Аврора"',
        subtitle: 'Професійний догляд за вашою красою',
        cta_text: 'Записатися',
        image: usePhoto ? (selectedPhoto || demoImages.masters[0]) : undefined,
        background_image: useBackground ? (selectedBackground || demoImages.backgrounds[0]) : undefined,
        // Hero background settings
        background_mode: heroSettings?.backgroundMode || 'image',
        gradient_type: heroSettings?.gradientType || 'none',
        gradient_color: heroSettings?.gradientColor || 'black',
        overlay_enabled: heroSettings?.overlayEnabled ?? true,
        overlay_opacity: heroSettings?.overlayOpacity ?? 40,
      }
    case 'services':
      return {
        title: 'Наші послуги',
        subtitle: 'Професійний догляд для вашої краси',
      }
    case 'about':
      return {
        title: 'Про нас',
        subtitle: 'Ваша краса - наша місія',
        text: 'Ми працюємо для вашої краси вже понад 10 років. Наша команда професіоналів допоможе вам виглядати чудово.',
        image: variant !== 'text-only' ? (selectedPhoto || demoImages.masters[0]) : undefined,
        highlights: [
          { icon: 'star', title: '10+ років', description: 'досвіду роботи' },
          { icon: 'heart', title: '500+', description: 'задоволених клієнтів' },
          { icon: 'award', title: 'Топ-10', description: 'салонів Києва' },
        ],
      }
    case 'team':
      return {
        title: 'Наша команда',
        subtitle: 'Професіонали своєї справи',
        members: [
          { name: 'Олена Петренко', role: 'Косметолог', description: '10 років досвіду', photo: demoImages.masters[0] },
          { name: 'Марія Іваненко', role: 'Дерматолог', description: '8 років досвіду', photo: demoImages.masters[1] },
          { name: 'Анна Коваленко', role: 'Візажист', description: '5 років досвіду', photo: demoImages.masters[2] },
        ],
      }
    case 'gallery':
      return {
        title: 'Наші роботи',
        subtitle: 'Результати, якими ми пишаємось',
        images: demoImages.gallery.map((url) => ({ url, caption: 'Результат процедури' })),
      }
    case 'testimonials':
      return {
        title: 'Відгуки клієнтів',
        subtitle: 'Що кажуть про нас',
        testimonials: [
          { author: 'Олена К.', text: 'Чудовий салон! Рекомендую всім. Професійний підхід та чудовий результат.', rating: 5 },
          { author: 'Марія П.', text: 'Професійний підхід та затишна атмосфера. Завжди приємно відвідувати.', rating: 5 },
          { author: 'Анна С.', text: 'Завжди задоволена результатом! Рекомендую усім своїм подругам.', rating: 5 },
        ],
      }
    case 'benefits':
      return {
        title: 'Чому обирають нас',
        subtitle: 'Наші переваги',
        benefits: [
          { icon: 'star', title: 'Якість', description: 'Тільки сертифіковані препарати' },
          { icon: 'heart', title: 'Турбота', description: 'Індивідуальний підхід' },
          { icon: 'award', title: 'Досвід', description: '10+ років на ринку' },
          { icon: 'sparkles', title: 'Результат', description: 'Гарантований ефект' },
        ],
      }
    case 'faq':
      return {
        title: 'Часті запитання',
        subtitle: 'Відповіді на популярні питання',
        items: [
          { question: 'Як записатися на процедуру?', answer: 'Ви можете записатися через наш бот у Telegram або зателефонувати.' },
          { question: 'Чи є знижки?', answer: 'Так, ми пропонуємо знижки для постійних клієнтів.' },
          { question: 'Скільки триває процедура?', answer: 'Тривалість залежить від типу процедури, від 30 хв до 2 годин.' },
        ],
      }
    case 'contact':
      return {
        title: "Зв'яжіться з нами",
        subtitle: 'Ми завжди раді вам допомогти',
      }
    case 'cta':
      return {
        title: 'Готові до перетворень?',
        subtitle: 'Запишіться на безкоштовну консультацію',
        button_text: 'Записатися зараз',
        background_image: variant === 'image' ? (selectedBackground || demoImages.backgrounds[1]) : undefined,
      }
    case 'pricing':
      return {
        title: 'Наші ціни',
        subtitle: 'Прозора цінова політика',
        plans: [
          { name: 'Базовий', price: '1000', features: ['Консультація', 'Базовий догляд'], cta_text: 'Обрати' },
          { name: 'Стандарт', price: '2000', features: ['Консультація', 'Повний догляд', 'Маска'], highlighted: true, cta_text: 'Обрати' },
          { name: 'Преміум', price: '3500', features: ['Консультація', 'VIP догляд', 'Масаж', 'Маска'], cta_text: 'Обрати' },
        ],
      }
    case 'map':
      return {
        title: 'Як нас знайти',
        subtitle: 'Ми знаходимось у центрі міста',
      }
    default:
      return {}
  }
}

// Component theme mode type
type ComponentThemeMode = 'auto' | 'light' | 'dark'

// Hero background settings types
type HeroBackgroundMode = 'image' | 'primary' | 'secondary' | 'background'
type HeroGradientType = 'none' | 'top-bottom' | 'bottom-top' | 'left-right' | 'right-left' | 'perimeter' | 'vignette' | 'vignette-inverse'
type HeroGradientColor = 'black' | 'white' | 'primary' | 'secondary' | 'background'

export default function ComponentsLibraryPage() {
  const [selectedPreview, setSelectedPreview] = useState<{ sectionType: string; variant: string } | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)

  // Fetch company data for uploaded images
  useEffect(() => {
    companyApi.getMyCompany()
      .then((c) => {
        setCompany(c)
        // Auto-select uploaded images if available
        const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'
        if (c.logo_url) {
          setSelectedPhoto(`${apiUrl}${c.logo_url}`)
        }
        if (c.cover_image_url) {
          setSelectedBackground(`${apiUrl}${c.cover_image_url}`)
        }
      })
      .catch(console.error)
  }, [])

  // Track scroll for floating header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Use global theme from admin
  const { theme: globalTheme } = useTheme()

  // Component theme mode: auto (follows admin), always light, always dark
  const [componentTheme, setComponentTheme] = useState<ComponentThemeMode>('auto')

  // Determine if components should be dark based on componentTheme setting
  const isComponentDark = componentTheme === 'auto'
    ? globalTheme === 'dark'
    : componentTheme === 'dark'

  // Color customization state for preview components
  const [primaryColor, setPrimaryColor] = useState('#e91e63')
  const [secondaryColor, setSecondaryColor] = useState('#9c27b0')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [showColorPicker, setShowColorPicker] = useState<'primary' | 'secondary' | 'background' | null>(null)

  // Demo images selection
  const [selectedPhoto, setSelectedPhoto] = useState(demoImages.masters[0])
  const [selectedBackground, setSelectedBackground] = useState(demoImages.backgrounds[0])
  const [showImagePicker, setShowImagePicker] = useState<'photo' | 'background' | null>(null)

  // Hero background settings
  const [heroBackgroundMode, setHeroBackgroundMode] = useState<HeroBackgroundMode>('image')
  const [heroGradientType, setHeroGradientType] = useState<HeroGradientType>('none')
  const [heroGradientColor, setHeroGradientColor] = useState<HeroGradientColor>('black')
  const [heroOverlayEnabled, setHeroOverlayEnabled] = useState(true)
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState(40)

  const theme = useMemo(() => getTheme('cosmetology'), [])

  // Generate dynamic theme styles for preview components
  const themeStyles = useMemo(
    () => generateThemeStyles(primaryColor, secondaryColor, backgroundColor),
    [primaryColor, secondaryColor, backgroundColor]
  )

  const resetColors = useCallback(() => {
    setPrimaryColor('#e91e63')
    setSecondaryColor('#9c27b0')
    setBackgroundColor(isComponentDark ? '#1a1a2e' : '#ffffff')
  }, [isComponentDark])

  // Change component theme mode
  const cycleComponentTheme = useCallback(() => {
    const modes: ComponentThemeMode[] = ['auto', 'light', 'dark']
    const currentIndex = modes.indexOf(componentTheme)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setComponentTheme(nextMode)

    // Update background color based on new mode
    const willBeDark = nextMode === 'auto' ? globalTheme === 'dark' : nextMode === 'dark'
    setBackgroundColor(willBeDark ? '#1a1a2e' : '#ffffff')
  }, [componentTheme, globalTheme])

  // Get available background colors based on component theme
  const availableBackgrounds = isComponentDark ? darkBackgrounds : lightBackgrounds

  // Build image lists with uploaded images first
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  const availablePhotos = useMemo(() => {
    const uploaded: string[] = []
    if (company?.logo_url) {
      uploaded.push(`${apiUrl}${company.logo_url}`)
    }
    return [...uploaded, ...demoImages.masters]
  }, [company?.logo_url, apiUrl])

  const availableBackgroundImages = useMemo(() => {
    const uploaded: string[] = []
    if (company?.cover_image_url) {
      uploaded.push(`${apiUrl}${company.cover_image_url}`)
    }
    return [...uploaded, ...demoImages.backgrounds]
  }, [company?.cover_image_url, apiUrl])

  const uploadedPhotoCount = company?.logo_url ? 1 : 0
  const uploadedBackgroundCount = company?.cover_image_url ? 1 : 0

  // Flatten sections with variants for display
  const allComponents = useMemo(() => {
    const components: Array<{
      sectionType: (typeof sectionTypes)[0]
      variant: (typeof sectionTypes)[0]['variants'][0]
    }> = []

    sectionTypes.forEach((section) => {
      section.variants.forEach((variant) => {
        components.push({ sectionType: section, variant })
      })
    })

    return components
  }, [])

  const filteredSections = filter ? sectionTypes.filter((s) => s.id === filter) : sectionTypes

  return (
    <div className="min-h-screen -m-6">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Бібліотека компонентів</h1>
              <p className="text-sm text-muted-foreground">{allComponents.length} варіантів секцій</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/website" className="px-3 py-1.5 rounded-lg text-sm transition-colors text-muted-foreground bg-muted hover:bg-muted/80">
                Налаштування
              </Link>
              <Link
                href="/admin/website/builder"
                className="px-3 py-1.5 text-sm text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-1.5"
              >
                <Layout className="w-4 h-4" />
                Редактор
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Color customization bar */}
      <div
        className={`sticky transition-all duration-300 ease-out ${showColorPicker || showImagePicker ? 'z-50' : 'z-20'}`}
        style={{
          top: isScrolled ? 8 : 0,
          padding: isScrolled ? '0 8px' : '0',
        }}
      >
        <div
          className="transition-all duration-300 ease-out"
          style={{
            backgroundColor: 'hsl(var(--background))',
            borderRadius: isScrolled ? 12 : 0,
            border: isScrolled ? '1px solid hsl(var(--border))' : 'none',
            borderBottom: '1px solid hsl(var(--border))',
            boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none',
            padding: isScrolled ? '8px 16px' : '6px 16px',
          }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            {/* Component theme mode toggle */}
            <button
              onClick={cycleComponentTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors bg-muted text-foreground hover:bg-muted/80"
              title={`Тема компонентів: ${componentTheme === 'auto' ? 'Авто' : componentTheme === 'light' ? 'Світла' : 'Темна'}`}
            >
              {componentTheme === 'auto' ? (
                <Monitor className="w-4 h-4" />
              ) : componentTheme === 'light' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {componentTheme === 'auto' ? 'Авто' : componentTheme === 'light' ? 'Світла' : 'Темна'}
              </span>
            </button>

            <div className="h-6 w-px bg-border" />

            {/* Primary color */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Акцент:</span>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowImagePicker(null)
                    setShowColorPicker(showColorPicker === 'primary' ? null : 'primary')
                  }}
                  className="w-8 h-8 rounded-lg border-2 border-white shadow-md hover:scale-105 transition-transform"
                  style={{ backgroundColor: primaryColor }}
                />
                {showColorPicker === 'primary' && (
                  <ColorPicker
                    colors={accentColors}
                    value={primaryColor}
                    onChange={setPrimaryColor}
                    columns={6}
                  />
                )}
              </div>
            </div>

            {/* Secondary color */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Вторинний:</span>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowImagePicker(null)
                    setShowColorPicker(showColorPicker === 'secondary' ? null : 'secondary')
                  }}
                  className="w-8 h-8 rounded-lg border-2 border-white shadow-md hover:scale-105 transition-transform"
                  style={{ backgroundColor: secondaryColor }}
                />
                {showColorPicker === 'secondary' && (
                  <ColorPicker
                    colors={accentColors}
                    value={secondaryColor}
                    onChange={setSecondaryColor}
                    columns={6}
                  />
                )}
              </div>
            </div>

            {/* Background color */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Фон:</span>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowImagePicker(null)
                    setShowColorPicker(showColorPicker === 'background' ? null : 'background')
                  }}
                  className="w-8 h-8 rounded-lg border-2 shadow-md hover:scale-105 transition-transform border-border"
                  style={{ backgroundColor: backgroundColor }}
                />
                {showColorPicker === 'background' && (
                  <ColorPicker
                    colors={availableBackgrounds}
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                    columns={4}
                  />
                )}
              </div>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Demo photo picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Фото:</span>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowColorPicker(null)
                    setShowImagePicker(showImagePicker === 'photo' ? null : 'photo')
                  }}
                  className="w-8 h-8 rounded-lg border-2 shadow-md hover:scale-105 transition-transform border-border overflow-hidden"
                >
                  <img src={selectedPhoto} alt="Demo" className="w-full h-full object-cover" />
                </button>
                {showImagePicker === 'photo' && (
                  <ImagePicker
                    images={availablePhotos}
                    value={selectedPhoto}
                    onChange={setSelectedPhoto}
                    columns={3}
                    imageSize={48}
                    uploadedCount={uploadedPhotoCount}
                  />
                )}
              </div>
            </div>

            {/* Demo background picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Обої:</span>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowColorPicker(null)
                    setShowImagePicker(showImagePicker === 'background' ? null : 'background')
                  }}
                  className="w-8 h-8 rounded-lg border-2 shadow-md hover:scale-105 transition-transform border-border overflow-hidden"
                >
                  <img src={selectedBackground} alt="Background" className="w-full h-full object-cover" />
                </button>
                {showImagePicker === 'background' && (
                  <ImagePicker
                    images={availableBackgroundImages}
                    value={selectedBackground}
                    onChange={setSelectedBackground}
                    columns={3}
                    imageSize={56}
                    uploadedCount={uploadedBackgroundCount}
                  />
                )}
              </div>
            </div>

            {/* Reset button */}
            <button onClick={resetColors} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto">
              <RotateCcw className="w-3 h-3" />
              Скинути
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close pickers */}
      {(showColorPicker || showImagePicker) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowColorPicker(null)
            setShowImagePicker(null)
          }}
        />
      )}

      {/* Filter tabs */}
      <div className="border-b border-border relative z-0">
        <div className="px-4">
          <div className="flex gap-1.5 py-2 overflow-x-auto">
            <button
              onClick={() => setFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === null ? 'bg-pink-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Всі ({allComponents.length})
            </button>
            {sectionTypes.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setFilter(filter === section.id ? null : section.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    filter === section.id ? 'bg-pink-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {section.name} ({section.variants.length})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 relative z-0">
        {/* Sections grouped by type */}
        {filteredSections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.id} className="mb-8">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/10">
                  <Icon className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{section.name}</h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{section.variants.length} варіантів</span>
                </div>
              </div>

              {/* Hero background settings - only for hero section */}
              {section.id === 'hero' && (
                <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Background mode */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">Фон:</span>
                      <select
                        value={heroBackgroundMode}
                        onChange={(e) => setHeroBackgroundMode(e.target.value as HeroBackgroundMode)}
                        className="px-2 py-1 text-xs rounded-lg border border-border bg-background text-foreground"
                      >
                        <option value="image">Зображення</option>
                        <option value="primary">Акцентний колір</option>
                        <option value="secondary">Вторинний колір</option>
                        <option value="background">Колір фону</option>
                      </select>
                    </div>

                    <div className="h-5 w-px bg-border" />

                    {/* Gradient type */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">Градієнт:</span>
                      <select
                        value={heroGradientType}
                        onChange={(e) => setHeroGradientType(e.target.value as HeroGradientType)}
                        className="px-2 py-1 text-xs rounded-lg border border-border bg-background text-foreground"
                      >
                        <option value="none">Немає</option>
                        <option value="top-bottom">Верх → Низ</option>
                        <option value="bottom-top">Низ → Верх</option>
                        <option value="left-right">Ліво → Право</option>
                        <option value="right-left">Право → Ліво</option>
                        <option value="perimeter">Периметр</option>
                        <option value="vignette">Віньєтка</option>
                        <option value="vignette-inverse">Віньєтка (інверс)</option>
                      </select>
                    </div>

                    {/* Gradient color */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">Колір:</span>
                      <select
                        value={heroGradientColor}
                        onChange={(e) => setHeroGradientColor(e.target.value as HeroGradientColor)}
                        className="px-2 py-1 text-xs rounded-lg border border-border bg-background text-foreground"
                      >
                        <option value="black">Чорний</option>
                        <option value="white">Білий</option>
                        <option value="primary">Акцентний</option>
                        <option value="secondary">Вторинний</option>
                        <option value="background">Фон</option>
                      </select>
                    </div>

                    <div className="h-5 w-px bg-border" />

                    {/* Overlay toggle and opacity */}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={heroOverlayEnabled}
                          onChange={(e) => setHeroOverlayEnabled(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-border accent-pink-500"
                        />
                        Overlay
                      </label>
                      {heroOverlayEnabled && (
                        <>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={heroOverlayOpacity}
                            onChange={(e) => setHeroOverlayOpacity(Number(e.target.value))}
                            className="w-20 h-1 accent-pink-500"
                          />
                          <span className="text-xs text-muted-foreground w-8">{heroOverlayOpacity}%</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Variants grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {section.variants.map((variant) => (
                  <div
                    key={`${section.id}-${variant.id}`}
                    className="rounded-xl border shadow-sm hover:shadow-lg transition-all overflow-hidden group cursor-pointer bg-card border-border hover:border-ring"
                    onClick={() => setSelectedPreview({ sectionType: section.id, variant: variant.id })}
                  >
                    {/* Preview thumbnail */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted" style={themeStyles}>
                      <div
                        className="absolute inset-0 origin-top-left"
                        style={{
                          transform: 'scale(0.25)',
                          width: '400%',
                          height: '400%',
                          pointerEvents: 'none',
                        }}
                      >
                        <SectionPreview sectionType={section.id} variant={variant.id} theme={theme} selectedPhoto={selectedPhoto} selectedBackground={selectedBackground} heroSettings={{ backgroundMode: heroBackgroundMode, gradientType: heroGradientType, gradientColor: heroGradientColor, overlayEnabled: heroOverlayEnabled, overlayOpacity: heroOverlayOpacity }} />
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors">
                          <Eye className="w-4 h-4" />
                          Переглянути
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm text-foreground">{variant.name}</h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
                      </div>
                      <p className="text-xs mb-2 text-muted-foreground">{variant.description}</p>

                      {/* Requirements tags */}
                      {variant.requirements && variant.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {variant.requirements.map((req) => {
                            const { label, icon: ReqIcon } = requirementLabels[req]
                            return (
                              <span key={req} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                                <ReqIcon className="w-3 h-3" />
                                {label}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Full Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-auto" onClick={() => setSelectedPreview(null)}>
          <div className="w-full max-w-6xl my-8 mx-4">
            {/* Modal header */}
            <div className="rounded-t-2xl px-6 py-4 flex items-center justify-between sticky top-8 z-10 bg-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4">
                {(() => {
                  const section = sectionTypes.find((s) => s.id === selectedPreview.sectionType)
                  const variant = section?.variants.find((v) => v.id === selectedPreview.variant)
                  const SectionIcon = section?.icon || Layout
                  return (
                    <>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/10">
                        <SectionIcon className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground">
                          {section?.name}: {variant?.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">{variant?.description}</p>
                      </div>
                      {/* Requirements in modal */}
                      {variant?.requirements && variant.requirements.length > 0 && (
                        <div className="flex gap-1 ml-4">
                          {variant.requirements.map((req) => {
                            const { label, icon: ReqIcon } = requirementLabels[req]
                            return (
                              <span key={req} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-muted text-muted-foreground">
                                <ReqIcon className="w-3 h-3" />
                                {label}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPreview(null)
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Preview content */}
            <div className="rounded-b-2xl overflow-hidden bg-card" style={themeStyles} onClick={(e) => e.stopPropagation()}>
              <SectionPreview sectionType={selectedPreview.sectionType} variant={selectedPreview.variant} theme={theme} selectedPhoto={selectedPhoto} selectedBackground={selectedBackground} heroSettings={{ backgroundMode: heroBackgroundMode, gradientType: heroGradientType, gradientColor: heroGradientColor, overlayEnabled: heroOverlayEnabled, overlayOpacity: heroOverlayOpacity }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
