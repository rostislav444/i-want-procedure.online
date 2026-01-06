import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ClientLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-muted rounded" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div>
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded mt-2" />
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-5 w-28 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 text-center">
              <div className="h-8 w-16 bg-muted rounded mx-auto" />
              <div className="h-4 w-24 bg-muted rounded mx-auto mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Appointments */}
      <Card>
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted rounded" />
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-20 bg-muted rounded" />
                  <div className="h-6 w-24 bg-muted rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
