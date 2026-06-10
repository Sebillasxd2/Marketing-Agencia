import { redirect } from 'next/navigation'
import { getUsuario } from '@/lib/dal'
import { accesoRapido } from './actions'
import { LoginForm } from './LoginForm'

const cuentas = [
  { email: 'alejandra@vertice.demo', nombre: 'Alejandra', rol: 'Jefa', desc: 'Revisa y aprueba con el semáforo' },
  { email: 'carla@vertice.demo', nombre: 'Carla', rol: 'Empleada', desc: 'Sube contenido y reporta' },
  { email: 'marco@vertice.demo', nombre: 'Marco', rol: 'Empleado', desc: 'Sube contenido y reporta' },
]

export default async function LoginPage() {
  const u = await getUsuario()
  if (u) redirect(u.rol === 'jefa' ? '/jefa' : '/empleado')

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Vértice</h1>
        <p className="mt-2 text-sm text-gray-500">Control de calidad para tu agencia.</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Acceso rápido (demo)</p>
        {cuentas.map((c) => (
          <form key={c.email} action={accesoRapido}>
            <input type="hidden" name="email" value={c.email} />
            <button className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300 hover:shadow">
              <span>
                <span className="block font-medium">{c.nombre}</span>
                <span className="block text-xs text-gray-500">{c.desc}</span>
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{c.rol}</span>
            </button>
          </form>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-2 text-xs text-gray-400">o con tu correo</span>
        </div>
      </div>

      <LoginForm />
    </main>
  )
}
