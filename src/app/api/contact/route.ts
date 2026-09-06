import { NextResponse } from 'next/server'

interface ContactPayload {
  name?: unknown
  email?: unknown
  message?: unknown
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  let body: ContactPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are all required.' }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL
  if (!webhookUrl) {
    console.error('ZAPIER_WEBHOOK_URL is not configured — contact form cannot deliver leads.')
    return NextResponse.json(
      { error: 'Sorry, this form is temporarily unavailable. Please call or email us directly.' },
      { status: 500 }
    )
  }

  try {
    const zapierResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message, source: 'theproperpainter.com contact form' }),
    })
    if (!zapierResponse.ok) {
      throw new Error(`Zapier webhook responded with ${zapierResponse.status}`)
    }
  } catch (err) {
    console.error('Failed to forward contact form submission to Zapier', err)
    return NextResponse.json(
      { error: 'Something went wrong sending your message. Please try again or call us directly.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
