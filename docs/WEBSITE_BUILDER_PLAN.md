# Website Builder Plan

## Overview

Flexible section-based website builder (like Tilda) for creating beautiful public pages for specialists and clinics.

---

## 1. Database Schema

### 1.1 WebsiteSection Model

```python
# backend/app/models/website_section.py

class SectionType(str, Enum):
    HERO = "hero"
    ABOUT = "about"
    SERVICES = "services"
    TEAM = "team"
    BENEFITS = "benefits"
    GALLERY = "gallery"
    TESTIMONIALS = "testimonials"
    CONTACT = "contact"
    MAP = "map"
    FAQ = "faq"
    CUSTOM_TEXT = "custom_text"
    CTA = "cta"
    PRICING = "pricing"
    SCHEDULE = "schedule"

class WebsiteSection(Base):
    __tablename__ = "website_sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))

    section_type: Mapped[str] = mapped_column(String(50))  # SectionType enum
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)

    # Flexible content storage
    content: Mapped[dict] = mapped_column(JSONB, default={})
    # Example content for different types:
    # hero: { title, subtitle, background_image, cta_text, cta_link }
    # about: { title, text, image, layout: "left" | "right" | "center" }
    # team: { title, members: [{ name, position, photo, description }] }
    # map: { title, address, coordinates: { lat, lng }, zoom }

    # Style overrides (optional)
    style: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Example: { background_color, text_color, padding, custom_css }

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="website_sections")
```

### 1.2 Industry Theme in Company Model

```python
# Add to backend/app/models/company.py

class IndustryTheme(str, Enum):
    COSMETOLOGY = "cosmetology"   # Pink/rose, elegant, soft
    MEDICAL = "medical"           # Blue/teal, clean, professional
    MASSAGE = "massage"           # Green/earth, calm, natural
    SPORT = "sport"               # Orange/dynamic, energetic, bold
    BEAUTY = "beauty"             # Purple/gold, luxury, glamour
    WELLNESS = "wellness"         # Mint/aqua, fresh, zen

# Company model additions:
industry_theme: Mapped[str | None] = mapped_column(String(30), default="cosmetology")
website_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
```

---

## 2. Industry-Specific Design Themes

### 2.1 Theme Configuration

