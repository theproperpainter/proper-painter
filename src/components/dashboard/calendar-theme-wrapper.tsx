'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

// Lets the calendar sit on its own card with user-chosen colors, independent
// of the rest of the dark site. Saved per-browser (localStorage) — each
// person who logs in can pick their own, nothing shared or server-side.
// Deliberately only exposes background + text; everything else (grid lines,
// muted labels, the "today" tint) is derived from those two so there's no
// combinatorial mess of five separate pickers, and job chips keep their own
// fixed high-contrast style regardless of what's chosen here.

const STORAGE_KEY = 'dashboardCalendarTheme'
const DEFAULT_BG = '#f5f5f5'
const DEFAULT_TEXT = '#171717'

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return `rgba(23, 23, 23, ${alpha})` // fall back to the default text color
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function CalendarThemeWrapper({ children }: { children: ReactNode }) {
  const [bg, setBg] = useState(DEFAULT_BG)
  const [text, setText] = useState(DEFAULT_TEXT)

  // localStorage isn't available during server rendering, so the first paint
  // always uses the defaults above; this reads any saved choice right after
  // mount. A brief flash from default -> saved colors on load is normal and
  // matches how most client-side theme preferences behave.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (typeof parsed.bg === 'string') setBg(parsed.bg)
      if (typeof parsed.text === 'string') setText(parsed.text)
    } catch {
      // Private browsing / blocked storage / corrupt value — just keep defaults.
    }
  }, [])

  function update(next: { bg?: string; text?: string }) {
    const newBg = next.bg ?? bg
    const newText = next.text ?? text
    setBg(newBg)
    setText(newText)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ bg: newBg, text: newText }))
    } catch {
      // Not worth failing the UI over a blocked write.
    }
  }

  function reset() {
    setBg(DEFAULT_BG)
    setText(DEFAULT_TEXT)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const vars = {
    '--cal-bg': bg,
    '--cal-text': text,
    '--cal-muted': hexToRgba(text, 0.55),
    '--cal-border': hexToRgba(text, 0.18),
    '--cal-today-tint': hexToRgba(text, 0.08),
  } as CSSProperties

  return (
    <div style={vars} className="rounded-md border border-[var(--cal-border)] bg-[var(--cal-bg)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--cal-muted)]">
        <label className="flex items-center gap-1.5">
          Background
          <input
            type="color"
            value={bg}
            onChange={(e) => update({ bg: e.target.value })}
            aria-label="Calendar background color"
            className="h-6 w-8 cursor-pointer border border-[var(--cal-border)] bg-transparent p-0"
          />
        </label>
        <label className="flex items-center gap-1.5">
          Text
          <input
            type="color"
            value={text}
            onChange={(e) => update({ text: e.target.value })}
            aria-label="Calendar text color"
            className="h-6 w-8 cursor-pointer border border-[var(--cal-border)] bg-transparent p-0"
          />
        </label>
        <button type="button" onClick={reset} className="underline-offset-4 hover:underline">
          Reset colors
        </button>
      </div>
      {children}
    </div>
  )
}
