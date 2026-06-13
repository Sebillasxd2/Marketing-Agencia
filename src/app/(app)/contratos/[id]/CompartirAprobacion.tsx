'use client'

import { useEffect, useState } from 'react'

export function CopyLink({ token }: { token: string }) {
  const [url, setUrl] = useState(`/aprobar/${token}`)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    setUrl(`${window.location.origin}/aprobar/${token}`)
  }, [token])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
      />
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 1500)
          } catch {}
        }}
        className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        {copiado ? '¡Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}