```typescript
// site/src/lib/themes.ts

export interface IndustryTheme {
  id: string
  name: string
  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  gradientFrom: string
  gradientTo: string
  // Typography
  headingFont: string
  bodyFont: string
  // Visual style
  borderRadius: string      // "sharp" | "rounded" | "pill"
  shadowStyle: string       // "none" | "soft" | "dramatic"
  backgroundPattern: string // "none" | "dots" | "waves" | "geometric"
  // Section defaults
  heroStyle: string         // "minimal" | "gradient" | "image-bg" | "split"
  cardStyle: string         // "flat" | "elevated" | "glass" | "bordered"
  buttonStyle: string       // "solid" | "outline" | "gradient" | "glow"
}

export const themes: Record<string, IndustryTheme> = {
  cosmetology: {
    id: "cosmetology",
    name: "Косметологія",
    primaryColor: "#e91e63",
    secondaryColor: "#fce4ec",
    accentColor: "#fbbf24",
    gradientFrom: "#ec4899",
    gradientTo: "#f472b6",
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    borderRadius: "rounded",    // 12-16px corners
    shadowStyle: "soft",
    backgroundPattern: "none",
    heroStyle: "gradient",
    cardStyle: "glass",
    buttonStyle: "gradient"
  },

  medical: {
    id: "medical",
    name: "Медицина",
    primaryColor: "#0891b2",
    secondaryColor: "#ecfeff",
    accentColor: "#06b6d4",
    gradientFrom: "#0ea5e9",
    gradientTo: "#22d3ee",
    headingFont: "Plus Jakarta Sans",
    bodyFont: "Inter",
    borderRadius: "sharp",      // 4-8px corners
    shadowStyle: "soft",
    backgroundPattern: "none",
    heroStyle: "minimal",
    cardStyle: "bordered",
    buttonStyle: "solid"
  },

  massage: {
    id: "massage",
    name: "Масаж",
    primaryColor: "#059669",
    secondaryColor: "#ecfdf5",
    accentColor: "#a3e635",
    gradientFrom: "#10b981",
    gradientTo: "#34d399",
    headingFont: "Cormorant Garamond",
    bodyFont: "Nunito",
    borderRadius: "rounded",
    shadowStyle: "none",
    backgroundPattern: "waves",
    heroStyle: "image-bg",
    cardStyle: "flat",
    buttonStyle: "outline"
  },

  sport: {
    id: "sport",
    name: "Спорт",
    primaryColor: "#f97316",
    secondaryColor: "#fff7ed",
    accentColor: "#eab308",
    gradientFrom: "#f97316",
    gradientTo: "#fb923c",
    headingFont: "Bebas Neue",
    bodyFont: "Roboto",
    borderRadius: "sharp",      // 0-4px corners, aggressive
    shadowStyle: "dramatic",
    backgroundPattern: "geometric",
    heroStyle: "split",
    cardStyle: "elevated",
    buttonStyle: "glow"
  },

  beauty: {
    id: "beauty",
    name: "Краса",
    primaryColor: "#a855f7",
    secondaryColor: "#faf5ff",
    accentColor: "#d4af37",
    gradientFrom: "#a855f7",
    gradientTo: "#c084fc",
    headingFont: "Cormorant",
    bodyFont: "Lato",
    borderRadius: "pill",       // very round
    shadowStyle: "soft",
    backgroundPattern: "dots",
    heroStyle: "gradient",
    cardStyle: "glass",
    buttonStyle: "gradient"
  },

  wellness: {
    id: "wellness",
    name: "Wellness",
    primaryColor: "#14b8a6",
    secondaryColor: "#f0fdfa",
    accentColor: "#5eead4",
    gradientFrom: "#2dd4bf",
    gradientTo: "#5eead4",
    headingFont: "Josefin Sans",
    bodyFont: "Open Sans",
    borderRadius: "rounded",
    shadowStyle: "none",
    backgroundPattern: "none",
    heroStyle: "minimal",
    cardStyle: "flat",
    buttonStyle: "outline"
  }
}
```

### 2.2 Theme-Specific Styles

Each theme affects:

**1. Hero Section:**
```
Cosmetology: Gradient background, elegant serif title, soft floating elements
Medical:     Clean white background, professional sans-serif, trust badges
Massage:     Full-width nature image, overlay text, calm vibe
Sport:       Bold diagonal split, dynamic angles, strong contrast
Beauty:      Luxury gradient, gold accents, script fonts
Wellness:    Minimal with breathing space, nature imagery, zen feel
```

**2. Service Cards:**
```
Cosmetology: Glass cards with pink accent line, hover glow
Medical:     Clean bordered cards, blue icons, structured layout
Massage:     Flat cards with nature imagery, earthy tones
Sport:       Elevated cards with sharp corners, orange accents, bold text
Beauty:      Soft gradient cards, purple-gold, elegant hover
Wellness:    Minimal cards, teal accents, lots of whitespace
```

**3. Buttons:**
```
Cosmetology: Gradient pink-to-light, rounded, soft shadow
Medical:     Solid blue, sharp corners, professional
Massage:     Outlined green, rounded, subtle
Sport:       Glowing orange, sharp, bold text
Beauty:      Gradient purple-gold, pill shape
Wellness:    Outlined teal, rounded, minimal
```

**4. Typography:**
```
Cosmetology: Playfair Display (headings) + Inter (body)
Medical:     Plus Jakarta Sans (headings) + Inter (body)
Massage:     Cormorant Garamond (headings) + Nunito (body)
Sport:       Bebas Neue (headings) + Roboto (body)
Beauty:      Cormorant (headings) + Lato (body)
Wellness:    Josefin Sans (headings) + Open Sans (body)
```

---

## 3. Section Types

### 3.1 Available Sections

