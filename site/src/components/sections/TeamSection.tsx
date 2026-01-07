'use client'

import { User, Instagram, Phone, Mail } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'
import { WaveTransition } from '@/components/ui/WaveTransition'

interface TeamMember {
  name: string
  role?: string
  photo?: string
  description?: string
  instagram?: string
  phone?: string
  email?: string
}

interface TeamContent {
  title?: string
  subtitle?: string
  members?: TeamMember[]
  layout?: 'grid' | 'carousel' | 'featured'
}

interface Props {
  content: TeamContent
  theme: IndustryTheme
  company: Company
}

export function TeamSection({ content, theme, company }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  const title = content.title || 'Наша команда'
  const subtitle = content.subtitle
  const members = content.members || []
  const layout = content.layout || 'grid'

  // If no members specified, use company owner as single member
  const displayMembers = members.length > 0 ? members : [
    {
      name: company.name,
      role: company.specialization,
      description: company.description,
      photo: company.logo_url,
    }
  ]

  return (
    <section className="py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--color-background-alt)' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text-on-alt)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted-on-alt)' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Team Members */}
        {layout === 'featured' && displayMembers.length === 1 ? (
          <FeaturedLayout member={displayMembers[0]} theme={theme} apiUrl={apiUrl} />
        ) : (
          <GridLayout members={displayMembers} theme={theme} apiUrl={apiUrl} />
        )}
      </div>

      {/* Wave transition to next section */}
      <WaveTransition variant={2} fillColor="var(--color-background)" />
    </section>
  )
}

interface GridLayoutProps {
  members: TeamMember[]
  theme: IndustryTheme
  apiUrl: string
}

function GridLayout({ members, theme, apiUrl }: GridLayoutProps) {
  const gridCols = members.length === 1
    ? 'max-w-md mx-auto'
    : members.length === 2
      ? 'grid sm:grid-cols-2 gap-8 max-w-2xl mx-auto'
      : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-8'

  return (
    <div className={gridCols}>
      {members.map((member, index) => (
        <div
          key={index}
          className="text-center transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: theme.borderRadius.card,
            boxShadow: theme.shadow.card,
            overflow: 'hidden',
          }}
        >
          {/* Photo */}
          <div className="aspect-square overflow-hidden">
            {member.photo ? (
              <img
                src={member.photo.startsWith('http') ? member.photo : `${apiUrl}${member.photo}`}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))',
                }}
              >
                <User className="w-24 h-24" style={{ color: 'var(--color-primary-300)' }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6">
            <h3 className="font-semibold text-xl mb-1" style={{ color: 'var(--color-text)' }}>
              {member.name}
            </h3>
            {member.role && (
              <p className="text-sm mb-3" style={{ color: 'var(--color-primary-500)' }}>
                {member.role}
              </p>
            )}
            {member.description && (
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                {member.description}
              </p>
            )}

            {/* Social links */}
            {(member.instagram || member.phone || member.email) && (
              <div className="flex items-center justify-center gap-3">
                {member.instagram && (
                  <a
                    href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <Instagram className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <Phone className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <Mail className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

interface FeaturedLayoutProps {
  member: TeamMember
  theme: IndustryTheme
  apiUrl: string
}

function FeaturedLayout({ member, theme, apiUrl }: FeaturedLayoutProps) {
  return (
    <div className="grid md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
      {/* Photo */}
      <div
        className="aspect-square overflow-hidden"
        style={{ borderRadius: theme.borderRadius.card }}
      >
        {member.photo ? (
          <img
            src={member.photo.startsWith('http') ? member.photo : `${apiUrl}${member.photo}`}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))',
            }}
          >
            <User className="w-32 h-32" style={{ color: 'var(--color-primary-300)' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h3
          className="font-bold text-3xl md:text-4xl mb-2"
          style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text-on-alt)' }}
        >
          {member.name}
        </h3>
        {member.role && (
          <p className="text-lg mb-4" style={{ color: 'var(--color-primary-500)' }}>
            {member.role}
          </p>
        )}
        {member.description && (
          <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--color-text-muted-on-alt)' }}>
            {member.description}
          </p>
        )}

        {/* Social links */}
        {(member.instagram || member.phone || member.email) && (
          <div className="flex items-center gap-3">
            {member.instagram && (
              <a
                href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <Instagram className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
              </a>
            )}
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <Phone className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
              </a>
            )}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <Mail className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
