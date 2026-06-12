import type { ReactNode } from 'react'
import { and, eq } from 'drizzle-orm'
import { Bell } from 'lucide-react'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { notificaciones } from '@/db/schema'
import { Sidebar } from '@/components/Sidebar'
import { Avatar } from '@/components/Avatar'
import { cerrarSesion } from '@/app/login/actions'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const u = await requireUsuario()

  const noLeidas = await db
    .select({ id: notificaciones.id })
    .from(notificaciones)
    .where(and(eq(notificaciones.destinatarioId, u.id), eq(notificaciones.leida, false)))
  const unread = noLeidas.length

  return (
    <div className="flex min-h-screen">
      <Sidebar rol={u.rol} />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-gray-200 bg-white px-6">
          <div className="ml-auto flex items-center gap-3">
            <button
              className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
              aria-label="Notificaciones"
            >
              <Bell size={18} />
              {unread > 0 && <span className="bg-brand absolute right-1.5 top-1.5 h-2 w-2 rounded-full" />}
            </button>
            <div className="flex items-center gap-2">
              <Avatar nombre={u.nombre} size={30} />
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium">{u.nombre}</div>
                <div className="text-[11px] text-gray-400">{u.rol === 'jefa' ? 'Jefa' : 'Empleado'}</div>
              </div>
            </div>
            <form action={cerrarSesion}>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50">
                Salir
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