| Type | Description | Content Fields |
|------|-------------|----------------|
| `hero` | Main banner | title, subtitle, background_image, cta_text, cta_link, style |
| `about` | About section | title, text, image, layout (left/right/center) |
| `services` | Services list | title, subtitle, display_mode (grid/list/cards) |
| `team` | Staff list | title, members: [{name, position, photo, bio}] |
| `benefits` | Why choose us | title, items: [{icon, title, description}] |
| `gallery` | Photo gallery | title, images: [{url, caption}], layout (grid/masonry) |
| `testimonials` | Reviews | title, reviews: [{text, author, rating, photo}] |
| `contact` | Contact info | title, show_phone, show_telegram, show_email, show_address |
| `map` | OpenStreetMap | title, address, coordinates: {lat, lng}, zoom |
| `faq` | FAQ accordion | title, items: [{question, answer}] |
| `cta` | Call to action | title, subtitle, button_text, button_link, style |
| `pricing` | Pricing table | title, plans: [{name, price, features, highlighted}] |
| `schedule` | Working hours | title, days: [{day, hours}] |
| `custom_text` | Custom HTML/MD | title, content (markdown supported) |

### 3.2 Default Sections by Industry

```typescript
const defaultSectionsByIndustry = {
  cosmetology: ['hero', 'about', 'services', 'gallery', 'testimonials', 'contact', 'map'],
  medical: ['hero', 'team', 'services', 'benefits', 'faq', 'contact', 'map'],
  massage: ['hero', 'about', 'services', 'benefits', 'schedule', 'contact', 'map'],
  sport: ['hero', 'team', 'services', 'pricing', 'testimonials', 'contact'],
  beauty: ['hero', 'about', 'gallery', 'services', 'testimonials', 'contact'],
  wellness: ['hero', 'about', 'benefits', 'services', 'schedule', 'contact', 'map']
}
```

---

## 4. API Endpoints

### 4.1 Website Sections API

```python
# backend/app/api/v1/website_sections.py

router = APIRouter(prefix="/website")

# Get all sections for company
@router.get("/sections")
async def get_sections(current_user: CurrentUser, db: DbSession):
    """Get all website sections for current user's company"""

# Create new section
@router.post("/sections")
async def create_section(
    data: WebsiteSectionCreate,
    current_user: CurrentUser,
    db: DbSession
):
    """Create a new section"""

# Update section
@router.patch("/sections/{section_id}")
async def update_section(
    section_id: int,
    data: WebsiteSectionUpdate,
    current_user: CurrentUser,
    db: DbSession
):
    """Update section content or visibility"""

# Delete section
@router.delete("/sections/{section_id}")
async def delete_section(section_id: int, current_user: CurrentUser, db: DbSession):
    """Delete a section"""

# Reorder sections
@router.post("/sections/reorder")
async def reorder_sections(
    data: list[SectionOrderItem],  # [{id: 1, order: 0}, {id: 2, order: 1}]
    current_user: CurrentUser,
    db: DbSession
):
    """Update section order"""

# Get available section types
@router.get("/section-types")
async def get_section_types():
    """Get list of available section types with their schemas"""

# Reset to defaults
@router.post("/sections/reset")
async def reset_to_defaults(current_user: CurrentUser, db: DbSession):
    """Reset website to default sections based on industry"""
```

### 4.2 Public API Update

```python
# backend/app/api/v1/public.py

@router.get("/companies/{slug}/website")
async def get_company_website(slug: str, db: DbSession):
    """Get company website data including sections"""
    # Returns: company info + ordered visible sections
```

---

## 5. Frontend Admin UI

### 5.1 Website Builder Page

