import { notFound } from 'next/navigation'
import { publicApi } from '@/lib/public-api'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Users } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const company = await publicApi.getCompany(slug)
    return {
      title: `Команда — ${company.name}`,
      description: `Наші спеціалісти у ${company.name}`,
    }
  } catch {
    return { title: 'Команда' }
  }
}

export default async function TeamPage({ params }: Props) {
  const { slug } = await params

  let company: Awaited<ReturnType<typeof publicApi.getCompany>>
  let team: Awaited<ReturnType<typeof publicApi.getTeam>>
  try {
    ;[company, team] = await Promise.all([
      publicApi.getCompany(slug),
      publicApi.getTeam(slug),
    ])
  } catch {
    notFound()
  }

  const accentColor = company.primary_color || '#C9837A'

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <p className="text-xs tracking-widest uppercase text-neutral-400 mb-1.5 font-medium">Наша команда</p>
      <h1 className="text-3xl font-bold text-neutral-900 mb-1.5">Спеціалісти</h1>
      <p className="text-neutral-500 text-sm mb-10">Познайомтесь з нашими майстрами</p>

      {team.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500">Інформація про команду скоро з&apos;явиться</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {team.map((member: any) => (
            <div key={member.id} className="group bg-white rounded-2xl overflow-hidden border border-rose-50 hover:shadow-md transition-all duration-200">
              <div className="aspect-[4/3] relative overflow-hidden">
                {member.photo_url ? (
                  <Image src={member.photo_url} alt={member.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-5xl font-bold text-white/70"
                    style={{ background: `linear-gradient(135deg, ${accentColor}55, ${accentColor}99)` }}
                  >
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-neutral-900 text-sm leading-tight">{member.name}</h3>
                {member.position && (
                  <p className="text-xs mt-0.5 font-medium" style={{ color: accentColor }}>{member.position}</p>
                )}
                {member.bio && (
                  <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed line-clamp-3">{member.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 text-center">
        <p className="text-neutral-500 text-sm mb-4">Хочете записатися до конкретного спеціаліста?</p>
        <a
          href={`https://t.me/i_want_procedure_bot?start=${company.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-8 py-3.5 text-white text-sm font-semibold rounded-full shadow-sm transition-opacity hover:opacity-85"
          style={{ backgroundColor: accentColor }}
        >
          Записатися онлайн
        </a>
      </div>
    </div>
  )
}
