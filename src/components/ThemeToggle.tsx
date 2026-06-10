'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])

  if (!montado) return <div className="h-9 w-44 rounded-lg bg-gray-100" />

  const dark = theme === 'dark'
  const base = 'rounded-lg border px-4 py-2 text-sm transition'
  const activo = 'border-gray-900 bg-gray-900 text-white'
  const inactivo = 'border-gray-200 text-gray-600 hover:bg-gray-50'

  return (
    <div className="flex gap-2">
      <button onClick={() => setTheme('light')} className={`${base} ${!dark ? activo : inactivo}`}>
        ☀️ Claro
      </button>
      <button onClick={() => setTheme('dark')} className={`${base} ${dark ? activo : inactivo}`}>
        🌙 Oscuro
      </button>
    </div>
  )
}