**Path:** `frontend/src/app/admin/website/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ Налаштування сайту                              [Preview] [Save]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Тема оформлення                                                 │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │Косм. │ │Медиц.│ │Масаж │ │Спорт │ │Краса │ │Wellns│         │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                                 │
│ Основний колір: [■ #e91e63] [Color Picker]                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Секції сайту                              [+ Додати секцію]     │
│                                                                 │
│ ≡ Hero Section                                    [👁] [✎] [🗑] │
│   Головний банер з назвою та кнопкою                            │
│                                                                 │
│ ≡ About                                           [👁] [✎] [🗑] │
│   Про мене / Про нас                                            │
│                                                                 │
│ ≡ Services                                        [👁] [✎] [🗑] │
│   Прайс-лист послуг                                             │
│                                                                 │
│ ≡ Gallery                                    [🔒 Premium] [👁]  │
│   Галерея робіт                                                 │
│                                                                 │
│ ≡ Map                                             [👁] [✎] [🗑] │
│   Карта з адресою                                               │
│                                                                 │
│ ≡ Contact                                         [👁] [✎] [🗑] │
│   Контактна інформація                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Section Editor Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Редагування: Hero Section                                    [X]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Заголовок                                                       │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Ласкаво просимо!                                            ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Підзаголовок                                                    │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Професійні косметологічні послуги                           ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Фонове зображення                                               │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ [📷 Завантажити]  or  [Без зображення]                      ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Кнопка дії                                                      │
│ Текст: [Записатися      ]  Посилання: [telegram bot link    ]  │
│                                                                 │
│ Стиль секції                                                    │
│ ( ) Мінімальний  (•) Градієнт  ( ) З фото  ( ) Розділений      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                      [Скасувати] [💾 Зберегти] │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Add Section Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Додати секцію                                                [X]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│ │    🏠        │ │    👤        │ │    💼        │              │
│ │    Hero      │ │    About     │ │   Services   │              │
│ │  Головний    │ │   Про нас    │ │   Послуги    │              │
│ └──────────────┘ └──────────────┘ └──────────────┘              │
│                                                                 │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│ │    👥        │ │    ⭐        │ │    📷        │              │
│ │    Team      │ │  Benefits    │ │   Gallery    │              │
│ │  Команда     │ │  Переваги    │ │   Галерея    │ [🔒]         │
│ └──────────────┘ └──────────────┘ └──────────────┘              │
│                                                                 │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│ │    💬        │ │    📍        │ │    ❓        │              │
│ │ Testimonials │ │     Map      │ │     FAQ      │              │
│ │   Відгуки    │ │    Карта     │ │   Питання    │ [🔒]         │
│ └──────────────┘ └──────────────┘ └──────────────┘              │
│                                                                 │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│ │    📞        │ │    📝        │ │    🎯        │              │
│ │   Contact    │ │ Custom Text  │ │     CTA      │              │
│ │  Контакти    │ │ Свій текст   │ │ Заклик до дії│              │
│ └──────────────┘ └──────────────┘ └──────────────┘              │
│                                                                 │
│ [🔒] - Premium функції                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Site Rendering

### 6.1 Dynamic Section Renderer

```tsx
// site/src/components/SectionRenderer.tsx

import { HeroSection } from './sections/HeroSection'
import { AboutSection } from './sections/AboutSection'
import { ServicesSection } from './sections/ServicesSection'
import { TeamSection } from './sections/TeamSection'
import { MapSection } from './sections/MapSection'
// ... other sections

const sectionComponents = {
  hero: HeroSection,
  about: AboutSection,
  services: ServicesSection,
  team: TeamSection,
  benefits: BenefitsSection,
  gallery: GallerySection,
  testimonials: TestimonialsSection,
  contact: ContactSection,
  map: MapSection,
  faq: FAQSection,
  cta: CTASection,
  custom_text: CustomTextSection,
}

interface Props {
  sections: WebsiteSection[]
  company: Company
  services: Service[]
  theme: IndustryTheme
}

export function SectionRenderer({ sections, company, services, theme }: Props) {
  return (
    <>
      {sections
        .filter(s => s.is_visible)
        .sort((a, b) => a.order - b.order)
        .map(section => {
          const Component = sectionComponents[section.section_type]
          if (!Component) return null

          return (
            <Component
              key={section.id}
              content={section.content}
              style={section.style}
              company={company}
              services={services}
              theme={theme}
            />
          )
        })}
    </>
  )
}
```

### 6.2 Theme-Aware Section Example

```tsx
// site/src/components/sections/HeroSection.tsx

