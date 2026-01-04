import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ClientNotFound() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Клієнт не знайдений</h1>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">
            Не вдалося знайти клієнта з таким ID
          </p>
          <Link href="/clients">
            <Button className="mt-4">Повернутися до списку</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
