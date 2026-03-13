import { CheckCircle2, Phone, FileText, Clock, DollarSign } from 'lucide-react'

export default function ProblemSolutionSection() {
  const problems = [
    { emoji: '📞', text: 'Клієнти дзвонять у найневідповідніший час' },
    { emoji: '📝', text: 'Записи губляться в месенджерах' },
    { emoji: '⏰', text: 'Забуваєте про зустрічі' },
    { emoji: '💸', text: 'Втрачаєте клієнтів через незручний запис' },
  ]

  const solutions = [
    'Автоматичний онлайн-запис 24/7',
    'Всі записи в одному місці',
    'Автоматичні нагадування',
    'Професійний імідж бізнесу',
  ]

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute w-80 h-80 bg-pink-200 -top-20 -left-40 rounded-full blur-3xl opacity-30 animate-blob" />

      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Problems Column */}
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-foreground">Знайомо?</h2>
            </div>
            <div className="space-y-4">
              {problems.map((problem, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-red-50 border border-red-100 hover:shadow-lg transition-all"
                >
                  <span className="text-3xl flex-shrink-0">{problem.emoji}</span>
                  <p className="text-foreground pt-1">{problem.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions Column */}
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-3xl font-bold">
                <span className="gradient-text">Beautica</span> вирішує це за вас
              </h2>
            </div>
            <div className="space-y-4">
              {solutions.map((solution, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-green-50 border border-green-100 hover:shadow-lg transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-foreground pt-1 font-medium">{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