interface Props {
  content: {
    title?: string
    subtitle?: string
    background_image?: string
    cta_text?: string
    cta_link?: string
    style?: 'minimal' | 'gradient' | 'image-bg' | 'split'
  }
  theme: IndustryTheme
  company: Company
}

export function HeroSection({ content, theme, company }: Props) {
  const style = content.style || theme.heroStyle

  // Different rendering based on theme style
  switch (style) {
    case 'gradient':
      return <GradientHero {...props} />
    case 'minimal':
      return <MinimalHero {...props} />
    case 'image-bg':
      return <ImageBgHero {...props} />
    case 'split':
      return <SplitHero {...props} />
  }
}

// Gradient Hero (Cosmetology, Beauty)
function GradientHero({ content, theme, company }) {
  return (
    <section
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`
      }}
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" />
        <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-float-delayed" />
      </div>

      <div className="relative z-10 text-center text-white px-4">
        <h1
          className="text-5xl md:text-7xl font-bold mb-6"
          style={{ fontFamily: theme.headingFont }}
        >
          {content.title || company.name}
        </h1>
        <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl mx-auto">
          {content.subtitle || company.description}
        </p>
        {content.cta_text && (
          <a
            href={content.cta_link}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:scale-105 transition-transform shadow-xl"
          >
            {content.cta_text}
          </a>
        )}
      </div>
    </section>
  )
}

// Sport Hero - Bold and Dynamic
function SplitHero({ content, theme, company }) {
  return (
    <section className="min-h-screen grid md:grid-cols-2">
      {/* Left side - Content */}
      <div
        className="flex items-center p-8 md:p-16"
        style={{ background: theme.primaryColor }}
      >
        <div className="text-white">
          <h1
            className="text-6xl md:text-8xl font-bold uppercase tracking-tight mb-6"
            style={{ fontFamily: theme.headingFont }}
          >
            {content.title || company.name}
          </h1>
          <p className="text-xl mb-8 opacity-90">
            {content.subtitle}
          </p>
          {content.cta_text && (
            <a
              href={content.cta_link}
              className="inline-block px-8 py-4 bg-white text-black font-bold uppercase tracking-wide hover:bg-yellow-400 transition-colors"
            >
              {content.cta_text}
            </a>
          )}
        </div>
      </div>

      {/* Right side - Image with diagonal cut */}
      <div className="relative overflow-hidden">
        {content.background_image && (
          <img
            src={content.background_image}
            className="w-full h-full object-cover"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' }}
          />
        )}
      </div>
    </section>
  )
}
```

---

## 7. OpenStreetMap Integration

### 7.1 Map Component

```tsx
// site/src/components/sections/MapSection.tsx

'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  content: {
    title?: string
    address?: string
    coordinates?: { lat: number; lng: number }
    zoom?: number
  }
  theme: IndustryTheme
  company: Company
}

export function MapSection({ content, theme, company }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const coords = content.coordinates || { lat: 50.4501, lng: 30.5234 } // Kyiv default
  const zoom = content.zoom || 15
  const address = content.address || company.address

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map
    const map = L.map(mapRef.current).setView([coords.lat, coords.lng], zoom)
    mapInstanceRef.current = map

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    // Custom marker with theme color
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: ${theme.primaryColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          <svg style="transform: rotate(45deg); width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    })

    L.marker([coords.lat, coords.lng], { icon }).addTo(map)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [coords, zoom, theme.primaryColor])

  return (
    <section className="py-16 bg-secondary">
      <div className="max-w-5xl mx-auto px-4">
        {content.title && (
          <h2
            className="text-3xl font-bold text-center mb-8"
            style={{ fontFamily: theme.headingFont }}
          >
            {content.title}
          </h2>
        )}

        <div className="bg-card rounded-2xl overflow-hidden shadow-xl border">
          {/* Map */}
          <div ref={mapRef} className="h-80 w-full" />

          {/* Address bar */}
          {address && (
            <div className="p-6 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${theme.primaryColor}20` }}
              >
                <MapPin style={{ color: theme.primaryColor }} />
              </div>
              <div>
                <p className="font-medium">Наша адреса</p>
                <p className="text-muted-foreground">{address}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto px-4 py-2 rounded-lg text-white text-sm"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Відкрити в Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
