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
    <section className="py-8 sm:py-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-500/15 dark:to-pink-500/15 text-purple-600 dark:text-purple-400 text-xs font-medium mb-3">
            <Heart className="w-3.5 h-3.5" />
            <span>Для кого</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold dark:text-white">
            Для кого <span className="gradient-text">Procedure?</span>
          </h2>
        </div>

        {/* Segments Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {segments.map((segment, i) => (
            <div
              key={i}
              className="group p-4 rounded-xl bg-card dark:bg-white/5 border border-pink-100 dark:border-pink-500/20 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${segment.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                >
                  <segment.icon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-sm font-bold mb-1 dark:text-white">{segment.title}</h3>
              <p className="text-muted-foreground dark:text-gray-400 text-xs leading-relaxed">
                {segment.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
