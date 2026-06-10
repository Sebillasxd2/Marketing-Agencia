import { requireUsuario } from '@/lib/dal'
import { Placeholder } from '@/components/Placeholder'

export default async function ContratosPage() {
  await requireUsuario()
  return (
    <Placeholder
      titulo="Contratos"
      descripcion="Las organizaciones y negocios con los que trabaja la agencia."
      items={[
        'Registrar un nuevo contrato: negocio, contacto, fecha de inicio, tarifa mensual, estado',
        'Ver y editar los datos de cada contrato',
        'Asignar empleados a cada contrato',
        'La jefa ve y gestiona todos; el staff solo ve/edita los asignados',
      ]}
    />
  )
}