```

### 7.2 Dependencies

```bash
# site/package.json
yarn add leaflet
yarn add -D @types/leaflet
```

---

## 8. Team Section (for Clinics)

```tsx
// site/src/components/sections/TeamSection.tsx

interface TeamMember {
  name: string
  position: string
  photo?: string
  bio?: string
  specializations?: string[]
}

interface Props {
  content: {
    title?: string
    members: TeamMember[]
  }
  theme: IndustryTheme
}

export function TeamSection({ content, theme }: Props) {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: theme.headingFont }}
        >
          {content.title || 'Наша команда'}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.members.map((member, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl overflow-hidden border hover:shadow-xl transition-shadow"
            >
              {/* Photo */}
              <div className="aspect-square overflow-hidden">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-6xl font-bold text-white"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {member.name[0]}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: theme.primaryColor }}
                >
                  {member.position}
                </p>
                {member.bio && (
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {member.bio}
                  </p>
                )}
                {member.specializations && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {member.specializations.map((spec, j) => (
                      <span
                        key={j}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${theme.primaryColor}15`,
                          color: theme.primaryColor
                        }}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## 9. Premium vs Basic Restrictions

### 9.1 Feature Matrix

| Feature | Basic | Premium |
|---------|-------|---------|
| Max sections | 5 | Unlimited |
| Hero section | Yes | Yes |
| About section | Yes | Yes |
| Services section | Yes | Yes |
| Contact section | Yes | Yes |
| Map section | Yes | Yes |
| Team section | No | Yes |
| Gallery section | No | Yes |
| Testimonials | No | Yes |
| FAQ section | No | Yes |
| Custom sections | No | Yes |
| Industry themes | 1 | All |
| Custom CSS | No | Yes |
| Remove branding | No | Yes |

### 9.2 Restriction Implementation

```typescript
// frontend/src/lib/website-features.ts

export const BASIC_SECTIONS = ['hero', 'about', 'services', 'contact', 'map']
export const PREMIUM_SECTIONS = ['team', 'gallery', 'testimonials', 'faq', 'cta', 'custom_text', 'pricing', 'schedule']
export const MAX_BASIC_SECTIONS = 5

export function canAddSection(
  sectionType: string,
  currentSections: WebsiteSection[],
  isPremium: boolean
): { allowed: boolean; reason?: string } {
  // Check premium restriction
  if (PREMIUM_SECTIONS.includes(sectionType) && !isPremium) {
    return { allowed: false, reason: 'Ця секція доступна в Premium плані' }
  }

  // Check section limit for basic
  if (!isPremium && currentSections.length >= MAX_BASIC_SECTIONS) {
    return { allowed: false, reason: `Максимум ${MAX_BASIC_SECTIONS} секцій на Basic плані` }
  }

  return { allowed: true }
}
```

---

## 10. File Structure

```
backend/
├── app/
│   ├── models/
│   │   └── website_section.py      # NEW
│   ├── schemas/
│   │   └── website_section.py      # NEW
│   └── api/v1/
│       └── website_sections.py     # NEW

frontend/
├── src/
│   ├── app/admin/
│   │   └── website/
│   │       └── page.tsx            # Website builder UI
│   ├── components/
│   │   └── website-builder/
│   │       ├── SectionList.tsx     # Drag-drop section list
│   │       ├── SectionEditor.tsx   # Edit modal
│   │       ├── AddSectionModal.tsx # Add new section
│   │       └── ThemeSelector.tsx   # Industry theme picker
│   └── lib/
│       └── website-features.ts     # Premium restrictions

site/
├── src/
│   ├── app/site/[slug]/
│   │   └── page.tsx                # Updated to use sections
│   ├── components/
│   │   ├── SectionRenderer.tsx     # Dynamic renderer
│   │   └── sections/
│   │       ├── HeroSection.tsx
│   │       ├── AboutSection.tsx
│   │       ├── ServicesSection.tsx
│   │       ├── TeamSection.tsx
│   │       ├── BenefitsSection.tsx
│   │       ├── GallerySection.tsx
│   │       ├── TestimonialsSection.tsx
│   │       ├── ContactSection.tsx
│   │       ├── MapSection.tsx
│   │       ├── FAQSection.tsx
│   │       ├── CTASection.tsx
│   │       └── CustomTextSection.tsx
│   └── lib/
│       └── themes.ts               # Industry themes config
```

---

## 11. Migration Strategy

### Step 1: Database Migration
```python
# alembic/versions/xxx_add_website_sections.py

def upgrade():
    # Add industry_theme to companies
    op.add_column('companies', sa.Column('industry_theme', sa.String(30), default='cosmetology'))
    op.add_column('companies', sa.Column('website_enabled', sa.Boolean(), default=True))

    # Create website_sections table
    op.create_table(
        'website_sections',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id', ondelete='CASCADE')),
        sa.Column('section_type', sa.String(50), nullable=False),
        sa.Column('order', sa.Integer(), default=0),
        sa.Column('is_visible', sa.Boolean(), default=True),
        sa.Column('content', JSONB, default={}),
        sa.Column('style', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Create default sections for existing companies
    op.execute("""
        INSERT INTO website_sections (company_id, section_type, "order", content)
        SELECT id, 'hero', 0, '{}'::jsonb FROM companies;

        INSERT INTO website_sections (company_id, section_type, "order", content)
        SELECT id, 'services', 1, '{}'::jsonb FROM companies;

        INSERT INTO website_sections (company_id, section_type, "order", content)
        SELECT id, 'contact', 2, '{}'::jsonb FROM companies;
    """)
```

### Step 2: Backend Implementation
1. Create models and schemas
2. Add API endpoints
3. Update public API

### Step 3: Frontend Admin
1. Create website builder page
2. Add section editors
3. Add theme selector

### Step 4: Site Rendering
1. Create section components
2. Implement theme system
3. Add OpenStreetMap

---

## 12. Implementation Order

1. **Database & Models** (Day 1)
   - [ ] Add migration for website_sections table
   - [ ] Add industry_theme to Company model
   - [ ] Create WebsiteSection model and schemas

2. **Backend API** (Day 1-2)
   - [ ] Create website_sections.py router
   - [ ] Implement CRUD endpoints
   - [ ] Update public API

3. **Industry Themes** (Day 2)
   - [ ] Create themes.ts with all 6 themes
   - [ ] Implement theme-aware CSS classes
   - [ ] Add Google Fonts loading

4. **Section Components** (Day 2-3)
   - [ ] HeroSection (4 variants)
   - [ ] ServicesSection
   - [ ] ContactSection
   - [ ] MapSection (with Leaflet)
   - [ ] AboutSection
   - [ ] TeamSection
   - [ ] Other sections

5. **Admin UI** (Day 3-4)
   - [ ] Website builder page
   - [ ] Section list with drag-drop
   - [ ] Section editors for each type
   - [ ] Theme selector
   - [ ] Preview functionality

6. **Premium Features** (Day 4)
   - [ ] Implement restrictions
   - [ ] Add upgrade prompts
   - [ ] Lock premium sections

---

## 13. Visual Examples

### Cosmetology Theme
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Послуги  Про мене  Контакти          [📞] [Записатися]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ╭─────────────────────────────────────────────────────────╮  │
│   ╱                                                           ╲ │
│  │     ✨ Косметологічний кабінет                              │ │
│  │                                                             │ │
│  │     Професійний догляд за вашою шкірою                     │ │
│  │                                                             │ │
│  │     ┌─────────────────────────────────────┐                │ │
│  │     │     💬  Записатися через Telegram    │                │ │
│  │     └─────────────────────────────────────┘                │ │
│   ╲                                                           ╱ │
│    ╰─────────────────────────────────────────────────────────╯  │
│                  Gradient: Pink → Light Pink                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      Прайс-лист процедур                        │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │ 💆 Чистка   │  │ 💉 Ін'єкції │  │ 🧴 Пілінг   │            │
│   │    обличчя  │  │   краси     │  │   хімічний  │            │
│   │             │  │             │  │             │            │
│   │   1200 ₴    │  │   2500 ₴    │  │   800 ₴     │            │
│   │   60 хв     │  │   45 хв     │  │   30 хв     │            │
│   │  [Glass BG] │  │  [Glass BG] │  │  [Glass BG] │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│      Rounded corners • Soft shadows • Pink accents              │
└─────────────────────────────────────────────────────────────────┘
```

### Sport Theme
```
┌─────────────────────────────────────────────────────────────────┐
│ ████ SPORTCLUB    SERVICES  TEAM  PRICING            [BOOK NOW]│
├─────────────────────────────────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                                  │
│▓                            ▓│                                  │
│▓  PUSH YOUR                 ▓│      ╱╲                          │
│▓  LIMITS                    ▓│     ╱  ╲     [Hero Image]        │
│▓                            ▓│    ╱    ╲                        │
│▓  Personal training &       ▓│   ╱ SPORT╲                       │
│▓  group fitness classes     ▓│  ╱________╲                      │
│▓                            ▓│                                  │
│▓  ┌─────────────────────┐   ▓│     Diagonal                     │
│▓  │   START TRAINING    │   ▓│     cut-out                      │
│▓  └─────────────────────┘   ▓│                                  │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                                  │
│        Orange BG             │                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━┓          │
│  ┃ 🏋️ CROSSFIT  ┃  ┃ 🥊 BOXING   ┃  ┃ 🧘 YOGA     ┃          │
│  ┃              ┃  ┃              ┃  ┃              ┃          │
│  ┃   500₴/мес  ┃  ┃   400₴/мес  ┃  ┃   350₴/мес  ┃          │
│  ┃              ┃  ┃              ┃  ┃              ┃          │
│  ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━┛          │
│                                                                 │
│   Sharp corners • Bold typography • High contrast • Geometric   │
└─────────────────────────────────────────────────────────────────┘
```

### Medical Theme
```
┌─────────────────────────────────────────────────────────────────┐
│  [⚕️ Logo]  Послуги  Лікарі  FAQ  Контакти      [📞 Записатися]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │   🏥 Медичний центр "Здоров'я"                            │  │
│  │                                                           │  │
│  │   Професійна медична допомога з турботою про вас         │  │
│  │                                                           │  │
│  │   ✓ Досвідчені спеціалісти  ✓ Сучасне обладнання        │  │
│  │                                                           │  │
│  │   ┌────────────────────┐                                  │  │
│  │   │  Записатися на прийом  │                              │  │
│  │   └────────────────────┘                                  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│           Clean white • Trust badges • Professional             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        Наші спеціалісти                         │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │   [Photo]   │  │   [Photo]   │  │   [Photo]   │            │
│   │─────────────│  │─────────────│  │─────────────│            │
│   │ Др. Іванов  │  │ Др. Петрова │  │ Др. Сидоров │            │
│   │  Терапевт   │  │  Кардіолог  │  │  Хірург     │            │
│   │ [bordered]  │  │ [bordered]  │  │ [bordered]  │            │
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│   Sharp corners • Blue accents • Structured layout • Trust      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

This plan provides a complete, flexible website builder system with:

1. **Section-based architecture** - Add, remove, reorder any section
2. **6 industry themes** - Cosmetology, Medical, Massage, Sport, Beauty, Wellness
3. **Theme-specific designs** - Not just colors, but typography, shapes, layouts
4. **OpenStreetMap integration** - Interactive maps with custom markers
5. **Team/Staff display** - For clinics with multiple specialists
6. **Premium gating** - Basic users get core features, Premium gets all
7. **Admin UI** - Visual drag-drop builder for specialists
8. **Responsive design** - Works on all devices
