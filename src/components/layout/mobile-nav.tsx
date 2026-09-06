'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { NAV_LINKS } from './nav-links'

export default function MobileNav() {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  return (
    <details ref={detailsRef} className="group md:hidden">
      <summary className="relative z-50 flex h-10 w-10 list-none items-center justify-center text-foreground">
        <button type="button" aria-label="Menu" className="pointer-events-none">
          <svg
            className="h-5 w-5 group-open:hidden"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M2.5 5.5h15M2.5 10h15M2.5 14.5h15" />
          </svg>
          <svg
            className="hidden h-5 w-5 group-open:block"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M4 4l12 12M16 4L4 16" />
          </svg>
        </button>
      </summary>
      <ul className="fixed inset-0 z-40 flex flex-col justify-center gap-1 bg-background px-8 pt-16">
        {NAV_LINKS.map((link) => (
          <li key={link.href} className="border-t border-gray-800 first:border-t-0">
            <Link
              href={link.href}
              onClick={() => {
                if (detailsRef.current) detailsRef.current.open = false
              }}
              className="block py-4 font-serif text-3xl text-foreground transition-colors hover:text-gray-400"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  )
}
