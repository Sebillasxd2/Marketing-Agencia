import { cerrarSesion } from '@/app/login/actions'

export function Header({ nombre, rol }: { nombre: string; rol: string }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center px-6 py-3">
        <span className="text-lg font-semibold tracking-tight">Vértice</span>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {nombre} · <span className="text-gray-400">{rol}</span>
          </span>
          <form action={cerrarSesion}>
            <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 transition hover:bg-gray-50">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
