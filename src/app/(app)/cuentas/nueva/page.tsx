import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { clientes } from '@/db/schema'
import { NuevaCuentaForm } from '../NuevaCuentaForm'

export default async function NuevaCuentaPage() {
  const u = await requireUsuario('jefa')
  const lista = await db
    .select({ id: clientes.id, nombre: clientes.nombre })
    .from(clientes)
    .where(eq(clientes.agenciaId, u.agenciaId))

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/cuentas" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver a cuentas
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva cuenta</h1>
        <p className="mt-1 text-sm text-gray-500">Registra una cuenta de redes para una organización.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        {lista.length === 0 ? (
          <p className="text-sm text-gray-400">Crea un contrato primero en la sección Contratos.</p>
        ) : (
          <NuevaCuentaForm clientes={lista} />
        )}
      </div>
    </div>
  )
}
