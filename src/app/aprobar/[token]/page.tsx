import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { clientes, piezas, versionesPieza, agencias } from '@/db/schema'
import { urlsFirmadas } from '@/lib/storage'
import { Logo } from '@/components/Logo'
import { AprobarForm } from './AprobarForm'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Invalido() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <Logo size={32} />
      <p className="text-sm text-gray-500">Este enlace de aprobación no es válido o fue desactivado.</p>
    </main>
  )
}

export default async function AprobarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!UUID_RE.test(token)) return <Invalido />

  const cli = await db
    .select({ id: clientes.id, nombre: clientes.nombre, agenciaId: clientes.agenciaId })
    .from(clientes)
    .where(eq(clientes.tokenAprobacion, token))
    .limit(1)
  const c = cli[0]
  if (!c) return <Invalido />

  const [agRow, pendientes] = await Promise.all([
    db.select({ nombre: agencias.nombre }).from(agencias).where(eq(agencias.id, c.agenciaId)).limit(1),
    db
      .select({ id: piezas.id, titulo: piezas.titulo, tipo: piezas.tipo, versionActual: piezas.versionActual })
      .from(piezas)
      .where(and(eq(piezas.clienteId, c.id), eq(piezas.estado, 'verde'), eq(piezas.aprobadaCliente, false))),
  ])

  const ids = pendientes.map((p) => p.id)
  const vers = ids.length
    ? await db
        .select({ piezaId: versionesPieza.piezaId, numeroVersion: versionesPieza.numeroVersion, archivoUrl: versionesPieza.archivoUrl })
        .from(versionesPieza)
        .where(inArray(versionesPieza.piezaId, ids))
    : []
  const pathPorPieza: Record<string, string | null> = {}
  for (const p of pendientes) {
    const v = vers.find((x) => x.piezaId === p.id && x.numeroVersion === p.versionActual) ?? vers.find((x) => x.piezaId === p.id)
    pathPorPieza[p.id] = v?.archivoUrl ?? null
  }
  const firmadas = await urlsFirmadas(Object.values(pathPorPieza).filter((p): p is string => !!p))

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <Logo size={30} />
        <h1 className="text-xl font-semibold tracking-tight">Aprobación de contenido</h1>
        <p className="text-sm text-gray-500">
          {c.nombre} · por {agRow[0]?.nombre ?? 'la agencia'}
        </p>
      </header>

      {pendientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
          ¡Todo aprobado! No hay nada pendiente. 🎉
        </div>
      ) : (
        <ul className="space-y-5">
          {pendientes.map((p) => {
            const path = pathPorPieza[p.id]
            const url = path ? firmadas[path] : null
            return (
              <li key={p.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center justify-center bg-gray-50">
                  {url ? (
                    p.tipo === 'video' ? (
                      <video src={url} controls className="max-h-[55vh] w-full" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={p.titulo} className="max-h-[55vh] w-full object-contain" />
                    )
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center text-sm text-gray-400">Sin vista previa</div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="text-sm font-medium">{p.titulo}</div>
                  <AprobarForm token={token} piezaId={p.id} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-center text-xs text-gray-300">Hecho con Vértice</p>
    </main>
  )
}
