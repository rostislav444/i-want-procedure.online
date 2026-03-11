'use client'

import { Check } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Оплата успішна!</h1>
        <p className="text-muted-foreground mb-6">
          Дякуємо за оплату. Ви можете закрити цю сторінку.
        </p>
      </div>
    </div>
  )
}
