import type { ReactNode } from 'react'
import { requireUsuario } from '@/lib/dal'
import { NicknameForm } from './NicknameForm'

export default async function AjustesPage() {
  const u = await requireUsuario()

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-gray-500">Personaliza tu cuenta y la plataforma.</p>
      </div>

      <Card titulo="Tu nombre" descripcion="Como apareces en la plataforma.">
        <NicknameForm inicial={u.nombre} />
      </Card>

      <Card titulo="Idioma" descripcion="Idioma de la interfaz.">
        <select disabled className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
          <option>Español</option>
        </select>
        <span className="ml-3 text-xs text-gray-400">Más idiomas, próximamente.</span>
      </Card>

      <Card titulo="Tema" descripcion="Apariencia de la plataforma.">
        <span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">Claro</span>
        <span className="ml-3 text-xs text-gray-400">
          El modo oscuro se activará en todas las secciones de una vez, para que se vea consistente.
        </span>
      </Card>
    </div>
  )
}

function Card({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
      <h2 className="font-medium">{titulo}</h2>
      <p className="mt-0.5 text-xs text-gray-500">{descripcion}</p>
      <div className="mt-3 flex flex-wrap items-center">{children}</div>
    </section>
  )
}
