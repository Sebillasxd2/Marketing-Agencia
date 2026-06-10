import { requireUsuario } from '@/lib/dal'
import { Placeholder } from '@/components/Placeholder'

export default async function ContenidoPage() {
  await requireUsuario()
  return (
    <Placeholder
      titulo="Contenido"
      descripcion="Explorador de contenido, organizado por staff, organización y fecha."
      items={[
        'Carpetas tipo explorador: cada miembro → cada organización → cada fecha',
        'Subir con formulario: organización, fecha, producción para (ej. "Día de la Madre")',
        'Revisar cada foto/video con el semáforo 🟢🟡🔴 + descripción',
        'Las marcas y comentarios los ve el equipo en la plataforma',
        'Conexión opcional con Google Drive del empleado',
      ]}
    />
  )
}
