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
      name: data.get('name'),
      email: data.get('email'),
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
      <div>
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input id="name" name="name" type="text" autoComplete="name" required className={fieldClass} />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
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
