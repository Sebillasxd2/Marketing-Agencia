import Link from 'next/link'
import { requireUsuario } from '@/lib/dal'
import { ContratoForm } from '../ContratoForm'

export default async function NuevoContratoPage() {
  await requireUsuario('jefa')

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/contratos" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver a contratos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo contrato</h1>
        <p className="mt-1 text-sm text-gray-500">Registra una organización con la que trabajas.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <ContratoForm />
      </div>
    </div>
  )
}
