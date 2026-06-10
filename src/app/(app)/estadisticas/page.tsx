import { requireUsuario } from '@/lib/dal'
import { Placeholder } from '@/components/Placeholder'

export default async function EstadisticasPage() {
  await requireUsuario('jefa')
  return (
    <Placeholder
      titulo="Estadísticas"
      descripcion="Resultados generales del equipo y la producción."
      items={[
        'Cuánto contenido (fotos/videos) se produjo por periodo',
        'Quién cumplió con sus reportes diarios y quién los saltó',
        'Tasa de aprobación al primer intento por empleado',
        'Gráficas de tendencia',
      ]}
    />
  )
}
