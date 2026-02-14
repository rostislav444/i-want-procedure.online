import { Sparkles, Heart, Hand, Stethoscope } from 'lucide-react'

export default function TargetAudienceSection() {
  const segments = [
    {
      icon: Sparkles,
      title: 'Косметологи',
      desc: 'Чистки, масажі, ін\'єкції, пілінги',
      color: 'from-pink-400 to-rose-500'
    },
    {
      icon: Heart,
      title: 'Стоматологи',
      desc: 'Прийоми, консультації, процедури',
      color: 'from-red-400 to-pink-500'
    },
    {
      icon: Hand,
      title: 'Масажні кабінети',
      desc: 'Масажі, SPA-процедури, релаксація',
      color: 'from-purple-400 to-indigo-500'
    },
    {
      icon: Stethoscope,
      title: 'Медичні клініки',
      desc: 'Дерматологія, спортивна медицина, реабілітація',
      color: 'from-blue-400 to-cyan-500'
    },
  ]

  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-yellow-200 -top-40 -right-48 rounded-full blur-3xl opacity-30 animate-blob" />

      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 text-sm font-medium mb-4">
            <Heart className="w-4 h-4" />
            <span>Для кого</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Для кого <span className="gradient-text">Procedure?</span>
          </h2>
        </div>

        {/* Segments Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {segments.map((segment, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-card border border-pink-100 shadow-soft hover:shadow-xl transition-all hover:-translate-y-2"
            >
              {/* Icon */}
              <div className="mb-4">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${segment.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <segment.icon className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-2">{segment.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {segment.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
