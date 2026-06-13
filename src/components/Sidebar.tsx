'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  FileText,
  Users,
  AtSign,
  BarChart3,
  FolderOpen,
  Settings,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '@/components/Logo'

type Rol = 'jefa' | 'empleado'
type Item = { href: string; label: string; icon: LucideIcon; roles: Rol[] }

const items: Item[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['jefa', 'empleado'] },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays, roles: ['jefa', 'empleado'] },
  { href: '/reportes', label: 'Reportes', icon: ClipboardList, roles: ['jefa', 'empleado'] },
  { href: '/contratos', label: 'Contratos', icon: FileText, roles: ['jefa', 'empleado'] },
  { href: '/trabajadores', label: 'Trabajadores', icon: Users, roles: ['jefa'] },
  { href: '/cuentas', label: 'Cuentas', icon: AtSign, roles: ['jefa', 'empleado'] },
  { href: '/estadisticas', label: 'Estadísticas', icon: BarChart3, roles: ['jefa'] },
  { href: '/contenido', label: 'Contenido', icon: FolderOpen, roles: ['jefa', 'empleado'] },
  { href: '/ajustes', label: 'Ajustes', icon: Settings, roles: ['jefa', 'empleado'] },
]

export function Sidebar({ rol }: { rol: Rol }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [path])

  const visibles = items.filter((i) => i.roles.includes(rol))

  function Links({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex-1 space-y-1 px-3 py-2">
        {visibles.map((i) => {
          const active = path === i.href || path.startsWith(i.href + '/')
          const Icon = i.icon
          return (
            <Link
              key={i.href}
              href={i.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? 'bg-gray-900 font-medium text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {i.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <>
      {/* Escritorio */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-14 items-center px-5">
          <Logo />
        </div>
        <Links />
        <div className="px-5 py-4 text-[11px] text-gray-300">Vértice · v0.1</div>
      </aside>

      {/* Botón hamburguesa (móvil) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-30 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      {/* Drawer (móvil) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between px-5">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <Links onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
