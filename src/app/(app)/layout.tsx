import type { ReactNode } from 'react'
import { requireUsuario } from '@/lib/dal'
import { Sidebar } from '@/components/Sidebar'
import { cerrarSesion } from '@/app/login/actions'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const u = await requireUsuario()

  return (
    <div className="flex min-h-screen">
      <Sidebar rol={u.rol} />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-gray-200 bg-white px-6">
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {u.nombre} · <span className="text-gray-400">{u.rol === 'jefa' ? 'Jefa' : 'Empleado'}</span>
            </span>
            <form action={cerrarSesion}>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 transition hover:bg-gray-50">
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
