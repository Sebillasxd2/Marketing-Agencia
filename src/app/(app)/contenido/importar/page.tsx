import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { googleTokens, clientes, asignacionesCliente } from '@/db/schema'
import { driveCliente } from '@/lib/google'
import { hoyISO } from '@/lib/fecha'
import { ImportarForm } from './ImportarForm'

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; reauth?: string }>
}) {
  const u = await requireUsuario()
  const sp = await searchParams

  const tok = (
    await db
      .select({ refreshToken: googleTokens.refreshToken, email: googleTokens.email })
      .from(googleTokens)
      .where(eq(googleTokens.perfilId, u.id))
      .limit(1)
  )[0]

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/contenido" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver a contenido
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Importar de Google Drive</h1>
        <p className="mt-1 text-sm text-gray-500">Trae fotos y videos de tu Drive directo a la plataforma.</p>
      </div>

      {sp.error && <p className="text-sm text-red-600">Hubo un problema al conectar con Google. Intenta de nuevo.</p>}
      {sp.reauth && <p className="text-sm text-amber-600">Reautoriza para renovar el acceso.</p>}
      {sp.ok && <p className="text-sm text-green-600">✓ Google Drive conectado.</p>}

      {!tok ? (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-600">Conecta tu Google Drive para empezar a importar.</p>
          <a
            href="/api/google/connect"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Conectar Google Drive
          </a>
        </div>
      ) : (
        <Conectado u={u} refreshToken={tok.refreshToken} email={tok.email} />
      )}
    </div>
  )
}

async function Conectado({
  u,
  refreshToken,
  email,
}: {
  u: { id: string; agenciaId: string; rol: 'jefa' | 'empleado' }
  refreshToken: string
  email: string | null
}) {
  const clientesDisp =
    u.rol === 'jefa'
      ? await db.select({ id: clientes.id, nombre: clientes.nombre }).from(clientes).where(eq(clientes.agenciaId, u.agenciaId))
      : await db
          .select({ id: clientes.id, nombre: clientes.nombre })
          .from(asignacionesCliente)
          .innerJoin(clientes, eq(clientes.id, asignacionesCliente.clienteId))
          .where(and(eq(asignacionesCliente.agenciaId, u.agenciaId), eq(asignacionesCliente.empleadoId, u.id)))

  let archivos: { id: string; name: string; mimeType: string }[] = []
  let errorDrive = false
  try {
    const drive = driveCliente(refreshToken)
    const res = await drive.files.list({
      q: "(mimeType contains 'image/' or mimeType contains 'video/') and trashed = false",
      fields: 'files(id, name, mimeType)',
      orderBy: 'modifiedTime desc',
      pageSize: 40,
    })
    archivos = (res.data.files ?? [])
      .filter((f) => f.id && f.name)
      .map((f) => ({ id: f.id!, name: f.name!, mimeType: f.mimeType ?? '' }))
  } catch {
    errorDrive = true
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Conectado como {email ?? 'tu cuenta de Google'} ·{' '}
        <a href="/api/google/connect" className="text-brand hover:underline">
          reconectar
        </a>
      </p>
      {errorDrive ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No pude leer tu Drive. Reautoriza (link de arriba) y verifica que la Google Drive API esté habilitada.
        </p>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          {clientesDisp.length === 0 ? (
            <p className="text-sm text-gray-400">No tienes organizaciones disponibles.</p>
          ) : (
            <ImportarForm clientes={clientesDisp} archivos={archivos} defaultFecha={hoyISO()} />
          )}
        </div>
      )}
    </div>
  )
}
