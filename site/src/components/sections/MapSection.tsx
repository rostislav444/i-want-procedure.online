'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface MapContent {
  title?: string
  address?: string
  coordinates?: { lat: number; lng: number }
  zoom?: number
}

interface Props {
  content: MapContent
  theme: IndustryTheme
  company: Company
}

export function MapSection({ content, theme, company }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)

  const title = content.title || 'Як нас знайти'
  const address = content.address || company.address
  const coords = content.coordinates || { lat: 50.4501, lng: 30.5234 } // Kyiv default
  const zoom = content.zoom || 15

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstanceRef.current) return

    // Dynamically import Leaflet
    const loadMap = async () => {
      const L = (await import('leaflet')).default

      // Add Leaflet CSS dynamically
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)
      }

      // Create map
      const map = L.map(mapRef.current!).setView([coords.lat, coords.lng], zoom)
      mapInstanceRef.current = map

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      // Custom marker with theme color - use CSS variable from computed style
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim() || '#e91e63'
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 40px;
            height: 40px;
            background: ${primaryColor};
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

      // Popup with company name
      if (company.name) {
        L.marker([coords.lat, coords.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${company.name}</strong><br>${address || ''}`)
      }
    }

    loadMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isClient, coords.lat, coords.lng, zoom, company.name, address])

  return (
    <section className="py-16" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-5xl mx-auto px-4">
        <h2
          className="text-3xl font-bold text-center mb-8"
          style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
        >
          {title}
        </h2>

        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-primary-100)' }}>
          {/* Map */}
          <div
            ref={mapRef}
            className="h-80 w-full"
            style={{ minHeight: '320px', backgroundColor: 'var(--color-background-alt)' }}
          >
            {!isClient && (
              <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                Завантаження карти...
              </div>
            )}
          </div>

          {/* Address bar */}
          {address && (
            <div
              className="p-6 flex flex-col md:flex-row items-center gap-4"
              style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-primary-100)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <MapPin className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
              </div>
              <div className="text-center md:text-left flex-1">
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>Наша адреса</p>
                <p style={{ color: 'var(--color-text-muted)' }}>{address}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'var(--color-primary-500)',
                  color: 'var(--color-primary-contrast)',
                  borderRadius: theme.borderRadius.button,
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Відкрити в Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
