export function Logo({ size = 22, soloIcono = false }: { size?: number; soloIcono?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2.5 L21.5 20.5 H2.5 Z" fill="var(--brand)" />
        <path d="M12 8 L17 18 H7 Z" fill="#ffffff" fillOpacity="0.92" />
      </svg>
      {!soloIcono && <span className="text-lg font-semibold tracking-tight">Vértice</span>}
    </span>
  )
}
