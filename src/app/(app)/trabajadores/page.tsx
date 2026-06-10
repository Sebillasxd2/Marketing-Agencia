import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { Plus } from 'lucide-react'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { miembrosAgencia, perfiles } from '@/db/schema'
import { cambiarRol, toggleActivo } from './actions'

export default async function TrabajadoresPage() {
  const u = await requireUsuario('jefa')

  const miembros = await db
    .select({
      miembroId: miembrosAgencia.id,
      perfilId: perfiles.id,
      nombre: perfiles.nombreCompleto,
      email: perfiles.email,
      rol: miembrosAgencia.rol,
      activo: miembrosAgencia.activo,
    })
    .from(miembrosAgencia)
    .innerJoin(perfiles, eq(perfiles.id, miembrosAgencia.perfilId))
    .where(eq(miembrosAgencia.agenciaId, u.agenciaId))

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trabajadores</h1>
          <p className="mt-1 text-sm text-gray-500">Tu equipo. Crea cuentas, cambia roles y controla el acceso.</p>
        </div>
        <Link
          href="/trabajadores/nuevo"
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={16} /> Nuevo trabajador
        </Link>
      </div>

      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {miembros.map((m) => {
          const esYo = m.perfilId === u.id
          return (
            <li key={m.miembroId} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.nombre}</span>
                  {esYo && <span className="text-xs text-gray-400">(tú)</span>}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.rol === 'jefa' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {m.rol === 'jefa' ? 'Jefa' : 'Empleado'}
                  </span>
                  {!m.activo && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Inactivo</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{m.email}</p>
              </div>

              {!esYo && (
                <div className="ml-auto flex items-center gap-2">
                  <form action={cambiarRol}>
                    <input type="hidden" name="miembroId" value={m.miembroId} />
                    <input type="hidden" name="rol" value={m.rol === 'jefa' ? 'empleado' : 'jefa'} />
                    <button className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-50">
                      {m.rol === 'jefa' ? 'Hacer empleado' : 'Hacer jefa'}
                    </button>
                  </form>
                  <form action={toggleActivo}>
                    <input type="hidden" name="miembroId" value={m.miembroId} />
                    <input type="hidden" name="activo" value={m.activo ? 'false' : 'true'} />
                    <button
                      className={`rounded-lg px-3 py-1 text-xs transition ${
                        m.activo
                          ? 'border border-gray-200 text-red-600 hover:bg-red-50'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {m.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
