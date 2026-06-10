import Link from 'next/link'
import { requireUsuario } from '@/lib/dal'
import { NuevoTrabajadorForm } from '../NuevoTrabajadorForm'

export default async function NuevoTrabajadorPage() {
  await requireUsuario('jefa')

  return (
    <div className="max-w-md space-y-6">
      <Link href="/trabajadores" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver a trabajadores
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo trabajador</h1>
        <p className="mt-1 text-sm text-gray-500">Crea una cuenta para un miembro de tu equipo.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <NuevoTrabajadorForm />
      </div>
    </div>
  )
}
