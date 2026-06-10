'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  AtSign,
  BarChart3,
  FolderOpen,
  Settings,
  type LucideIcon,
} from 'lucide-react'

type Rol = 'jefa' | 'empleado'
type Item = { href: string; label: string; icon: LucideIcon; roles: Rol[] }

const items: Item[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['jefa', 'empleado'] },
  { href: '/contratos', label: 'Contratos', icon: FileText, roles: ['jefa', 'empleado'] },
  { href: '/trabajadores', label: 'Trabajadores', icon: Users, roles: ['jefa'] },
  { href: '/cuentas', label: 'Cuentas', icon: AtSign, roles: ['jefa', 'empleado'] },
  { href: '/estadisticas', label: 'Estadísticas', icon: BarChart3, roles: ['jefa'] },
  { href: '/contenido', label: 'Contenido', icon: FolderOpen, roles: ['jefa', 'empleado'] },
  { href: '/ajustes', label: 'Ajustes', icon: Settings, roles: ['jefa', 'empleado'] },
]

export function Sidebar({ rol }: { rol: Rol }) {
  const path = usePathname()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center px-6 text-lg font-semibold tracking-tight">Vértice</div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items
          .filter((i) => i.roles.includes(rol))
          .map((i) => {
            const active = path === i.href || path.startsWith(i.href + '/')
            const Icon = i.icon
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {i.label}
              </Link>
            )
          })}
      </nav>
      <div className="px-6 py-4 text-xs text-gray-300">Vértice · v0.1</div>
    </aside>
  )
}
