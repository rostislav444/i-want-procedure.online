import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL_INTERNAL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { event_id, full_name, email, phone, telegram } = body

  const res = await fetch(`${API_URL}/api/v1/public/education/events/${event_id}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, phone, telegram }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
