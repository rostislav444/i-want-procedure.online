'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, MessageCircle, ChevronRight, Tag, ListOrdered, Package } from 'lucide-react'
import type { PublicCompany, PublicService } from '@/lib/public-api'

interface Props {
  company: PublicCompany
  service: PublicService
  relatedServices: PublicService[]
}

function formatPrice(service: PublicService): string {
  if (service.price_options && service.price_options.length > 0) {
    const minPrice = Math.min(...service.price_options.map(o => Number(o.price)))
    return `від ${minPrice.toLocaleString('uk-UA')} ₴`
  }
  return `${Number(service.price).toLocaleString('uk-UA')} ₴`
}

export function ServiceDetail({ company, service, relatedServices }: Props) {
  const telegramLink = `https://t.me/i_want_procedure_bot?start=${company.slug}`

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-8">
        <Link href={`/marketplace/${company.id}-${company.slug}`} className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
          {company.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/marketplace/${company.id}-${company.slug}/services`} className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
          Послуги
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-neutral-900 dark:text-neutral-100">{service.name}</span>
      </nav>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Service info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title */}
          <div>
            {service.global_category && (
              <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 mb-3">
                {service.global_category.icon && <span>{service.global_category.icon}</span>}
                {service.global_category.name}
              </span>
            )}
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {service.name}
            </h1>
          </div>

          {/* Description */}
          {service.description && (
            <div className="text-base leading-relaxed whitespace-pre-line text-neutral-500 dark:text-neutral-400">
              {service.description}
            </div>
          )}

          {/* Price options */}
          {service.price_options && service.price_options.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-neutral-400" />
                Варіанти
              </h2>
              <div className="divide-y divide-neutral-100 dark:divide-white/10">
                {service.price_options
                  .sort((a, b) => a.order - b.order)
                  .map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between py-4"
                    >
                      <div>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {opt.name}
                        </span>
                        {opt.duration_minutes && (
                          <span className="ml-3 text-sm inline-flex items-center gap-1 text-neutral-400">
                            <Clock className="w-3.5 h-3.5" />
                            {opt.duration_minutes} хв
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-lg text-neutral-900 dark:text-white">
                        {Number(opt.price).toLocaleString('uk-UA')} ₴
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {service.steps && service.steps.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-neutral-400" />
                Етапи процедури
              </h2>
              <div className="space-y-4">
                {service.steps
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => (
                    <div key={step.id} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="pt-1">
                        <h4 className="font-medium text-neutral-900 dark:text-white">
                          {step.title}
                        </h4>
                        {step.description && (
                          <p className="text-sm mt-1 text-neutral-500 dark:text-neutral-400">
                            {step.description}
                          </p>
                        )}
                        {step.duration_minutes && (
                          <span className="inline-flex items-center gap-1 text-xs mt-2 text-neutral-400">
                            <Clock className="w-3 h-3" />
                            {step.duration_minutes} хв
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Products used */}
          {service.products && service.products.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-neutral-400" />
                Використовувані засоби
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-neutral-200 dark:bg-white/10">
                {service.products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-[#0f0f17] p-4"
                  >
                    <h4 className="font-medium text-sm text-neutral-900 dark:text-white">
                      {product.name}
                    </h4>
                    {product.manufacturer && (
                      <p className="text-xs mt-0.5 text-neutral-400">
                        {product.manufacturer}
                      </p>
                    )}
                    {product.description && (
                      <p className="text-xs mt-1 text-neutral-500 dark:text-neutral-400">
                        {product.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sticky sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-neutral-200 dark:border-white/10 dark:bg-white/5 p-6 space-y-4">
            {/* Price */}
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">
                {formatPrice(service)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-neutral-400">
                <Clock className="w-4 h-4" />
                <span>{service.duration_minutes} хв</span>
              </div>
            </div>

            {/* CTA */}
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Записатися
            </a>

            {/* Company info */}
            <div className="pt-4 border-t border-neutral-200 dark:border-white/10 space-y-2">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {company.name}
              </p>
              {company.address && (
                <p className="text-xs text-neutral-400">
                  {company.address}
                </p>
              )}
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="text-sm text-neutral-900 dark:text-neutral-200 hover:underline underline-offset-4 block"
                >
                  {company.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related services */}
      {relatedServices.length > 0 && (
        <div className="mt-20 pt-12 border-t border-neutral-200 dark:border-white/10">
          <p className="text-sm tracking-widest uppercase text-neutral-400 mb-2">Також</p>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
            Схожі послуги
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 dark:bg-white/10">
            {relatedServices.map((s) => (
              <Link
                key={s.id}
                href={`/marketplace/${company.id}-${company.slug}/services/${s.id}`}
                className="group bg-white dark:bg-[#0f0f17] p-5 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
              >
                <h3 className="font-medium text-sm text-neutral-900 dark:text-white group-hover:underline underline-offset-4 line-clamp-2">
                  {s.name}
                </h3>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-white/10">
                  <span className="text-xs flex items-center gap-1 text-neutral-400">
                    <Clock className="w-3 h-3" />
                    {s.duration_minutes} хв
                  </span>
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                    {formatPrice(s)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-12">
        <Link
          href={`/marketplace/${company.id}-${company.slug}/services`}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Усі послуги
        </Link>
      </div>
    </div>
  )
}
