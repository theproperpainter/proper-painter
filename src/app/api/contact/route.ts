import { NextResponse } from 'next/server'

interface ContactPayload {
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  phone?: unknown
  jobAddress?: unknown
  jobCity?: unknown
  jobState?: unknown
  jobZip?: unknown
  message?: unknown
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  let body: ContactPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const firstName = str(body.firstName)
  const lastName = str(body.lastName)
  const email = str(body.email)
  const phone = str(body.phone)
  const message = str(body.message)
  // The job site's address is a nice-to-have, not a hard requirement — most
  // people requesting a quote will type it in, but we don't want to block
  // an otherwise-valid submission on it.
  const jobAddress = str(body.jobAddress)
  const jobCity = str(body.jobCity)
  const jobState = str(body.jobState)
  const jobZip = str(body.jobZip)

  if (!firstName || !lastName || !email || !phone || !message) {
    return NextResponse.json(
      { error: 'First name, last name, email, phone, and message are all required.' },
      { status: 400 }
    )
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
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        jobAddress,
        jobCity,
        jobState,
        jobZip,
        message,
        source: 'theproperpainter.com contact form',
      }),
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
