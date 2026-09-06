'use client'

import { useState, type FormEvent } from 'react'

const fieldClass =
  'mt-1 w-full border-b border-gray-800 bg-transparent py-2 text-foreground placeholder:text-gray-600 focus:border-foreground focus:outline-none transition-colors'

const labelClass = 'block text-sm text-gray-500'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      firstName: data.get('firstName'),
      lastName: data.get('lastName'),
      email: data.get('email'),
      phone: data.get('phone'),
      jobAddress: data.get('jobAddress'),
      jobCity: data.get('jobCity'),
      jobState: data.get('jobState'),
      jobZip: data.get('jobZip'),
      message: data.get('message'),
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong sending your message.')
      }
      setStatus('success')
      form.reset()
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong sending your message.'
      )
    }
  }

  if (status === 'success') {
    return (
      <div className="md:border-l md:border-gray-800 md:pl-16">
        <p className="text-lg leading-relaxed">
          Thanks for reaching out. We&rsquo;ll be in touch soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:border-l md:border-gray-800 md:pl-16">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone
        </label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" required className={fieldClass} />
      </div>
      <div>
        <label htmlFor="jobAddress" className={labelClass}>
          Job address <span className="text-gray-600">(optional)</span>
        </label>
        <input
          id="jobAddress"
          name="jobAddress"
          type="text"
          autoComplete="street-address"
          className={fieldClass}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="jobCity" className={labelClass}>
            City
          </label>
          <input id="jobCity" name="jobCity" type="text" autoComplete="address-level2" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="jobState" className={labelClass}>
            State
          </label>
          <input
            id="jobState"
            name="jobState"
            type="text"
            autoComplete="address-level1"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="jobZip" className={labelClass}>
            Zip
          </label>
          <input
            id="jobZip"
            name="jobZip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea id="message" name="message" rows={4} required className={`${fieldClass} resize-none`} />
      </div>
      {status === 'error' && (
        <p role="alert" className="text-sm text-gray-300">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-2 inline-block w-full border border-foreground px-8 py-3 text-sm tracking-wide transition-colors hover:bg-foreground hover:text-background disabled:opacity-50 sm:w-auto"
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
