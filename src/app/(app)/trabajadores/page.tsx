import { requireUsuario } from '@/lib/dal'
import { Placeholder } from '@/components/Placeholder'

export default async function TrabajadoresPage() {
  await requireUsuario('jefa')
  return (
    <Placeholder
      titulo="Trabajadores"
      descripcion="Tu equipo de staff. Solo tú ves esta sección."
      items={[
        'Crear cuentas para los miembros de tu equipo',
        'Editar su rol y permisos',
        'Asignarles contratos y cuentas',
        'Ver su actividad (reportes, contenido producido)',
      ]}
    />
  )
}
