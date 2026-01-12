'use client'

import Link from 'next/link'

interface CompanyFooterProps {
  companyName: string
}

export default function CompanyFooter({ companyName }: CompanyFooterProps) {
  return (
    <footer className="py-8 border-t bg-card">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          &copy; {new Date().getFullYear()} {companyName}
        </p>
        <p className="text-xs text-muted-foreground">
          Працює на{' '}
          <Link href="/" className="text-pink-500 hover:underline font-medium">
            Procedure
          </Link>
        </p>
      </div>
    </footer>
  )
}
